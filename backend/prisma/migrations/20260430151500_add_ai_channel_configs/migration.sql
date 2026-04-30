CREATE TABLE "Claro"."ai_channel_configs" (
  "id" TEXT NOT NULL,
  "org_id" TEXT NOT NULL,
  "zalo_account_id" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "instructions" TEXT,
  "language_policy" TEXT NOT NULL DEFAULT 'auto',
  "follow_up_enabled" BOOLEAN NOT NULL DEFAULT false,
  "follow_up_interval" INTEGER NOT NULL DEFAULT 30,
  "follow_up_max_messages" INTEGER NOT NULL DEFAULT 3,
  "follow_up_type" TEXT NOT NULL DEFAULT 'ai',
  "follow_up_manual_content" TEXT,
  "stop_conditions" JSONB NOT NULL DEFAULT '[]',
  "auto_resume_enabled" BOOLEAN NOT NULL DEFAULT true,
  "auto_resume_minutes" INTEGER NOT NULL DEFAULT 60,
  "ai_work_mode" TEXT NOT NULL DEFAULT 'always',
  "ai_response_mode" TEXT NOT NULL DEFAULT 'auto',
  "ai_work_hours" JSONB NOT NULL DEFAULT '{}',
  "ai_timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  "auto_extract_info" BOOLEAN NOT NULL DEFAULT false,
  "auto_create_leads" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ai_channel_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_channel_configs_zalo_account_id_key"
  ON "Claro"."ai_channel_configs"("zalo_account_id");

CREATE INDEX "ai_channel_configs_org_id_idx"
  ON "Claro"."ai_channel_configs"("org_id");

ALTER TABLE "Claro"."ai_channel_configs"
  ADD CONSTRAINT "ai_channel_configs_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "Claro"."organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Claro"."ai_channel_configs"
  ADD CONSTRAINT "ai_channel_configs_zalo_account_id_fkey"
  FOREIGN KEY ("zalo_account_id") REFERENCES "Claro"."zalo_accounts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
