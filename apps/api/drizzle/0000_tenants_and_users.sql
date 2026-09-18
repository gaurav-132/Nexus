CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended');
--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'admin', 'member');
--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'invited', 'suspended');
--> statement-breakpoint
CREATE TABLE "tenants" (
    "id" uuid PRIMARY KEY NOT NULL,
    "name" varchar(120) NOT NULL,
    "slug" varchar(80) NOT NULL,
    "status" "tenant_status" DEFAULT 'active' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
    "id" uuid PRIMARY KEY NOT NULL,
    "tenant_id" uuid NOT NULL,
    "email" varchar(320) NOT NULL,
    "password_hash" varchar(255) NOT NULL,
    "first_name" varchar(80) NOT NULL,
    "last_name" varchar(80),
    "role" "user_role" DEFAULT 'member' NOT NULL,
    "status" "user_status" DEFAULT 'active' NOT NULL,
    "email_verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users"
    ADD CONSTRAINT "users_tenant_id_tenants_id_fk"
    FOREIGN KEY ("tenant_id")
    REFERENCES "public"."tenants"("id")
    ON DELETE cascade
    ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_unique" ON "tenants" USING btree ("slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "users_tenant_email_unique" ON "users" USING btree ("tenant_id","email");
--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "users" USING btree ("tenant_id");
