import * as notiRepo from "../repositories/notification.repository.js";
import { CustomError } from "../response/customError.js"; // 파일 경로와 확장자 확인 필요
import { sendSMS } from "../utils/sms.util.js"; // SMS 발송 모듈 가정 (추후 변경)
import { getRouteToken, deleteRouteToken } from "../utils/routeTokenStore.util.js";
import { recordRecentDestination } from "./recentDestination.service.js"; // 경로 확인!

// export const registerNotification = async (userId, cacheKey, alert_time) => {
//     const cachedData = getRouteToken(cacheKey);
export const registerNotification = async (userId, cacheKey, alert_time) => {
    const cachedData = await getRouteToken(cacheKey);
    
    // 캐시 데이터 존재 여부 확인
    if (!cachedData) {
        throw new CustomError(
            "NOTI-404-001",
            "만료 되었거나 유효하지 않은 경로 정보입니다. 다시 조회하세요.",
            "api/alerts"        
        );
    }

    const { snapshot } = cachedData;

    // 필수 하위 데이터 존재 확인
    if (!snapshot.origin || !snapshot.destination) {
        console.error("❌ 캐시 데이터 구조가 올바르지 않습니다:", snapshot);
        throw new CustomError(
            "NOTI-400-001",
            "경로 상세 정보(출발지/목적지)가 누락되었습니다.",
            "api/alerts"
        );
    }

    const destination = snapshot.destination;
    const stationIdFromCache = snapshot.station_id
    const stationName = snapshot.origin.name || snapshot.detail?.steps[1]?.from?.name || "알 수 없는 역";
    const lat = snapshot.origin.lat; // 위도
    const lng = snapshot.origin.lng; // 경도

    if (!stationIdFromCache) {
        throw new CustomError("COM-400-001", "출발역 정보가 누락되었습니다.", "api/alerts");
    }

    const scheduledTime = new Date(snapshot.card?.deadline_at);
    const currentTime = new Date();

    // 4. 유저 설정 보장
    await notiRepo.ensureUserSetting(userId);

    // 5. 막차 시간 계산 및 초기 트리거 결정
    const diffMin = Math.floor((scheduledTime - currentTime) / 60000);
    let initTrigger = 'SENT_THIRTY';
    if (diffMin <= 3) initTrigger = 'SENT_NOW';
    else if (diffMin <= 10) initTrigger = 'SENT_THREE';
    else if (diffMin <= 30 ) initTrigger = 'SENT_TEN';

    const user = await notiRepo.getUserById(userId);

    if (!user?.phone_number) {
        throw new CustomError(
            "AUTH-404-002",
            "유저의 전화번호 정보가 없습니다.",
            "api/alerts"
        )
    }

    await notiRepo.upsertStation(stationIdFromCache, stationName, lat, lng);

    // 6. DB 저장 (notiRepo.addNotification)
    // 여기서 snapshot.origin.stationId가 확실히 있는지 체크 후 전달
    const result = await notiRepo.addNotification({
        user_id: userId,
        phone_number: user.phone_number,
        station_id: stationIdFromCache,
        route_id: snapshot.routeId || null, 
        title: destination.name,
        latitude: destination.lat,
        longitude: destination.lng,
        road_address: destination.address,
        scheduled: scheduledTime,
        trigger_time: initTrigger,
        alert_time: alert_time 
    });

    // 7. 최근 목적지 기록
    await recordRecentDestination({
        userId,
        placeId: String(destination.id || destination.placeId || `P${Date.now()}`),
        title: destination.name || destination.title || "알 수 없는 목적지",
        roadAddress: destination.address || destination.road_address || "주소 정보 없음",
        latitude: destination.lat,
        longitude: destination.lng
    });

    // 8. 캐시 삭제 및 SMS 발송
    await deleteRouteToken(cacheKey);

    const userPhoneNumber = result.user?.phone_number;
    if (userPhoneNumber) {
    try {
        await smsUtil.sendVerificationSMS(userPhoneNumber, "막차 알림 예약 완료");
    } catch (e) {
        console.error("SMS 발송은 실패했지만 예약은 완료됨:", e.message);
    }
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

const bitToTimeList = (mask) => {
  const result = [];
  if (mask & 1) result.push(1);
  if (mask & 2) result.push(3);
  if (mask & 4) result.push(5);
  if (mask & 8) result.push(10);
  if (mask & 16) result.push(30);
  return result;
};

// 마이페이지 (커스텀 설정)
export const getMySettings = async (user_id) => {
    await notiRepo.ensureUserSetting(user_id);

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
        enabled: settings.enabled,
        timeList: settings.enabled
        ? bitToTimeList(settings.notify_mask)
        : []
    };
};

export const updateSettings = async (user_id, timeList) => {
    await notiRepo.ensureUserSetting(user_id);

    if (!timeList || timeList.length === 0) {
        return await notiRepo.updateSettings(user_id, { notify_mask: 0, enabled: false });
    }
    const mask = timeList.reduce((add, time) => add | getBitByTime(Number(time)), 0);
    return await notiRepo.updateSettings(user_id, { notify_mask: mask, enabled: true });
};

export const checkAndSendNotifications = async () => {
    const currentTime = new Date();
    let notifications; //try 밖에서 선언함.(try 밖에서 변수 선언 -> try 안에서 값을 할당하도록)

    try {
        // 1. 아직 발송 완료되지 않은(sent_success: false) 알림들 조회
        notifications = await notiRepo.findPendingNotifications(currentTime);
        // const notifications = await notiRepo.findPendingNotifications(currentTime);
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
            let shouldUpdateStatus = false;
            let nextTrigger = noti.trigger_time;

            // 마이페이지에서 설정한 경우 (커스텀모드)
            const userSetting = noti.user.notificationSettings;

            if (userSetting && userSetting.enabled && userSetting.notify_mask > 0) {
                const currentBit = getBitByTime(diffMin);
                if (currentBit > 0 && (userSetting.notify_mask & currentBit) !== 0) {
                    // 도달하는 '분'에 보냈는지 체크
                    if (noti.last_sent_min != diffMin) {
                        message = `막차 출발 ${diffMin}분 전입니다.`;
                        shouldUpdateStatus = true;
                    }
                }
            }
            

            // 2. 현재 trigger_time 상태에 따른 분기 처리
            else {
                if (noti.trigger_time === 'SENT_THIRTY' && diffMin <= 30) {
                    message = "막차 출발 30분 전입니다.";
                    nextTrigger = 'SENT_TEN';
                    shouldUpdateStatus = true;
                } 
                else if (noti.trigger_time === 'SENT_TEN' && diffMin <= 10) {
                    message = "막차 출발 10분 전입니다.";
                    nextTrigger = 'SENT_THREE';
                    shouldUpdateStatus = true;
                } 
                else if (noti.trigger_time === 'SENT_THREE' && diffMin <= 3) {
                    message = "막차 출발 3분 전입니다.";
                    nextTrigger = 'SENT_NOW';
                    shouldUpdateStatus = true;
                } 
            }

                if (noti.trigger_time === 'SENT_NOW' && diffMin <= 0) {
                // 15분 전부터 '실시간 모니터링' 상태라고 가정
                if (diffMin <= 0) { // Deadline(나갈 시간)이 되었거나 지났을 때
                    message = "지금 당장 출발하세요! 계산된 막차 탑승 마지노선입니다.";
                    nextTrigger = null; // 알림 종료
                    shouldUpdateStatus = true;
            }
            }

            // 3. 메시지가 결정되었다면 문자 발송 및 DB 업데이트
            if (shouldUpdateStatus && message) {
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