import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly sesClient: SESClient;
  private readonly logger = new Logger(EmailService.name);
  private readonly isMock: boolean;
  private readonly senderEmail: string;

  constructor(private readonly configService: ConfigService) {
    const accessKey = this.configService.get<string>('aws.accessKeyId');
    const secretKey = this.configService.get<string>('aws.secretAccessKey');
    const sessionToken = this.configService.get<string>('aws.sessionToken');
    const region = this.configService.get<string>('aws.region') || 'ap-south-1';
    this.senderEmail =
      this.configService.get<string>('aws.sesSender') || 'noreply@evolvian.in';

    const sesConfig: any = { region };

    const hasCreds = !!(
      accessKey &&
      secretKey &&
      accessKey !== 'your_aws_access_key'
    );
    const isProd = process.env.NODE_ENV === 'production';
    const forceMock = process.env.USE_MOCK_SES === 'true';

    if (hasCreds) {
      sesConfig.credentials = {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        ...(sessionToken &&
          sessionToken !== 'your_aws_session_token' && { sessionToken }),
      };
      this.logger.log('[SES] Using explicit credentials from configuration');
      this.isMock = false;
    } else if (isProd && !forceMock) {
      this.logger.log(
        '[SES] Using EC2 IAM Role / Default AWS Provider Chain in production',
      );
      this.isMock = false;
    } else {
      this.logger.warn('[SES] Using Mock SES service');
      this.isMock = true;
    }

    this.sesClient = new SESClient(sesConfig);
  }

  async sendOTPEmail(toEmail: string, otp: string): Promise<any> {
    if (this.isMock) {
      this.logger.log(`
=========================================
[MOCK SES] Email sending bypassed
To: ${toEmail}
Subject: Your CodeSkill Login Code: ${otp}
OTP CODE: ${otp}
=========================================`);
      return { MessageId: 'mock-message-id-' + Date.now() };
    }

    const params = {
      Destination: { ToAddresses: [toEmail] },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2563EB;">CodeSkill Authentication</h2>
                <p>Hello,</p>
                <p>Your one-time password (OTP) for logging in is:</p>
                <h1 style="font-size: 32px; letter-spacing: 4px; color: #1e293b;">${otp}</h1>
                <p>This code will expire in 5 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
              </div>
            `,
          },
          Text: {
            Charset: 'UTF-8',
            Data: `Your CodeSkill OTP is: ${otp}. It expires in 5 minutes.`,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: `Your CodeSkill Login Code: ${otp}`,
        },
      },
      Source: this.senderEmail,
    };

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const command = new SendEmailCommand(params);
        const result = await this.sesClient.send(command);
        this.logger.log(
          `[SES] Email sent to ${toEmail}. MessageId: ${result.MessageId}`,
        );
        return result;
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      }
    }

    throw new Error(
      `Failed to send OTP email to ${toEmail}. SES Error: ${lastError?.message || 'Unknown'}`,
    );
  }
}
