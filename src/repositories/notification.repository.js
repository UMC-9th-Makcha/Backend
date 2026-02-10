import { prisma } from '../config/prisma.js';  //경로 수정 작업을 진행함.
import { CustomError } from "../response/customError.js"; //

// 알림 생성
export const addNotification = async (data) => {
    // 필수 데이터 체크
    if (!data.user_id || !data.station_id) {
        throw new CustomError("COM-400-001", "필수 데이터 누락", "api/alerts");
    }

    try {
        const notification = await prisma.notificationTrigger.create({
            data: {
                // 관계 필드(user) 대신 실제 컬럼 필드(user_id)에 직접 입력
                user_id: BigInt(data.user_id),
                station_id: BigInt(data.station_id),
                
                // 알림 생성 시 route_id 내부적으로 생성
                route_id: BigInt(data.route_id),

                phone_number: data.phone_number,
                trigger_time: data.trigger_time, // TriggerTime 열거형 값
                sent_success: false,
                
                // 날짜 데이터 처리
                sent_at: (data.sent_at && !isNaN(new Date(data.sent_at))) 
                    ? new Date(data.sent_at) 
                    : null,
                
                scheduled: (data.scheduled && !isNaN(new Date(data.scheduled))) 
                    ? new Date(data.scheduled) 
                    : new Date(),
            },
            include: {
                user: true // 응답에 유저 정보 포함
            }
        });
        return notification;
    } catch (error) {
        console.error("❌ [Prisma Create Error]:", error);
        throw error;
    }
};

// [추가] 알림 상세 조회 (취소/권한 체크용)
export const getNotificationById = async (notification_id) => {
    return await prisma.notificationTrigger.findUnique({
        where: { notification_id: BigInt(notification_id) },
        include: { user: true } // 서비스에서 유저 ID 비교를 위해 포함
    });
};

// 알림을 보내야 하는 대기열 조회
export const findPendingNotifications = async (currentTime) => {
    return await prisma.notificationTrigger.findMany({
        where: {
            sent_success: false, 
            scheduled: {
                gte: new Date(currentTime.getTime() - 60 * 60000), 
                lte: new Date(currentTime.getTime() + 120 * 60000)
            }
        },
        include: {
            user: {
                include: { notificationSettings: true }
            }
        }
    });
};

// 발송 상태 업데이트
export const updateSentStatus = async (notification_id, data) => {
    return await prisma.notificationTrigger.update({
        where: { notification_id: BigInt(notification_id) },
        data: data
    });
};

// 알림 삭제 함수
export const deleteNotification = async (notification_id) => {
    return await prisma.notificationTrigger.delete({
        where: { notification_id: BigInt(notification_id) }
    });
};

// 알림 수정이 없을 시에 기본 값으로 설정 추가
export const ensureUserSetting = async (user_id) => {
    return await prisma.userNotificationSetting.upsert({
        where: { user_id: BigInt(user_id)},
        update: {},
        create: {
            user_id: BigInt(user_id),
            notify_mask: 0,
            enabled: false
        }
    })
}

// 마이페이지 설정 조회
export const getMySettings = async (user_id) => {
    return await prisma.userNotificationSetting.findUnique({
        where: { user_id: BigInt(user_id) }
    });
};

// 마이페이지 설정 업데이트
export const updateSettings = async (user_id, updateData) => {
    return await prisma.userNotificationSetting.update({
        where: { user_id: BigInt(user_id) },
        data: updateData
    });
};

// 발송 완료된 정보를 기록하는 함수
export const createHistory = async (notiData) => {
    return await prisma.notificationHistory.create({
        data: {
            user_id: notiData.user_id,
            notification_trigger_id: notiData.notification_id,
            route_search_id: notiData.route_id,

            origin_name: notiData.origin_name || "알 수 없음",
            destination_name: notiData.destination_name || "알 수 없음",
            departure_datetime: notiData.scheduled,
            arrival_datetime: new Date(),
            duration_minutes: 0,

        }
    });
};

//현재 대기 중인 가장 가까운 알림 조회
export const getActiveTrigger = async (user_id) => {
    return await prisma.notificationTrigger.findFirst({
        where: {
            user_id: BigInt(user_id),
            sent_success: false,
            scheduled: { gte: new Date() }
        },
        include: {
            station: true,
            routeSearch: true
        },
        orderBy: {scheduled: 'asc' }
    });
};

export const upsertSaveReport = async (user_id, month, savedFare) => {
    return await prisma.saveReport.upsert({
        where: {
            user_id_month: {
                user_id: BigInt(user_id),
                month: month
            }
        },
        update: {
            total_count: { increment: 1 },
            saved_amount: { increment: savedFare }
        },
        create: {
            user_id: BigInt(user_id),
            month: month,
            total_count: 1,
            saved_amount: savedFare
        }
    });
};

//과거 발송 완료된 히스토리 리스트 조회
export const getHistoryList = async (user_id) => {
    return await prisma.notificationHistory.findMany({
        where: { user_id: BigInt(user_id) },
        orderBy: { departure_datetime: 'desc' },
        include: {
            routeSearches: true
        },
        take: 10
    })
}

//유저 ID로 유저 정보(전화번호 등)를 조회하는 함수
export const getUserById = async (user_id) => {
    return await prisma.user.findUnique({
        where: { 
            user_id: BigInt(user_id) 
        },
        select: { 
            phone_number: true // 서비스에서 번호가 필요하므로 선택해서 가져옴
        }
    });
};

// 역 정보가 없으면 저장하고, 있으면 가져오는 함수
export const upsertStation = async (stationId, stationName, latitude = null, longitude = null) => {
    return await prisma.station.upsert({
        where: { 
            station_id: BigInt(stationId) 
        },
        update: {
            latitude: latitude,
            longitude: longitude
        },
        create: {
            station_id: BigInt(stationId),
            station_name: stationName,
            latitude: latitude,
            longitude: longitude
        }
    });
};


export const getNotificationWithRoute = async (notificationId) => {
    return await prisma.notificationTrigger.findUnique({
        where: { notification_id: BigInt(notificationId) },
        include: {
            routeSearch: true,
            station: true 
        }
    });
};

export const getHistoryWithRoute = async (id) => {
    return await prisma.notificationHistory.findUnique({
        where: { notification_history_id: BigInt(id) },
        include: {
            routeSearch: true,
            station: true 
        }
    });
};


