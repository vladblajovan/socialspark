import { sendEmail } from "./index";
import { buildPublishFailureEmail } from "./templates/publish-failure";

interface FailedPlatformInfo {
  name: string;
  error: string;
}

export async function sendPublishFailureNotification({
  to,
  postContent,
  postId,
  platforms,
  dashboardUrl,
}: {
  to: string;
  postContent: string;
  postId: string;
  platforms: FailedPlatformInfo[];
  dashboardUrl: string;
}): Promise<{ sent: boolean }> {
  try {
    const contentPreview = postContent.length > 200 ? postContent.slice(0, 200) + "..." : postContent;

    const { subject, html } = buildPublishFailureEmail({
      contentPreview,
      platforms,
      postUrl: `${dashboardUrl}/dashboard/posts/${postId}`,
      timestamp: new Date(),
    });

    return await sendEmail({ to, subject, html });
  } catch (err) {
    console.error("Failed to send publish failure notification:", err);
    return { sent: false };
  }
}
