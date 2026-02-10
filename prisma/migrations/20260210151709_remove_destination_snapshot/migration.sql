/*
  Warnings:

  - You are about to drop the column `destination_snapshot` on the `notificationtrigger` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `notificationtrigger` DROP COLUMN `destination_snapshot`;
