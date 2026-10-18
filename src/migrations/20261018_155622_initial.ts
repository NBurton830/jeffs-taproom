import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_menu_items_tags" AS ENUM('popular', 'spicy', 'seafood', 'vegetarian', 'new');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('new', 'accepted', 'ready', 'completed', 'cancelled');
  CREATE TYPE "public"."enum_orders_pickup_mode" AS ENUM('asap', 'scheduled');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('cash', 'card_at_pickup', 'online_card');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('unpaid', 'paid');
  CREATE TYPE "public"."enum_events_category" AS ENUM('trivia', 'music', 'sports', 'party', 'other');
  CREATE TYPE "public"."enum_specials_days" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
  CREATE TYPE "public"."enum_taps_status" AS ENUM('on', 'coming-soon', 'kicked');
  CREATE TYPE "public"."enum_challenge_entries_result" AS ENUM('won', 'attempted');
  CREATE TYPE "public"."enum_inquiries_type" AS ENUM('Birthday', 'Team party', 'Watch party', 'Catering', 'Other');
  CREATE TYPE "public"."enum_inquiries_status" AS ENUM('new', 'contacted', 'closed');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'manager', 'kitchen');
  CREATE TYPE "public"."enum_hours_weekly_day" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');
  CREATE TABLE "menu_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"note" varchar,
  	"description" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu_items_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price_cents" numeric,
  	"is_market_price" boolean DEFAULT false
  );
  
  CREATE TABLE "menu_items_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_menu_items_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "menu_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"category_id" integer NOT NULL,
  	"description" varchar,
  	"image_id" integer,
  	"available" boolean DEFAULT true,
  	"online_orderable" boolean DEFAULT true,
  	"ordering_note" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu_items_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"modifier_groups_id" integer
  );
  
  CREATE TABLE "modifier_groups_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"price_delta_cents" numeric DEFAULT 0 NOT NULL,
  	"default" boolean DEFAULT false
  );
  
  CREATE TABLE "modifier_groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"admin_name" varchar NOT NULL,
  	"min_select" numeric DEFAULT 0 NOT NULL,
  	"max_select" numeric DEFAULT 1 NOT NULL,
  	"max_select_by_variant" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_lines_modifiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"group" varchar,
  	"label" varchar,
  	"price_delta_cents" numeric
  );
  
  CREATE TABLE "orders_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item_slug" varchar,
  	"item_name" varchar,
  	"variant_label" varchar,
  	"unit_price_cents" numeric,
  	"quantity" numeric,
  	"notes" varchar,
  	"line_total_cents" numeric
  );
  
  CREATE TABLE "orders_status_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"status" varchar,
  	"at" timestamp(3) with time zone,
  	"by_user_id" integer
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric NOT NULL,
  	"number_label" varchar,
  	"public_id" varchar NOT NULL,
  	"idempotency_key" varchar,
  	"status" "enum_orders_status" DEFAULT 'new' NOT NULL,
  	"customer_display" varchar,
  	"pickup_display" varchar,
  	"customer_name" varchar,
  	"customer_phone" varchar,
  	"customer_email" varchar,
  	"pickup_mode" "enum_orders_pickup_mode",
  	"pickup_requested_at" timestamp(3) with time zone,
  	"pickup_promised_at" timestamp(3) with time zone,
  	"payment_method" "enum_orders_payment_method",
  	"payment_status" "enum_orders_payment_status" DEFAULT 'unpaid',
  	"subtotal_cents" numeric,
  	"cash_discount_cents" numeric,
  	"tax_cents" numeric,
  	"tip_cents" numeric,
  	"total_cents" numeric,
  	"order_notes" varchar,
  	"cancel_reason" varchar,
  	"placed_at" timestamp(3) with time zone,
  	"status_changed_at" timestamp(3) with time zone,
  	"pii_redacted" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone,
  	"description" varchar,
  	"image_id" integer,
  	"category" "enum_events_category" DEFAULT 'other' NOT NULL,
  	"featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "specials_days" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_specials_days",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "specials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"price_text" varchar,
  	"start_time" varchar,
  	"end_time" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "taps" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"brewery" varchar,
  	"style" varchar,
  	"abv" numeric,
  	"status" "enum_taps_status" DEFAULT 'on' NOT NULL,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "challenge_entries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"time_seconds" numeric,
  	"result" "enum_challenge_entries_result" NOT NULL,
  	"photo_id" integer,
  	"approved" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"date" varchar NOT NULL,
  	"guests" numeric NOT NULL,
  	"type" "enum_inquiries_type" NOT NULL,
  	"message" varchar,
  	"status" "enum_inquiries_status" DEFAULT 'new',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"placeholder" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'kitchen' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "rate_limit_hits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"menu_categories_id" integer,
  	"menu_items_id" integer,
  	"modifier_groups_id" integer,
  	"orders_id" integer,
  	"events_id" integer,
  	"specials_id" integer,
  	"taps_id" integer,
  	"challenge_entries_id" integer,
  	"inquiries_id" integer,
  	"media_id" integer,
  	"users_id" integer,
  	"rate_limit_hits_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"online_ordering_enabled" boolean DEFAULT true,
  	"ordering_paused_until" timestamp(3) with time zone,
  	"pause_message" varchar DEFAULT 'Online ordering is paused — please call (302) 337-8602.',
  	"prep_lead_minutes" numeric DEFAULT 20,
  	"slot_interval_minutes" numeric DEFAULT 15,
  	"last_order_minutes_before_close" numeric DEFAULT 30,
  	"cash_discount_percent" numeric DEFAULT 3,
  	"tax_rate_percent" numeric DEFAULT 0,
  	"max_online_subtotal_cents" numeric DEFAULT 50000,
  	"order_notification_email" varchar,
  	"phone" varchar DEFAULT '(302) 337-8602',
  	"address" varchar DEFAULT '416 Market Street, Bridgeville, DE 19933',
  	"geo_lat" numeric DEFAULT 38.7426,
  	"geo_lng" numeric DEFAULT -75.6044,
  	"announcement_enabled" boolean DEFAULT false,
  	"announcement_text" varchar,
  	"announcement_link" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "settings_numbers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "hours_weekly" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"day" "enum_hours_weekly_day" NOT NULL,
  	"open" varchar NOT NULL,
  	"close" varchar NOT NULL,
  	"closed" boolean DEFAULT false
  );
  
  CREATE TABLE "hours_exceptions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"date" varchar NOT NULL,
  	"closed" boolean DEFAULT true,
  	"open" varchar,
  	"close" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "hours" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_headline" varchar DEFAULT 'Beer. Wings. Bridgeville''s Taproom.',
  	"hero_subhead" varchar DEFAULT 'Famous wings, fresh-ground burgers and cold drafts on Market Street. Order ahead for pickup.',
  	"hero_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "challenge_rules" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "challenge" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "menu_items_variants" ADD CONSTRAINT "menu_items_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu_items_tags" ADD CONSTRAINT "menu_items_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu_items_rels" ADD CONSTRAINT "menu_items_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu_items_rels" ADD CONSTRAINT "menu_items_rels_modifier_groups_fk" FOREIGN KEY ("modifier_groups_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "modifier_groups_options" ADD CONSTRAINT "modifier_groups_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_lines_modifiers" ADD CONSTRAINT "orders_lines_modifiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_lines" ADD CONSTRAINT "orders_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_status_history" ADD CONSTRAINT "orders_status_history_by_user_id_users_id_fk" FOREIGN KEY ("by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_status_history" ADD CONSTRAINT "orders_status_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "specials_days" ADD CONSTRAINT "specials_days_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."specials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "challenge_entries" ADD CONSTRAINT "challenge_entries_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_categories_fk" FOREIGN KEY ("menu_categories_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_items_fk" FOREIGN KEY ("menu_items_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_modifier_groups_fk" FOREIGN KEY ("modifier_groups_id") REFERENCES "public"."modifier_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_specials_fk" FOREIGN KEY ("specials_id") REFERENCES "public"."specials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_taps_fk" FOREIGN KEY ("taps_id") REFERENCES "public"."taps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_challenge_entries_fk" FOREIGN KEY ("challenge_entries_id") REFERENCES "public"."challenge_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk" FOREIGN KEY ("inquiries_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_limit_hits_fk" FOREIGN KEY ("rate_limit_hits_id") REFERENCES "public"."rate_limit_hits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_social_links" ADD CONSTRAINT "settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "settings_numbers" ADD CONSTRAINT "settings_numbers_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hours_weekly" ADD CONSTRAINT "hours_weekly_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hours_exceptions" ADD CONSTRAINT "hours_exceptions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_texts" ADD CONSTRAINT "home_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "challenge_rules" ADD CONSTRAINT "challenge_rules_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."challenge"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "menu_categories_slug_idx" ON "menu_categories" USING btree ("slug");
  CREATE INDEX "menu_categories_updated_at_idx" ON "menu_categories" USING btree ("updated_at");
  CREATE INDEX "menu_categories_created_at_idx" ON "menu_categories" USING btree ("created_at");
  CREATE INDEX "menu_items_variants_order_idx" ON "menu_items_variants" USING btree ("_order");
  CREATE INDEX "menu_items_variants_parent_id_idx" ON "menu_items_variants" USING btree ("_parent_id");
  CREATE INDEX "menu_items_tags_order_idx" ON "menu_items_tags" USING btree ("order");
  CREATE INDEX "menu_items_tags_parent_idx" ON "menu_items_tags" USING btree ("parent_id");
  CREATE UNIQUE INDEX "menu_items_slug_idx" ON "menu_items" USING btree ("slug");
  CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category_id");
  CREATE INDEX "menu_items_image_idx" ON "menu_items" USING btree ("image_id");
  CREATE INDEX "menu_items_updated_at_idx" ON "menu_items" USING btree ("updated_at");
  CREATE INDEX "menu_items_created_at_idx" ON "menu_items" USING btree ("created_at");
  CREATE INDEX "menu_items_rels_order_idx" ON "menu_items_rels" USING btree ("order");
  CREATE INDEX "menu_items_rels_parent_idx" ON "menu_items_rels" USING btree ("parent_id");
  CREATE INDEX "menu_items_rels_path_idx" ON "menu_items_rels" USING btree ("path");
  CREATE INDEX "menu_items_rels_modifier_groups_id_idx" ON "menu_items_rels" USING btree ("modifier_groups_id");
  CREATE INDEX "modifier_groups_options_order_idx" ON "modifier_groups_options" USING btree ("_order");
  CREATE INDEX "modifier_groups_options_parent_id_idx" ON "modifier_groups_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "modifier_groups_key_idx" ON "modifier_groups" USING btree ("key");
  CREATE INDEX "modifier_groups_updated_at_idx" ON "modifier_groups" USING btree ("updated_at");
  CREATE INDEX "modifier_groups_created_at_idx" ON "modifier_groups" USING btree ("created_at");
  CREATE INDEX "orders_lines_modifiers_order_idx" ON "orders_lines_modifiers" USING btree ("_order");
  CREATE INDEX "orders_lines_modifiers_parent_id_idx" ON "orders_lines_modifiers" USING btree ("_parent_id");
  CREATE INDEX "orders_lines_order_idx" ON "orders_lines" USING btree ("_order");
  CREATE INDEX "orders_lines_parent_id_idx" ON "orders_lines" USING btree ("_parent_id");
  CREATE INDEX "orders_status_history_order_idx" ON "orders_status_history" USING btree ("_order");
  CREATE INDEX "orders_status_history_parent_id_idx" ON "orders_status_history" USING btree ("_parent_id");
  CREATE INDEX "orders_status_history_by_user_idx" ON "orders_status_history" USING btree ("by_user_id");
  CREATE UNIQUE INDEX "orders_number_idx" ON "orders" USING btree ("number");
  CREATE UNIQUE INDEX "orders_public_id_idx" ON "orders" USING btree ("public_id");
  CREATE UNIQUE INDEX "orders_idempotency_key_idx" ON "orders" USING btree ("idempotency_key");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_pickup_pickup_promised_at_idx" ON "orders" USING btree ("pickup_promised_at");
  CREATE INDEX "orders_placed_at_idx" ON "orders" USING btree ("placed_at");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");
  CREATE INDEX "events_image_idx" ON "events" USING btree ("image_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "specials_days_order_idx" ON "specials_days" USING btree ("order");
  CREATE INDEX "specials_days_parent_idx" ON "specials_days" USING btree ("parent_id");
  CREATE INDEX "specials_updated_at_idx" ON "specials" USING btree ("updated_at");
  CREATE INDEX "specials_created_at_idx" ON "specials" USING btree ("created_at");
  CREATE INDEX "taps_updated_at_idx" ON "taps" USING btree ("updated_at");
  CREATE INDEX "taps_created_at_idx" ON "taps" USING btree ("created_at");
  CREATE INDEX "challenge_entries_photo_idx" ON "challenge_entries" USING btree ("photo_id");
  CREATE INDEX "challenge_entries_updated_at_idx" ON "challenge_entries" USING btree ("updated_at");
  CREATE INDEX "challenge_entries_created_at_idx" ON "challenge_entries" USING btree ("created_at");
  CREATE INDEX "inquiries_updated_at_idx" ON "inquiries" USING btree ("updated_at");
  CREATE INDEX "inquiries_created_at_idx" ON "inquiries" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "rate_limit_hits_key_idx" ON "rate_limit_hits" USING btree ("key");
  CREATE INDEX "rate_limit_hits_at_idx" ON "rate_limit_hits" USING btree ("at");
  CREATE INDEX "rate_limit_hits_updated_at_idx" ON "rate_limit_hits" USING btree ("updated_at");
  CREATE INDEX "rate_limit_hits_created_at_idx" ON "rate_limit_hits" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_menu_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_categories_id");
  CREATE INDEX "payload_locked_documents_rels_menu_items_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_items_id");
  CREATE INDEX "payload_locked_documents_rels_modifier_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("modifier_groups_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_specials_id_idx" ON "payload_locked_documents_rels" USING btree ("specials_id");
  CREATE INDEX "payload_locked_documents_rels_taps_id_idx" ON "payload_locked_documents_rels" USING btree ("taps_id");
  CREATE INDEX "payload_locked_documents_rels_challenge_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("challenge_entries_id");
  CREATE INDEX "payload_locked_documents_rels_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("inquiries_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_rate_limit_hits_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_limit_hits_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "settings_social_links_order_idx" ON "settings_social_links" USING btree ("_order");
  CREATE INDEX "settings_social_links_parent_id_idx" ON "settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "settings_numbers_order_parent_idx" ON "settings_numbers" USING btree ("order","parent_id");
  CREATE INDEX "hours_weekly_order_idx" ON "hours_weekly" USING btree ("_order");
  CREATE INDEX "hours_weekly_parent_id_idx" ON "hours_weekly" USING btree ("_parent_id");
  CREATE INDEX "hours_exceptions_order_idx" ON "hours_exceptions" USING btree ("_order");
  CREATE INDEX "hours_exceptions_parent_id_idx" ON "hours_exceptions" USING btree ("_parent_id");
  CREATE INDEX "home_hero_image_idx" ON "home" USING btree ("hero_image_id");
  CREATE INDEX "home_texts_order_parent" ON "home_texts" USING btree ("order","parent_id");
  CREATE INDEX "challenge_rules_order_idx" ON "challenge_rules" USING btree ("_order");
  CREATE INDEX "challenge_rules_parent_id_idx" ON "challenge_rules" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "menu_categories" CASCADE;
  DROP TABLE "menu_items_variants" CASCADE;
  DROP TABLE "menu_items_tags" CASCADE;
  DROP TABLE "menu_items" CASCADE;
  DROP TABLE "menu_items_rels" CASCADE;
  DROP TABLE "modifier_groups_options" CASCADE;
  DROP TABLE "modifier_groups" CASCADE;
  DROP TABLE "orders_lines_modifiers" CASCADE;
  DROP TABLE "orders_lines" CASCADE;
  DROP TABLE "orders_status_history" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "specials_days" CASCADE;
  DROP TABLE "specials" CASCADE;
  DROP TABLE "taps" CASCADE;
  DROP TABLE "challenge_entries" CASCADE;
  DROP TABLE "inquiries" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "rate_limit_hits" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "settings_social_links" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TABLE "settings_numbers" CASCADE;
  DROP TABLE "hours_weekly" CASCADE;
  DROP TABLE "hours_exceptions" CASCADE;
  DROP TABLE "hours" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_texts" CASCADE;
  DROP TABLE "challenge_rules" CASCADE;
  DROP TABLE "challenge" CASCADE;
  DROP TYPE "public"."enum_menu_items_tags";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_pickup_mode";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_events_category";
  DROP TYPE "public"."enum_specials_days";
  DROP TYPE "public"."enum_taps_status";
  DROP TYPE "public"."enum_challenge_entries_result";
  DROP TYPE "public"."enum_inquiries_type";
  DROP TYPE "public"."enum_inquiries_status";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_hours_weekly_day";`)
}
