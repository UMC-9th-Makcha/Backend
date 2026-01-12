import { prisma } from "../config/db.config.js";

//알림 생성
export const addNotification = async (data) => {
    try {
        const notification = await prisma.mission.create({
            data: {
                user: {connect: { id: data.user_id }},
                route_id: data_route.id,
                station_id: data.station_id,
                phone_number: data.phone_number,
                sent_at: data.sent_at,
                n_min: data.n_min,
                is_success: false
            }
        });

        return notification;
    } catch (error) {
        throw error;
    }
};

//알림을 보내야 하는 유저 조회
export const findPendingNotifications = async (currentTime) => {
    return await prisma.notificationTrigger.findMany({
        where: {
            sent_success: false, 
            // 님의 DB 컬럼명인 'scheduled'를 정확히 사용합니다.
            scheduled: {
                gte: new Date(currentTime.getTime() - 60 * 60000), 
                lte: new Date(currentTime.getTime() + 120 * 60000)
            }
        }
    });
};

export const updateSentStatus = async (id, data) => {
    return await prisma.notificationTrigger.update({
        where: { notification_id: BigInt(id) },
        data: data
    });
};

//알림 삭제 함수
export const deleteNotification = async (id) => {
    return await prisma.notificationTrigger.delete({
        where: { notification_id: BigInt(id)}
    })
}

// 알림 예약 시 히스토리 생성
export const createHistory = async (data) => {
    return await prisma.notificationHistory.create({
        data: data
    });
}