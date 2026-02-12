import { z } from "zod";

const workerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters"),
  BETTERSTACK_HEARTBEAT_URL: z.string().url().optional(),
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type WorkerEnv = z.infer<typeof workerEnvSchema>;

let _env: WorkerEnv | null = null;

export function getEnv(): WorkerEnv {
  if (!_env) {
    const parsed = workerEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("Invalid worker environment variables:", parsed.error.flatten().fieldErrors);
      throw new Error("Invalid worker environment variables");
    }
    _env = parsed.data;
  }
  return _env;
}
