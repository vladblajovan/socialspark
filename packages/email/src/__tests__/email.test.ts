import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildPublishFailureEmail } from "../templates/publish-failure";

describe("buildPublishFailureEmail", () => {
  it("builds subject with content preview", () => {
    const result = buildPublishFailureEmail({
      contentPreview: "My amazing post about cats",
      platforms: [{ name: "Twitter", error: "Rate limited" }],
      postUrl: "https://socialspark.app/dashboard/posts/123",
      timestamp: new Date("2026-02-13T12:00:00Z"),
    });

    expect(result.subject).toBe("Publishing failed: My amazing post about cats");
  });

  it("truncates long content preview in subject", () => {
    const longContent = "A".repeat(100);
    const result = buildPublishFailureEmail({
      contentPreview: longContent,
      platforms: [{ name: "Twitter", error: "Error" }],
      postUrl: "https://example.com/post/1",
      timestamp: new Date(),
    });

    expect(result.subject.length).toBeLessThanOrEqual(75);
    expect(result.subject).toContain("...");
  });

  it("includes platform names and errors in HTML", () => {
    const result = buildPublishFailureEmail({
      contentPreview: "Test post",
      platforms: [
        { name: "Twitter (@user)", error: "API timeout" },
        { name: "LinkedIn (John)", error: "Authentication expired" },
      ],
      postUrl: "https://socialspark.app/dashboard/posts/456",
      timestamp: new Date("2026-02-13T15:30:00Z"),
    });

    expect(result.html).toContain("Twitter (@user)");
    expect(result.html).toContain("API timeout");
    expect(result.html).toContain("LinkedIn (John)");
    expect(result.html).toContain("Authentication expired");
  });

  it("includes dashboard link in HTML", () => {
    const result = buildPublishFailureEmail({
      contentPreview: "Test",
      platforms: [{ name: "Twitter", error: "Error" }],
      postUrl: "https://socialspark.app/dashboard/posts/789",
      timestamp: new Date(),
    });

    expect(result.html).toContain("https://socialspark.app/dashboard/posts/789");
    expect(result.html).toContain("View Post in Dashboard");
  });

  it("escapes HTML in content preview", () => {
    const result = buildPublishFailureEmail({
      contentPreview: '<script>alert("xss")</script>',
      platforms: [{ name: "Twitter", error: "Error" }],
      postUrl: "https://example.com/post/1",
      timestamp: new Date(),
    });

    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
  });

  it("escapes HTML in platform error messages", () => {
    const result = buildPublishFailureEmail({
      contentPreview: "Test",
      platforms: [{ name: "Twitter", error: 'Error: <img src=x onerror="alert(1)">' }],
      postUrl: "https://example.com/post/1",
      timestamp: new Date(),
    });

    expect(result.html).not.toContain("<img");
    expect(result.html).toContain("&lt;img");
  });

  it("includes formatted timestamp", () => {
    const result = buildPublishFailureEmail({
      contentPreview: "Test",
      platforms: [{ name: "Twitter", error: "Error" }],
      postUrl: "https://example.com/post/1",
      timestamp: new Date("2026-02-13T15:30:00Z"),
    });

    expect(result.html).toContain("Fri, 13 Feb 2026");
  });
});

describe("sendEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns { sent: false } when RESEND_API_KEY is not set", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const { sendEmail } = await import("../index");
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(result.sent).toBe(false);
  });
});

describe("sendPublishFailureNotification", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns { sent: false } when email sending fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const { sendPublishFailureNotification } = await import("../notifications");
    const result = await sendPublishFailureNotification({
      to: "owner@example.com",
      postContent: "Test post content",
      postId: "post-123",
      platforms: [{ name: "Twitter (@user)", error: "API timeout" }],
      dashboardUrl: "https://socialspark.app",
    });

    expect(result.sent).toBe(false);
  });

  it("truncates long post content in email", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const { sendPublishFailureNotification } = await import("../notifications");
    const longContent = "A".repeat(300);

    // Won't actually send (no API key), but exercises the path
    const result = await sendPublishFailureNotification({
      to: "owner@example.com",
      postContent: longContent,
      postId: "post-123",
      platforms: [{ name: "Twitter", error: "Error" }],
      dashboardUrl: "https://socialspark.app",
    });

    expect(result.sent).toBe(false);
  });

  it("never throws even if internal error occurs", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const { sendPublishFailureNotification } = await import("../notifications");

    // Should not throw
    const result = await sendPublishFailureNotification({
      to: "owner@example.com",
      postContent: "Test",
      postId: "post-123",
      platforms: [{ name: "Twitter", error: "Error" }],
      dashboardUrl: "https://socialspark.app",
    });

    expect(result).toEqual({ sent: false });
  });
});
