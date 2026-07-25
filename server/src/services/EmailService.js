const nodemailer = require("nodemailer");
const env = require("../config/env");

class EmailService {
  constructor() {
    this.isSmtpConfigured = Boolean(env.SMTP_HOST);
    if (this.isSmtpConfigured) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 2525,
        secure: env.SMTP_PORT === 465,
        auth: (env.SMTP_USER && env.SMTP_PASS) ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        } : undefined,
      });
    } else {
      this.transporter = null;
    }
  }

  async sendEmail(options) {
    const message = {
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    if (!this.transporter) {
      const err = new Error("SMTP is not configured.");
      err.code = "SMTP_DISABLED";
      throw err;
    }

    try {
      const info = await this.transporter.sendMail(message);
      console.log("[EmailService] Email sent successfully: %s", info.messageId);
      return info;
    } catch (error) {
      console.error("[EmailService] Error sending email:", error.message);
      throw error;
    }
  }

  async sendVerificationEmail(user, verifyUrl) {
    const isDevOrTest = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT_TEST === "true";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #334155; }
          .logo { font-size: 24px; font-weight: 800; color: #8b5cf6; letter-spacing: -0.5px; }
          .content { padding: 24px 0; line-height: 1.6; }
          .btn-wrapper { text-align: center; margin: 32px 0; }
          .btn { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4); }
          .fallback-link { background: #0f172a; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px; color: #94a3b8; margin-top: 16px; border: 1px solid #334155; }
          .footer { font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 20px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">FutureMedia</div>
          </div>
          <div class="content">
            <h2>Welcome to FutureMedia, ${user.username}!</h2>
            <p>Thank you for creating an account. Please verify your email address to activate your account and start connecting with your network.</p>
            <div class="btn-wrapper">
              <a href="${verifyUrl}" class="btn" target="_blank">Verify Email Address</a>
            </div>
            <p>If the button above does not work, copy and paste the link below into your web browser:</p>
            <div class="fallback-link">${verifyUrl}</div>
            <p style="margin-top: 20px; font-size: 13px; color: #cbd5e1;">⚠️ <strong>Note:</strong> This verification link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>If you did not create an account on FutureMedia, please ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} FutureMedia. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.sendEmail({
        email: user.email,
        subject: "Verify Your FutureMedia Account",
        html
      });
    } catch (err) {
      if (isDevOrTest) {
        console.log("\n=================================================");
        console.log("FutureMedia Development Email Verification");
        console.log("=================================================");
        console.log("User:            " + user.email);
        console.log("Verification URL: " + verifyUrl);
        console.log("Expires:         24 Hours");
        console.log("=================================================\n");
      }
      throw err;
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <a href="${resetUrl}" target="_blank">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;
    await this.sendEmail({
      email: user.email,
      subject: "Password Reset Token",
      html
    });
  }
}

module.exports = new EmailService();
