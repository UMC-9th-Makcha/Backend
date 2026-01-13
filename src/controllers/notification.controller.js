import cron from "node-cron";
import * as notiService from "../services/notification.service.js";
import { CustomSuccess } from "../../../looktoday/response/customSuccess.js";

// 매 분 0초에 실행
cron.schedule("* * * * *", async () => {
    try {
        await checkAndSendNotifications();
    } catch (error) {
        console.error("스케줄러 에러:", error);
    }
});

export const createNotification = async (req, res, next) => {
    try {
        const result = await notiService.registerNotification(req.body);

        const response = new CustomSuccess(
            "NOTI-200-001",
            "200",
            "막차 알림 예약이 완료되었습니다.",
            result
        );

        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
}

export const cancelNotification = async (req, res, next) => {
    try {
        const { notification_id } = req.params;
        const user_id = req.user.id;

        await notiService.cancelNotification(notification_id, user_id);

        const response = new CustomSuccess(
            "NOTI-200-002",
            "200",
            "막차 알림 예약이 취소되었습니다.",
        );

        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
};

