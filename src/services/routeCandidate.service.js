import crypto from "crypto";
import {
  buildTransportTags,
  toRouteCandidateCardDto,
  toRouteCandidateDetailDto,
} from "../dtos/routeCandidate.dto.js";
import { fetchPubTransPath } from "../repositories/odsay.repository.js";
import { getBusLastTimeAtStation } from "./busLastTime.service.js";
import {
  computeDeadline,
  resolveLastDepartureDateTime,
} from "./deadline.service.js";
import { markOptimalCandidate } from "./routeOptimal.service.js";
import { detectSupportForCandidate } from "./routeSupport.service.js";
import { getSubwayLastTimeAtStation } from "./subwayLastTime.service.js";
import { setRouteToken } from "../utils/routeTokenStore.util.js";

const BASE_BUFFER = 5;
const TRANSFER_BUFFER = 2;
const LAST_BOARD_BUFFER = 3;

const CANDIDATE_FETCH_N = 10;
const PICK_MAX = 3;

function generateRouteToken() {
  return "rt_" + crypto.randomBytes(16).toString("base64url"); // 128-bit
}

// 환승 횟수 계산 (도보 제외 지하철/버스 구간 개수 -1)
function calcTransferCount(subPath) {
  const arr = Array.isArray(subPath) ? subPath : [];
  const transitLegCount = arr.filter((sp) => {
    const t = Number(sp?.trafficType);
    return t === 1 || t === 2;
  }).length;
  return Math.max(0, transitLegCount - 1);
}

// 총 도보 시간 계산
function calcWalkTime(subPath) {
  const arr = Array.isArray(subPath) ? subPath : [];
  return arr
    .filter((sp) => Number(sp?.trafficType) === 3)
    .reduce((sum, sp) => sum + Number(sp.sectionTime ?? 0), 0);
}

// 첫 교통수단 찾기 (도보 제외)
function pickFirstTransitLeg(subPath) {
  const arr = Array.isArray(subPath) ? subPath : [];
  return (
    arr.find((sp) => {
      const t = Number(sp?.trafficType);
      return t === 1 || t === 2;
    }) ?? null
  );
}

// 마지막 교통수단 찾기 (도보 제외)
function pickLastTransitLeg(subPath) {
  const arr = Array.isArray(subPath) ? subPath : [];
  for (let i = arr.length - 1; i >= 0; i--) {
    const sp = arr[i];
    const t = Number(sp?.trafficType);
    if (t === 1 || t === 2) return sp;
  }
  return null;
}

// 마지막 교통수단 탑승 전까지의 소요 시간
function minutesUntilLegStarts(subPath, targetLeg) {
  const arr = Array.isArray(subPath) ? subPath : [];
  let sum = 0;
  for (const sp of arr) {
    if (sp === targetLeg) break;
    sum += Number(sp.sectionTime ?? 0);
  }
  return sum;
}

// 마지막 구간 탑승 가능 여부
function checkLastLegCatchable({ lastLastTimeHHMM, minutesToLastBoard }) {
  // 막차 시간 정보가 없으면 일단 통과 처리 (경고만)
  if (!lastLastTimeHHMM) {
    return {
      passed: true,
      reason: "LAST_LEG_LAST_TIME_UNKNOWN",
      lastLegDepartureAt: null,
    };
  }

  const lastDeparture = resolveLastDepartureDateTime({
    hhmm: lastLastTimeHHMM,
  });
  const now = new Date();

  const needReadyMs =
    now.getTime() + (minutesToLastBoard + LAST_BOARD_BUFFER) * 60 * 1000;

  const passed = needReadyMs <= lastDeparture.getTime();

  return {
    passed,
    reason: passed ? null : "LAST_LEG_MISSED",
    lastLegDepartureAt: lastDeparture.toISOString(),
  };
}

function getBusNosFromLane(transitLeg) {
  const lane = Array.isArray(transitLeg?.lane) ? transitLeg.lane : [];
  return lane.map((l) => l?.busNo ?? l?.busNoKor ?? null).filter(Boolean);
}

