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
import { CustomError } from "../response/customError.js";
import {
  isLikelyValidOdsayMapObject,
  normalizeOdsayMapObject,
} from "../utils/odsayMapObject.util.js";
import { getKstParts } from "../utils/kstDate.util.js";

const BASE_BUFFER = 5;
const TRANSFER_BUFFER = 2;
const FIRST_BOARD_BUFFER = 3;
const LAST_BOARD_BUFFER = 3;

const CANDIDATE_FETCH_N = 10;
const PICK_MAX = 3;

function throwCustom(errorCode, message, path, statusCode = 500, result = {}) {
  const err = new CustomError(errorCode, message, path, result);
  err.statusCode = statusCode;
  throw err;
}

function generateRouteToken() {
  return "rt_" + crypto.randomBytes(16).toString("base64url"); // 128-bit
}

function extractWalkSegments(detail) {
  const steps = detail?.steps;
  if (!Array.isArray(steps)) return [];

  const segs = [];

  steps.forEach((step, idx) => {
    if (step?.type !== "WALK") return;

    const pts = Array.isArray(step?.points) ? step.points : [];
    const a = pts[0];
    const b = pts[pts.length - 1];

    const fromLat = Number(a?.lat);
    const fromLng = Number(a?.lng);
    const toLat = Number(b?.lat);
    const toLng = Number(b?.lng);

    if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) return;

    // 0거리/동일점 WALK는 스킵
    if (fromLat === toLat && fromLng === toLng) return;

    segs.push({
      order: idx,
      from: { lat: fromLat, lng: fromLng },
      to: { lat: toLat, lng: toLng },
    });
  });

  return segs;
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

  const lastMs = lastDeparture?.getTime?.();
  // 파싱 실패/Invalid Date -> 통과 + warning
  if (!Number.isFinite(lastMs)) {
    return {
      passed: true,
      reason: "LAST_LEG_LAST_TIME_INVALID",
      lastLegDepartureAt: null,
    };
  }

  const passed = needReadyMs <= lastMs;

  return {
    passed,
    reason: passed ? null : "LAST_LEG_MISSED",
    lastLegDepartureAt: new Date(lastMs).toISOString(),
  };
}

// 버스 lane 정보(busNo + type) 추출
function getBusLaneInfos(transitLeg) {
  const lane = Array.isArray(transitLeg?.lane) ? transitLeg.lane : [];
  return lane
    .map((l) => ({
      busNo: l?.busNo ?? l?.busNoKor ?? null,
      busType: l?.type == null ? null : Number(l.type),
    }))
    .filter((x) => !!x.busNo);
}

// stationID+busNo별 막차 조회 중복 방지
function createBusLastTimeMemo(getBusLastTimeAtStation) {
  const memo = new Map();
  return async function getBusLastTimeAtStationMemo({ stationID, busNo }) {
    const sid = stationID == null ? "null" : String(Number(stationID));
    const bn = busNo == null ? "null" : String(busNo);
    const key = `${sid}:${bn}`;

    if (memo.has(key)) return memo.get(key);

    const p = (async () => {
      try {
        const hhmm = await getBusLastTimeAtStation({ stationID, busNo });
        return hhmm ?? null;
      } catch {
        return null;
      }
    })();

    memo.set(key, p);
    return p;
  };
}

// 지하철 시간표는 "평일/토/일(공휴)"에 따라 달라질 수 있어 dayKey 포함
function getKstDayKey() {
  const { day } = getKstParts(); // 0=일, 6=토
  if (day === 6) return "SAT";
  if (day === 0) return "SUN";
  return "WEEKDAY";
}

function createSubwayLastTimeMemo(getSubwayLastTimeAtStation) {
  const memo = new Map();
  return async function getSubwayLastTimeAtStationMemo({ stationID, wayCode }) {
    const dayKey = getKstDayKey();

    const sid = stationID == null ? "null" : String(Number(stationID));
    const wc = wayCode == null ? "null" : String(Number(wayCode));
    const key = `${dayKey}:${sid}:${wc}`;

    if (memo.has(key)) return memo.get(key);

    const p = (async () => {
      try {
        const hhmm = await getSubwayLastTimeAtStation({ stationID, wayCode });
        return hhmm ?? null;
      } catch {
        return null;
      }
    })();

    memo.set(key, p);
    return p;
  };
}

