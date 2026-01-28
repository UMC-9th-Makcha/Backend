import { Router } from "express";
import { postRouteCandidates } from "../controllers/routeCandidate.controller.js";
import { getRoutePolyline } from "../controllers/routePolyline.controller.js";

const router = Router();

/**
 * @swagger
 * /api/routes/candidates:
 *   post:
 *     tags: [Routes]
 *     summary: 경로 후보 조회
 *     description: |
 *       출발지(origin)와 도착지(destination) 좌표를 기반으로
 *       대중교통 경로 후보를 최대 3개 반환합니다.
 *
 *       - 미지원 경로는 candidates에서 제거됩니다.
 *       - first_last_time(첫 대중교통 막차)이 없으면 is_possible=false 입니다.
 *       - route_token은 최종 picked(최대 3개)에 대해서만 발급되며 TTL은 30분입니다.
 *       - 버스 step은 타입에 따라 BUS_GREEN/BUS_RED/BUS_BLUE/BUS_SKY/BUS_ORANGE 로 내려갑니다.
 *       - 버스 lane이 여러 개인 경우, 해당 구간에서 "막차가 가장 늦은 버스"의 타입 색상으로 step.type을 결정합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [origin, destination]
 *             properties:
 *               origin:
 *                 type: object
 *                 required: [lat, lng]
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 37.6175836
 *                   lng:
 *                     type: number
 *                     example: 127.0760294
 *               destination:
 *                 type: object
 *                 required: [lat, lng]
 *                 properties:
 *                   lat:
 *                     type: number
 *                     example: 37.6260506
 *                   lng:
 *                     type: number
 *                     example: 127.0937494
 *     responses:
 *       200:
 *         description: 후보 경로 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 successCode:
 *                   type: string
 *                   example: ROUTE-200-001
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 후보 경로 조회 성공
 *                 result:
 *                   type: object
 *                   properties:
 *                     candidates:
 *                       type: array
 *                       description: 경로 후보 목록 (최대 3개)
 *                       items:
 *                         type: object
 *                         properties:
 *                           candidate_key:
 *                             type: string
 *                             example: tmp_1769239744553_6
 *                           route_token:
 *                             type: string
 *                             nullable: true
 *                             description: 폴리라인/알림 확정용 토큰 (picked에 대해서만 발급, TTL 30분)
 *                             example: rt_iNR1QytQDnuycCITER-WDg
 *                           station_id:
 *                             type: number
 *                             nullable: true
 *                             description: 첫 대중교통(지하철/버스) 승차 지점 ID(ODsay stationID)
 *                             example: 645
 *                           end_address:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           is_supported:
 *                             type: boolean
 *                             example: true
 *                           is_possible:
 *                             type: boolean
 *                             description: 현재 시점 기준 탑승 가능 여부 (막차 정보 없으면 false)
 *                             example: true
 *                           is_optimal:
 *                             type: boolean
 *                             description: 후보 중 최적 경로 여부
 *                             example: true
 *                           reason:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           message:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           tags:
 *                             type: array
 *                             description: 경로에 포함된 교통수단 태그
 *                             items:
 *                               type: string
 *                               enum: [SUBWAY, BUS]
 *                             example: ["SUBWAY"]
 *                           card:
 *                             type: object
 *                             properties:
 *                               traveled_time:
 *                                 type: number
 *                                 description: 총 소요 시간(분)
 *                                 example: 21
 *                               transfer_count:
 *                                 type: number
 *                                 description: 환승 횟수
 *                                 example: 0
 *                               public_transit_fare:
 *                                 type: number
 *                                 nullable: true
 *                                 description: 대중교통 요금
 *                                 example: 1550
 *                               walk_time:
 *                                 type: number
 *                                 description: 총 도보 시간(분)
 *                                 example: 17
 *                               deadline_at:
 *                                 type: string
 *                                 nullable: true
 *                                 description: 출발 마감 시각(UTC ISO8601, 예: ...Z)
 *                                 example: 2026-01-28T14:31:00.000Z
 *                               minutes_left:
 *                                 type: number
 *                                 nullable: true
 *                                 description: 출발 마감까지 남은 시간(분)
 *                                 example: 1142
 *                           detail:
 *                             type: object
 *                             properties:
 *                               steps:
 *                                 type: array
 *                                 description: 상세 경로 step 목록
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     type:
 *                                       type: string
 *                                       description: |
 *                                         경로 step 타입 (프론트 렌더링용 map_type).
 *
 *                                         - WALK : 도보
 *                                         - BUS_{COLOR} : 버스 색상 타입
 *                                           - BUS_GREEN / BUS_BLUE / BUS_RED / BUS_SKY / BUS_ORANGE
 *                                         - SUBWAY_{type} : 지하철 노선 타입
 *                                           - type은 ODsay 지하철 노선 타입 코드(숫자)
 *                                           - 예: SUBWAY_1, SUBWAY_2, SUBWAY_6, SUBWAY_9
 *                                       example: SUBWAY_6
 *                                     points:
 *                                       type: array
 *                                       description: 경로 좌표 목록
 *                                       items:
 *                                         type: object
 *                                         properties:
 *                                           lat:
 *                                             type: number
 *                                             example: 37.6175836
 *                                           lng:
 *                                             type: number
 *                                             example: 127.0760294
 *                                     section_time:
 *                                       type: number
 *                                       description: 해당 구간 소요시간(분)
 *                                       example: 2
 *                                     distance:
 *                                       type: number
 *                                       description: 해당 구간 거리(m)
 *                                       example: 107
 *                                     station_count:
 *                                       type: number
 *                                       nullable: true
 *                                       description: 정거장/역 개수 (대중교통 구간만)
 *                                       example: 4
 *                                     from:
 *                                       type: object
 *                                       nullable: true
 *                                       description: 승차 지점 (대중교통 구간만)
 *                                       properties:
 *                                         name: { type: string, example: 태릉입구 }
 *                                         lat: { type: number, example: 37.617357 }
 *                                         lng: { type: number, example: 127.074854 }
 *                                         id: { type: number, example: 645 }
 *                                     to:
 *                                       type: object
 *                                       nullable: true
 *                                       description: 하차 지점 (대중교통 구간만)
 *                                       properties:
 *                                         name: { type: string, example: 봉화산(서울의료원) }
 *                                         lat: { type: number, example: 37.617368 }
 *                                         lng: { type: number, example: 127.091324 }
 *                                         id: { type: number, example: 647 }
 *                                     bus_numbers:
 *                                       type: array
 *                                       nullable: true
 *                                       description: 버스 번호 목록 (버스 구간만)
 *                                       items:
 *                                         type: string
 *                                       example: ["1132"]
 *                                     bus_types:
 *                                       type: array
 *                                       nullable: true
 *                                       description: 버스 타입 코드 목록 (버스 구간만)
 *                                       items:
 *                                         type: number
 *                                       example: [12]
 *                                     subway_lines:
 *                                       type: array
 *                                       nullable: true
 *                                       description: 지하철 노선명 목록 (지하철 구간만)
 *                                       items:
 *                                         type: string
 *                                       example: ["수도권 6호선"]
 *                                     way:
 *                                       type: string
 *                                       nullable: true
 *                                       description: 진행 방향(종착역명 등, 지하철 구간만)
 *                                       example: 봉화산(서울의료원)
 *                                     way_code:
 *                                       type: number
 *                                       nullable: true
 *                                       description: 방향 코드 (지하철 구간만)
 *                                       example: 2
 *                                     subway_type:
 *                                       type: number
 *                                       nullable: true
 *                                       description: 지하철 타입 코드 (ODsay)
 *                                       example: null
 *                           warnings:
 *                             type: array
 *                             description: 판단 불가/주의 사유 코드 목록 (예: FIRST_LEG_LAST_TIME_UNKNOWN, LAST_LEG_LAST_TIME_INVALID 등)
 *                             items:
 *                               type: string
 *                             example: []
 *       400:
 *         description: 필수 파라미터 누락/형식 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: COM-400-001 }
 *                 statusCode: { type: number, example: 400 }
 *                 message: { type: string, example: 요청 파라미터가 올바르지 않습니다. }
 *                 result:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: 서버 내부 오류 또는 외부 API 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: COM-500-001 }
 *                 statusCode: { type: number, example: 500 }
 *                 message: { type: string, example: 서버 내부 오류가 발생했습니다. }
 *                 result:
 *                   type: object
 *                   nullable: true
 *                   example: null
 */

