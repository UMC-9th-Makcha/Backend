import { getPolylineByRouteToken } from "../services/routePolyline.service.js";

export async function getRoutePolyline(req, res, next) {
  try {
    const { route_token } = req.params;

    if (typeof route_token !== "string" || route_token.length < 10) {
      return res.status(400).json({
        successCode: "COM-400-001",
        statusCode: 400,
        message: "route_token 형식이 올바르지 않습니다.",
        result: null,
      });
    }

    const result = await getPolylineByRouteToken({ routeToken: route_token });

    return res.status(200).json({
      successCode: "ROUTE-200-002",
      statusCode: 200,
      message: "폴리라인 조회 성공",
      result,
    });
  } catch (err) {
    return next(err);
  }
}
