import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionOrThrow, getUserTeam } from "@/lib/session";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getStorageAdapter } from "@/lib/storage";
import { media, eq, desc } from "@socialspark/db";
import {
  ALLOWED_MEDIA_TYPES,
  MAX_MEDIA_SIZE_BYTES,
  type AllowedMediaType,
} from "@socialspark/shared";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const altText = formData.get("altText") as string | null;

    if (!file) {
      return apiError("No file provided", 400);
    }

    if (!ALLOWED_MEDIA_TYPES.includes(file.type as AllowedMediaType)) {
      return apiError(
        `Invalid file type. Allowed: ${ALLOWED_MEDIA_TYPES.join(", ")}`,
        400
      );
    }

    if (file.size > MAX_MEDIA_SIZE_BYTES) {
      return apiError(
        `File too large. Maximum size: ${MAX_MEDIA_SIZE_BYTES / 1024 / 1024}MB`,
        400
      );
    }

    const storage = getStorageAdapter();
    const ext = file.name.split(".").pop() || "bin";
    const key = `${crypto.randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageUrl = await storage.upload(key, buffer, file.type);

    const [record] = await db
      .insert(media)
      .values({
        teamId: team.teamId,
        uploadedBy: session.user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageKey: key,
        storageUrl,
        altText: altText || undefined,
      })
      .returning();

    return apiSuccess(record, undefined, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("POST /api/v1/media error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function GET() {
  try {
    const session = await getSessionOrThrow();
    const team = await getUserTeam(session.user.id);
    const db = getDb();

    const items = await db
      .select()
      .from(media)
      .where(eq(media.teamId, team.teamId))
      .orderBy(desc(media.createdAt));

    return apiSuccess(items);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("GET /api/v1/media error:", err);
    return apiError("Internal server error", 500);
  }
}
