CREATE TYPE "public"."marketplace" AS ENUM('mx');--> statement-breakpoint
CREATE TYPE "public"."observation_status" AS ENUM('accepted', 'duplicate', 'pending', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."offer_type" AS ENUM('amazon', 'new', 'used');--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" char(64) NOT NULL,
	"label" varchar(64),
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "price_observations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"product_id" bigint NOT NULL,
	"user_id" uuid,
	"offer_type" "offer_type" NOT NULL,
	"price_cents" integer,
	"list_price_cents" integer,
	"status" "observation_status" NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_points" (
	"product_id" bigint NOT NULL,
	"offer_type" "offer_type" NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"price_cents" integer,
	CONSTRAINT "price_points_product_id_offer_type_ts_pk" PRIMARY KEY("product_id","offer_type","ts")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"marketplace" "marketplace" NOT NULL,
	"asin" varchar(10) NOT NULL,
	"title" text,
	"image_url" text,
	"last_observed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" bigint NOT NULL,
	"target_price_cents" integer,
	"last_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracked_products_user_product_uq" UNIQUE("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_points" ADD CONSTRAINT "price_points_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_products" ADD CONSTRAINT "tracked_products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_products" ADD CONSTRAINT "tracked_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_tokens_token_hash_idx" ON "api_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "api_tokens_user_idx" ON "api_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "price_obs_product_offer_received_idx" ON "price_observations" USING btree ("product_id","offer_type","received_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "price_obs_received_idx" ON "price_observations" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "products_marketplace_asin_idx" ON "products" USING btree ("marketplace","asin");--> statement-breakpoint
CREATE INDEX "tracked_products_product_idx" ON "tracked_products" USING btree ("product_id") WHERE "tracked_products"."target_price_cents" is not null;