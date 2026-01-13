/*
  Warnings:

  - The values [CAFE,SAUNA,PCROOM] on the enum `MyPlace_place_type` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `latitude` on table `myplace` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `myplace` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `myplace` ADD COLUMN `provider_place_id` VARCHAR(50) NULL,
    MODIFY `place_type` ENUM('PLACE', 'HOME') NOT NULL,
    MODIFY `place_address` VARCHAR(200) NOT NULL,
    MODIFY `place_detail_address` VARCHAR(200) NULL,
    MODIFY `latitude` DOUBLE NOT NULL,
    MODIFY `longitude` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `notificationhistory` MODIFY `origin_place_id` VARCHAR(50) NULL,
    MODIFY `destination_place_id` VARCHAR(50) NULL;
