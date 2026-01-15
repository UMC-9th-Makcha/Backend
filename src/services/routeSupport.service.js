const SUPPORTED_TRAFFIC_TYPES = new Set([1, 2, 3]); // 1:지하철 2:버스 3:도보

export function detectSupportForCandidate({
  resultSearchType,
  pathType,
  subPath,
}) {
  // 1) searchType이 도시 내(0)가 아니면 도시 간 -> 미지원
  if (typeof resultSearchType === "number" && resultSearchType !== 0) {
    return {
      is_supported: false,
      reason: "INTERCITY_NOT_SUPPORTED",
      message: "현재 도시 간 이동(고속버스/기차) 경로는 지원하지 않아요.",
    };
  }

  // 2) subPath 안에 지원하지 않는 trafficType이 하나라도 있으면 미지원
  const legs = Array.isArray(subPath) ? subPath : [];
  const unsupportedLeg = legs.find(
    (sp) => !SUPPORTED_TRAFFIC_TYPES.has(sp?.trafficType)
  );

  if (unsupportedLeg) {
    return {
      is_supported: false,
      reason: "TRAFFIC_TYPE_NOT_SUPPORTED",
      message: "현재 지원하지 않는 교통수단이 포함된 경로예요.",
    };
  }

  return { is_supported: true, reason: null, message: null };
}

/*
candidates 배열 전체에 대해 is_supported / reason / message / is_possible을 일괄 세팅
- meta: { resultSearchType }
*/
export function markSupportCandidates(candidates, meta = {}) {
  if (!Array.isArray(candidates)) return candidates;

  const resultSearchType =
    typeof meta.resultSearchType === "number" ? meta.resultSearchType : null;

  for (const c of candidates) {
    const support = detectSupportForCandidate({
      resultSearchType,
      pathType: c?.meta?.path_type ?? null,
      subPath: c?.meta?.subPath ?? c?.detail?.subPath ?? c?.raw_subPath ?? [],
    });

    // 기본값: supported
    c.is_supported = support.is_supported;
    c.reason = support.reason;
    c.message = support.message;

    // 미지원이면 무조건 선택 불가 처리
    if (!support.is_supported) {
      c.is_possible = false;
      // 카드/디테일은 내려가도 되고, deadline_at은 null로 강제해도 됨(정책)
      if (c?.card) {
        c.card.deadline_at = null;
        c.card.minutes_left = null;
      }
      // 경고
      if (Array.isArray(c.warnings)) c.warnings.push("UNSUPPORTED_CANDIDATE");
      else c.warnings = ["UNSUPPORTED_CANDIDATE"];
    }
  }

  return candidates;
}
