CREATE TABLE "contexts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contexts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notes_contexts" (
	"note_id" uuid NOT NULL,
	"context_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notes_contexts_note_id_context_id_pk" PRIMARY KEY("note_id","context_id")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"key_context" text,
	"tags" text[],
	"suggested_contexts" text[],
	"note_type" text,
	"embedding" vector(${EMBEDDINGS_DIMS}),
	"embedding_model" varchar(50),
	"embedding_created_at" timestamp with time zone,
	"deadline" timestamp with time zone,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notes_contexts" ADD CONSTRAINT "notes_contexts_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes_contexts" ADD CONSTRAINT "notes_contexts_context_id_contexts_id_fk" FOREIGN KEY ("context_id") REFERENCES "public"."contexts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_contexts_name" ON "contexts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_notes_contexts_note_id" ON "notes_contexts" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "idx_notes_contexts_context_id" ON "notes_contexts" USING btree ("context_id");--> statement-breakpoint
CREATE INDEX "idx_notes_key_context" ON "notes" USING btree ("key_context");--> statement-breakpoint
CREATE INDEX "idx_notes_note_type" ON "notes" USING btree ("note_type");--> statement-breakpoint
CREATE INDEX "idx_notes_deadline" ON "notes" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "idx_notes_status" ON "notes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notes_created_at" ON "notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notes_updated_at" ON "notes" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_notes_tags_gin" ON "notes" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_notes_suggested_contexts_gin" ON "notes" USING gin ("suggested_contexts");--> statement-breakpoint
CREATE INDEX "idx_notes_embedding_cosine" ON "notes" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists=100) WHERE "notes"."embedding" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_notes_embedding_l2" ON "notes" USING ivfflat ("embedding" vector_l2_ops) WITH (lists=100) WHERE "notes"."embedding" IS NOT NULL;