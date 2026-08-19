CREATE TYPE "public"."ListingCategory" AS ENUM('SALE', 'RENT', 'SHORTLET', 'LAND');--> statement-breakpoint
CREATE TYPE "public"."ListingStatus" AS ENUM('DRAFT', 'PENDING', 'ACTIVE', 'SUSPENDED', 'SOLD', 'RENTED');--> statement-breakpoint
CREATE TYPE "public"."TransactionStatus" AS ENUM('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."TransactionType" AS ENUM('PURCHASE', 'RENTAL', 'SHORTLET');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('GUEST', 'BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TABLE "ActivityRule" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"points" integer NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"cooldownMs" integer,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	CONSTRAINT "ActivityRule_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "AgentActivity" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"ruleId" text NOT NULL,
	"points" integer NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AgentPoints" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"totalPoints" integer DEFAULT 0 NOT NULL,
	"tier" text DEFAULT 'bronze' NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "AgentPoints_agentId_unique" UNIQUE("agentId")
);
--> statement-breakpoint
CREATE TABLE "AnalyticsEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"userId" text,
	"sessionId" text,
	"listingId" text,
	"agentId" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuditEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text NOT NULL,
	"action" text NOT NULL,
	"actorId" text NOT NULL,
	"actorRole" text NOT NULL,
	"actorName" text NOT NULL,
	"ipAddress" text,
	"deviceInfo" jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timestamp" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BlogPost" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"coverImage" text,
	"authorId" text NOT NULL,
	"categories" text[] NOT NULL,
	"tags" text[] NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"publishedAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "BlogPost_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "Client" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"buyerId" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Commission" (
	"id" text PRIMARY KEY NOT NULL,
	"referralId" text NOT NULL,
	"referrerId" text NOT NULL,
	"referredId" text NOT NULL,
	"transactionId" text NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"rate" numeric(5, 4) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paidAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Conversation" (
	"id" text PRIMARY KEY NOT NULL,
	"propertyId" text,
	"participantIds" text[] NOT NULL,
	"lastMessageAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "FeaturedPlacement" (
	"id" text PRIMARY KEY NOT NULL,
	"listingId" text NOT NULL,
	"startDate" timestamp with time zone NOT NULL,
	"endDate" timestamp with time zone NOT NULL,
	"amountPaid" numeric(18, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"paystackRef" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Inspection" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"listingId" text NOT NULL,
	"scheduledAt" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"authorId" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Listing" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(18, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"category" "ListingCategory" NOT NULL,
	"propertyType" text NOT NULL,
	"status" "ListingStatus" DEFAULT 'DRAFT' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"locationJson" jsonb NOT NULL,
	"amenityIds" text[] NOT NULL,
	"ownerId" text NOT NULL,
	"agentId" text,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"enquiryCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Media" (
	"id" text PRIMARY KEY NOT NULL,
	"listingId" text NOT NULL,
	"url" text NOT NULL,
	"type" text DEFAULT 'image' NOT NULL,
	"altText" text,
	"dominantColor" text,
	"width" integer,
	"height" integer,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"displayOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Message" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"senderId" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"mediaUrl" text,
	"readAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Note" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"content" text NOT NULL,
	"authorId" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Notification" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"channel" text DEFAULT 'in_app' NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PaymentRecord" (
	"id" text PRIMARY KEY NOT NULL,
	"transactionId" text NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"evidenceUrl" text,
	"confirmedBy" text,
	"confirmedAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PlatformConfig" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updatedById" text NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "PlatformConfig_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "Rating" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text NOT NULL,
	"score" integer NOT NULL,
	"review" text,
	"authorId" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RecentlyViewed" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"sessionId" text,
	"listingId" text NOT NULL,
	"viewedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Referral" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"referrerId" text NOT NULL,
	"referredId" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"convertedAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL,
	CONSTRAINT "Referral_referredId_unique" UNIQUE("referredId")
);
--> statement-breakpoint
CREATE TABLE "SavedCollection" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"listingIds" text[] NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SignatureRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"transactionId" text NOT NULL,
	"documentId" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"signerId" text NOT NULL,
	"signerEmail" text NOT NULL,
	"signerName" text NOT NULL,
	"embedUrl" text,
	"externalId" text,
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SubscriptionPlan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(18, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"interval" text DEFAULT 'monthly' NOT NULL,
	"features" jsonb NOT NULL,
	"limits" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "SubscriptionPlan_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"planId" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"paystackRef" text,
	"currentPeriodStart" timestamp with time zone,
	"currentPeriodEnd" timestamp with time zone,
	"cancelledAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TransactionDocument" (
	"id" text PRIMARY KEY NOT NULL,
	"transactionId" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"size" integer DEFAULT 0 NOT NULL,
	"uploadedBy" text NOT NULL,
	"uploadedById" text NOT NULL,
	"visibility" text DEFAULT 'shared' NOT NULL,
	"virusScanStatus" text DEFAULT 'pending' NOT NULL,
	"signedUrl" text,
	"signedAt" timestamp with time zone,
	"createdAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"listingId" text NOT NULL,
	"buyerId" text NOT NULL,
	"agentId" text NOT NULL,
	"type" "TransactionType" NOT NULL,
	"status" "TransactionStatus" DEFAULT 'INITIATED' NOT NULL,
	"currentStep" integer DEFAULT 0 NOT NULL,
	"stepsJson" jsonb NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"avatar" text,
	"role" "UserRole" NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"referralCode" text,
	"referredById" text,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	CONSTRAINT "User_email_unique" UNIQUE("email"),
	CONSTRAINT "User_phone_unique" UNIQUE("phone"),
	CONSTRAINT "User_referralCode_unique" UNIQUE("referralCode")
);
--> statement-breakpoint
ALTER TABLE "AgentActivity" ADD CONSTRAINT "AgentActivity_agentId_User_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AgentActivity" ADD CONSTRAINT "AgentActivity_ruleId_ActivityRule_id_fk" FOREIGN KEY ("ruleId") REFERENCES "public"."ActivityRule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AgentPoints" ADD CONSTRAINT "AgentPoints_agentId_User_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_User_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Client" ADD CONSTRAINT "Client_agentId_User_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Client" ADD CONSTRAINT "Client_buyerId_User_id_fk" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_referralId_Referral_id_fk" FOREIGN KEY ("referralId") REFERENCES "public"."Referral"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "FeaturedPlacement" ADD CONSTRAINT "FeaturedPlacement_listingId_Listing_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_clientId_Client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_listingId_Listing_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_agentId_User_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Media" ADD CONSTRAINT "Media_listingId_Listing_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_Conversation_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."Conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_User_id_fk" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_Client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_transactionId_Transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_clientId_Client_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_authorId_User_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_User_id_fk" FOREIGN KEY ("referredId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_transactionId_Transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SignatureRequest" ADD CONSTRAINT "SignatureRequest_documentId_TransactionDocument_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."TransactionDocument"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_SubscriptionPlan_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."SubscriptionPlan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "TransactionDocument" ADD CONSTRAINT "TransactionDocument_transactionId_Transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_listingId_Listing_id_fk" FOREIGN KEY ("listingId") REFERENCES "public"."Listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_User_id_fk" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_agentId_User_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ActivityRule_key_idx" ON "ActivityRule" USING btree ("key");--> statement-breakpoint
CREATE INDEX "AgentActivity_agentId_idx" ON "AgentActivity" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "AgentActivity_createdAt_idx" ON "AgentActivity" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "AgentPoints_totalPoints_idx" ON "AgentPoints" USING btree ("totalPoints");--> statement-breakpoint
CREATE INDEX "AnalyticsEvent_event_idx" ON "AnalyticsEvent" USING btree ("event");--> statement-breakpoint
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AnalyticsEvent_listingId_idx" ON "AnalyticsEvent" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX "AnalyticsEvent_agentId_idx" ON "AnalyticsEvent" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "AuditEvent_entity_idx" ON "AuditEvent" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent" USING btree ("actorId");--> statement-breakpoint
CREATE INDEX "AuditEvent_timestamp_idx" ON "AuditEvent" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "BlogPost_published_idx" ON "BlogPost" USING btree ("published");--> statement-breakpoint
CREATE INDEX "BlogPost_featured_idx" ON "BlogPost" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost" USING btree ("publishedAt");--> statement-breakpoint
CREATE INDEX "BlogPost_categories_idx" ON "BlogPost" USING btree ("categories");--> statement-breakpoint
CREATE INDEX "Client_agentId_idx" ON "Client" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "Client_buyerId_idx" ON "Client" USING btree ("buyerId");--> statement-breakpoint
CREATE INDEX "Client_status_idx" ON "Client" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Commission_referrerId_idx" ON "Commission" USING btree ("referrerId");--> statement-breakpoint
CREATE INDEX "Commission_transactionId_idx" ON "Commission" USING btree ("transactionId");--> statement-breakpoint
CREATE INDEX "Commission_status_idx" ON "Commission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Conversation_participantIds_idx" ON "Conversation" USING btree ("participantIds");--> statement-breakpoint
CREATE INDEX "FeaturedPlacement_listingId_idx" ON "FeaturedPlacement" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX "FeaturedPlacement_status_idx" ON "FeaturedPlacement" USING btree ("status");--> statement-breakpoint
CREATE INDEX "FeaturedPlacement_endDate_idx" ON "FeaturedPlacement" USING btree ("endDate");--> statement-breakpoint
CREATE INDEX "Inspection_clientId_idx" ON "Inspection" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "Inspection_listingId_idx" ON "Inspection" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX "Inspection_scheduledAt_idx" ON "Inspection" USING btree ("scheduledAt");--> statement-breakpoint
CREATE INDEX "Inspection_status_idx" ON "Inspection" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Listing_status_idx" ON "Listing" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Listing_category_idx" ON "Listing" USING btree ("category");--> statement-breakpoint
CREATE INDEX "Listing_ownerId_idx" ON "Listing" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "Listing_agentId_idx" ON "Listing" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "Listing_createdAt_idx" ON "Listing" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Media_listingId_idx" ON "Media" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX "Message_conversationId_idx" ON "Message" USING btree ("conversationId");--> statement-breakpoint
CREATE INDEX "Message_createdAt_idx" ON "Message" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "Note_clientId_idx" ON "Note" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "Notification_userId_read_idx" ON "Notification" USING btree ("userId","read");--> statement-breakpoint
CREATE INDEX "Notification_createdAt_idx" ON "Notification" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "PaymentRecord_transactionId_idx" ON "PaymentRecord" USING btree ("transactionId");--> statement-breakpoint
CREATE INDEX "PlatformConfig_key_idx" ON "PlatformConfig" USING btree ("key");--> statement-breakpoint
CREATE INDEX "Rating_clientId_idx" ON "Rating" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "RecentlyViewed_userId_idx" ON "RecentlyViewed" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "RecentlyViewed_sessionId_idx" ON "RecentlyViewed" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "RecentlyViewed_listingId_idx" ON "RecentlyViewed" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX "Referral_referrerId_idx" ON "Referral" USING btree ("referrerId");--> statement-breakpoint
CREATE INDEX "Referral_status_idx" ON "Referral" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Referral_code_idx" ON "Referral" USING btree ("code");--> statement-breakpoint
CREATE INDEX "SavedCollection_userId_idx" ON "SavedCollection" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "SignatureRequest_transactionId_idx" ON "SignatureRequest" USING btree ("transactionId");--> statement-breakpoint
CREATE INDEX "SignatureRequest_status_idx" ON "SignatureRequest" USING btree ("status");--> statement-breakpoint
CREATE INDEX "SubscriptionPlan_slug_idx" ON "SubscriptionPlan" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "SubscriptionPlan_active_idx" ON "SubscriptionPlan" USING btree ("active");--> statement-breakpoint
CREATE INDEX "Subscription_userId_idx" ON "Subscription" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Subscription_status_idx" ON "Subscription" USING btree ("status");--> statement-breakpoint
CREATE INDEX "TransactionDocument_transactionId_idx" ON "TransactionDocument" USING btree ("transactionId");--> statement-breakpoint
CREATE INDEX "TransactionDocument_uploadedById_idx" ON "TransactionDocument" USING btree ("uploadedById");--> statement-breakpoint
CREATE INDEX "Transaction_listingId_idx" ON "Transaction" USING btree ("listingId");--> statement-breakpoint
CREATE INDEX "Transaction_buyerId_idx" ON "Transaction" USING btree ("buyerId");--> statement-breakpoint
CREATE INDEX "Transaction_agentId_idx" ON "Transaction" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "Transaction_status_idx" ON "Transaction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "User_role_idx" ON "User" USING btree ("role");