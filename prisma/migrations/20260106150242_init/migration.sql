-- CreateTable
CREATE TABLE `User` (
    `user_id` BIGINT NOT NULL AUTO_INCREMENT,
    `kakao_id` BIGINT NOT NULL,
    `phone_number` VARCHAR(50) NOT NULL,
    `nickname` VARCHAR(200) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `social_type` VARCHAR(200) NOT NULL,
    `refresh_token` VARCHAR(200) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `last_login_at` DATETIME(3) NULL,

    UNIQUE INDEX `User_kakao_id_key`(`kakao_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Term` (
    `term_id` BIGINT NOT NULL AUTO_INCREMENT,
    `term_name` VARCHAR(200) NOT NULL,
    `term_content` VARCHAR(200) NOT NULL,
    `is_required` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`term_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserTerm` (
    `user_id` BIGINT NOT NULL,
    `term_id` BIGINT NOT NULL,
    `consent_type` VARCHAR(200) NOT NULL,
    `agreed` BOOLEAN NOT NULL,
    `agreed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`user_id`, `term_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecentDestination` (
    `recent_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `road_address` VARCHAR(255) NOT NULL,
    `detail_address` VARCHAR(255) NULL,
    `place_id` VARCHAR(50) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `Field` VARCHAR(255) NULL,

    PRIMARY KEY (`recent_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Station` (
    `station_id` BIGINT NOT NULL AUTO_INCREMENT,
    `station_name` VARCHAR(50) NOT NULL,
    `station_line` VARCHAR(20) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `region` VARCHAR(191) NULL,

    PRIMARY KEY (`station_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RouteSearch` (
    `route_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `station_id` BIGINT NOT NULL,
    `end_address` VARCHAR(200) NULL,
    `searched_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_success` BOOLEAN NULL,
    `arrived_at` DATETIME(3) NULL,
    `traveled_time` INTEGER NULL,

    PRIMARY KEY (`route_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SaveReport` (
    `report_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `month` CHAR(7) NOT NULL,
    `saved_amount` INTEGER NOT NULL,
    `total_count` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `SaveReport_user_id_month_idx`(`user_id`, `month`),
    UNIQUE INDEX `SaveReport_user_id_month_key`(`user_id`, `month`),
    PRIMARY KEY (`report_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MyPlace` (
    `myplace_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `place_type` ENUM('CAFE', 'SAUNA', 'PCROOM') NOT NULL,
    `place_address` VARCHAR(191) NOT NULL,
    `place_detail_address` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    PRIMARY KEY (`myplace_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationTrigger` (
    `notification_id` BIGINT NOT NULL AUTO_INCREMENT,
    `route_id` BIGINT NULL,
    `user_id` BIGINT NOT NULL,
    `station_id` BIGINT NOT NULL,
    `trigger_time` ENUM('SENT_THIRTY', 'SENT_TEN', 'SENT_THREE', 'SENT_NOW') NOT NULL,
    `sent_success` BOOLEAN NOT NULL,
    `sent_at` DATETIME(3) NULL,
    `scheduled` DATETIME(3) NULL,

    PRIMARY KEY (`notification_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserNotificationSetting` (
    `user_notification_setting_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `enabled` BOOLEAN NOT NULL,
    `notify_mask` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `UserNotificationSetting_user_id_key`(`user_id`),
    PRIMARY KEY (`user_notification_setting_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationHistory` (
    `notification_history_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `route_search_id` BIGINT NULL,
    `notification_trigger_id` BIGINT NULL,
    `origin_name` VARCHAR(100) NOT NULL,
    `origin_place_id` VARCHAR(50) NOT NULL,
    `origin_station_id` BIGINT NULL,
    `destination_name` VARCHAR(200) NOT NULL,
    `destination_station_id` BIGINT NULL,
    `destination_place_id` VARCHAR(50) NOT NULL,
    `departure_datetime` DATETIME(3) NOT NULL,
    `arrival_datetime` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `route_detail_json` JSON NULL,
    `transfers` INTEGER NULL,
    `walking_minutes` INTEGER NULL,
    `saved_fare_won` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_nh_user_depart`(`user_id`, `departure_datetime` DESC),
    PRIMARY KEY (`notification_history_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserTerm` ADD CONSTRAINT `UserTerm_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserTerm` ADD CONSTRAINT `UserTerm_term_id_fkey` FOREIGN KEY (`term_id`) REFERENCES `Term`(`term_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecentDestination` ADD CONSTRAINT `RecentDestination_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RouteSearch` ADD CONSTRAINT `RouteSearch_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RouteSearch` ADD CONSTRAINT `RouteSearch_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `Station`(`station_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SaveReport` ADD CONSTRAINT `SaveReport_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MyPlace` ADD CONSTRAINT `MyPlace_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationTrigger` ADD CONSTRAINT `NotificationTrigger_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationTrigger` ADD CONSTRAINT `NotificationTrigger_station_id_fkey` FOREIGN KEY (`station_id`) REFERENCES `Station`(`station_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationTrigger` ADD CONSTRAINT `NotificationTrigger_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `RouteSearch`(`route_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotificationSetting` ADD CONSTRAINT `UserNotificationSetting_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationHistory` ADD CONSTRAINT `NotificationHistory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationHistory` ADD CONSTRAINT `NotificationHistory_route_search_id_fkey` FOREIGN KEY (`route_search_id`) REFERENCES `RouteSearch`(`route_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationHistory` ADD CONSTRAINT `NotificationHistory_notification_trigger_id_fkey` FOREIGN KEY (`notification_trigger_id`) REFERENCES `NotificationTrigger`(`notification_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationHistory` ADD CONSTRAINT `NotificationHistory_origin_station_id_fkey` FOREIGN KEY (`origin_station_id`) REFERENCES `Station`(`station_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationHistory` ADD CONSTRAINT `NotificationHistory_destination_station_id_fkey` FOREIGN KEY (`destination_station_id`) REFERENCES `Station`(`station_id`) ON DELETE SET NULL ON UPDATE CASCADE;
