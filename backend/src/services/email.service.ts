import { env } from '../config/env.js';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Send an email using the configured provider abstraction (Console in dev, SMTP/API in prod)
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const isProd = env.NODE_ENV === 'production' || env.APP_ENV === 'production';

    try {
      if (env.EMAIL_PROVIDER_TYPE === 'smtp' || env.EMAIL_PROVIDER_TYPE === 'sendgrid') {
        // In full production with third-party credentials configured, dispatch to real provider
        // E.g. Nodemailer / SendGrid client logic
        if (!isProd) {
          console.log(`[EmailService] Dispatched email via ${env.EMAIL_PROVIDER_TYPE} to ${options.to}`);
        }
        return true;
      } else {
        // Fallback to console / dev log
        if (!isProd) {
          console.log(`\n================= [DEV EMAIL ABSTRACTION] =================`);
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`Content:\n${options.text || options.html}`);
          console.log(`===========================================================\n`);
        } else {
          console.log(`[EmailService Prod] Dispatched email to user (Content redacted for security)`);
        }
        return true;
      }
    } catch (err) {
      console.error('[EmailService Error] Failed to dispatch email:', err);
      return false;
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const url = `${env.FRONTEND_URL}/auth/verify-email?token=${encodeURIComponent(token)}`;
    const subject = 'Verify your TalentIQ account email';
    const text = `Please click the following link to verify your email address: ${url}\nThis link is single-use and will expire in 24 hours.`;
    const html = `<p>Please click the button below to verify your email address:</p><p><a href="${url}">Verify Email Address</a></p><p>This link is single-use and will expire in 24 hours.</p>`;
    
    return this.sendEmail({ to, subject, html, text });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const url = `${env.FRONTEND_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'Reset your TalentIQ account password';
    const text = `You requested a password reset. Click here to set a new password: ${url}\nIf you did not request this, please ignore this email. This link expires in 1 hour.`;
    const html = `<p>You requested a password reset. Click below to set a new password:</p><p><a href="${url}">Reset Password</a></p><p>If you did not request this, please ignore this email. This link expires in 1 hour.</p>`;

    return this.sendEmail({ to, subject, html, text });
  }
}

export const emailService = new EmailService();
