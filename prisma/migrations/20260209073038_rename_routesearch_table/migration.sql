-- DropForeignKey
ALTER TABLE `routesearch` DROP FOREIGN KEY `RouteSearch_station_id_fkey`;

-- DropForeignKey
ALTER TABLE `routesearch` DROP FOREIGN KEY `RouteSearch_user_id_fkey`;

-- AddForeignKey
ALTER TABLE `routesearch` ADD CONSTRAINT `routesearch_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routesearch` ADD CONSTRAINT `routesearch_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `Station`(`station_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