router.post("/candidates", postRouteCandidates);

/**
 * @swagger
 * /api/routes/polylines/{route_token}:
 *   get:
 *     tags: [Routes]
 *     summary: 경로 폴리라인 조회
 *     description: |
 *       후보 경로 조회 시 발급된 route_token으로
 *       지도에 표시할 폴리라인 좌표를 반환합니다.
 *
 *       - route_token의 TTL은 30분이며 만료 시 410(Gone)을 반환합니다.
 *       - class/type은 "노선 그래픽 API(loadLane)" 기준입니다.
 *         (candidates의 trafficType과 번호 체계가 다릅니다)
 *     parameters:
 *       - name: route_token
 *         in: path
 *         required: true
 *         description: 후보 경로 조회 API에서 발급된 route_token
 *         schema:
 *           type: string
 *         example: rt_iNR1QytQDnuycCITER-WDg
 *     responses:
 *       200:
 *         description: 폴리라인 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 successCode:
 *                   type: string
 *                   example: ROUTE-200-002
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 폴리라인 조회 성공
 *                 result:
 *                   type: object
 *                   properties:
 *                     route_token:
 *                       type: string
 *                       example: rt_iNR1QytQDnuycCITER-WDg
 *                     map_object:
 *                       type: string
 *                       description: ODsay loadLane 호출용 mapObject (디버그용)
 *                       example: 0:0@6:2:645:647
 *                     paths:
 *                       type: array
 *                       description: 노선별 polyline 정보
 *                       items:
 *                         type: object
 *                         properties:
 *                           class:
 *                             type: number
 *                             description: 노선 그래픽 API(loadLane) 기준 (1=버스노선, 2=지하철노선)
 *                             enum: [1, 2]
 *                             example: 2
 *                           type:
 *                             type: number
 *                             description: 노선 종류 코드 (ODsay 문서 하단의 버스/지하철 노선 타입 표 참조)
 *                             example: 6
 *                           points:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 lat:
 *                                   type: number
 *                                   example: 37.617366
 *                                 lng:
 *                                   type: number
 *                                   example: 127.074854
 *                     boundary:
 *                       type: object
 *                       properties:
 *                         top:
 *                           type: number
 *                           example: 37.619884
 *                         left:
 *                           type: number
 *                           example: 127.074854
 *                         bottom:
 *                           type: number
 *                           example: 37.617366
 *                         right:
 *                           type: number
 *                           example: 127.091336
 *       400:
 *         description: route_token 형식 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: COM-400-002 }
 *                 statusCode: { type: number, example: 400 }
 *                 message: { type: string, example: route_token 형식이 올바르지 않습니다. }
 *                 result:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       404:
 *         description: 폴리라인 데이터 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: ROUTE-404-001 }
 *                 statusCode: { type: number, example: 404 }
 *                 message: { type: string, example: 폴리라인 데이터를 찾을 수 없습니다. }
 *                 result:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       410:
 *         description: route_token 만료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: ROUTE-410-001 }
 *                 statusCode: { type: number, example: 410 }
 *                 message: { type: string, example: route_token이 만료되었습니다. }
 *                 result:
 *                   type: object
 *                   nullable: true
 *                   example: null
 *       500:
 *         description: 서버 내부 오류 또는 외부 API 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: COM-500-001 }
 *                 statusCode: { type: number, example: 500 }
 *                 message: { type: string, example: 서버 내부 오류가 발생했습니다. }
 *                 result:
 *                   type: object
 *                   nullable: true
 *                   example: null
 */

router.get("/polylines/:route_token", getRoutePolyline);

export default router;
