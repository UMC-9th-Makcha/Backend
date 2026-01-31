function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
      points,
    };
  });

  const boundary = result?.boundary ?? null;

  return { paths, boundary };
}
