import cron from "node-cron";
import * as notiService from "../services/notification.service.js";
import { CustomSuccess } from '../response/customSuccess.js';

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

        const safeResult = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        const response = new CustomSuccess(
            "NOTI-200-001",
            200,
            "막차 알림 예약이 완료되었습니다.",
            safeResult
        );

        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
}

// 매 분 0초에 실행
cron.schedule("* * * * *", async () => {
    try {
        await notiService.checkAndSendNotifications();
    } catch (error) {
        console.error("스케줄러 에러:", error);
    }
});

export const cancelNotification = async (req, res, next) => {
    try {
        const { notification_id } = req.params;
        const user_id = 1;

        await notiService.cancelNotification(notification_id, user_id);

        const response = new CustomSuccess(
            "NOTI-200-002",
            200,
            "막차 알림 예약이 취소되었습니다.",
        );

        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
};

export const getSettings = async (req, res, next) => {
    try {
        const user_id = 1;
        const settings = await notiService.getMySettings(user_id);

        const safeSettings = JSON.parse(JSON.stringify(settings, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        const response = new CustomSuccess(
            "NOTI-200-003",
            200,
            "알림 설정을 성공적으로 조회했습니다.",
            safeSettings
        );
        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (req, res, next) => {
    try {
        const user_id = 1;
        const { timeList } = req.body;

        const result = await notiService.updateSettings(user_id, timeList);

        const safeResult = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        const response = new CustomSuccess(
            "NOTI-200-004",
            200,
            "알림 설정이 변경되었습니다.",
            safeResult
        );
        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
};

