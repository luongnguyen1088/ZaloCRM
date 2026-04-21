-- CreateTable
CREATE TABLE "ai_credit_usages" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 1,
    "input_chars" INTEGER,
    "output_chars" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_credit_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_credit_usages_org_id_created_at_idx" ON "ai_credit_usages"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_credit_usages_org_id_feature_created_at_idx" ON "ai_credit_usages"("org_id", "feature", "created_at");

-- AddForeignKey
ALTER TABLE "ai_credit_usages" ADD CONSTRAINT "ai_credit_usages_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
