import { Resend } from "resend";

export const EMAIL_FROM_DEFAULT = "SocialSpark <noreply@socialspark.app>";

let _resend: Resend | null = null;
let _initialized = false;

function getResendClient(): Resend | null {
  if (!_initialized) {
    _initialized = true;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("Email sending disabled: RESEND_API_KEY not configured");
      return null;
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = EMAIL_FROM_DEFAULT,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false };
  }

  const { error } = await resend.emails.send({ from, to: [to], subject, html });
  if (error) {
    console.error("Failed to send email:", error);
    return { sent: false };
  }

  return { sent: true };
}
