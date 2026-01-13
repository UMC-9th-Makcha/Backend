/*
  Warnings:

  - Added the required column `phone_number` to the `NotificationTrigger` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `notificationtrigger` ADD COLUMN `phone_number` VARCHAR(191) NOT NULL,
    MODIFY `trigger_time` ENUM('INIT', 'SENT_THIRTY', 'SENT_TEN', 'SENT_THREE', 'SENT_NOW') NOT NULL;