// 가장 늦은 버스 막차 + (그 버스의 번호/타입) 반환
async function getLatestBusLastTimeHHMM({
  stationID,
  laneInfos,
  getBusLastTimeAtStationMemo,
}) {
  if (!stationID || !Array.isArray(laneInfos) || laneInfos.length === 0)
    return null;

  // busNo 기준 unique + 너무 많으면 제한
  const byNo = new Map();
  for (const x of laneInfos) {
    if (x?.busNo && !byNo.has(x.busNo)) byNo.set(x.busNo, x);
  }
  const unique = Array.from(byNo.values()).slice(0, 5);

  const results = await Promise.all(
    unique.map(async ({ busNo, busType }) => {
      const hhmm = await getBusLastTimeAtStationMemo({ stationID, busNo });
      return hhmm ? { busNo, busType: busType ?? null, hhmm } : null;
    }),
  );

  const available = results.filter(Boolean);
  if (available.length === 0) return null;

  // 가장 늦은 막차 선택 (오늘/내일 판단은 resolveLastDepartureDateTime)
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

  return { hhmm: best.hhmm, busNo: best.busNo, busType: best.busType };
}

// BUS 구간별로 lane이 여러 개인 경우, '막차가 가장 늦은 버스'의 타입/번호 선택
async function annotateBusStepsWithPickedType({
  subPath,
  getBusLastTimeAtStationMemo,
}) {
  const arr = Array.isArray(subPath) ? subPath : [];
  const busSteps = arr.filter((sp) => Number(sp?.trafficType) === 2);

  await Promise.all(
    busSteps.map(async (sp) => {
      const stationID = sp?.startID;
      const laneInfos = getBusLaneInfos(sp);

      if (!stationID || laneInfos.length === 0) return;

      // lane 1개면 조회 없이 타입 고정
      if (laneInfos.length === 1) {
        sp._picked_bus_no = laneInfos[0].busNo ?? null;
        sp._picked_bus_type = laneInfos[0].busType ?? null;
        return;
      }

      const picked = await getLatestBusLastTimeHHMM({
        stationID,
        laneInfos,
        getBusLastTimeAtStationMemo,
      });

      sp._picked_bus_no = picked?.busNo ?? null;
      sp._picked_bus_type = picked?.busType ?? null;
    }),
  );
}

// ---------- 막차 조회 ----------

async function getFirstLastTimeHHMM({
  firstTransit,
  getBusLastTimeAtStationMemo,
  getSubwayLastTimeAtStationMemo,
}) {
  if (!firstTransit) return null;

  const tt = Number(firstTransit?.trafficType);

  // 지하철
  if (tt === 1) {
    const stationID = firstTransit.startID;
    const wayCodeRaw = firstTransit.wayCode ?? null;
    const wayCode = wayCodeRaw == null ? null : Number(wayCodeRaw);
    if (!stationID) return null;
    return await getSubwayLastTimeAtStationMemo({ stationID, wayCode });
  }

  // 버스: lane 중 하나라도 가능하면 "가장 늦은 막차"
  if (tt === 2) {
    const stationID = firstTransit.startID;
    const laneInfos = getBusLaneInfos(firstTransit);
    if (!stationID || laneInfos.length === 0) return null;

    const picked = await getLatestBusLastTimeHHMM({
      stationID,
      laneInfos,
      getBusLastTimeAtStationMemo,
    });

    // 선택된 버스 정보를 sp에 넣음
    if (picked) {
      firstTransit._picked_bus_no = picked.busNo ?? null;
      firstTransit._picked_bus_type = picked.busType ?? null;
      return picked.hhmm;
    }
    return null;
  }

  return null;
}

