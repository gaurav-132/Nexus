DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM users
        GROUP BY lower(email)
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Cannot make email globally unique: duplicate email identities exist across tenants. Resolve them before applying this migration.';
    END IF;
END
$$;
--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'suspended');
--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" varchar(160);
--> statement-breakpoint
UPDATE "users"
SET "email" = lower("email"),
    "name" = left(
        COALESCE(
            NULLIF(trim(concat_ws(' ', "first_name", "last_name")), ''),
            split_part(lower("email"), '@', 1)
        ),
        160
    );
--> statement-breakpoint
CREATE TABLE "memberships" (
    "id" uuid PRIMARY KEY NOT NULL,
    "user_id" uuid NOT NULL,
    "tenant_id" uuid NOT NULL,
    "role" "user_role" DEFAULT 'member' NOT NULL,
    "status" "membership_status" DEFAULT 'active' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "memberships_user_tenant_unique" UNIQUE("user_id", "tenant_id")
);
--> statement-breakpoint
INSERT INTO "memberships" ("id", "user_id", "tenant_id", "role", "status", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", "tenant_id", "role", 'active', "created_at", "updated_at"
FROM "users";
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "memberships_tenant_id_index" ON "memberships" USING btree ("tenant_id");
--> statement-breakpoint
ALTER TABLE "auth_sessions" RENAME TO "sessions";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "auth_sessions_pkey";
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "id" uuid;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "membership_id" uuid;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_used_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "revoked_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "sessions" SET "id" = gen_random_uuid(), "last_used_at" = "created_at";
--> statement-breakpoint
UPDATE "sessions" AS s
SET "membership_id" = membership."id"
FROM "users" AS "user"
JOIN "memberships" AS membership
  ON membership."user_id" = "user"."id"
 AND membership."tenant_id" = "user"."tenant_id"
WHERE s."user_id" = "user"."id";
--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_hash_unique" UNIQUE ("token_hash");
--> statement-breakpoint
ALTER TABLE "sessions" RENAME CONSTRAINT "auth_sessions_user_id_users_id_fk" TO "sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER INDEX "auth_sessions_user_id_index" RENAME TO "sessions_user_id_index";
--> statement-breakpoint
ALTER INDEX "auth_sessions_expires_at_index" RENAME TO "sessions_expires_at_index";
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_membership_id_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sessions_membership_id_index" ON "sessions" USING btree ("membership_id");
--> statement-breakpoint
CREATE TABLE "invitations" (
    "id" uuid PRIMARY KEY NOT NULL,
    "tenant_id" uuid NOT NULL,
    "email" varchar(320) NOT NULL,
    "role" "user_role" NOT NULL,
    "token_hash" varchar(64) NOT NULL,
    "invited_by" uuid NOT NULL,
    "status" "invitation_status" DEFAULT 'pending' NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash"),
    CONSTRAINT "invitations_email_lowercase_check" CHECK ("email" = lower("email"))
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "invitations_tenant_email_index" ON "invitations" USING btree ("tenant_id", "email");
--> statement-breakpoint
CREATE INDEX "invitations_expiry_index" ON "invitations" USING btree ("expires_at");
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_email_unique";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_tenants_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "tenant_id";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "first_name";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "last_name";
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase_check" CHECK ("email" = lower("email"));
--> statement-breakpoint
