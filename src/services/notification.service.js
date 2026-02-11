import * as notiRepo from "../repositories/notification.repository.js";
import { CustomError } from "../response/customError.js"; // 파일 경로와 확장자 확인 필요
import smsUtil, { sendSMS } from "../utils/sms.util.js";
import { getRouteToken, deleteRouteToken } from "../utils/routeTokenStore.util.js";
import { recordRecentDestination } from "./recentDestination.service.js"; // 경로 확인!
import prisma from '../database/prisma.js'

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
    const origin = snapshot.origin;
    const snapDest = snapshot.destination;

    const stationIdFromCache = snapshot.station_id
    const stationName = 
        origin.title || 
        origin.name || 
        snapshot.detail?.steps[1]?.from?.name || 
        "알 수 없는 역";
    const lat = snapshot.origin.lat; // 위도
    const lng = snapshot.origin.lng; // 경도

    await notiRepo.upsertStation(stationIdFromCache, stationName, lat, lng);

    //알림 생성 전 RouteSearch 테이블에 경로 상세 정보 먼저 저장
    const routeSearchRecord = await prisma.routeSearch.create({
        data: {
            user: {
            connect: { user_id: BigInt(userId) } // DB에 있는 기존 유저와 연결
        },
        station: {
            connect: { station_id: BigInt(snapshot.station_id) } 
        },
            route_token: snapshot.route_token || cacheKey,
            route_data: snapshot,
            is_optimal: snapshot.is_optimal || false,
        }
    })

    // 필수 하위 데이터 존재 확인
    if (!snapshot.origin || !snapshot.destination) {
        console.error("❌ 캐시 데이터 구조가 올바르지 않습니다:", snapshot);
        throw new CustomError(
            "NOTI-400-001",
            "경로 상세 정보(출발지/목적지)가 누락되었습니다.",
            "api/alerts"
        );
    }

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
        route_id: routeSearchRecord.route_id,

        title: snapDest.title || snapDest.name || snapshot.card?.destination_name || "알 수 없는 목적지",
        latitude: snapDest.lat,
        longitude: snapDest.lng,
        road_address: snapDest.roadAddress || snapDest.address || "주소 정보 없음",
        detail_address: snapDest.detailAddress || "상세 주소 정보 없음",

        scheduled: scheduledTime,
        trigger_time: initTrigger,
        alert_time: alert_time 
    });

    // 7. 최근 목적지 기록
    await recordRecentDestination({
        userId,
        placeId: String(snapDest.id || snapDest.placeId || `P${Date.now()}`),
        title: snapDest.title || snapDest.name || "알 수 없는 목적지",
        roadAddress: snapDest.roadAddress || snapDest.address || "주소 정보 없음",
        detailAddress: snapDest.detailAddress || null, 
        latitude: snapDest.lat,
        longitude: snapDest.lng
    });

    console.log("🧭 recent destination source:", {
    destination: snapDest,
    card: snapshot.card,
    lastStep: snapshot.detail?.steps?.slice(-1)[0]
});

    // 8. 캐시 삭제 및 SMS 발송
    const userPhoneNumber = result.user?.phone_number;
    if (userPhoneNumber) {
    try {
        await smsUtil.sendVerificationSMS(userPhoneNumber, "설정하신 경로의 막차 알림이 정상적으로 등록되었습니다. 막차 출발 전, 단계별로 알림을 보내드립니다.");
    } catch (e) {
        console.error("SMS 발송은 실패했지만 예약은 완료됨:", e.message);
    }
}

    return result;
};

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

            if (userSetting && userSetting.enabled) {
                // 설정된 시간 리스트 (예: [30, 10, 3])
                const timeList = bitToTimeList(userSetting.notify_mask);
                
                for (const targetMin of timeList) {
                    // 현재 시간이 설정값보다 작거나 같고, 아직 이 타임에 안 보냈다면
                    if (diffMin <= targetMin && diffMin > targetMin - 1 && noti.last_sent_min !== targetMin) {
                        message = `막차 출발 ${targetMin}분 전입니다.`;
                        shouldUpdateStatus = true;
                        nextTrigger = noti.trigger_time; // 커스텀 모드에선 트리거 순서 무의미하므로 유지
                        break;
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
                        const rs = noti.route_search; // route_search 조인 데이터
                        const snapshot = rs?.route_data || {};
                        const card = snapshot.card || {};

                        await notiRepo.createHistory({
                            user_id: noti.user_id,
                            notification_id: noti.notification_id,
                            route_id: noti.route_id,
                            
                            // 1. 역/장소 이름들
                            origin_name: noti.station?.station_name || "알 수 없음",
                            destination_name: noti.title || "알 수 없는 목적지",
                            
                            // 2. 시간 관련 (Prisma 스키마의 departure_datetime 등)
                            scheduled: noti.scheduled, // 출발 시간
                            arrival_datetime: new Date(new Date(noti.scheduled).getTime() + (card.traveled_time || 0) * 60000), // 출발 + 소요시간
                            duration_minutes: card.traveled_time || 0,
                            
                            // 3. 경로 상세 데이터 (JSON 스냅샷)
                            route_detail_json: snapshot.detail || null,
                            transfers: card.transfer_count || 0,
                            walking_minutes: card.walk_time || 0,
                            
                            // 4. 절약 금액
                            saved_fare_won: snapshot.taxi_fare || 0 
                        });

                // 세이브리포트 집계 갱신
                    const departureDate = new Date(noti.scheduled);
                    const monthStr = departureDate.toISOString().slice(0, 7);

                    // 절약 금액 가져오기
                    const savedFare = noti.route_search?.route_data?.taxi_fare || 0;

                    await notiRepo.upsertSaveReport(noti.user_id, monthStr, savedFare);
                
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

    let currentAlertData = null;
    if (activeTrigger) {
        const rs = activeTrigger.routeSearch;
        const snapshot = rs?.route_data || {};

        const scheduledTime = new Date(activeTrigger.scheduled);
        const diffMs = scheduledTime - new Date();

        currentAlertData = {
            id: String(activeTrigger.notification_id),
            station_name: activeTrigger.station?.station_name,
            scheduled_time: activeTrigger.scheduled,
            
            // 추가 요청 필드
            route_token: rs?.route_token || null, 
            route_id: rs?.route_id ? String(rs.route_id) : null,
            is_optimal: rs?.is_optimal || snapshot.is_optimal || false,
            
            // 칩 구성을 위한 노선 정보 (지하철/버스 번호)
            lines: snapshot.detail?.steps
                ? snapshot.detail.steps
                    .filter(s => s.type?.includes("SUBWAY") || s.type?.includes("BUS"))
                    .map(s => {
                        if (s.type?.includes("SUBWAY")) {
                            // 1순위: subway_lines[0] ("수도권 6호선")
                            // 2순위: s.name ("6호선")
                            // 3순위: 기본값 "지하철"
                            return (s.subway_lines && s.subway_lines[0]) || s.name || "지하철";
                        }
                        if (s.type?.includes("BUS")) {
                            // 1순위: bus_numbers[0] ("7700")
                            // 2순위: s.name ("7700")
                            return (s.bus_numbers && s.bus_numbers[0]) || s.name || "버스";
                        }
                        return s.name;
                    })
    : (snapshot.tags || []),
            
            // 카드 표시용 요약 정보
            total_duration_min: snapshot.card?.traveled_time || 0,
            transfer_count: snapshot.card?.transfer_count || 0,
            walking_time_min: snapshot.card?.walk_time || 0,
            
            // 실시간 남은 시간 계산
            minutes_left: Math.max(0, Math.floor((new Date(activeTrigger.scheduled) - new Date()) / 60000))
        };

        console.log("SNAPSHOT_CHECK:", snapshot.is_optimal)
    }

    const formattedHistory = historyList.map(h => {
    // 관계 데이터가 아예 없을 수도 있으니 옵셔널 체이닝 사용
    const rs = h.route_search || h.routeSearches;

    return {
        id: String(h.notification_history_id),
        notification_id: h.notification_id ? String(h.notification_id) : null,
        origin: h.origin_name,
        destination: h.destination_name,
        departure_time: h.departure_datetime,
        arrival_time: h.arrival_datetime,
        
        route_id: rs?.route_id ? String(rs.route_id) : (h.route_search_id ? String(h.route_search_id) : null),
        route_token: rs?.route_token || null,
        
        is_optimal: rs?.is_optimal || false,
        lines: h.route_detail_json?.steps
            ? h.route_detail_json.steps
                .filter(s => s.type?.includes("SUBWAY") || s.type?.includes("BUS")) 
                .map(s => s.name || (s.type?.includes("SUBWAY") ? "지하철" : "버스"))
            : [],
        total_duration_min: h.duration_minutes || 0,
        transfer_count: h.transfers || 0,
        walking_time_min: h.walking_minutes || 0,
        minutes_left: 0
    };
});

    return {
        user_setting: settings,
        current_alert: currentAlertData,
        history: formattedHistory 
    };
};

export const getNotificationDetail = async (notification_id) => {
    const noti = await notiRepo.getNotificationWithRoute(notification_id);

    if (!noti || !noti.routeSearch) {
        throw new CustomError(
            "NOTI-404-001",
            "해당 알림의 상세 경로 정보를 찾을 수 없습니다. ",
            `/api/alerts/${notification_id}/detail`
        );
    }

    const rs = noti.routeSearch;
    const snapshot = rs.route_data || {};
    const card = snapshot.card || {};

    // 프론트 요청대로 데이터 매핑
    return {
        is_optimal: rs.is_optimal || snapshot.is_optimal || false,
        lines: snapshot.detail?.steps
            ? snapshot.detail.steps
                .filter(s => s.type?.includes("SUBWAY") || s.type?.includes("BUS"))
                .map(s => (s.subway_lines && s.subway_lines[0]) || s.bus_numbers?.[0] || s.name)
            : [],
        total_duration_min: card.traveled_time || 0,
        transfer_count: card.transfer_count || 0,
        walking_time_min: card.walk_time || 0,
        minutes_left: Math.max(0, Math.floor((new Date(noti.scheduled) - new Date()) / 60000)),
        departure_at: noti.scheduled, // 예약된 막차 출발 시간
        arrival_at: new Date(new Date(noti.scheduled).getTime() + (card.traveled_time || 0) * 60000), // 출발+소요시간

        route_id: rs?.route_id ? String(rs.route_id) : (noti.route_search_id ? String(noti.route_search_id) : null),
        route_token: rs?.route_token || null,
        
        // 캐시된 snapshot 데이터 그대로 전달
        steps: snapshot.detail?.steps || [] 
    };
};


export const getHistoryDetail = async (notification_history_id) => {
    const history = await notiRepo.getNotificationWithRoute(notification_history_id);

    if (!history || !history.routeSearch) {
        throw new CustomError(
            "NOTI-404-001",
            "해당 알림의 상세 경로 정보를 찾을 수 없습니다. ",
            `/api/alerts/history/${notification_history_id}/detail`
        );
    }

    const rs = history.routeSearch;
    const snapshot = rs.route_data || {};
    const card = snapshot.card || {};

    // 프론트 요청대로 데이터 매핑
    return {
        is_optimal: rs.is_optimal || snapshot.is_optimal || false,
        lines: snapshot.detail?.steps
            ? snapshot.detail.steps
                .filter(s => s.type?.includes("SUBWAY") || s.type?.includes("BUS"))
                .map(s => (s.subway_lines && s.subway_lines[0]) || s.bus_numbers?.[0] || s.name)
            : [],
        total_duration_min: card.traveled_time || 0,
        transfer_count: card.transfer_count || 0,
        walking_time_min: card.walk_time || 0,
        minutes_left: Math.max(0, Math.floor((new Date(history.scheduled) - new Date()) / 60000)),
        departure_at: history.scheduled, // 예약된 막차 출발 시간
        arrival_at: new Date(new Date(history.scheduled).getTime() + (card.traveled_time || 0) * 60000), // 출발+소요시간

        route_id: rs?.route_id ? String(rs.route_id) : (history.route_search_id ? String(history.route_search_id) : null),
        route_token: rs?.route_token || null,
        
        // 캐시된 snapshot 데이터 그대로 전달
        steps: snapshot.detail?.steps || [] 
    };
};

// 알림 강제 완료 처리 (테스트용)
export const forceCompleteNotification = async (notification_id, user_id) => {
    const noti = await notiRepo.getNotificationWithRoute(notification_id);

    if (!noti) {
        throw new CustomError(
            "NOTI-404-001", 
            "알림 정보를 찾을 수 없습니다.", 
            "/api/alerts/force-complete");
    }

    // 본인 확인
    if (String(noti.user_id) !== String(user_id)) {
        throw new CustomError(
            "AUTH-403-001", 
            "본인의 알림만 완료 처리할 수 있습니다.", 
            "/api/alerts/force-complete");
    }

    try {
        // 1. 즉시 완료 문자 발송
        const userPhone = noti.user?.phone_number;
        const message = "[테스트] 막차 탑승 성공! 알림이 강제 완료되었습니다.";
        if (userPhone) {
            await sendSMS(userPhone, message);
        }

        // 2. 상태 업데이트 (sent_success: true, trigger_time: null)
        await notiRepo.updateSentStatus(notification_id, {
            trigger_time: 'SENT_NOW',
            sent_success: true,
            sent_at: new Date()
        });

        const rs = noti.routeSearch; // Prisma include로 가져온 경로 정보
        const snapshot = rs?.route_data || {};
        const card = snapshot.card || {};

        // 3. 히스토리 기록 생성
        await notiRepo.createHistory({
            user_id: noti.user_id,
            notification_id: noti.notification_id,
            route_id: noti.route_id,

            // 1. 역/장소 명칭 및 ID
            origin_name: noti.station?.station_name || "알 수 없음",
            origin_station_id: noti.station_id,
            destination_name: noti.title || "알 수 없는 목적지",

            // 2. 시간 및 소요 시간 계산
            scheduled: noti.scheduled, // 출발 시간 (departure_datetime)
            arrival_datetime: new Date(new Date(noti.scheduled).getTime() + (card.traveled_time || 0) * 60000), // 출발+소요시간
            duration_minutes: card.traveled_time || 0,

            // 3. 상세 경로 및 통계 데이터 (지연님이 쓸 것들)
            route_detail_json: snapshot.detail || null, // steps 정보가 든 JSON
            transfers: card.transfer_count || 0,
            walking_minutes: card.walk_time || 0,
            
            // 4. 세이브 리포트용 금액
            saved_fare_won: snapshot.taxi_fare || 0 
        });

        // 4. 세이브 리포트 갱신
        const monthStr = new Date(noti.scheduled).toISOString().slice(0, 7);
        const savedFare = noti.routeSearch?.route_data?.taxi_fare || 0;
        await notiRepo.upsertSaveReport(noti.user_id, monthStr, savedFare);

        return { success: true, message: "강제 완료 처리 성공" };
    } catch (error) {
        console.error("강제 완료 중 오류:", error);
        throw error;
    }
};