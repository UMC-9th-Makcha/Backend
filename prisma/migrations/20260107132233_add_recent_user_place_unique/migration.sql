/*
  Warnings:

  - You are about to drop the column `Field` on the `recentdestination` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,place_id]` on the table `RecentDestination` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `recentdestination` DROP COLUMN `Field`;

-- CreateIndex
CREATE INDEX `RecentDestination_user_id_used_at_idx` ON `RecentDestination`(`user_id`, `used_at`);

-- CreateIndex
CREATE UNIQUE INDEX `RecentDestination_user_id_place_id_key` ON `RecentDestination`(`user_id`, `place_id`);
