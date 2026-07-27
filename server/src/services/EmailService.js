const nodemailer = require("nodemailer");
const env = require("../config/env");
const { getVerificationEmailHtml, getPasswordResetEmailHtml } = require("../utils/emailTemplates");

class EmailService {
  constructor() {
    this.isSmtpConfigured = Boolean(env.SMTP_HOST);
    if (this.isSmtpConfigured) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 2525,
        secure: Number(env.SMTP_PORT) === 465,
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
    const fromHeader = `${env.FROM_NAME} <${env.FROM_EMAIL}>`;
    console.log("[EmailService] Outbound Email Header Trace:");
    console.log("  - env.FROM_EMAIL: %s", env.FROM_EMAIL);
    console.log("  - env.FROM_NAME:  %s", env.FROM_NAME);
    console.log("  - message.from:    %s", fromHeader);
    console.log("  - message.to:      %s", options.email);

    const message = {
      from: fromHeader,
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
      console.log("[EmailService] Email sent successfully via SMTP:");
      console.log("  - Message-ID: %s", info.messageId);
      console.log("  - Envelope From: %s", info.envelope?.from);
      console.log("  - Envelope To:   %j", info.envelope?.to);
      console.log("  - SMTP Response: %s", info.response);
      return info;
    } catch (error) {
      console.error("[EmailService] Error sending email:", error.message);
      throw error;
    }
  }

  async sendVerificationEmail(user, verifyUrl) {
    const mode = env.EMAIL_MODE || (process.env.NODE_ENV === "test" ? "mock" : "resend");

    if (mode === "mock") {
      console.log(`[EmailService] EMAIL_MODE=mock: Simulated verification email for ${user.email}`);
      return { delivered: true, mode: "mock", verifyUrl, info: { messageId: `<mock-${Date.now()}>` } };
    }

    if (mode === "console") {
      console.log("\n=================================================");
      console.log("FutureMedia Console Email Verification");
      console.log("=================================================");
      console.log("User:            " + user.email);
      console.log("Verification URL: " + verifyUrl);
      console.log("Expires:         24 Hours");
      console.log("=================================================\n");
      return { delivered: false, mode: "console", verifyUrl };
    }

    // mode === "resend"
    const html = getVerificationEmailHtml(user, verifyUrl);
    try {
      const info = await this.sendEmail({
        email: user.email,
        subject: "Verify Your FutureMedia Account",
        html
      });
      return { delivered: true, info };
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.log("\n=================================================");
        console.log("FutureMedia Development Email Verification (Fallback)");
        console.log("=================================================");
        console.log("User:            " + user.email);
        console.log("Verification URL: " + verifyUrl);
        console.log("Expires:         24 Hours");
        console.log("=================================================\n");

        return {
          delivered: false,
          mode: "console",
          verifyUrl,
          warning: "Verification email could not be sent because SMTP is not configured."
        };
      }
      throw err;
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    const mode = env.EMAIL_MODE || (process.env.NODE_ENV === "test" ? "mock" : "resend");

    if (mode === "mock") {
      console.log(`[EmailService] EMAIL_MODE=mock: Simulated password reset email for ${user.email}`);
      return { delivered: true, mode: "mock", resetUrl, info: { messageId: `<mock-${Date.now()}>` } };
    }

    if (mode === "console") {
      console.log("\n=================================================");
      console.log("FutureMedia Console Password Reset Link");
      console.log("=================================================");
      console.log("User:            " + user.email);
      console.log("Reset URL:       " + resetUrl);
      console.log("Expires:         1 Hour");
      console.log("=================================================\n");
      return { delivered: false, mode: "console", resetUrl };
    }

    // mode === "resend"
    const html = getPasswordResetEmailHtml(user, resetUrl);

    try {
      const info = await this.sendEmail({
        email: user.email,
        subject: "Reset Your FutureMedia Password",
        html
      });
      return { delivered: true, info };
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.log("\n=================================================");
        console.log("FutureMedia Development Password Reset Link (Fallback)");
        console.log("=================================================");
        console.log("User:            " + user.email);
        console.log("Reset URL:       " + resetUrl);
        console.log("Expires:         1 Hour");
        console.log("=================================================\n");
        return { delivered: false, mode: "console", resetUrl };
      }
      throw err;
    }
  }
}

module.exports = new EmailService();
