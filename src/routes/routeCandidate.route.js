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
 *             $ref: "#/components/schemas/RouteCandidatesRequest"
 *     responses:
 *       200:
 *         description: 후보 경로 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RouteCandidatesResponse"
 *             examples:
 *               success:
 *                 summary: 성공 예시
 *                 value:
 *                   successCode: "ROUTE-200-001"
 *                   statusCode: 200
 *                   message: "후보 경로 조회 성공"
 *                   result:
 *                     candidates:
 *                       - candidate_key: "tmp_1769239744553_6"
 *                         route_token: "rt_iNR1QytQDnuycCITER-WDg"
 *                         station_id: 645
 *                         is_supported: true
 *                         is_possible: true
 *                         is_optimal: true
 *                         reason: null
 *                         message: null
 *                         tags: ["SUBWAY"]
 *                         card:
 *                           traveled_time: 21
 *                           transfer_count: 0
 *                           public_transit_fare: 1550
 *                           walk_time: 17
 *                           deadline_at: "2026-01-28T14:31:00.000Z"
 *                           minutes_left: 1142
 *                         detail:
 *                           steps:
 *                             - type: "WALK"
 *                               points:
 *                                 - { lat: 37.6175836, lng: 127.0760294 }
 *                                 - { lat: 37.617357, lng: 127.074854 }
 *                               section_time: 2
 *                               distance: 107
 *                               station_count: null
 *                               from: null
 *                               to: null
 *                               bus_numbers: null
 *                               bus_types: null
 *                               subway_lines: null
 *                               way: null
 *                               way_code: null
 *                               subway_type: null
 *                             - type: "SUBWAY_6"
 *                               points:
 *                                 - { lat: 37.617357, lng: 127.074854 }
 *                                 - { lat: 37.617368, lng: 127.091324 }
 *                               section_time: 7
 *                               distance: 0
 *                               station_count: 4
 *                               from: { name: "태릉입구", lat: 37.617357, lng: 127.074854, id: 645 }
 *                               to: { name: "봉화산(서울의료원)", lat: 37.617368, lng: 127.091324, id: 647 }
 *                               bus_numbers: null
 *                               bus_types: null
 *                               subway_lines: ["수도권 6호선"]
 *                               way: "봉화산(서울의료원)"
 *                               way_code: 2
 *                               subway_type: 6
 *                         warnings: []
 *       400:
 *         description: 필수 파라미터 누락/형식 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: "COM-400-001" }
 *                 statusCode: { type: number, example: 400 }
 *                 message: { type: string, example: "요청 파라미터가 올바르지 않습니다." }
 *                 result: { type: object, nullable: true }
 *             examples:
 *               bad_request:
 *                 summary: 400 예시
 *                 value:
 *                   errorCode: "COM-400-001"
 *                   statusCode: 400
 *                   message: "요청 파라미터가 올바르지 않습니다."
 *                   result: null
 *       500:
 *         description: 서버 내부 오류 또는 외부 API 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: "COM-500-001" }
 *                 statusCode: { type: number, example: 500 }
 *                 message: { type: string, example: "서버 내부 오류가 발생했습니다." }
 *                 result: { type: object, nullable: true }
 *             examples:
 *               server_error:
 *                 summary: 500 예시
 *                 value:
 *                   errorCode: "COM-500-001"
 *                   statusCode: 500
 *                   message: "서버 내부 오류가 발생했습니다."
 *                   result: null
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
 *       - route_token의 TTL은 30분이며 만료/없음이면 410(Gone)을 반환합니다. (MAP-410-001)
 *       - 토큰은 있으나 mapObject가 없으면 410(Gone)을 반환합니다. (MAP-410-002)
 *       - mapObject가 유효하지 않거나 ODsay가 -8(mapObject 형식 오류)을 반환하면 422를 반환합니다. (MAP-422-001)
 *       - class/type은 "노선 그래픽 API(loadLane)" 기준입니다.
 *         (candidates의 trafficType과 번호 체계가 다릅니다)
 *     parameters:
 *       - name: route_token
 *         in: path
 *         required: true
 *         description: 후보 경로 조회 API에서 발급된 route_token
 *         schema:
 *           type: string
 *         example: "rt_iNR1QytQDnuycCITER-WDg"
 *     responses:
 *       200:
 *         description: 폴리라인 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RoutePolylineResponse"
 *       400:
 *         description: route_token 형식 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: "COM-400-001" }
 *                 statusCode: { type: number, example: 400 }
 *                 message: { type: string, example: "route_token 형식이 올바르지 않습니다." }
 *                 result: { type: object, nullable: true }
 *             examples:
 *               invalid_token:
 *                 summary: 400 예시
 *                 value:
 *                   errorCode: "COM-400-001"
 *                   statusCode: 400
 *                   message: "route_token 형식이 올바르지 않습니다."
 *                   result: null
 *       404:
 *         description: 폴리라인 데이터 없음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: "MAP-404-003" }
 *                 statusCode: { type: number, example: 404 }
 *                 message: { type: string, example: "폴리라인 데이터를 찾을 수 없습니다." }
 *                 result: { type: object, nullable: true }
 *             examples:
 *               not_found:
 *                 summary: 404 예시
 *                 value:
 *                   errorCode: "MAP-404-003"
 *                   statusCode: 404
 *                   message: "폴리라인 데이터를 찾을 수 없습니다."
 *                   result: null
 *       410:
 *         description: route_token 만료/무효(없음 또는 mapObject 없음)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     errorCode: { type: string, example: "MAP-410-001" }
 *                     statusCode: { type: number, example: 410 }
 *                     message: { type: string, example: "경로 토큰이 만료되었거나 존재하지 않습니다." }
 *                     result: { type: object, nullable: true, example: null }
 *                 - type: object
 *                   properties:
 *                     errorCode: { type: string, example: "MAP-410-002" }
 *                     statusCode: { type: number, example: 410 }
 *                     message: { type: string, example: "mapObject가 없어 폴리라인을 생성할 수 없습니다. 경로를 다시 조회해주세요." }
 *                     result:
 *                       type: object
 *                       nullable: true
 *                       example: { reason: "MAP_OBJECT_NOT_FOUND" }
 *             examples:
 *               token_gone:
 *                 summary: 410(토큰 만료/없음) 예시
 *                 value:
 *                   errorCode: "MAP-410-001"
 *                   statusCode: 410
 *                   message: "경로 토큰이 만료되었거나 존재하지 않습니다."
 *                   result: null
 *               token_data_invalid:
 *                 summary: 410(mapObject 없음) 예시
 *                 value:
 *                   errorCode: "MAP-410-002"
 *                   statusCode: 410
 *                   message: "mapObject가 없어 폴리라인을 생성할 수 없습니다. 경로를 다시 조회해주세요."
 *                   result:
 *                     reason: "MAP_OBJECT_NOT_FOUND"
 *       422:
 *         description: mapObject invalid(ODsay -8 포함) — 재시도 대신 candidates 재조회 필요
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: "MAP-422-001" }
 *                 statusCode: { type: number, example: 422 }
 *                 message: { type: string, example: "경로 폴리라인을 조회할 수 없습니다. 다시 경로를 조회해주세요." }
 *                 result:
 *                   type: object
 *                   nullable: true
 *                   example: { reason: "MAP_OBJECT_INVALID" }
 *             examples:
 *               invalid_mapobject:
 *                 summary: 422 예시
 *                 value:
 *                   errorCode: "MAP-422-001"
 *                   statusCode: 422
 *                   message: "경로 폴리라인을 조회할 수 없습니다. 다시 경로를 조회해주세요."
 *                   result:
 *                     reason: "MAP_OBJECT_INVALID"
 *       502:
 *         description: ODsay upstream 장애
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: "COM-500-001" }
 *                 statusCode: { type: number, example: 502 }
 *                 message: { type: string, example: "ODsay loadLane upstream 오류" }
 *                 result: { type: object, nullable: true }
 *             examples:
 *               upstream_error:
 *                 summary: 502 예시
 *                 value:
 *                   errorCode: "COM-500-001"
 *                   statusCode: 502
 *                   message: "ODsay loadLane upstream 오류"
 *                   result:
 *                     status: 502
 */

router.get("/polylines/:route_token", getRoutePolyline);

export default router;
