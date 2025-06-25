import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private templatesPath: string;

  constructor(private configService: ConfigService) {
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPass = this.configService.get<string>('MAIL_PASS');

    console.log('🔍 [MAIL SERVICE] Checking environment variables...');
    console.log('MAIL_USER:', mailUser ? '✅ Found' : '❌ Missing');
    console.log('MAIL_PASS:', mailPass ? '✅ Found' : '❌ Missing');

    if (!mailUser || !mailPass) {
      console.error('❌ [MAIL SERVICE] Missing email credentials in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('MAIL')));
      throw new Error('Email credentials not configured');
    }

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: mailUser,
        pass: mailPass,
      },
      // Additional options for Gmail
      tls: {
        rejectUnauthorized: false
      }
    });

    // Set template path
    this.templatesPath = path.join(process.cwd(), 'src', 'mail', 'templates');

    // Verify transporter configuration
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ [MAIL SERVICE] SMTP connection verified successfully');
    } catch (error) {
      console.error('❌ [MAIL SERVICE] SMTP connection failed:', error.message);
    }
  }

  private async renderTemplate(
    templateName: string,
    data: any,
    useLayout: boolean = true,
  ): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.ejs`);

      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        console.warn(`Template ${templateName} not found at ${templatePath}, using fallback`);
        return this.getFallbackTemplate(templateName, data);
      }

      // Render the template content
      const templateContent = (await ejs.renderFile(
        templatePath,
        data,
      )) as string;

      // If using layout, wrap content in base layout
      if (useLayout) {
        const layoutPath = path.join(this.templatesPath, 'layouts', 'base.ejs');

        if (fs.existsSync(layoutPath)) {
          return (await ejs.renderFile(layoutPath, {
            ...data,
            content: templateContent,
          })) as string;
        }
      }

      return templateContent;
    } catch (error) {
      console.error(`❌ [MAIL SERVICE] Error rendering template ${templateName}:`, error);
      // Fallback to simple HTML if template fails
      return this.getFallbackTemplate(templateName, data);
    }
  }

  private getFallbackTemplate(templateName: string, data: any): string {
    switch (templateName) {
      case 'welcome-user':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome to Shopie! 🎉</h1>
            <p>Hello ${data.userName || data.userEmail},</p>
            <p>Welcome to Shopie! We're excited to have you on board.</p>
            <p>Start exploring our products and enjoy shopping with us!</p>
            <p>Best regards,<br>The Shopie Team</p>
          </div>
        `;
      case 'password-reset':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Reset Request</h1>
            <p>Hello,</p>
            <p>You requested a password reset for your Shopie account.</p>
            <p>Click the link below to reset your password:</p>
            <a href="${data.resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>The Shopie Team</p>
          </div>
        `;
      case 'password-change-confirmation':
        return `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Password Changed Successfully</h1>
            <p>Hello,</p>
            <p>Your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>The Shopie Team</p>
          </div>
        `;
      default:
        return `<p>Email notification from Shopie Platform.</p>`;
    }
  }

  private async sendTemplatedEmail(
    to: string | string[],
    subject: string,
    templateName: string,
    data: any,
  ) {
    try {
      const html = await this.renderTemplate(templateName, data);
      const mailOptions = {
        from: `"Shopie Platform" <${this.configService.get<string>('MAIL_USER')}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ [MAIL SERVICE] Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('❌ [MAIL SERVICE] Cannot send templated email:', error.message);
      throw error; // Re-throw so calling code can handle it
    }
  }

  async sendWelcomeEmail(userEmail: string, userName?: string) {
    const subject = 'Welcome to Shopie! 🎉';

    const templateData = {
      title: subject,
      userName: userName || userEmail,
      userEmail,
      platformName: 'Shopie',
    };

    try {
      await this.sendTemplatedEmail(
        userEmail,
        subject,
        'welcome-user',
        templateData,
      );

      console.log(
        '✅ [MAIL SERVICE] Welcome email sent successfully to user:',
        userEmail,
      );
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (error) {
      console.error(
        '❌ [MAIL SERVICE] Error sending welcome email to user:',
        userEmail,
        error.message,
      );
      return { success: false, message: 'Failed to send welcome email', error: error.message };
    }
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string) {
    const subject = 'Password Reset Request - Shopie';
    
    // For API-only testing, don't create a clickable URL
    // Just pass the token for manual API testing
    const templateData = {
      title: subject,
      userEmail,
      resetToken, // Pass token directly for API testing
      platformName: 'Shopie',
      isApiOnly: true, // Flag to indicate this is for API testing
    };

    try {
      await this.sendTemplatedEmail(
        userEmail,
        subject,
        'password-reset',
        templateData,
      );

      console.log(
        '✅ [MAIL SERVICE] Password reset email sent successfully to:',
        userEmail,
      );
      console.log('🔑 [MAIL SERVICE] Reset Token:', resetToken); // Fixed: use resetToken instead of resetUrl
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      console.error(
        '❌ [MAIL SERVICE] Error sending password reset email to:',
        userEmail,
        error.message,
      );
      throw error;
    }
  }

  async sendPasswordChangeConfirmation(userEmail: string) {
    const subject = 'Password Changed Successfully - Shopie';

    const templateData = {
      title: subject,
      userEmail,
      platformName: 'Shopie',
    };

    try {
      await this.sendTemplatedEmail(
        userEmail,
        subject,
        'password-change-confirmation',
        templateData,
      );

      console.log(
        '✅ [MAIL SERVICE] Password change confirmation sent successfully to:',
        userEmail,
      );
      return { success: true, message: 'Password change confirmation sent successfully' };
    } catch (error) {
      console.error(
        '❌ [MAIL SERVICE] Error sending password change confirmation to:',
        userEmail,
        error.message,
      );
      return { success: false, message: 'Failed to send confirmation email', error: error.message };
    }
  }

  // Keep the existing method for backwards compatibility
  async sendWelcomeToShopie(userEmail: string, userName: string) {
    return this.sendWelcomeEmail(userEmail, userName);
  }
}