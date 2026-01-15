import {
  buildTransportTags,
  toRouteCandidateCardDto,
  toRouteCandidateDetailDto,
} from "../dtos/routeSearch.dto.js";
import { fetchPubTransPath } from "../repositories/odsay.repository.js";
import { getBusLastTimeAtStation } from "./busLastTime.service.js";
import {
  computeDeadline,
  resolveLastDepartureDateTime,
} from "./deadline.service.js";
import { markOptimalCandidate } from "./routeOptimal.service.js";
import {
  detectSupportForCandidate,
  markSupportCandidates,
} from "./routeSupport.service.js";
import { getSubwayLastTimeAtStation } from "./subwayLastTime.service.js";

const BASE_BUFFER = 5;
const TRANSFER_BUFFER = 2;
const LAST_BOARD_BUFFER = 3;

// 환승 횟수 계산 (도보 제외 지하철/버스 구간 개수 -1)
function calcTransferCount(subPath) {
  const arr = Array.isArray(subPath) ? subPath : [];
  const transitLegCount = arr.filter(
    (sp) => sp.trafficType === 1 || sp.trafficType === 2
  ).length;
  return Math.max(0, transitLegCount - 1);
}

// 첫 교통수단 찾기 (도보 제외)
function pickFirstTransitLeg(subPath) {
  return (
    subPath.find((sp) => sp.trafficType === 1 || sp.trafficType === 2) ?? null
  );
}

// 마지막 교통수단 찾기 (도보 제외)
function pickLastTransitLeg(subPath) {
  for (let i = subPath.length - 1; i >= 0; i--) {
    const sp = subPath[i];
    if (sp.trafficType === 1 || sp.trafficType === 2) return sp;
  }
  return null;
}

// 마지막 교통수단 탑승 전까지의 소요 시간
function minutesUntilLegStarts(subPath, targetLeg) {
  let sum = 0;
  for (const sp of subPath) {
    if (sp === targetLeg) break;
    sum += Number(sp.sectionTime ?? 0);
  }
  return sum;
}

// 마지막 교통수단 막차 시간 조회 (버스)
async function getLastBusLastTime(lastTransit) {
  if (lastTransit?.trafficType !== 2) return null;

  const stationID = lastTransit.startID;
  const busNo = lastTransit?.lane?.[0]?.busNo ?? null;

  if (!stationID || !busNo) return null;
  return await getBusLastTimeAtStation({ stationID, busNo });
}

// 마지막 교통수단 막차 시간 조회 (지하철)
async function getLastSubwayLastTime(lastTransit) {
  if (lastTransit?.trafficType !== 1) return null;

  const stationID = lastTransit.startID;
  const wayCodeRaw = lastTransit.wayCode ?? null;
  const wayCode =
    wayCodeRaw === 1 || wayCodeRaw === 2 ? wayCodeRaw : Number(wayCodeRaw);

  if (!stationID) return null;
  return await getSubwayLastTimeAtStation({ stationID, wayCode });
}

// 총 도보 시간 계산
function calcWalkTime(subPath) {
  const arr = Array.isArray(subPath) ? subPath : [];
  return arr
    .filter((sp) => sp.trafficType === 3)
    .reduce((sum, sp) => sum + Number(sp.sectionTime ?? 0), 0);
}

