interface FailedPlatform {
  name: string;
  error: string;
}

interface PublishFailureEmailData {
  contentPreview: string;
  platforms: FailedPlatform[];
  postUrl: string;
  timestamp: Date;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPublishFailureEmail(data: PublishFailureEmailData): {
  subject: string;
  html: string;
} {
  const preview =
    data.contentPreview.length > 50
      ? data.contentPreview.slice(0, 50) + "..."
      : data.contentPreview;

  const subject = `Publishing failed: ${preview}`;

  const platformRows = data.platforms
    .map(
      (p) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${escapeHtml(p.name)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #dc2626;">${escapeHtml(p.error)}</td>
        </tr>`
    )
    .join("");

  const formattedTime = data.timestamp.toUTCString();

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #dc2626; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Publishing Failed</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.5;">
                Your post failed to publish after all retry attempts. Here are the details:
              </p>

              <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Post Content</p>
                <p style="margin: 0; color: #111827; font-size: 14px; line-height: 1.5;">${escapeHtml(data.contentPreview)}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 24px;">
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Platform</th>
                  <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Error</th>
                </tr>
                ${platformRows}
              </table>

              <p style="margin: 0 0 24px; font-size: 13px; color: #6b7280;">
                Failed at: ${formattedTime}
              </p>

              <a href="${escapeHtml(data.postUrl)}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
                View Post in Dashboard
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                You can retry publishing from the dashboard, or edit the post and reschedule it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
