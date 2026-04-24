/*
  Warnings:

  - You are about to drop the column `is_active` on the `pickup_pins` table. All the data in the column will be lost.
  - You are about to drop the `bus_locations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[razorpay_order_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[razorpay_payment_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `pickup_pins` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `latitude` to the `pickup_pins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `pickup_pins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `pickup_pins` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PickupPinStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PickupRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT', 'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'LOCATION_UPDATED', 'ATTENDANCE_MARKED', 'EMERGENCY_TRIGGERED');

-- DropForeignKey
ALTER TABLE "bus_locations" DROP CONSTRAINT "bus_locations_bus_id_fkey";

-- AlterTable
ALTER TABLE "buses" ADD COLUMN     "current_lat" DOUBLE PRECISION,
ADD COLUMN     "current_lng" DOUBLE PRECISION,
ADD COLUMN     "last_location_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "failed_at" TIMESTAMP(3),
ADD COLUMN     "fee_structure_id" UUID,
ADD COLUMN     "invoice_url" TEXT,
ADD COLUMN     "razorpay_order_id" TEXT,
ADD COLUMN     "razorpay_payment_id" TEXT,
ADD COLUMN     "razorpay_signature" TEXT,
ADD COLUMN     "receipt_number" TEXT,
ADD COLUMN     "refunded_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pickup_pins" DROP COLUMN "is_active",
ADD COLUMN     "accuracy" DOUBLE PRECISION,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "status" "PickupPinStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "student_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "routes" ADD COLUMN     "path_geojson" JSONB;

-- DropTable
DROP TABLE "bus_locations";

-- CreateTable
CREATE TABLE "location_history" (
    "id" UUID NOT NULL,
    "bus_id" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_requests" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "accuracy" DOUBLE PRECISION,
    "status" "PickupRequestStatus" NOT NULL DEFAULT 'PENDING',
    "driver_id" UUID,
    "bus_id" UUID,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "user_id" UUID,
    "user_role" "UserRole",
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_history_bus_id_recorded_at_idx" ON "location_history"("bus_id", "recorded_at");

-- CreateIndex
CREATE INDEX "location_history_latitude_longitude_idx" ON "location_history"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "pickup_requests_student_id_status_idx" ON "pickup_requests"("student_id", "status");

-- CreateIndex
CREATE INDEX "pickup_requests_driver_id_status_idx" ON "pickup_requests"("driver_id", "status");

-- CreateIndex
CREATE INDEX "pickup_requests_status_expires_at_idx" ON "pickup_requests"("status", "expires_at");

-- CreateIndex
CREATE INDEX "pickup_requests_latitude_longitude_idx" ON "pickup_requests"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_order_id_key" ON "payments"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_payment_id_key" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "payments_student_id_status_idx" ON "payments"("student_id", "status");

-- CreateIndex
CREATE INDEX "payments_razorpay_order_id_idx" ON "payments"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "payments_razorpay_payment_id_idx" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "pickup_pins_code_key" ON "pickup_pins"("code");

-- CreateIndex
CREATE INDEX "pickup_pins_pickup_point_id_status_idx" ON "pickup_pins"("pickup_point_id", "status");

-- AddForeignKey
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_pins" ADD CONSTRAINT "pickup_pins_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_bus_id_fkey" FOREIGN KEY ("bus_id") REFERENCES "buses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