async function getLatestBusLastTimeHHMM({ stationID, busNos }) {
  if (!stationID || !Array.isArray(busNos) || busNos.length === 0) return null;

  // 너무 많으면 제한
  const unique = Array.from(new Set(busNos)).slice(0, 5);

  const results = await Promise.all(
    unique.map(async (busNo) => {
      try {
        const hhmm = await getBusLastTimeAtStation({ stationID, busNo });
        return hhmm ? { busNo, hhmm } : null;
      } catch {
        return null;
      }
    }),
  );

  const available = results.filter(Boolean);
  if (available.length === 0) return null;

  // 가장 "늦은" 막차 선택 (오늘/내일 판단은 resolveLastDepartureDateTime)
  let best = available[0];
  let bestMs = resolveLastDepartureDateTime({ hhmm: best.hhmm }).getTime();

  for (let i = 1; i < available.length; i++) {
    const cur = available[i];
    const curMs = resolveLastDepartureDateTime({ hhmm: cur.hhmm }).getTime();
    if (curMs > bestMs) {
      best = cur;
      bestMs = curMs;
    }
  }

  return best.hhmm;
}

// ---------- 막차 조회 ----------

async function getFirstLastTimeHHMM(firstTransit) {
  if (!firstTransit) return null;

  const tt = Number(firstTransit?.trafficType);

  // 지하철
  if (tt === 1) {
    const stationID = firstTransit.startID;
    const wayCodeRaw = firstTransit.wayCode ?? null;
    const wayCode = wayCodeRaw == null ? null : Number(wayCodeRaw);
    if (!stationID) return null;

    return await getSubwayLastTimeAtStation({ stationID, wayCode });
  }

  // 버스: lane 중 하나라도 가능하면 "가장 늦은 막차"로 살림
  if (tt === 2) {
    const stationID = firstTransit.startID;
    const busNos = getBusNosFromLane(firstTransit);
    if (!stationID || busNos.length === 0) return null;

    return await getLatestBusLastTimeHHMM({ stationID, busNos });
  }

  return null;
}

async function getLastLastTimeHHMM(lastTransit) {
  if (!lastTransit) return null;

  const tt = Number(lastTransit?.trafficType);

  // 지하철
  if (tt === 1) {
    const stationID = lastTransit.startID;
    const wayCodeRaw = lastTransit.wayCode ?? null;
    const wayCode = wayCodeRaw == null ? null : Number(wayCodeRaw);
    if (!stationID) return null;

    return await getSubwayLastTimeAtStation({ stationID, wayCode });
  }

  // 버스: lane 중 하나라도 가능하면 "가장 늦은 막차"로 살림
  if (tt === 2) {
    const stationID = lastTransit.startID;
    const busNos = getBusNosFromLane(lastTransit);
    if (!stationID || busNos.length === 0) return null;

    return await getLatestBusLastTimeHHMM({ stationID, busNos });
  }

  return null;
}

// ---------- 그룹화/대표선정 ----------

function flowSignature(subPath) {
  // 도보 제외한 trafficType 흐름만
  const arr = Array.isArray(subPath) ? subPath : [];
  return arr
    .filter((sp) => {
      const t = Number(sp?.trafficType);
      return t === 1 || t === 2;
    })
    .map((sp) => Number(sp?.trafficType))
    .join("-");
}

/*
승/하차 정류장(역) 기준 그룹 키
 - firstTransit.startID (승차)
 - lastTransit.endID (최종 하차)
 - transit flow (버스/지하철 조합)
 - pathType까지 포함
*/
function buildStopGroupKey({ pathType, subPath }) {
  const first = pickFirstTransitLeg(subPath);
  const last = pickLastTransitLeg(subPath);
  const fromId = first?.startID ?? "null";
  const toId = last?.endID ?? "null";
  const flow = flowSignature(subPath) || "none";
  return `${pathType}|${fromId}|${toId}|${flow}`;
}

