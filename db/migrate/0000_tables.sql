CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"key_context" text,
	"contexts" text[],
	"tags" text[],
	"suggested_contexts" text[],
	"note_type" text,
	"embedding" vector(1536),
	"embedding_model" varchar(50),
	"embedding_created_at" timestamp with time zone,
	"deadline" timestamp with time zone,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_notes_key_context" ON "notes" USING btree ("key_context");--> statement-breakpoint
CREATE INDEX "idx_notes_note_type" ON "notes" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "idx_notes_deadline" ON "notes" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "idx_notes_status" ON "notes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notes_created_at" ON "notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notes_updated_at" ON "notes" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_notes_contexts_gin" ON "notes" USING gin ("contexts");--> statement-breakpoint
CREATE INDEX "idx_notes_tags_gin" ON "notes" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_notes_suggested_contexts_gin" ON "notes" USING gin ("suggested_contexts");--> statement-breakpoint
CREATE INDEX "idx_notes_embedding_cosine" ON "notes" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100) WHERE "notes"."embedding" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_notes_embedding_l2" ON "notes" USING ivfflat ("embedding" vector_l2_ops) WITH (lists=100) WHERE "notes"."embedding" IS NOT NULL;