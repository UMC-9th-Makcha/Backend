function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ODsay 버스 타입 -> mapType(색) 매핑 (candidates와 동일)
function busTypeToMapType(t) {
  if (t === 4 || t === 6 || t === 14 || t === 15) return "BUS_RED";
  if (t === 11) return "BUS_BLUE";
  if (t === 5) return "BUS_SKY";
  if (t === 13) return "BUS_ORANGE";
  if (t === 1 || t === 2 || t === 3 || t === 12) return "BUS_GREEN";
  return "BUS";
}

function laneToMapType({ cls, type }) {
  if (cls === 2 && Number.isFinite(type)) return `SUBWAY_${type}`;
  if (cls === 1 && Number.isFinite(type)) return busTypeToMapType(type);
  return "UNKNOWN";
}

export function parseLoadLaneToPaths(data) {
  const result = data?.result;
  const laneArr = Array.isArray(result?.lane) ? result.lane : [];

  const paths = laneArr.map((lane) => {
    const sections = Array.isArray(lane?.section) ? lane.section : [];

    const points = sections
      .flatMap((sec) => (Array.isArray(sec?.graphPos) ? sec.graphPos : []))
      .map((p) => {
        const lng = asNumber(p?.x);
        const lat = asNumber(p?.y);
        if (lat == null || lng == null) return null;
        return { lat, lng };
      })
      .filter(Boolean);

    return {
      class: asNumber(lane?.class), // 1(버스), 2(지하철)
      type: asNumber(lane?.type), // 노선 타입
      map_type: laneToMapType({
        cls: asNumber(lane?.class),
        type: asNumber(lane?.type),
      }),
      points,
    };
  });

  const boundary = result?.boundary ?? null;

  return { paths, boundary };
}
