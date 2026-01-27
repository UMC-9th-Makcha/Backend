function toTimeMs(isoString) {
  if (!isoString) return null;
  const t = new Date(isoString).getTime();
  return Number.isFinite(t) ? t : null;
}

/*
후보 목록에서 "최적 1개"를 골라 is_optimal=true로 표시
기준:
1) 출발 마감시간(deadline_at) 늦은 경로
2) 총 소요시간(traveled_time) 짧은 경로
3) 환승 횟수(transfer_count) 적은 경로
4) 도보시간(walk_time) 짧은 경로

제외:
is_supported=false, is_possible=false, deadline_at=null
*/
export function markOptimalCandidate(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) return candidates;

  let bestIdx = -1;

  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i];

    if (a?.is_supported === false) continue;
    if (a?.is_possible === false) continue;

    const aDeadline = toTimeMs(a?.card?.deadline_at);
    if (aDeadline === null) continue;

    if (bestIdx === -1) {
      bestIdx = i;
      continue;
    }

    const b = candidates[bestIdx];
    const bDeadline = toTimeMs(b?.card?.deadline_at);

    // 1) deadline 늦은 것
    if (aDeadline > bDeadline) {
      bestIdx = i;
      continue;
    }
    if (aDeadline < bDeadline) continue;

    // 2) totalTime 짧은 것
    const aTime = a?.card?.traveled_time ?? Infinity;
    const bTime = b?.card?.traveled_time ?? Infinity;
    if (aTime < bTime) {
      bestIdx = i;
      continue;
    }
    if (aTime > bTime) continue;

    // 3) 환승 적은 것
    const aTr = a?.card?.transfer_count ?? Infinity;
    const bTr = b?.card?.transfer_count ?? Infinity;
    if (aTr < bTr) {
      bestIdx = i;
      continue;
    }
    if (aTr > bTr) continue;

    // 4) 도보 짧은 것
    const aWalk = a?.card?.walk_time ?? Infinity;
    const bWalk = b?.card?.walk_time ?? Infinity;
    if (aWalk < bWalk) {
      bestIdx = i;
      continue;
    }
  }

  // 초기화 후 bestIdx만 true
  for (const c of candidates) c.is_optimal = false;
  if (bestIdx !== -1) candidates[bestIdx].is_optimal = true;

  return candidates;
}
