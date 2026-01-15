import { bodyToNotification } from "../dtos/notification.dto.js";
import * as notiRepo from "../repositories/notification.repository.js";
import { CustomError } from "../response/customError.js"; // 파일 경로와 확장자 확인 필요
import { sendSMS } from "../utils/sms.util.js"; // SMS 발송 모듈 가정 (추후 변경)
import { checkSubwayRealtime } from "../utils/subway.util.js"; // 실시간 API 가정 (추후 변경)

export const checkAndSendNotifications = async () => {
    const currentTime = new Date();
    const MY_PHONE_NUMBER = "01091459221"; // 테스트용 하드코딩
    let notifications;

    try {
        // 1. 아직 발송 완료되지 않은(sent_success: false) 알림들 조회
        notifications = await notiRepo.findPendingNotifications(currentTime);
    } catch (error) {
        throw new CustomError(
            "COM-500-001",
            "알림 대기열 조회 중 DB 오류 발생",
            "/api/alerts",
            { originalError: error.message }
        );
    }

    if (!notifications || notifications.length === 0) return;

    for (const noti of notifications) {
        try {
            // noti.scheduled (막차 시간) 기준으로 차이 계산
            const diffMs = noti.scheduled.getTime() - currentTime.getTime();
            const diffMin = Math.floor(diffMs / 60000);

            let message = "";
            let nextTrigger = null;

            // 2. 현재 trigger_time 상태에 따른 분기 처리
            if (noti.trigger_time === 'SENT_THIRTY' && diffMin <= 30) {
                message = "막차 출발 30분 전입니다.";
                nextTrigger = 'SENT_TEN';
            } 
            else if (noti.trigger_time === 'SENT_TEN' && diffMin <= 10) {
                message = "막차 출발 10분 전입니다.";
                nextTrigger = 'SENT_THREE';
            } 
            else if (noti.trigger_time === 'SENT_THREE' && diffMin <= 3) {
                message = "막차 출발 3분 전입니다.";
                nextTrigger = 'SENT_NOW';
            } 
            else if (noti.trigger_time === 'SENT_NOW' && diffMin <= 15) { // 적절한 실시간 감시 범위
                const isRealTimeMatch = await checkSubwayRealtime(noti);
                
                if (isRealTimeMatch === null) {
                    throw new CustomError(
                        "MAP-404-001",
                        "실시간 역 정보를 찾을 수 없습니다.",
                        "api/checkSubwayRealtime", //추후 수정 필요
                        { station: noti.station_id }
                    );
                }

                if (isRealTimeMatch) {
                    message = "지금 당장 출발하세요! (실시간 분석 완료)";
                    // 마지막 단계이므로 nextTrigger는 그대로 null
                }
            }

            // 3. 메시지가 결정되었다면 문자 발송 및 DB 업데이트
            if (message) {
                await sendSMS(MY_PHONE_NUMBER, message);

                if (noti.trigger_time === 'SENT_NOW') {
                    // 최종 단계 완료 시
                    await notiRepo.updateSentStatus(noti.notification_id, {
                        sent_success: true,
                        sent_at: new Date()
                    });
                } else {
                    // 다음 단계로 업데이트 (sent_success는 false 유지)
                    await notiRepo.updateSentStatus(noti.notification_id, {
                        trigger_time: nextTrigger
                    });
                }
            }
        } catch (innerError) {
            // 개별 알림 에러 로그 (스케줄러 중단 방지)
            console.error(`[발송 에러] ID: ${noti.notification_id} | ${innerError.message}`);
        }
    }
}

export const cancelNotification = async (notification_id, user_id) => {
    const notification = await notiRepo.getNotificationById(notification_id);

    if (!notification) {
        throw new CustomError(
            "NOTI-404-001",
            "알림 정보를 찾을 수 없습니다.",
            "/api/alerts/cancel"
        );
    }

    if (notification.user_id !== user_id) {
        throw new CustomError(
            "AUTH-403-001",
            "본인의 알림만 취소할 수 있습니다.",
            "/api/alerts/cancel"
        );
    }

    //물리적 삭제로 알림 취소 로직 구현
    return await notiRepo.deleteNotification(notification_id);
}

