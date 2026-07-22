import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  otp: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}

export class SendOtpDto {
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  code: string;

  @IsString()
  name?: string;
}

export class AdminVerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;
}

export class OAuthDto {
  @IsString()
  token: string;
}

export class GithubAuthDto {
  @IsString()
  code: string;
}

export class LinkedinAuthDto {
  @IsString()
  code: string;

  @IsString()
  redirectUri: string;
}
