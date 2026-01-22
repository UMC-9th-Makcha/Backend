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

// BigInt 변환을 위한 공통 유틸 함수 (코드 중복 방지)
const toSafeJSON = (data) => {
    return JSON.parse(JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
};

export const createNotification = async (req, res, next) => {
    try {
        const user_id = req.user.id; 
        const result = await notiService.registerNotification({
            ...req.body,
            user_id: user_id
        });

        const response = new CustomSuccess(
            "NOTI-200-001",
            200,
            "막차 알림 예약이 완료되었습니다.",
            toSafeJSON(result)
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
        const user_id = req.user.id;

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
        const user_id = req.user.id;
        const settings = await notiService.getMySettings(user_id);

        const response = new CustomSuccess(
            "NOTI-200-003",
            200,
            "알림 설정을 성공적으로 조회했습니다.",
            toSafeJSON(settings)
        );
        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
};

export const updateSettings = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { timeList } = req.body;

        const result = await notiService.updateSettings(user_id, timeList);

        const response = new CustomSuccess(
            "NOTI-200-004",
            200,
            "알림 설정이 변경되었습니다.",
            toSafeJSON(result)
        );
        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
};

export const getNotificationHistoryView = async (req, res, next) => {
    try {
        // 요청으로부터 사용자 ID 추출
        const user_id = req.user_id;

        //서비스 호출
        const pageData = await notiService.getFullNotificationPageData(user_id);
        
        //성공 응답 전송
        const response = new CustomSuccess(
            "NOTI-200-005",
            200,
            "사용자 과거 알림 내역 호출에 성공하였습니다.",
            toSafeJSON(pageData)
        );
        return res.status(response.statusCode).json(response);
    } catch (error) {
        next(error);
    }
};