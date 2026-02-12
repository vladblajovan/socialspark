import { pgTable, text, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { team } from "./teams";

export const platformAccount = pgTable(
  "platform_account",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    platform: text("platform").notNull(),
    platformUserId: text("platform_user_id").notNull(),
    platformUsername: text("platform_username"),
    platformDisplayName: text("platform_display_name"),
    platformAvatarUrl: text("platform_avatar_url"),
    accessTokenEnc: text("access_token_enc"),
    refreshTokenEnc: text("refresh_token_enc"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    scopes: text("scopes").array(),
    metadata: text("metadata").default("{}"),
    isActive: boolean("is_active").notNull().default(true),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_platform_accounts_team_id").on(table.teamId),
    index("idx_platform_accounts_platform").on(table.platform),
    uniqueIndex("uq_platform_accounts_team_platform_user").on(
      table.teamId,
      table.platform,
      table.platformUserId,
    ),
    index("idx_platform_accounts_token_expires")
      .on(table.tokenExpiresAt)
      .where(sql`is_active = true`),
  ]
);
