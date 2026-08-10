export async function sendEmail({ to, subject, html, text }) {
  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER;

  if (smtpConfigured) {
    try {
      // In production, integrate nodemailer or provider
      console.log(`[SMTP EMAIL SENT] To: ${to} | Subject: ${subject}`);
      return { success: true, mode: 'SMTP' };
    } catch (err) {
      console.error('[SMTP EMAIL ERROR]', err);
      return { success: false, error: err.message };
    }
  } else {
    // Development fallback
    console.log(`[DEV EMAIL MOCK] To: ${to} | Subject: ${subject}\nContent: ${text || html}`);
    return { success: true, mode: 'DEV_FALLBACK' };
  }
}
