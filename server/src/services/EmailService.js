const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const env = require("../config/env");
const { getVerificationEmailHtml, getPasswordResetEmailHtml } = require("../utils/emailTemplates");

const maskString = (str) => {
  if (!str || typeof str !== "string") return "[NOT SET]";
  if (str.startsWith("re_")) return `re_${"*".repeat(Math.max(4, str.length - 3))}`;
  if (str.includes("@")) {
    const [user, domain] = str.split("@");
    return `${user.substring(0, 2)}****@${domain}`;
  }
  return `${str.substring(0, 2)}${"*".repeat(Math.max(4, str.length - 2))}`;
};

class EmailService {
  constructor() {
    this.resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
    
    if (env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 587,
        secure: Number(env.SMTP_PORT) === 465,
        auth: (env.SMTP_USER && env.SMTP_PASS) ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        } : undefined,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });
    } else {
      this.transporter = null;
    }
  }

  async sendEmail(options) {
    const fromHeader = `${env.FROM_NAME} <${env.FROM_EMAIL}>`;
    console.log("[EmailService] Outbound Email Trace:");
    console.log("  - Provider Mode: %s", this.resendClient ? "Resend HTTPS REST API (Port 443)" : "SMTP Transporter");
    console.log("  - From Header:   %s", fromHeader);
    console.log("  - Recipient:     %s", maskString(options.email));

    // Priority 1: Resend HTTP REST API (100% Cloud / Render Compatible over HTTPS Port 443)
    if (this.resendClient) {
      try {
        const payload = {
          from: fromHeader,
          to: [options.email],
          subject: options.subject,
          html: options.html,
        };
        const response = await this.resendClient.emails.send(payload);
        if (response.error) {
          throw new Error(`Resend API Error: ${response.error.message}`);
        }
        console.log("[EmailService] Email sent successfully via Resend HTTPS API:");
        console.log("  - Email ID: %s", response.data?.id);
        return { delivered: true, provider: "resend_api", messageId: response.data?.id };
      } catch (apiError) {
        console.error("[EmailService] Resend HTTPS API delivery error:", apiError.message);
        // Fallback to SMTP if transporter exists
        if (!this.transporter) throw apiError;
      }
    }

    // Priority 2: Standard SMTP Fallback
    if (!this.transporter) {
      const err = new Error("Neither Resend API Key nor SMTP settings are configured.");
      err.code = "EMAIL_DISABLED";
      throw err;
    }

    const message = {
      from: fromHeader,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    try {
      const info = await this.transporter.sendMail(message);
      console.log("[EmailService] Email sent successfully via SMTP:");
      console.log("  - Message-ID: %s", info.messageId);
      return { delivered: true, provider: "smtp", messageId: info.messageId };
    } catch (smtpError) {
      console.error("[EmailService] SMTP delivery error:", smtpError.message);
      throw smtpError;
    }
  }

  async sendVerificationEmail(user, verifyUrl) {
    const mode = env.EMAIL_MODE || (process.env.NODE_ENV === "test" ? "mock" : "resend_api");

    if (mode === "mock") {
      console.log(`[EmailService] EMAIL_MODE=mock: Simulated verification email for ${maskString(user.email)}`);
      return { delivered: true, mode: "mock", verifyUrl, info: { messageId: `<mock-${Date.now()}>` } };
    }

    if (mode === "console" && !this.resendClient && !this.transporter) {
      console.log("\n=================================================");
      console.log("FutureMedia Console Email Verification");
      console.log("=================================================");
      console.log("User:            " + maskString(user.email));
      console.log("Verification URL: " + verifyUrl);
      console.log("=================================================\n");
      return { delivered: false, mode: "console", verifyUrl };
    }

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
        console.log("FutureMedia Development Verification Link (Fallback)");
        console.log("=================================================");
        console.log("User:            " + maskString(user.email));
        console.log("Verification URL: " + verifyUrl);
        console.log("=================================================\n");

        return {
          delivered: false,
          mode: "console",
          verifyUrl,
          warning: "Verification email could not be delivered via cloud API or SMTP."
        };
      }
      throw err;
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    const mode = env.EMAIL_MODE || (process.env.NODE_ENV === "test" ? "mock" : "resend_api");

    if (mode === "mock") {
      console.log(`[EmailService] EMAIL_MODE=mock: Simulated password reset email for ${maskString(user.email)}`);
      return { delivered: true, mode: "mock", resetUrl, info: { messageId: `<mock-${Date.now()}>` } };
    }

    if (mode === "console" && !this.resendClient && !this.transporter) {
      console.log("\n=================================================");
      console.log("FutureMedia Console Password Reset Link");
      console.log("=================================================");
      console.log("User:            " + maskString(user.email));
      console.log("Reset URL:       " + resetUrl);
      console.log("=================================================\n");
      return { delivered: false, mode: "console", resetUrl };
    }

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
        console.log("User:            " + maskString(user.email));
        console.log("Reset URL:       " + resetUrl);
        console.log("=================================================\n");
        return { delivered: false, mode: "console", resetUrl };
      }
      throw err;
    }
  }
}

module.exports = new EmailService();
