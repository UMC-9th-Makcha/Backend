-- AlterTable
ALTER TABLE `notificationtrigger` MODIFY `trigger_time` ENUM('INIT', 'SENT_THIRTY', 'SENT_TEN', 'SENT_THREE', 'SENT_NOW') NULL;
