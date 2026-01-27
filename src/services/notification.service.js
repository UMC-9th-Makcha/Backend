import * as notiRepo from "../repositories/notification.repository.js";
import { CustomError } from "../response/customError.js"; // 파일 경로와 확장자 확인 필요
import { sendSMS } from "../utils/sms.util.js"; // SMS 발송 모듈 가정 (추후 변경)
import { getRouteToken, deleteRouteToken } from "../utils/routeTokenStore.util.js";
import { recordRecentDestination } from "./recentDestination.service.js"; // 경로 확인!

export const registerNotification = async (userId, cacheKey, alert_time) => {
    const cachedData = getRouteToken(cacheKey);
    
    if(!cachedData) {
        throw new CustomError(
            "NOTI-404-001",
            "만료 되었거나 유효하지 않은 경로 정보입니다. 다시 조회하세요.",
            "api/alerts"        
        );
    }

    const { snapshot } = cachedData;
    const destination = snapshot.destination;

    const scheduledTime = new Date(snapshot.deadlineAt);
    const currentTime = new Date();

    // 유저가 마이페이지에서 알림 수정을 하지 않는다면 기본 값으로 DB 저장
    await notiRepo.ensureUserSetting(userId);

    // 막차까지 남은 시간 계산하기
    const diffMin = Math.floor((scheduledTime - currentTime) / 60000);

    // 남은 시간 기준으로 DB에 들어갈 상태값 결정
    let initTrigger = 'SENT_THIRTY';
    if (diffMin <= 3) initTrigger = 'SENT_NOW';
    else if (diffMin <= 10) initTrigger = 'SENT_THREE';
    else if (diffMin <= 30 ) initTrigger = 'SENT_TEN';

    // 5. 알림 테이블에 저장
    const result = await notiRepo.addNotification({
        user_id: userId,
        station_id: snapshot.origin.stationId,
        title: destination.name,
        latitude: destination.lat,
        longitude: destination.lng,
        road_address: destination.address,
        scheduled: scheduledTime,
        trigger_time: initTrigger,
        alert_time: alert_time 
    });

    await recordRecentDestination({
        userId,
        placeId: destination.placeId,
        title: destination.name,
        roadAddress: destination.address,
        latitude: destination.lat,
        longitude: destination.lng
    });

    // 사용한 캐시는 삭제하여 메모리 관리
    deleteRouteToken(cacheKey);

    //result에 담긴 유저 정보 통해 번호를 가져옴
    const userPhoneNumber = result.user?.phone_number;
    if (userPhoneNumber) {
        await sendSMS(userPhoneNumber, `막차 알림 예약이 완료되었습니다.`)
    }

    return result;
}

const getBitByTime = (min) => {
    if(min === 1) return 1;
    if(min === 3) return 2;
    if(min === 5) return 4;
    if(min === 10) return 8;
    if(min === 30) return 16;
    return 0;
}

// 마이페이지 (커스텀 설정)
export const getMySettings = async (user_id) => {
    const settings = await notiRepo.getMySettings(user_id);

    if (!settings) {
        // 설정이 아예 없는 유저라면 기본값 반환 혹은 에러 처리
        throw new CustomError(
            "NOTI-404-002",
            "알림 설정 정보를 찾을 수 없습니다.",
            "/api/alerts/settings"
        );
    }

    // BigInt 등이 포함될 수 있으므로 필요한 데이터만 정리해서 반환
    return {
        user_id: String(settings.user_id),
        notify_mask: settings.notify_mask,
        enabled: settings.enabled
    };
};

export const updateSettings = async (user_id, timeList) => {
    if (!timeList || timeList.length === 0) {
        return await notiRepo.updateSettings(user_id, { notify_mask: 0, enabled: false });
    }
    const mask = timeList.reduce((add, time) => add | getBitByTime(Number(time)), 0);
    return await notiRepo.updateSettings(user_id, { notify_mask: mask, enabled: true });
};

