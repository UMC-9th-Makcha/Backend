// 지원 교통수단
const SUPPORTED_TRAFFIC_TYPES = new Set([1, 2, 3]); // 1:지하철 2:버스 3:도보

// 미지원 버스
const UNSUPPORTED_BUS_TYPES = new Set([16, 20, 22, 26, 30]);

// 미지원 지하철
const UNSUPPORTED_SUBWAY_TYPES = new Set([
  21, 22, 31, 41, 42, 43, 48, 51, 71, 72, 73, 74, 78, 79,
]);

function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function hasUnsupportedTrafficType(subPath) {
  const legs = Array.isArray(subPath) ? subPath : [];
  return legs.some((sp) => {
    const t = asNumber(sp?.trafficType);
    // trafficType이 null/NaN이거나, 지원 목록에 없으면 미지원
    return t == null || !SUPPORTED_TRAFFIC_TYPES.has(t);
  });
}

function hasUnsupportedBusType(subPath) {
  const legs = Array.isArray(subPath) ? subPath : [];
  for (const sp of legs) {
    const tt = asNumber(sp?.trafficType);
    if (tt !== 2) continue;

    const lane = Array.isArray(sp.lane) ? sp.lane : [];
    for (const l of lane) {
      const t = asNumber(l?.type);
      if (t !== null && UNSUPPORTED_BUS_TYPES.has(t)) return true;
    }
  }
  return false;
}

function hasUnsupportedSubwayType(subPath) {
  const legs = Array.isArray(subPath) ? subPath : [];
  for (const sp of legs) {
    const tt = asNumber(sp?.trafficType);
    if (tt !== 1) continue;

    const lane = Array.isArray(sp.lane) ? sp.lane : [];
    for (const l of lane) {
      const t = asNumber(l?.subwayCode ?? l?.type);
      if (t !== null && UNSUPPORTED_SUBWAY_TYPES.has(t)) return true;
    }
  }
  return false;
}

// 지원 가능 여부 판정
export function detectSupportForCandidate({ resultSearchType, subPath }) {
  const st = asNumber(resultSearchType);
  // 1) searchType이 도시 내(0)가 아니면 도시 간 -> 미지원
  if (st !== null && st !== 0) {
    return {
      is_supported: false,
      reason: "INTERCITY_NOT_SUPPORTED",
      message: "현재 도시 간 이동 경로는 지원하지 않아요.",
    };
  }

  // 2) subPath 안에 지원하지 않는 trafficType이 하나라도 있으면 미지원
  if (hasUnsupportedTrafficType(subPath)) {
    return {
      is_supported: false,
      reason: "TRAFFIC_TYPE_NOT_SUPPORTED",
      message: "현재 지원하지 않는 교통수단이 포함된 경로예요.",
    };
  }

  if (hasUnsupportedBusType(subPath)) {
    return {
      is_supported: false,
      reason: "BUS_TYPE_NOT_SUPPORTED",
      message: "현재 지원하지 않는 버스 노선 타입이 포함된 경로예요.",
    };
  }

  if (hasUnsupportedSubwayType(subPath)) {
    return {
      is_supported: false,
      reason: "SUBWAY_TYPE_NOT_SUPPORTED",
      message: "현재 수도권 외 지하철 노선은 지원하지 않아요.",
    };
  }

  return { is_supported: true, reason: null, message: null };
}
