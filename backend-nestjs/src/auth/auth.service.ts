import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../database/schemas/user.schema';
import { OtpService } from '../redis/otp.service';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import {
  RegisterDto,
  LoginDto,
  SendOtpDto,
  VerifyOtpDto,
  OAuthDto,
  GithubAuthDto,
  LinkedinAuthDto,
  AdminLoginDto,
  AdminVerifyOtpDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private googleClient: OAuth2Client;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private otpService: OtpService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('oauth.googleClientId'),
    );
  }

  async onModuleInit() {
    try {
      await this.seedAdmin();
    } catch (err) {
      console.error('[Seed Admin] Startup error:', err);
    }
  }

  private authResponse(user: UserDocument) {
    const token = (user as any).getSignedJwtToken();
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
        bio: user.bio,
        profile: user.profile,
        stats: user.stats,
        authProvider: user.authProvider,
      },
    };
  }

  async sendOtp(dto: SendOtpDto) {
    return this.otpService.sendOTP(dto.email);
  }

  async sendRegistrationOtp(dto: SendOtpDto) {
    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) {
      throw new BadRequestException('Email already registered. Please login.');
    }
    return this.otpService.sendOTP(dto.email);
  }

  async register(dto: RegisterDto) {
    await this.otpService.verifyOTP(dto.email, dto.otp);

    const userExists = await this.userModel.findOne({ email: dto.email });
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });

    return this.authResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.authProvider !== 'local' && !user.password) {
      throw new UnauthorizedException(
        `Please login using ${user.authProvider}`,
      );
    }

    const isMatch = await (user as any).matchPassword(dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authResponse(user);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    await this.otpService.verifyOTP(dto.email, dto.code);

    let user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      user = await this.userModel.create({
        name: dto.name || dto.email.split('@')[0],
        email: dto.email,
        authProvider: 'otp',
      });
    }

    return this.authResponse(user);
  }

  async googleLogin(dto: OAuthDto) {
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.token,
        audience: this.configService.get<string>('oauth.googleClientId'),
      });
      payload = ticket.getPayload();
    } catch (e) {
      try {
        const response = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: { Authorization: `Bearer ${dto.token}` },
          },
        );
        payload = response.data;
      } catch (err) {
        throw new UnauthorizedException('Invalid Google token');
      }
    }

    const { email, name, sub, picture } = payload;
    let user = await this.userModel.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = sub;
        if (!user.avatar) user.avatar = picture;
        await user.save();
      }
    } else {
      user = await this.userModel.create({
        name,
        email,
        googleId: sub,
        avatar: picture,
        authProvider: 'google',
      });
    }

    return this.authResponse(user);
  }

  async githubLogin(dto: GithubAuthDto) {
    try {
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.configService.get<string>('oauth.githubClientId'),
          client_secret: this.configService.get<string>(
            'oauth.githubClientSecret',
          ),
          code: dto.code,
        },
        { headers: { Accept: 'application/json' } },
      );

      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) throw new Error('No access token from GitHub');

      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const emailsResponse = await axios.get(
        'https://api.github.com/user/emails',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const primaryEmail =
        emailsResponse.data.find((e: any) => e.primary)?.email ||
        emailsResponse.data[0]?.email;
      const { id, name, login, avatar_url } = userResponse.data;

      let user = await this.userModel.findOne({ email: primaryEmail });
      if (user) {
        if (!user.githubId) {
          user.githubId = id.toString();
          if (!user.avatar) user.avatar = avatar_url;
          await user.save();
        }
      } else {
        user = await this.userModel.create({
          name: name || login,
          email: primaryEmail,
          githubId: id.toString(),
          avatar: avatar_url,
          authProvider: 'github',
        });
      }

      return this.authResponse(user);
    } catch (error) {
      throw new UnauthorizedException('GitHub authentication failed');
    }
  }

  async linkedinLogin(dto: LinkedinAuthDto) {
    try {
      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code: dto.code,
            client_id: this.configService.get<string>('oauth.linkedinClientId'),
            client_secret: this.configService.get<string>(
              'oauth.linkedinClientSecret',
            ),
            redirect_uri: dto.redirectUri,
          },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const accessToken = tokenResponse.data.access_token;

      const userResponse = await axios.get(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const { sub, name, email, picture } = userResponse.data;

      let user = await this.userModel.findOne({ email });
      if (user) {
        if (!user.linkedinId) {
          user.linkedinId = sub;
          if (!user.avatar) user.avatar = picture;
          await user.save();
        }
      } else {
        user = await this.userModel.create({
          name,
          email,
          linkedinId: sub,
          avatar: picture,
          authProvider: 'linkedin',
        });
      }

      return this.authResponse(user);
    } catch (error) {
      throw new UnauthorizedException('LinkedIn authentication failed');
    }
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: any) {
    const updates: any = {};
    const allowedFields = ['name', 'bio', 'avatar', 'username'];
    const allowedProfileFields = [
      'institution',
      'role',
      'preferredLanguage',
      'theme',
      'fontSize',
    ];

    for (const key of allowedFields) {
      if (data[key] !== undefined) updates[key] = data[key];
    }

    if (data.profile) {
      for (const key of allowedProfileFields) {
        if (data.profile[key] !== undefined) {
          updates[`profile.${key}`] = data.profile[key];
        }
      }
    }

    if (updates.username) {
      // Validate username format (lowercase, alphanumeric, underscores)
      const usernameRegex = /^[a-z0-9_]+$/;
      if (!usernameRegex.test(updates.username)) {
        throw new BadRequestException('Username can only contain lowercase letters, numbers, and underscores');
      }

      // Check if username is taken by another user
      const existingUser = await this.userModel.findOne({
        username: updates.username,
        _id: { $ne: userId }
      });
      if (existingUser) {
        throw new BadRequestException('Username is already taken');
      }
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true },
    );

    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) {
      throw new BadRequestException('No user found with this email address');
    }
    await this.otpService.sendOTP(normalizedEmail);
    return { success: true, message: 'Password reset OTP sent to your email via SES' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    await this.otpService.verifyOTP(normalizedEmail, dto.otp);
    const user = await this.userModel.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.password = dto.newPassword;
    await user.save();
    return { success: true, message: 'Password has been successfully reset' };
  }

  async adminLogin(dto: AdminLoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userModel
      .findOne({ email: normalizedEmail })
      .select('+password');
    if (!user) {
      throw new UnauthorizedException('User not found with this email');
    }
    if (!user.isAdmin) {
      throw new UnauthorizedException('Access denied. Admin only.');
    }

    if (user.password) {
      if (!dto.password) {
        throw new BadRequestException('Password is required for this admin account');
      }
      const isMatch = await (user as any).matchPassword(dto.password);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    await this.otpService.sendOTP(normalizedEmail);
    const msg = !user.password
      ? 'Verification OTP sent to your email (OAuth Admin Account)'
      : 'OTP sent successfully';
    return {
      success: true,
      requireOTP: true,
      message: msg,
    };
  }

  async adminVerifyOtp(dto: AdminVerifyOtpDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    await this.otpService.verifyOTP(normalizedEmail, dto.otp);

    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user || !user.isAdmin) {
      throw new UnauthorizedException('Access denied');
    }

    user.lastActive = new Date();
    await user.save();

    return this.authResponse(user);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.userModel.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true },
    );
    return this.getMe(userId);
  }
}