// 마지막 구간 탑승 가능 여부 체크
function checkLastLegCatchable({ lastLastTimeHHMM, minutesToLastBoard }) {
  // 막차 시간 정보가 없으면 "체크 불가" -> 일단 통과 처리 (경고만)
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

/* 
길찾기 후보 3개 가져오기
1) 후보 생성(최대 3개)
2) 지원 여부 판단 (도시간/미지원 교통수단 포함 여부)
3) 지원되는 후보만 막차 계산(첫 교통수단 + 마지막 구간 체크)
4) DTO(card/detail/tags)로 응답 형태 정리
5) 지원여부/최적 후보 마킹
*/
export async function getRouteCandidates({ origin, destination }) {
  const { ok, status, data } = await fetchPubTransPath({
    sx: origin.lng,
    sy: origin.lat,
    ex: destination.lng,
    ey: destination.lat,
  });

  // 1) HTTP 실패
  if (!ok) {
    throw new Error(
      `ODsay HTTP error: status=${status}, body=${JSON.stringify(data)}`
    );
  }

  // 2) ODsay API 에러 (HTTP 200이어도 여기로 올 수 있음)
  if (data?.error) {
    throw new Error(`ODsay API error: ${JSON.stringify(data.error)}`);
  }

  // 3) 기대한 result/path가 없으면 디버깅 에러
  if (!data?.result || !Array.isArray(data.result.path)) {
    throw new Error(`ODsay invalid response: ${JSON.stringify(data)}`);
  }

  const resultSearchType = data?.result?.searchType; // 0이면 도시내, 그 외는 도시 간
  const paths = data.result.path.slice(0, 3); // 최대 3개

  const candidates = await Promise.all(
    paths.map(async (p, idx) => {
      const info = p.info ?? {};
      const subPath = Array.isArray(p.subPath) ? p.subPath : [];

      const transfer_count = calcTransferCount(subPath);
      const bufferMinutes = BASE_BUFFER + TRANSFER_BUFFER * transfer_count;

      const tags = buildTransportTags(subPath);
      const walk_time = calcWalkTime(subPath);

      // ---- 지원 여부 체크 (도시간 / 미지원 교통수단 포함) ----
      const support = detectSupportForCandidate({
        resultSearchType,
        pathType: p?.pathType,
        subPath,
      });

      const baseCandidate = {
        candidate_key: `tmp_${Date.now()}_${idx}`,
        station_id: null,
        end_address: null,

        is_supported: support.is_supported,
        is_possible: false,
        is_optimal: false,
        reason: support.reason,
        message: support.message,

        tags,
        card: null,
        detail: null,
        warnings: [],
        // meta로 원본 일부 보관
        meta: {
          path_type: p?.pathType ?? null,
          subPath,
        },
      };

      // 디테일은 미지원이어도 항상 생성
      const detail = toRouteCandidateDetailDto({ subPath });
      baseCandidate.detail = detail;

      // 미지원이면 막차 계산 스킵 + 카드에 deadline null
      if (!support.is_supported) {
        baseCandidate.is_possible = false;
        baseCandidate.warnings.push("UNSUPPORTED_CANDIDATE");

        baseCandidate.card = toRouteCandidateCardDto({
          traveled_time: info.totalTime ?? null,
          transfer_count,
          public_transit_fare:
            info.payment ?? info.payment === 0 ? info.payment : null,
          walk_time,
          deadline_at: null,
          minutes_left: null,
        });

        return baseCandidate;
      }

      // ---------- 지원되는 후보만 막차 계산 ----------
      const firstTransit = pickFirstTransitLeg(subPath);
      const lastTransit = pickLastTransitLeg(subPath);

      let first_last_time = null;
      let deadline_at = null;
      let minutes_left = null;
      let is_possible = true;

      // 첫 대중교통 승차지점 startID (버스/지하철 공통)
      baseCandidate.station_id = firstTransit?.startID ?? null;

      // ---------- 1) 첫 교통수단 기준 deadline ----------
      // 지하철
      if (firstTransit?.trafficType === 1) {
        const stationID = firstTransit.startID;
        const wayCode = firstTransit.wayCode ?? null;

        if (stationID) {
          first_last_time = await getSubwayLastTimeAtStation({
            stationID,
            wayCode,
          });
        }
      } else if (firstTransit?.trafficType === 2) {
        const stationID = firstTransit.startID;
        const busNo = firstTransit?.lane?.[0]?.busNo ?? null;

        if (stationID && busNo) {
          first_last_time = await getBusLastTimeAtStation({ stationID, busNo });
        }
      }

      if (first_last_time) {
        const dl = computeDeadline({
          firstLastTimeHHMM: first_last_time,
          bufferMinutes,
        });
        deadline_at = dl.deadlineAt;
        minutes_left = dl.minutesLeft;
        is_possible = dl.isPossible;
      } else {
        // 막차를 못 구하면 일단 가능으로 두되 경고
        baseCandidate.warnings.push("FIRST_LAST_TIME_UNKNOWN");
        is_possible = true;
      }

      // ---------- 2) 마지막 구간 탑승 가능 여부 체크 ----------
      if (lastTransit) {
        const minutes_to_last_board = minutesUntilLegStarts(
          subPath,
          lastTransit
        );

        let last_last_time = null;

        if (lastTransit.trafficType === 1) {
          last_last_time = await getLastSubwayLastTime(lastTransit);
        } else if (lastTransit.trafficType === 2) {
          last_last_time = await getLastBusLastTime(lastTransit);
        }

        const lastCheck = checkLastLegCatchable({
          lastLastTimeHHMM: last_last_time,
          minutesToLastBoard: minutes_to_last_board,
        });

        if (lastCheck.reason) baseCandidate.warnings.push(lastCheck.reason);
        if (!lastCheck.passed) is_possible = false;
      }

      baseCandidate.is_possible = is_possible;

      baseCandidate.card = toRouteCandidateCardDto({
        traveled_time: info.totalTime ?? null,
        transfer_count,
        public_transit_fare:
          info.payment ?? info.payment === 0 ? info.payment : null,
        walk_time,
        deadline_at,
        minutes_left,
      });

      return baseCandidate;
    })
  );

  // 다시 전체 후보 지원여부를 통일된 방식으로 확정
  markSupportCandidates(candidates, { resultSearchType });

  // 최적 1개 선택
  markOptimalCandidate(candidates);

  return candidates;
}
