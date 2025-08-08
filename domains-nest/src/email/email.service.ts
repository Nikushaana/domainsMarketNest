import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// 🔼 Place enum outside the class
export enum EmailType {
  FORGOT_PASSWORD = 'forgot-password',
  WELCOME = 'welcome',
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      throw new InternalServerErrorException(
        'Email credentials are not set in .env',
      );
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  // 🔽 Add getEmailContent INSIDE the class
  getEmailContent(
    type: EmailType,
    data: any,
  ): { subject: string; text: string; html?: string } {
    switch (type) {
      case EmailType.WELCOME:
        return {
          subject: 'Welcome to Domains.ge!',
          text: `Hello ${data.email}, welcome to our platform!`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333;">Hello!</h2>
                    <p>You registered on domains.ge successfully!</p>
                    <p style="margin-top: 30px; font-size: 14px; color: #777;">Thanks, <br />The Domains.ge Team</p>
                </div>`,
        };
      case EmailType.FORGOT_PASSWORD:
        return {
          subject: 'Reset Your Password',
          text: `Use this code: ${data.code}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #333;">Hello!</h2>
                    <p>You requested a password reset. Use the code below to reset your password:</p>
                    <div style="font-size: 24px; font-weight: bold; color: #2E86C1; margin: 20px 0;">
                    ${data.code}
                    </div>
                    <p><strong>This code is valid for 15 minutes.</strong></p>
                    <p>If you didn’t request this, you can ignore this email.</p>
                    <p style="margin-top: 30px; font-size: 14px; color: #777;">Thanks,<br />The Domains.ge Team</p>
                </div>`,
        };
      default:
        throw new Error('Unknown email type');
    }
  }

  // Reuse it in sendEmail
  async sendEmailByType(type: EmailType, to: string, data: any): Promise<void> {
    const { subject, text, html } = this.getEmailContent(type, data);

    await this.transporter.sendMail({
      from: `"Domains.ge" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    });
  }
}
