import { prisma } from "../config/db.config.js";

// 알림 생성
export const addNotification = async (data) => {
    try {
        const notification = await prisma.notificationTrigger.create({
            data: {
                user: { connect: { user_id: BigInt(data.user_id) } },
                station: { connect: { station_id: BigInt(data.station_id) } },
                
                ...(data.route_id && {
                    routeSearch: { connect: { route_id: BigInt(data.route_id) } }
                }),

                phone_number: data.phone_number,
                trigger_time: data.trigger_time,
                sent_success: false,
                
                sent_at: (data.sent_at && !isNaN(new Date(data.sent_at))) 
                    ? new Date(data.sent_at) 
                    : null,
                
                scheduled: (data.scheduled && !isNaN(new Date(data.scheduled))) 
                    ? new Date(data.scheduled) 
                    : new Date(),
            }
        });
        return notification;
    } catch (error) {
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