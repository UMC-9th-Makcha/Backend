// src/dtos/recentDestination.dto.js

export const toRecentDestinationsDto = (row) => ({
    recentId: row.recent_id?.toString(),
    userId: row.user_id?.toString(),
    title: row.title,
    roadAddress: row.road_address,
    detailAddress: row.detail_address,
    placeId: row.place_id,
    latitude: row.latitude,
    longitude: row.longitude,
    usedAt: row.used_at,
    createdAt: row.created_at,
});