function firstPointOf(step) {
  const pts = step?.points;
  return Array.isArray(pts) && pts.length ? pts[0] : null;
}

function lastPointOf(step) {
  const pts = step?.points;
  return Array.isArray(pts) && pts.length ? pts[pts.length - 1] : null;
}

/*
WALK step의 points가 비어있으면, 앞/뒤 step의 points를 이용해 [start,end]로 보정
origin/destination이 있으면 fallback으로 사용
*/
export function fillWalkPoints(steps, origin = null, destination = null) {
  if (!Array.isArray(steps) || steps.length === 0) return steps;

  const filled = steps.map((s) => ({ ...s }));

  for (let i = 0; i < filled.length; i++) {
    const step = filled[i];
    if (step?.type !== "WALK") continue;

    const hasPoints = Array.isArray(step.points) && step.points.length >= 2;
    if (hasPoints) continue;

    // start: prev lastPoint OR origin
    let start = null;
    for (let p = i - 1; p >= 0; p--) {
      start = lastPointOf(filled[p]);
      if (start) break;
    }
    if (!start) start = origin ?? null;

    // end: next firstPoint OR destination
    let end = null;
    for (let n = i + 1; n < filled.length; n++) {
      end = firstPointOf(filled[n]);
      if (end) break;
    }
    if (!end) end = destination ?? null;

    // 둘 다 없으면 유지
    if (!start || !end) {
      step.points = Array.isArray(step.points) ? step.points : [];
      continue;
    }

    step.points = [start, end];
  }

  return filled;
}