/*
대표 1개 선정
1) deadline_at 늦은 것
2) traveled_time 짧은 것
3) transfer_count 적은 것
4) walk_time 짧은 것
*/
function pickBest(cands) {
  if (!Array.isArray(cands) || cands.length === 0) return null;

  const toTimeMs = (iso) => {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : null;
  };

  let best = null;

  for (const a of cands) {
    if (!a) continue;
    if (a.is_supported === false) continue;
    if (a.is_possible === false) continue;

    const aDeadline = toTimeMs(a?.card?.deadline_at);
    if (aDeadline === null) continue;

    if (!best) {
      best = a;
      continue;
    }

    const bDeadline = toTimeMs(best?.card?.deadline_at);

    // 1) deadline 늦은 것
    if (aDeadline > bDeadline) {
      best = a;
      continue;
    }
    if (aDeadline < bDeadline) continue;

    // 2) 소요시간 짧은 것
    const aTime = a?.card?.traveled_time ?? Infinity;
    const bTime = best?.card?.traveled_time ?? Infinity;
    if (aTime < bTime) {
      best = a;
      continue;
    }
    if (aTime > bTime) continue;

    // 3) 환승 적은 것
    const aTr = a?.card?.transfer_count ?? Infinity;
    const bTr = best?.card?.transfer_count ?? Infinity;
    if (aTr < bTr) {
      best = a;
      continue;
    }
    if (aTr > bTr) continue;

    // 4) 도보 짧은 것
    const aWalk = a?.card?.walk_time ?? Infinity;
    const bWalk = best?.card?.walk_time ?? Infinity;
    if (aWalk < bWalk) {
      best = a;
      continue;
    }
  }

  return best;
}

/*
pathType별로 그룹화 -> 그룹 대표 1개 -> 타입당 대표 1개
최종 최대 3개 반환
*/
function selectTopCandidates({ candidates }) {
  // 1) pathType별 분리
  const byType = new Map(); // pathType -> array
  for (const c of candidates) {
    const t = c?.meta?.path_type;
    if (t === null || t === undefined) continue;
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t).push(c);
  }

  const picked = [];

  // pathType 우선순위
  const typePriority = [1, 2, 3];
  for (const t of typePriority) {
    const group = byType.get(t);
    if (!group || group.length === 0) continue;

    // 2) 승/하차 기준 그룹화
    const byStops = new Map(); // key -> array
    for (const c of group) {
      const key = c?.meta?.stop_group_key;
      if (!key) continue;
      if (!byStops.has(key)) byStops.set(key, []);
      byStops.get(key).push(c);
    }

    // 3) 그룹별 대표 뽑기 -> 그 중 다시 best 1개
    const representatives = [];
    for (const arr of byStops.values()) {
      const rep = pickBest(arr);
      if (rep) representatives.push(rep);
    }

    const bestOfType = pickBest(representatives);
    if (bestOfType) picked.push(bestOfType);

    if (picked.length >= PICK_MAX) break;
  }

  return picked.slice(0, PICK_MAX);
}

// ---------- routes/candidates ----------
// 미지원 경로는 candidates에 포함하지 않음

