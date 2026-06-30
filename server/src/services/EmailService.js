const nodemailer = require("nodemailer");
const env = require("../config/env");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      } : undefined, // For local testing if auth not strictly required
    });
  }

  async sendEmail(options) {
    const message = {
      from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    try {
      const info = await this.transporter.sendMail(message);
      console.log("Email sent: %s", info.messageId);
    } catch (error) {
      console.error("Error sending email", error);
      throw error;
    }
  }

  async sendVerificationEmail(user, verifyUrl) {
    const html = `
      <h1>Welcome to FutureMedia, ${user.username}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verifyUrl}" target="_blank">Verify Email</a>
    `;
    await this.sendEmail({
      email: user.email,
      subject: "Verify Your Email Address",
      html
    });
  }

  async sendResetPassword(user, resetUrl) {
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

  async sendWelcomeEmail(user) {
    const html = `
      <h1>Welcome to FutureMedia!</h1>
      <p>We are thrilled to have you here. Start connecting with friends, sharing moments, and exploring new content.</p>
    `;
    await this.sendEmail({
      email: user.email,
      subject: "Welcome to FutureMedia",
      html
    });
  }
}

module.exports = new EmailService();
