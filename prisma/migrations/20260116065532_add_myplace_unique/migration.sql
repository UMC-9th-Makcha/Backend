/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `myplace` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,place_type,provider_place_id]` on the table `MyPlace` will be added. If there are existing duplicate values, this will fail.
  - Made the column `updated_at` on table `myplace` required. This step will fail if there are existing NULL values in that column.
  - Made the column `provider_place_id` on table `myplace` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `myplace` DROP COLUMN `deleted_at`,
    MODIFY `updated_at` DATETIME(3) NOT NULL,
    MODIFY `provider_place_id` VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE INDEX `idx_user_type` ON `MyPlace`(`user_id`, `place_type`);

-- CreateIndex
CREATE UNIQUE INDEX `MyPlace_user_id_place_type_provider_place_id_key` ON `MyPlace`(`user_id`, `place_type`, `provider_place_id`);