async function getLastLastTimeHHMM({
  lastTransit,
  getBusLastTimeAtStationMemo,
  getSubwayLastTimeAtStationMemo,
}) {
  if (!lastTransit) return null;

  const tt = Number(lastTransit?.trafficType);

  // 지하철
  if (tt === 1) {
    const stationID = lastTransit.startID;
    const wayCodeRaw = lastTransit.wayCode ?? null;
    const wayCode = wayCodeRaw == null ? null : Number(wayCodeRaw);
    if (!stationID) return null;
    return await getSubwayLastTimeAtStationMemo({ stationID, wayCode });
  }

  // 버스: lane 중 하나라도 가능하면 "가장 늦은 막차"
  if (tt === 2) {
    const stationID = lastTransit.startID;
    const laneInfos = getBusLaneInfos(lastTransit);
    if (!stationID || laneInfos.length === 0) return null;

    const picked = await getLatestBusLastTimeHHMM({
      stationID,
      laneInfos,
      getBusLastTimeAtStationMemo,
    });

    // 색상 일관성을 위해 선택된 버스 정보를 sp에 넣음
    if (picked) {
      lastTransit._picked_bus_no = picked.busNo ?? null;
      lastTransit._picked_bus_type = picked.busType ?? null;
      return picked.hhmm;
    }
    return null;
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

  // 2) 타입별 대표 선정
  for (const t of typePriority) {
    const group = byType.get(t);
    if (!group || group.length === 0) continue;

    // 승/하차 기준 그룹화
    const byStops = new Map(); // key -> array
    for (const c of group) {
      const key = c?.meta?.stop_group_key;
      if (!key) continue;
      if (!byStops.has(key)) byStops.set(key, []);
      byStops.get(key).push(c);
    }

    // 그룹별 대표 뽑기 -> 그 중 다시 best 1개
    const representatives = [];
    for (const arr of byStops.values()) {
      const rep = pickBest(arr);
      if (rep) representatives.push(rep);
    }

    const bestOfType = pickBest(representatives);
    if (bestOfType) picked.push(bestOfType);

    if (picked.length >= PICK_MAX) return picked.slice(0, PICK_MAX);
  }

  // 3) 부족하면 나머지 후보로 채우기
  if (picked.length < PICK_MAX) {
    const pickedKeys = new Set(picked.map((c) => c.candidate_key));

    // pickBest 우선순위로 정렬
    const rest = candidates
      .filter((c) => c && !pickedKeys.has(c.candidate_key))
      .filter((c) => c.is_supported !== false && c.is_possible !== false)
      .sort((a, b) => {
        const toMs = (iso) => {
          const t = iso ? new Date(iso).getTime() : NaN;
          return Number.isFinite(t) ? t : -Infinity;
        };

        const ad = toMs(a?.card?.deadline_at);
        const bd = toMs(b?.card?.deadline_at);
        if (ad !== bd) return bd - ad; // deadline 늦은게 먼저

        const at = a?.card?.traveled_time ?? Infinity;
        const bt = b?.card?.traveled_time ?? Infinity;
        if (at !== bt) return at - bt;

        const atr = a?.card?.transfer_count ?? Infinity;
        const btr = b?.card?.transfer_count ?? Infinity;
        if (atr !== btr) return atr - btr;

        const aw = a?.card?.walk_time ?? Infinity;
        const bw = b?.card?.walk_time ?? Infinity;
        return aw - bw;
      });

    for (const c of rest) {
      picked.push(c);
      if (picked.length >= PICK_MAX) break;
    }
  }

  return picked.slice(0, PICK_MAX);
}

// ---------- routes/candidates ----------
// 미지원 경로는 candidates에 포함하지 않음

export async function getRouteCandidates({ origin, destination }) {
  const PATH = "/api/routes/candidates";

  const { ok, status, data } = await fetchPubTransPath({
    sx: origin.lng,
    sy: origin.lat,
    ex: destination.lng,
    ey: destination.lat,
  });

  if (!ok) {
    throwCustom("COM-500-001", "외부 경로 API 호출 실패", PATH, 502, {
      status,
      data,
    });
  }

  if (data?.error) {
    throwCustom("COM-500-001", "외부 경로 API 응답 오류", PATH, 502, {
      error: data.error,
    });
  }

  if (!data?.result || !Array.isArray(data.result.path)) {
    throwCustom("COM-500-001", "경로 API 응답 형식 오류", PATH, 500, { data });
  }

  const resultSearchType = data?.result?.searchType;
  const paths = data.result.path.slice(0, CANDIDATE_FETCH_N);

  console.log("[candidates] searchType=", resultSearchType);
  console.log("[candidates] odsay path count=", data.result.path.length);
  console.log("[candidates] using slice count=", paths.length);

  const getBusLastTimeAtStationMemo = createBusLastTimeMemo(
    getBusLastTimeAtStation,
  );
  const getSubwayLastTimeAtStationMemo = createSubwayLastTimeMemo(
    getSubwayLastTimeAtStation,
  );

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
        console.log("[candidates][drop][unsupported]", {
          idx,
          reason: support.reason,
          message: support.message,
          pathType: p?.pathType,
        });
        return null; // 미지원은 제외
      }

      // 모든 BUS step에 대해 lane 여러 개면 "막차가 가장 늦은 버스"의 타입/번호 선택
      await annotateBusStepsWithPickedType({
        subPath,
        getBusLastTimeAtStationMemo,
      });

      const transfer_count = calcTransferCount(subPath);
      const walk_time = calcWalkTime(subPath);
      const bufferMinutes = BASE_BUFFER + TRANSFER_BUFFER * transfer_count;

      const firstTransit = pickFirstTransitLeg(subPath);
      const lastTransit = pickLastTransitLeg(subPath);

      // ---------- 1) 첫 교통수단 기준 deadline ----------
      let deadline_at = null;
      let minutes_left = null;
      let is_possible = true;
      const warnings = [];

      const first_last_time = await getFirstLastTimeHHMM({
        firstTransit,
        getBusLastTimeAtStationMemo,
        getSubwayLastTimeAtStationMemo,
      });

      const minutes_to_first_board = firstTransit
        ? minutesUntilLegStarts(subPath, firstTransit)
        : 0;

      if (first_last_time) {
        const dl = computeDeadline({
          firstLastTimeHHMM: first_last_time,
          bufferMinutes,
          minutesToFirstBoard: minutes_to_first_board,
          firstBoardBufferMinutes: FIRST_BOARD_BUFFER,
        });
        deadline_at = dl.deadlineAt;
        minutes_left = dl.minutesLeft;
        is_possible = dl.isPossible;
        if (dl.reason) warnings.push(dl.reason);
      } else {
        // 첫 막차 시간이 없으면 불가능
        is_possible = false;
        warnings.push("FIRST_LEG_LAST_TIME_UNKNOWN");
      }

      // ---------- 2) 마지막 구간 탑승 가능 여부 체크 ----------
      const minutes_to_last_board = lastTransit
        ? minutesUntilLegStarts(subPath, lastTransit)
        : 0;

      const last_last_time = await getLastLastTimeHHMM({
        lastTransit,
        getBusLastTimeAtStationMemo,
        getSubwayLastTimeAtStationMemo,
      });

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
      // ---------- route_token, 캐시 ----------
      const mapObj =
        (typeof info?.mapObj === "string" && info.mapObj.trim()) ||
        (typeof p?.info?.mapObj === "string" && p.info.mapObj.trim()) ||
        (typeof p?.mapObj === "string" && p.mapObj.trim()) ||
        null;

      return {
        candidate_key: `tmp_${Date.now()}_${idx}`,
        route_token: null,
        station_id: firstTransit?.startID ?? null,

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
          map_obj: mapObj,
        },
      };
    }),
  );

  const supportedCandidates = computed.filter(Boolean);

  console.log("[candidates] computed total=", computed.length);
  console.log("[candidates] supportedCandidates=", supportedCandidates.length);

  // 최종 3개 선택
  const picked = selectTopCandidates({ candidates: supportedCandidates });

  const pickedKeys = new Set(picked.map((c) => c.candidate_key));
  const pool = [
    ...picked,
    ...supportedCandidates.filter((c) => c && !pickedKeys.has(c.candidate_key)),
  ];
  const finalPicked = [];

  // 2) token 발급 가능한 후보만 채택 (최대 3개)
  for (const c of pool) {
    if (!c) continue;
    if (finalPicked.length >= PICK_MAX) break;

    const raw = c?.meta?.map_obj ?? null;
    const mapObj = normalizeOdsayMapObject(raw);

    if (!mapObj) {
      console.warn("[route_token][skip] MAP_OBJECT_MISSING", {
        candidate_key: c?.candidate_key,
        raw,
      });
      continue;
    }

    if (!isLikelyValidOdsayMapObject(mapObj)) {
      console.warn("[route_token][skip] MAP_OBJECT_INVALID", {
        candidate_key: c?.candidate_key,
        mapObj,
      });
      continue;
    }

    const route_token = generateRouteToken();
    const walkSegments = extractWalkSegments(c.detail);

    const originSnapshot = {
      lat: origin.lat,
      lng: origin.lng,
      title: origin.title ?? null,
      roadAddress: origin.roadAddress ?? null,
      detailAddress: origin.detailAddress ?? null,
    };

    const destinationSnapshot = {
      lat: destination.lat,
      lng: destination.lng,
      title: destination.title ?? null,
      roadAddress: destination.roadAddress ?? null,
      detailAddress: destination.detailAddress ?? null,
    };

    await setRouteToken(
      route_token,
      {
        mapObj,
        walkSegments,
        snapshot: {
          origin: originSnapshot,
          destination: destinationSnapshot,
          tags: c.tags,
          station_id: c.station_id,
          card: c.card,
          detail: c.detail,
        },
      },
      30 * 60,
    );

    console.log("[route_token snapshot]", route_token, {
      origin: originSnapshot,
      destination: destinationSnapshot,
    });

    c.route_token = route_token;
    finalPicked.push(c);
  }
  // 최적 1개 표시
  markOptimalCandidate(finalPicked);

  // meta 제거
  return finalPicked.map(({ meta, ...rest }) => rest);
}
