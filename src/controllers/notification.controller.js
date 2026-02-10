import cron from "node-cron";
import * as notiService from "../services/notification.service.js";
import { CustomSuccess } from '../response/customSuccess.js';

// 스케줄러: 매 분 0초에 실행 (하나만 유지)
cron.schedule("* * * * *", async () => {
  try {
    await notiService.checkAndSendNotifications();
  } catch (error) {
    console.error("스케줄러 에러:", error);
  }
});

const toSafeJSON = (data) => {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
};

export const createNotification = async (req, res, next) => {
  try {
    const userId = req.user.userId; 
    const { cacheKey, alert_time } = req.body;

    // 서비스에서 캐시 처리 + 알림 저장 + 최근 목적지 저장을 한 번에 수행
    const result = await notiService.registerNotification(userId, cacheKey, alert_time);

    const response = new CustomSuccess(
      "NOTI-201-001",
      201,
      "막차 알림 예약이 완료되었습니다.",
      toSafeJSON(result)
    );

    return res.status(response.statusCode).json(response);
  } catch (error) {
    next(error);
  }
}

export const cancelNotification = async (req, res, next) => {
  try {
    const { notification_id } = req.params;
    const userId = req.user.userId; // 변수명 통일

    await notiService.cancelNotification(notification_id, userId);

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
    const userId = req.user.userId;
    const settings = await notiService.getMySettings(userId);

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
    const userId = req.user.userId;
    const { timeList } = req.body;

    const result = await notiService.updateSettings(userId, timeList);

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
    const userId = req.user.userId; // 변수명 통일

    const pageData = await notiService.getFullNotificationPageData(userId);
    
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

export const getNotiDetail = async (req, res, next) => {
    try {
        const { notification_id } = req.params;
        const result = await notiService.getNotificationDetail(notification_id);
        
        res.status(200).json({
            successCode: "NOTI-200-006",
            statusCode: 200,
            message: "알림 상세 경로 조회에 성공하였습니다.",
            result
        });
    } catch (error) {
        next(error);
    }
};

export const getHistoryDetail = async (req, res, next) => {
    try {
        const { notification_history_id } = req.params;
        const result = await notiService.getHistoryDetail(notification_history_id);
        
        res.status(200).json({
            successCode: "NOTI-200-006",
            statusCode: 200,
            message: "과거 알림 상세 경로 조회에 성공하였습니다.",
            result
        });
    } catch (error) {
        next(error);
    }
};