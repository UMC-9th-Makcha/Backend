import { fillWalkPoints } from "../utils/routeSteps.util.js";

// 카드(리스트)용
export function toRouteCandidateCardDto({
  traveled_time,
  transfer_count,
  public_transit_fare,
  walk_time,
  deadline_at,
  minutes_left,
}) {
  return {
    traveled_time: traveled_time ?? null, // 총 소요시간(분)
    transfer_count: Number.isFinite(transfer_count) ? transfer_count : 0, // 환승 횟수
    public_transit_fare: public_transit_fare ?? null, // 요금
    walk_time: Number.isFinite(walk_time) ? walk_time : 0, // 총 도보 시간(분)
    deadline_at: deadline_at ?? null, // 막차 기준 출발 마감 시간(ISO)
    minutes_left: minutes_left ?? null, // deadline_at 까지 남은 시간(분)
  };
}

function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toPointsFromSp(sp) {
  // X=lng, Y=lat
  const sy = asNumber(sp?.startY);
  const sx = asNumber(sp?.startX);
  const ey = asNumber(sp?.endY);
  const ex = asNumber(sp?.endX);

  if (sy == null || sx == null || ey == null || ex == null) return [];
  return [
    { lat: sy, lng: sx },
    { lat: ey, lng: ex },
  ];
}

/*
지하철 map_type: SUBWAY_{lineType}
lane[].type : 지하철 노선 타입
lane이 여러 개일 수 있지만 보통 1개이므로 0번을 기준으로 함
*/
function toSubwayMapType(sp) {
  const lane = Array.isArray(sp?.lane) ? sp.lane : [];
  const t = asNumber(lane?.[0]?.type);
  return t != null ? `SUBWAY_${t}` : "SUBWAY";
}

/*
버스 map_type: BUS (통일)
lane[]에 여러 버스가 들어올 수 있고, type 섞일 가능성도 있어 통일
*/
function toBusMapType() {
  return "BUS";
}

/*
ODsay subPath -> detail.steps 배열 (상세보기용)
trafficType: 1-지하철, 2-버스, 3-도보
*/
export function toRouteCandidateDetailDto({ subPath, origin, destination }) {
  const arr = Array.isArray(subPath) ? subPath : [];

  const steps = arr.map((sp) => {
    const trafficType = asNumber(sp?.trafficType);

    // 도보
    if (trafficType === 3) {
      return {
        type: "WALK",
        points: toPointsFromSp(sp), // 도보는 보통 start/end가 없어서 []가 될 수 있음
        section_time: sp?.sectionTime ?? null,
        distance: sp?.distance ?? null,
      };
    }

    // 지하철
    if (trafficType === 1) {
      const lane = Array.isArray(sp?.lane) ? sp.lane : [];

      return {
        type: toSubwayMapType(sp),
        points: toPointsFromSp(sp),
        section_time: sp?.sectionTime ?? null,
        distance: sp?.distance ?? null,
        station_count: sp?.stationCount ?? null,
        from: {
          name: sp?.startNameKor ?? sp?.startName ?? null,
          lat: asNumber(sp?.startY) ?? null,
          lng: asNumber(sp?.startX) ?? null,
          id: sp?.startID ?? null,
        },
        to: {
          name: sp?.endNameKor ?? sp?.endName ?? null,
          lat: asNumber(sp?.endY) ?? null,
          lng: asNumber(sp?.endX) ?? null,
          id: sp?.endID ?? null,
        },

        // UI 표시용 라인명 리스트(있으면)
        subway_lines: lane
          .map((l) => l?.nameKor ?? l?.name ?? null)
          .filter(Boolean),
        way: sp?.way ?? null,
        way_code: sp?.wayCode ?? null,
        // 노선 타입 원본(참고용)
        subway_type: asNumber(lane?.[0]?.type),
      };
    }

    // 버스
    if (trafficType === 2) {
      const lane = Array.isArray(sp?.lane) ? sp.lane : [];

      return {
        type: toBusMapType(),
        points: toPointsFromSp(sp),
        section_time: sp?.sectionTime ?? null,
        distance: sp?.distance ?? null,
        station_count: sp?.stationCount ?? null,
        from: {
          name: sp?.startNameKor ?? sp?.startName ?? null,
          lat: asNumber(sp?.startY) ?? null,
          lng: asNumber(sp?.startX) ?? null,
          id: sp?.startID ?? null,
        },
        to: {
          name: sp?.endNameKor ?? sp?.endName ?? null,
          lat: asNumber(sp?.endY) ?? null,
          lng: asNumber(sp?.endX) ?? null,
          id: sp?.endID ?? null,
        },
        // lane[]가 여러 개면 같은 구간에서 탈 수 있는 버스가 여러 개
        bus_numbers: lane
          .map((l) => l?.busNoKor ?? l?.busNo ?? null)
          .filter(Boolean),
        // 참고용 버스 타입 배열
        bus_types: lane.map((l) => asNumber(l?.type)).filter((v) => v != null),
      };
    }

    return {
      type: "UNKNOWN",
      points: toPointsFromSp(sp),
      traffic_type: trafficType ?? null,
      section_time: sp?.sectionTime ?? null,
      distance: sp?.distance ?? null,
    };
  });

  const originPoint =
    origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)
      ? origin
      : null;
  const destinationPoint =
    destination &&
    Number.isFinite(destination.lat) &&
    Number.isFinite(destination.lng)
      ? destination
      : null;

  return { steps: fillWalkPoints(steps, originPoint, destinationPoint) };
}

// tag (카드 상단 배지용 등)
export function buildTransportTags(subPath) {
  const arr = Array.isArray(subPath) ? subPath : [];
  const hasBus = arr.some((sp) => asNumber(sp?.trafficType) === 2);
  const hasSubway = arr.some((sp) => asNumber(sp?.trafficType) === 1);

  const tags = [];
  if (hasSubway) tags.push("SUBWAY");
  if (hasBus) tags.push("BUS");
  return tags;
}
