-- AlterTable
ALTER TABLE `routesearch` ADD COLUMN `is_optimal` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `route_data` JSON NULL;
