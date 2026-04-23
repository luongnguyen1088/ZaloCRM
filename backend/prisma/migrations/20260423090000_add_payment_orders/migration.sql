-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "order_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_by_user_id" TEXT,
    "requested_by_email" TEXT,
    "reviewed_by_user_id" TEXT,
    "reviewed_by_email" TEXT,
    "plan_id" TEXT,
    "plan_name" TEXT,
    "months" INTEGER,
    "token_amount" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "payment_content" TEXT,
    "customer_note" TEXT,
    "admin_note" TEXT,
    "approved_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "reference_code" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_reference_code_key" ON "payment_orders"("reference_code");

-- CreateIndex
CREATE INDEX "payment_orders_org_id_created_at_idx" ON "payment_orders"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "payment_orders_status_created_at_idx" ON "payment_orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "payment_orders_order_type_status_created_at_idx" ON "payment_orders"("order_type", "status", "created_at");

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
