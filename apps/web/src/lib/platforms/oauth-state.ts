import { randomBytes, createHmac, timingSafeEqual } from "crypto";

export function generateCodeVerifier(): string {
  return randomBytes(32)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9\-._~]/g, "");
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("base64url");
}

interface OAuthStatePayload {
  teamId: string;
  csrf: string;
}

export function generateOAuthState(teamId: string, secret: string): { state: string; csrf: string } {
  const csrf = randomBytes(16).toString("hex");
  const payload: OAuthStatePayload = { teamId, csrf };
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return {
    state: `${encoded}.${signature}`,
    csrf,
  };
}

export function verifyOAuthState(
  state: string,
  csrfFromCookie: string,
  secret: string,
): { teamId: string } {
  const dotIndex = state.indexOf(".");
  if (dotIndex === -1) {
    throw new Error("Invalid OAuth state format");
  }

  const encoded = state.slice(0, dotIndex);
  const signature = state.slice(dotIndex + 1);

  const expectedSig = createHmac("sha256", secret).update(encoded).digest("base64url");

  if (
    signature.length !== expectedSig.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  ) {
    throw new Error("Invalid OAuth state signature");
  }

  const json = Buffer.from(encoded, "base64url").toString();
  const payload: OAuthStatePayload = JSON.parse(json);

  if (payload.csrf !== csrfFromCookie) {
    throw new Error("CSRF token mismatch");
  }

  return { teamId: payload.teamId };
}