export const checkAndSendNotifications = async () => {
    const currentTime = new Date();

    try {
        // 1. 아직 발송 완료되지 않은(sent_success: false) 알림들 조회
        const notifications = await notiRepo.findPendingNotifications(currentTime);
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
            let nextTrigger = noti.trigger_time;

            // 마이페이지에서 설정한 경우 (커스텀모드)
            const userSetting = noti.user.notificationSettings;

            if (userSetting && userSetting.enabled && userSetting.notify_mask > 0) {
                const currentBit = getBitByTime(diffMin);

                //유저가 설정한 비트와 현재 남은 시간 비트가 일치하는지 확인
                if ((userSetting.notify_mask & currentBit) !== 0) {
                    // 도달하는 '분'에 보냈는지 체크
                    if (noti.last_sent_min != diffMin) {
                        message = `막차 출발 ${diffMin}분 전입니다.`;
                    }
                }
            }
            

            // 2. 현재 trigger_time 상태에 따른 분기 처리
            else {
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
            }

            if (noti.trigger_time === 'SENT_NOW' && diffMin <= 15) { // 적절한 실시간 감시 범위
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
                    nextTrigger = null;
                    // 마지막 단계이므로 nextTrigger는 그대로 null
                }
            }

            // 3. 메시지가 결정되었다면 문자 발송 및 DB 업데이트
            if (message) {
                const userPhone = noti.user?.phone_number;

                if (userPhone) {
                    await sendSMS(userPhone, message);
                } else {
                    console.warn(`[SMS skip] 유저번호 없음: ${noti.user_id}`);
                }
                
                // 상태 업데이트 (nextTrigger가 있으면 업데이트, 없으면 완료 처리)
                await notiRepo.updateSentStatus(noti.notification_id, {
                    trigger_time: nextTrigger,
                    last_sent_min: diffMin,
                    sent_success: nextTrigger === null ? true : false,
                    sent_at: new Date()
                });

                //최종 발송 완료인 경우 History에 기록 남기기
                if (nextTrigger === null || message.includes("실시간")) {
                    try {
                        await notiRepo.createHistory({
                            ...noti,
                            origin_name: noti.station?.station_name,
                            destination_name: noti.title
                        });
                    } catch (hisError) {
                        console.error("히스토리 저장 실패:", hisError);
                    }
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

    if (String(notification.user_id) !== String(user_id)) {
        throw new CustomError(
            "AUTH-403-001",
            "본인의 알림만 취소할 수 있습니다.",
            "/api/alerts/cancel"
        );
    }

    try {
        const userPhone = notification.user?. phone_number;
        if (userPhone) {
            await sendSMS(userPhone, "예약하신 알림이 취소되었습니다.")
        }
    } catch (e) { console.error(e); }

    //물리적 삭제로 알림 취소 로직 구현
    return await notiRepo.deleteNotification(notification_id);
}

//알림 통합 조회 서비스
export const getFullNotificationPageData = async (user_id) => {
    //세 가지 데이터를 병렬로 동시에 조회함
    const [settings, activeTrigger, historyList] = await Promise.all([
        getMySettings(user_id),
        notiRepo.getActiveTrigger(user_id),
        notiRepo.getHistoryList(user_id),
    ]);

    return {
        // 설정된 정보를 보여줌 (userTriggerSettings 관련)
        user_setting: settings,
        current_alert: activeTrigger ? {
            id: String(activeTrigger.notification_id),
            station_name: activeTrigger.station?.station_name,
            scheduled_time: activeTrigger.scheduled,
        } : null,

        // 과거 이용 내역 리스트
        history: historyList.map(h => ({
            id: String(h.notification_history_id),
            origin: h.origin_name,
            destination: h.destination_name,
            departure_time: h.departure_datetime,
            arrival_time: h.arrival_datetime,
            duration: h.duration_minutes
        }))
    };
};