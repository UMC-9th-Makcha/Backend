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

// (상세보기용)
// trafficType 1: 지하철, 2: 버스, 3: 도보
export function toRouteCandidateDetailDto({ subPath }) {
  const arr = Array.isArray(subPath) ? subPath : [];
  const steps = arr.map((sp) => {
    const section_time = sp?.sectionTime ?? null;
    const distance = sp?.distance ?? null;

    // 도보
    if (sp?.trafficType === 3) {
      return { type: "WALK", section_time, distance };
    }

    // 지하철
    if (sp?.trafficType === 1) {
      const lane = Array.isArray(sp.lane) ? sp.lane : [];
      const subwayLines = [
        ...new Set(
          lane.map((l) => l?.nameKor ?? l?.name ?? null).filter(Boolean)
        ),
      ];

      return {
        type: "SUBWAY",
        section_time,
        distance,
        station_count: sp?.stationCount ?? null,
        from: {
          name: sp?.startName ?? null,
          x: sp?.startX ?? null,
          y: sp?.startY ?? null,
          id: sp?.startID ?? null,
        },
        to: {
          name: sp?.endName ?? null,
          x: sp?.endX ?? null,
          y: sp?.endY ?? null,
          id: sp?.endID ?? null,
        },
        subway_lines: subwayLines,
        way: sp?.way ?? null,
        way_code: sp?.wayCode ?? null,
      };
    }

    // 버스
    if (sp?.trafficType === 2) {
      const lane = Array.isArray(sp.lane) ? sp.lane : [];
      const busNumbers = [
        ...new Set(
          lane.map((l) => l?.busNoKor ?? l?.busNo ?? null).filter(Boolean)
        ),
      ];

      return {
        type: "BUS",
        section_time,
        distance,
        station_count: sp?.stationCount ?? null,
        from: {
          name: sp?.startName ?? null,
          x: sp?.startX ?? null,
          y: sp?.startY ?? null,
          id: sp?.startID ?? null,
        },
        to: {
          name: sp?.endName ?? null,
          x: sp?.endX ?? null,
          y: sp?.endY ?? null,
          id: sp?.endID ?? null,
        },
        bus_numbers: busNumbers,
      };
    }

    // 알 수 없는 타입
    return {
      type: "UNKNOWN",
      traffic_type: sp?.trafficType ?? null,
      section_time,
      distance,
    };
  });

  return { steps };
}

// tag 만들기
export function buildTransportTags(subPath) {
  const arr = Array.isArray(subPath) ? subPath : [];
  const hasSubway = arr.some((sp) => sp?.trafficType === 1);
  const hasBus = arr.some((sp) => sp?.trafficType === 2);

  const tags = [];
  if (hasSubway) tags.push("SUBWAY");
  if (hasBus) tags.push("BUS");
  return tags;
}
