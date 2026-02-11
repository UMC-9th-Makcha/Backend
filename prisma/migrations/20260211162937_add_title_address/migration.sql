-- AlterTable
ALTER TABLE `notificationtrigger` ADD COLUMN `destination_snapshot` JSON NULL,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL,
    ADD COLUMN `road_address` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(191) NULL;
