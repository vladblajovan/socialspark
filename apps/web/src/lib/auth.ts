import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, eq, team, teamMember } from "@socialspark/db";

let _auth: ReturnType<typeof betterAuth> | null = null;

function getAuth() {
  if (!_auth) {
    const db = createDb(process.env.DATABASE_URL!);
    _auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
      }),
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        ...(process.env.GOOGLE_CLIENT_ID && {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }),
        ...(process.env.GITHUB_CLIENT_ID && {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          },
        }),
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // refresh every 24 hours
      },
      baseURL: process.env.BETTER_AUTH_URL,
      secret: process.env.BETTER_AUTH_SECRET,
      databaseHooks: {
        user: {
          create: {
            async after(user) {
              const slug = generateSlug(user.name || user.email);
              await db.insert(team).values({
                name: `${user.name || "My"}'s Team`,
                slug,
                ownerId: user.id,
                plan: "free",
              });
              const [newTeam] = await db
                .select()
                .from(team)
                .where(eq(team.ownerId, user.id));
              if (newTeam) {
                await db.insert(teamMember).values({
                  teamId: newTeam.id,
                  userId: user.id,
                  role: "owner",
                });
              }
            },
          },
        },
      },
    });
  }
  return _auth;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export { getAuth };

export type Session = Awaited<ReturnType<ReturnType<typeof betterAuth>["api"]["getSession"]>>;
