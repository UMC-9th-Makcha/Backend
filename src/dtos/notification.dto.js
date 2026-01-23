export const bodyToNotification = (body) => {
    return {
        user_id: body.user_id,
        route_id: body.route_id,
        station_id: body.station_id,
        phone_number: body.phone_number,
        sent_at: body.sent_at,
        scheduled: body.scheduled ? new Date(body.scheduled) : new Date() 
    };
};