-- Drizzle baseline migration. Innehåller både auth-tabeller (som Auth.js
-- redan satt upp i prod-DB) och conversation-tabeller (helt nya).
--
-- IF NOT EXISTS gör migrationen idempotent: kan köras mot Carls befintliga
-- Railway-DB utan att smälla på existerande auth-tabeller, och mot en ren
-- DB i framtida environments (preview, staging) som "skapa allt".

CREATE TABLE IF NOT EXISTS "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"selvra_tenant_id" text,
	"selvra_subject_id" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consumer_conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_memory_fact" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"fact_text" text NOT NULL,
	"source_turn_id" text,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp,
	"redacted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_turn" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"turn_index" integer NOT NULL,
	"user_text" text NOT NULL,
	"selvra_text" text,
	"sources_consulted" jsonb,
	"llm_provider" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Foreign keys: DO-block med EXCEPTION-handling så befintliga FKs inte
-- triggar fel. Auth-FKs finns redan i prod; conversation-FKs är nya.
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consumer_conversation" ADD CONSTRAINT "consumer_conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_memory_fact" ADD CONSTRAINT "conversation_memory_fact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_memory_fact" ADD CONSTRAINT "conversation_memory_fact_source_turn_id_conversation_turn_id_fk" FOREIGN KEY ("source_turn_id") REFERENCES "public"."conversation_turn"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_turn" ADD CONSTRAINT "conversation_turn_conversation_id_consumer_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."consumer_conversation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
