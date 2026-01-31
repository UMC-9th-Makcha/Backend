import { fetchBusStationInfo } from "../repositories/odsayBus.repository.js";

const STATION_INFO_TTL_MS = 5 * 60 * 1000; // 5분 캐시
const stationInfoCache = new Map();

async function getStationLanesCached({ stationID }) {
  if (stationID == null) return null;
  const key = String(stationID);
  const now = Date.now();

  const cached = stationInfoCache.get(key);
  if (cached && cached.expiresAt > now) {
    return await cached.promise;
  }

  const p = (async () => {
    const { ok, status, data } = await fetchBusStationInfo({ stationID });

    if (!ok) {
      throw new CustomError(
        "OD-BUS-502",
        "ODsay busStationInfo 호출 실패",
        "/services/busLastTime",
        { status, stationID },
      );
    }

    if (data?.error) {
      throw new CustomError(
        "OD-BUS-502",
        "ODsay busStationInfo 응답 오류",
        "/services/busLastTime",
        { stationID, error: data.error },
      );
    }

    const lanes = data?.result?.lane;
    return Array.isArray(lanes) ? lanes : null;
  })();

  stationInfoCache.set(key, {
    expiresAt: now + STATION_INFO_TTL_MS,
    promise: p,
  });

  try {
    return await p;
  } catch (e) {
    // 실패한 promise 제거
    stationInfoCache.delete(key);
    throw e;
  }
}

// 특정 정류장에서 특정 버스의 막차 반환
export async function getBusLastTimeAtStation({ stationID, busNo }) {
  if (!stationID || !busNo) return null;

  const lanes = await getStationLanesCached({ stationID });
  if (!lanes) return null;

  const matched = lanes.find((l) => {
    const noKor = l?.busNoKor ?? null;
    const no = l?.busNo ?? null;
    return noKor === busNo || no === busNo;
  });

  return matched?.busLastTime ?? null;
}
