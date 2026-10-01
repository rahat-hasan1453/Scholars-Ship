import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendOtpEmail(toEmail: string, otpCode: string, name?: string): Promise<{ success: boolean; error?: string }> {
  const recipientName = name?.trim() || 'Scholar';
  
  // HTML Template for HighScholar Verification Email
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your HighScholar account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 24px; color: #101828; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(112, 80, 230, 0.08); border: 1px solid #EAECF0; }
          .logo { font-size: 24px; font-weight: 800; color: #704FE6; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
          .greeting { font-size: 18px; font-weight: 600; color: #101828; margin-bottom: 12px; }
          .description { font-size: 14px; color: #475467; line-height: 1.6; margin-bottom: 28px; }
          .code-box { background: #F4F1FD; border: 1.5px dashed #704FE6; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 28px; }
          .code-label { font-size: 12px; font-weight: 600; color: #704FE6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .code-number { font-size: 38px; font-weight: 800; color: #101828; letter-spacing: 10px; font-family: 'SF Pro Display', -apple-system, monospace; }
          .footer-note { font-size: 12px; color: #98A2B3; line-height: 1.5; border-top: 1px solid #F2F4F7; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            🎓 HighScholar
          </div>
          <div class="greeting">
            Welcome, ${recipientName}!
          </div>
          <div class="description">
            Thank you for registering with HighScholar. Please use the following 5-digit verification code to confirm your email and complete your scholar account setup:
          </div>
          <div class="code-box">
            <div class="code-label">Verification Code</div>
            <div class="code-number">${otpCode}</div>
          </div>
          <div class="description" style="font-size: 13px; color: #667085;">
            This code will expire in <strong>10 minutes</strong>. If you did not request this registration, you can safely ignore this email.
          </div>
          <div class="footer-note">
            HighScholar — Global Higher Ed, Fully Funded Scholarships & Faculty Matching<br/>
            Need help? Contact support@highscholar.io
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: toEmail, subject: `${otpCode} is your HighScholar verification code`, html: htmlContent });
}

export async function sendPasswordResetEmail(toEmail: string, resetLink: string, name?: string): Promise<{ success: boolean; error?: string }> {
  const recipientName = (name?.trim() || 'Scholar').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your HighScholar password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 24px; color: #101828; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(112, 80, 230, 0.08); border: 1px solid #EAECF0; }
          .logo { font-size: 24px; font-weight: 800; color: #7150E7; margin-bottom: 24px; }
          .greeting { font-size: 18px; font-weight: 600; color: #101828; margin-bottom: 12px; }
          .description { font-size: 14px; color: #475467; line-height: 1.6; margin-bottom: 28px; }
          .button { display: inline-block; background: #7150E7; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 10px 20px; border-radius: 8px; margin-bottom: 28px; }
          .link { font-size: 12px; color: #667085; word-break: break-all; margin-bottom: 28px; }
          .footer-note { font-size: 12px; color: #98A2B3; line-height: 1.5; border-top: 1px solid #F2F4F7; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">HighScholar</div>
          <div class="greeting">Hi ${recipientName},</div>
          <div class="description">
            We received a request to reset your HighScholar password. Click the button below to choose a new password.
          </div>
          <a class="button" href="${resetLink}">Reset password</a>
          <div class="link">Or copy this link into your browser:<br/>${resetLink}</div>
          <div class="description" style="font-size: 13px; color: #667085;">
            This link will expire in <strong>30 minutes</strong> and can be used once. If you did not request a password reset, you can safely ignore this email.
          </div>
          <div class="footer-note">
            HighScholar — Global Higher Ed, Fully Funded Scholarships & Faculty Matching<br/>
            Need help? Contact support@highscholar.io
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: toEmail, subject: 'Reset your HighScholar password', html: htmlContent });
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  // 1. Check if Resend API Key is set
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'HighScholar <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
        }),
      });

      if (response.ok) {
        console.log(`[Email] Sent "${subject}" via Resend to ${to}`);
        return { success: true };
      }
      const errData = await response.json();
      console.error('[Email] Resend error:', errData);
    } catch (err) {
      console.error('[Email] Resend fetch exception:', err);
    }
  }

  // 2. Check if SMTP configuration is set (e.g. Gmail, Amazon SES, SendGrid SMTP)
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST || (smtpUser?.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);
  const smtpPort = Number(process.env.SMTP_PORT) || 465;

  if (smtpUser && smtpPass) {
    try {
      const cleanPass = smtpPass.replace(/\s+/g, '');
      const isGmail = (smtpHost && smtpHost.includes('gmail')) || smtpUser.includes('@gmail.com');

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpUser.trim(),
              pass: cleanPass,
            },
          })
        : nodemailer.createTransport({
            host: smtpHost || 'smtp.gmail.com',
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser.trim(),
              pass: cleanPass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"HighScholar" <${smtpUser.trim()}>`,
        to,
        subject,
        html,
      });

      console.log(`[Email] Sent "${subject}" via SMTP to ${to}`);
      return { success: true };
    } catch (smtpError: any) {
      console.error('[Email] SMTP send failure:', smtpError);
      const detail = smtpError?.message || 'Failed to dispatch email via SMTP server.';
      return { 
        success: false, 
        error: detail.includes('535') 
          ? 'Gmail authentication failed: Please verify that you are using a 16-character Google App Password (not your regular Gmail password).' 
          : `SMTP dispatch error: ${detail}` 
      };
    }
  }

  // If no SMTP or Resend credentials are provided in env:
  console.warn(`[HighScholar Email Notice] No SMTP or Resend credentials configured in .env.local / Vercel Environment Variables. Undelivered email to ${to}: ${subject}`);
  return { 
    success: false, 
    error: 'Email service credentials (SMTP_USER/SMTP_PASSWORD or RESEND_API_KEY) are not configured yet.' 
  };
}
