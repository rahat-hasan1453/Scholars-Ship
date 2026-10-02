import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendOtpEmail(toEmail: string, otpCode: string, appUrl: string, name?: string): Promise<{ success: boolean; error?: string; notConfigured?: boolean }> {
  const recipientName = name?.trim() || 'Scholar';
  
  // Email clients can't render SVG, so the wordmark is a PNG served from the site itself.
  const logoUrl = `${appUrl.replace(/\/$/, '')}/email/logo.png`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Scholars'ship sign-in code</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 24px; color: #101828; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(112, 80, 230, 0.08); border: 1px solid #EAECF0; }
          .logo { margin-bottom: 24px; }
          .logo img { display: block; width: 180px; height: 36px; border: 0; }
          .greeting { font-size: 18px; font-weight: 600; color: #101828; margin-bottom: 12px; }
          .description { font-size: 14px; color: #475467; line-height: 1.6; margin-bottom: 28px; }
          .code-box { background: #F4F1FD; border: 1.5px dashed #704FE6; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 28px; }
          .code-label { font-size: 12px; font-weight: 600; color: #704FE6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .code-number { font-size: 38px; font-weight: 800; color: #101828; letter-spacing: 10px; font-family: 'SF Pro Display', -apple-system, monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="${logoUrl}" alt="Scholars'ship" width="180" height="36">
          </div>
          <div class="greeting">
            Welcome, ${recipientName}!
          </div>
          <div class="description">
            Use the following 5-digit code to sign in to Scholars'ship:
          </div>
          <div class="code-box">
            <div class="code-label">Sign-in Code</div>
            <div class="code-number">${otpCode}</div>
          </div>
          <div class="description" style="font-size: 13px; color: #667085;">
            This code will expire in <strong>10 minutes</strong>. If you did not try to sign in, you can safely ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: toEmail, subject: `${otpCode} is your Scholars'ship sign-in code`, html: htmlContent });
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string; notConfigured?: boolean }> {
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
          from: process.env.EMAIL_FROM || 'Scholars\'ship <onboarding@resend.dev>',
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
        from: process.env.SMTP_FROM || `"Scholars'ship" <${smtpUser.trim()}>`,
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
    notConfigured: true,
    error: 'Email service credentials (SMTP_USER/SMTP_PASSWORD or RESEND_API_KEY) are not configured yet.' 
  };
}
