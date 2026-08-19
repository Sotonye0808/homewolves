CREATE TABLE "EmailLog" (
	"id" text PRIMARY KEY NOT NULL,
	"toEmail" text NOT NULL,
	"templateKey" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"providerMessageId" text,
	"error" text,
	"metadata" jsonb,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "EmailTemplate" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"htmlBody" text NOT NULL,
	"textBody" text,
	"fromEmail" text,
	"active" boolean DEFAULT true NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "EmailTemplate_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "providerId" text;--> statement-breakpoint
CREATE INDEX "EmailLog_toEmail_idx" ON "EmailLog" USING btree ("toEmail");--> statement-breakpoint
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "EmailTemplate_key_idx" ON "EmailTemplate" USING btree ("key");--> statement-breakpoint
CREATE INDEX "User_providerId_idx" ON "User" USING btree ("providerId");