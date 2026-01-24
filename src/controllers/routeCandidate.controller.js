import { getRouteCandidates } from "../services/routeCandidate.service.js";
import { CustomError } from "../response/customError.js";
import { CustomSuccess } from "../response/customSuccess.js";

function toFiniteNumber(v) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

function isValidLatLng(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export async function postRouteCandidates(req, res, next) {
  const path = "/api/routes/candidates";

  try {
    const originLat = toFiniteNumber(req.body?.origin?.lat);
    const originLng = toFiniteNumber(req.body?.origin?.lng);
    const destLat = toFiniteNumber(req.body?.destination?.lat);
    const destLng = toFiniteNumber(req.body?.destination?.lng);

    if (
      originLat === null ||
      originLng === null ||
      destLat === null ||
      destLng === null
    ) {
      throw new CustomError(
        "COM-400-001",
        "필수 파라미터 누락 또는 형식 오류",
        path,
      );
    }

    // 좌표 범위 오류
    if (
      !isValidLatLng(originLat, originLng) ||
      !isValidLatLng(destLat, destLng)
    ) {
      throw new CustomError("MAP-400-001", "잘못된 좌표값", path, {
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destLat, lng: destLng },
      });
    }

    const candidates = await getRouteCandidates({
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
    });

    return res.status(200).json(
      new CustomSuccess("ROUTE-200-001", 200, "후보 경로 조회 성공", {
        candidates,
      }),
    );
  } catch (e) {
    next(e);
  }
}
