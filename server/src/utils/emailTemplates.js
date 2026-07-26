/**
 * FutureMedia V2 Email Templates Module
 * Modern, dark-mode, high-contrast HTML email templates following email client best practices.
 */

const BRAND = {
  name: "FutureMedia",
  primaryColor: "#7C3AED",
  gradientStart: "#7C3AED",
  gradientEnd: "#6366F1",
  bgColor: "#0B0F19",
  cardBg: "#131B2E",
  borderColor: "#1E293B",
  textColor: "#FFFFFF",
  subtextColor: "#94A3B8",
  accentBlue: "#38BDF8",
};

/**
 * Generates the V2 HTML Email Verification Template
 */
function getVerificationEmailHtml(user, verifyUrl) {
  const currentYear = new Date().getFullYear();
  const username = user.username || "Creator";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Verify Your FutureMedia Account</title>
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: ${BRAND.bgColor}; color: ${BRAND.textColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    /* Hover effects */
    .cta-button:hover { background-color: #6D28D9 !important; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5) !important; }
    .link-hover:hover { text-decoration: underline !important; color: #38BDF8 !important; }

    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .card-padding { padding: 24px 20px !important; }
      .mobile-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
      .title-text { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <!-- Outer Wrapper Table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND.bgColor}; padding: 40px 0;">
    <tr>
      <td align="center" style="padding: 0 16px;">
        
        <!-- Main Email Container (Max Width 560px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="560" class="email-container" style="max-width: 560px; width: 100%; background-color: ${BRAND.cardBg}; border-radius: 16px; border: 1px solid ${BRAND.borderColor}; border-collapse: separate; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 36px 36px 24px 36px; border-bottom: 1px solid ${BRAND.borderColor};" class="card-padding">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, ${BRAND.gradientStart}, ${BRAND.gradientEnd}); display: inline-block; text-align: center; line-height: 40px; color: #FFFFFF; font-weight: 800; font-size: 16px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);">FM</div>
                  </td>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; vertical-align: middle;">FutureMedia</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECURITY BADGE & CONTENT BODY -->
          <tr>
            <td style="padding: 36px 36px;" class="card-padding">
              
              <!-- Security Shield Graphic -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background-color: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); display: inline-block; text-align: center; line-height: 64px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: 16px;">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Welcome Heading -->
              <h1 class="title-text" style="margin: 0 0 12px 0; font-size: 26px; font-weight: 700; color: #FFFFFF; text-align: center; line-height: 1.3;">Verify your email address</h1>
              
              <!-- Subtitle -->
              <p style="margin: 0 0 28px 0; font-size: 15px; color: ${BRAND.subtextColor}; text-align: center; line-height: 1.6;">
                Welcome to FutureMedia, <strong style="color: #FFFFFF;">${username}</strong>! Please confirm your email address to activate your account and start sharing.
              </p>

              <!-- CTA BUTTON TABLE -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" class="mobile-btn">
                      <tr>
                        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, ${BRAND.gradientStart}, ${BRAND.gradientEnd}); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);">
                          <a href="${verifyUrl}" target="_blank" class="cta-button mobile-btn" style="display: inline-block; padding: 15px 36px; font-size: 16px; font-weight: 600; color: #FFFFFF !important; text-decoration: none; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); font-family: inherit;">
                            Verify Email Address &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SECURITY SUMMARY CARD -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A; border-radius: 12px; border: 1px solid ${BRAND.borderColor}; margin-bottom: 28px; padding: 18px 20px;">
                <tr>
                  <td style="font-size: 13px; color: ${BRAND.subtextColor}; line-height: 1.9;">
                    <div style="margin-bottom: 8px;">
                      <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #10B981; color: #0B0F19; font-size: 11px; font-weight: 800; text-align: center; line-height: 18px; margin-right: 8px; vertical-align: middle;">&#10003;</span>
                      <span style="vertical-align: middle;">Security Note: Link expires in <strong style="color: #FFFFFF;">24 hours</strong>.</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                      <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #10B981; color: #0B0F19; font-size: 11px; font-weight: 800; text-align: center; line-height: 18px; margin-right: 8px; vertical-align: middle;">&#10003;</span>
                      <span style="vertical-align: middle;">Single-use authentication link.</span>
                    </div>
                    <div>
                      <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #64748B; color: #0B0F19; font-size: 11px; font-weight: 800; text-align: center; line-height: 18px; margin-right: 8px; vertical-align: middle;">i</span>
                      <span style="vertical-align: middle;">Didn't create an account? You can safely ignore this email.</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- FALLBACK LINK SECTION -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 12px; color: ${BRAND.subtextColor}; line-height: 1.5; padding-bottom: 8px;">
                    Button not working? Copy and paste this URL into your browser:
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="background-color: #090D16; border: 1px solid #1E293B; border-radius: 8px; padding: 12px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 12px; color: #38BDF8; word-break: break-all; line-height: 1.4;">
                      ${verifyUrl}
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #090D16; padding: 24px 36px; border-top: 1px solid ${BRAND.borderColor}; text-align: center;" class="card-padding">
              <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">
                FutureMedia Social Platform
              </p>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748B;">
                Connecting creators, communities, and conversations.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748B;">
                <a href="${verifyUrl}" style="color: #94A3B8; text-decoration: none;" class="link-hover">Help Center</a> &bull; 
                <a href="${verifyUrl}" style="color: #94A3B8; text-decoration: none;" class="link-hover">Privacy Policy</a> &bull; 
                <a href="${verifyUrl}" style="color: #94A3B8; text-decoration: none;" class="link-hover">Terms of Service</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${currentYear} FutureMedia Inc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Generates the V2 HTML Password Reset Template
 */
function getPasswordResetEmailHtml(user, resetUrl) {
  const currentYear = new Date().getFullYear();
  const username = user.username || "Creator";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Reset Your FutureMedia Password</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: ${BRAND.bgColor}; color: ${BRAND.textColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    .cta-button:hover { background-color: #6D28D9 !important; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5) !important; }
    .link-hover:hover { text-decoration: underline !important; color: #38BDF8 !important; }

    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .card-padding { padding: 24px 20px !important; }
      .mobile-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
      .title-text { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND.bgColor}; padding: 40px 0;">
    <tr>
      <td align="center" style="padding: 0 16px;">
        
        <table border="0" cellpadding="0" cellspacing="0" width="560" class="email-container" style="max-width: 560px; width: 100%; background-color: ${BRAND.cardBg}; border-radius: 16px; border: 1px solid ${BRAND.borderColor}; border-collapse: separate; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="padding: 36px 36px 24px 36px; border-bottom: 1px solid ${BRAND.borderColor};" class="card-padding">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, ${BRAND.gradientStart}, ${BRAND.gradientEnd}); display: inline-block; text-align: center; line-height: 40px; color: #FFFFFF; font-weight: 800; font-size: 16px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);">FM</div>
                  </td>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; vertical-align: middle;">FutureMedia</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SECURITY BADGE & CONTENT BODY -->
          <tr>
            <td style="padding: 36px 36px;" class="card-padding">
              
              <!-- Lock Key Graphic -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background-color: rgba(124, 58, 237, 0.15); border: 1px solid rgba(124, 58, 237, 0.3); display: inline-block; text-align: center; line-height: 64px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-top: 16px;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Welcome Heading -->
              <h1 class="title-text" style="margin: 0 0 12px 0; font-size: 26px; font-weight: 700; color: #FFFFFF; text-align: center; line-height: 1.3;">Reset your password</h1>
              
              <!-- Subtitle -->
              <p style="margin: 0 0 28px 0; font-size: 15px; color: ${BRAND.subtextColor}; text-align: center; line-height: 1.6;">
                Hi <strong style="color: #FFFFFF;">${username}</strong>, we received a request to reset the password for your FutureMedia account.
              </p>

              <!-- CTA BUTTON TABLE -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0" class="mobile-btn">
                      <tr>
                        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, ${BRAND.gradientStart}, ${BRAND.gradientEnd}); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);">
                          <a href="${resetUrl}" target="_blank" class="cta-button mobile-btn" style="display: inline-block; padding: 15px 36px; font-size: 16px; font-weight: 600; color: #FFFFFF !important; text-decoration: none; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); font-family: inherit;">
                            Reset Password &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- SECURITY SUMMARY CARD -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A; border-radius: 12px; border: 1px solid ${BRAND.borderColor}; margin-bottom: 28px; padding: 18px 20px;">
                <tr>
                  <td style="font-size: 13px; color: ${BRAND.subtextColor}; line-height: 1.9;">
                    <div style="margin-bottom: 8px;">
                      <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #10B981; color: #0B0F19; font-size: 11px; font-weight: 800; text-align: center; line-height: 18px; margin-right: 8px; vertical-align: middle;">&#10003;</span>
                      <span style="vertical-align: middle;">Security Note: Reset link expires in <strong style="color: #FFFFFF;">1 hour</strong>.</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                      <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #10B981; color: #0B0F19; font-size: 11px; font-weight: 800; text-align: center; line-height: 18px; margin-right: 8px; vertical-align: middle;">&#10003;</span>
                      <span style="vertical-align: middle;">Single-use secure token.</span>
                    </div>
                    <div>
                      <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #64748B; color: #0B0F19; font-size: 11px; font-weight: 800; text-align: center; line-height: 18px; margin-right: 8px; vertical-align: middle;">i</span>
                      <span style="vertical-align: middle;">Didn't request this reset? You can safely ignore this email.</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- FALLBACK LINK SECTION -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 12px; color: ${BRAND.subtextColor}; line-height: 1.5; padding-bottom: 8px;">
                    Button not working? Copy and paste this URL into your browser:
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="background-color: #090D16; border: 1px solid #1E293B; border-radius: 8px; padding: 12px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 12px; color: #38BDF8; word-break: break-all; line-height: 1.4;">
                      ${resetUrl}
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #090D16; padding: 24px 36px; border-top: 1px solid ${BRAND.borderColor}; text-align: center;" class="card-padding">
              <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; color: #FFFFFF;">
                FutureMedia Social Platform
              </p>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #64748B;">
                Connecting creators, communities, and conversations.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${currentYear} FutureMedia Inc. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

module.exports = {
  BRAND,
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
};