export async function getRouteCandidates({ origin, destination }) {
  const { ok, status, data } = await fetchPubTransPath({
    sx: origin.lng,
    sy: origin.lat,
    ex: destination.lng,
    ey: destination.lat,
  });

  if (!ok) {
    throw new Error(
      `ODsay HTTP error: status=${status}, body=${JSON.stringify(data)}`,
    );
  }

  if (data?.error) {
    throw new Error(`ODsay API error: ${JSON.stringify(data.error)}`);
  }

  if (!data?.result || !Array.isArray(data.result.path)) {
    throw new Error(`ODsay invalid response: ${JSON.stringify(data)}`);
  }

  const resultSearchType = data?.result?.searchType; // 0이면 도시내
  const paths = data.result.path.slice(0, CANDIDATE_FETCH_N);

  // 1) 후보 생성(지원 필터 + 막차계산 + DTO 생성)
  const computed = await Promise.all(
    paths.map(async (p, idx) => {
      const info = p.info ?? {};
      const subPath = Array.isArray(p.subPath) ? p.subPath : [];

      // 지원 여부
      const support = detectSupportForCandidate({
        resultSearchType,
        subPath,
      });
      if (!support.is_supported) {
        return null; // 미지원은 제외
      }

      const transfer_count = calcTransferCount(subPath);
      const walk_time = calcWalkTime(subPath);
      const bufferMinutes = BASE_BUFFER + TRANSFER_BUFFER * transfer_count;

      const firstTransit = pickFirstTransitLeg(subPath);
      const lastTransit = pickLastTransitLeg(subPath);

      // ---------- 1) 첫 교통수단 기준 deadline ----------
      let deadline_at = null;
      let minutes_left = null;
      let is_possible = true;

      const first_last_time = await getFirstLastTimeHHMM(firstTransit);
      if (first_last_time) {
        const dl = computeDeadline({
          firstLastTimeHHMM: first_last_time,
          bufferMinutes,
        });
        deadline_at = dl.deadlineAt;
        minutes_left = dl.minutesLeft;
        is_possible = dl.isPossible;
      } else {
        is_possible = false;
      }

      // ---------- 2) 마지막 구간 탑승 가능 여부 체크 ----------
      const warnings = [];

      const minutes_to_last_board = lastTransit
        ? minutesUntilLegStarts(subPath, lastTransit)
        : 0;

      const last_last_time = await getLastLastTimeHHMM(lastTransit);

      const lastCheck = checkLastLegCatchable({
        lastLastTimeHHMM: last_last_time,
        minutesToLastBoard: minutes_to_last_board,
      });

      if (lastCheck.reason) warnings.push(lastCheck.reason);
      if (!lastCheck.passed) is_possible = false;

      // DTO
      const tags = buildTransportTags(subPath);

      const card = toRouteCandidateCardDto({
        traveled_time: info.totalTime,
        transfer_count,
        public_transit_fare: info.payment ?? null,
        walk_time,
        deadline_at,
        minutes_left,
      });

      const detail = toRouteCandidateDetailDto({
        subPath,
        origin,
        destination,
      });

      // 승/하차 그룹키
      const stop_group_key = buildStopGroupKey({
        pathType: p?.pathType,
        subPath,
      });

      // 폴리라인용 mapObj
      const mapObj = info?.mapObj ?? info?.mapOBJ ?? p?.mapObj ?? null;

      return {
        // route_token은 picked 후에
        route_token: null,

        candidate_key: `tmp_${Date.now()}_${idx}`,
        station_id: firstTransit?.startID ?? null,
        end_address: null,

        is_supported: true,
        is_possible,
        is_optimal: false,
        reason: null,
        message: null,

        tags,
        card,
        detail,
        warnings,

        // 메타 (임시)
        meta: {
          path_type: p?.pathType ?? null,
          stop_group_key,
          map_obj: mapObj, // 임시
        },
      };
    }),
  );

  // null(미지원 제외) 제거
  const supportedCandidates = computed.filter(Boolean);

  // 최종 3개 선택
  const picked = selectTopCandidates({ candidates: supportedCandidates });

  // 3개에 대해서만 route_token 발급 + 캐시에 mapObj 저장 (TTL 30분)
  const TTL_SEC = 60 * 30;
  for (const c of picked) {
    const mapObj = c?.meta?.map_obj ?? null;

    if (!mapObj) {
      c.route_token = null;
      c.warnings = Array.isArray(c.warnings) ? c.warnings : [];
      c.warnings.push("MAP_OBJ_NOT_FOUND");
      continue;
    }

    const route_token = generateRouteToken();
    setRouteToken(route_token, { mapObj }, TTL_SEC);
    c.route_token = route_token;
  }

  // 최적 1개 표시
  markOptimalCandidate(picked);

  // meta 제거
  const cleaned = picked.map(({ meta, ...rest }) => rest);

  return cleaned;
}
