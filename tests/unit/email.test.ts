import { describe, expect, it, vi } from 'vitest';

vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: vi.fn() }) } }));

describe('sendOtpEmail', () => {
  it('uses the given origin for the logo and sends a plain-text part with the code', async () => {
    const sendMail = vi.fn().mockResolvedValue({});
    vi.resetModules();
    vi.doMock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail }) } }));
    process.env.SMTP_USER = 'sender@gmail.com';
    process.env.SMTP_PASSWORD = 'abcd efgh ijkl mnop';
    delete process.env.RESEND_API_KEY;
    const { sendOtpEmail } = await import('@/lib/email');
    const res = await sendOtpEmail('a@b.test', '12345', 'https://scholarsship.vercel.app');
    expect(res.success).toBe(true);
    const mail = sendMail.mock.calls[0][0];
    expect(mail.html).toContain('https://scholarsship.vercel.app/email/logo.png');
    expect(mail.text).toContain('12345');
    expect(mail.text).not.toMatch(/<[a-z]/i);
  });
});
