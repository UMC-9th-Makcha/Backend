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
 *                         end_address: "서울특별시 노원구 ..."
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
 *         example: "rt_iNR1QytQDnuycCITER-WDg"
 *     responses:
 *       200:
 *         description: 폴리라인 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 successCode: { type: string, example: "ROUTE-200-002" }
 *                 statusCode: { type: number, example: 200 }
 *                 message: { type: string, example: "폴리라인 조회 성공" }
 *                 result:
 *                   type: object
 *                   properties:
 *                     route_token: { type: string, example: "rt_iNR1QytQDnuycCITER-WDg" }
 *                     map_object:
 *                       type: string
 *                       description: ODsay loadLane 호출용 mapObject (디버그용)
 *                       example: "0:0@6:2:645:647"
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
 *                                 lat: { type: number, example: 37.617366 }
 *                                 lng: { type: number, example: 127.074854 }
 *                     boundary:
 *                       type: object
 *                       properties:
 *                         top: { type: number, example: 37.619884 }
 *                         left: { type: number, example: 127.074854 }
 *                         bottom: { type: number, example: 37.617366 }
 *                         right: { type: number, example: 127.091336 }
 *       400:
 *         description: route_token 형식 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: "COM-400-002" }
 *                 statusCode: { type: number, example: 400 }
 *                 message: { type: string, example: "route_token 형식이 올바르지 않습니다." }
 *                 result: { type: object, nullable: true }
 *             examples:
 *               invalid_token:
 *                 summary: 400 예시
 *                 value:
 *                   errorCode: "COM-400-002"
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
 *                 errorCode: { type: string, example: "ROUTE-404-001" }
 *                 statusCode: { type: number, example: 404 }
 *                 message: { type: string, example: "폴리라인 데이터를 찾을 수 없습니다." }
 *                 result: { type: object, nullable: true }
 *             examples:
 *               not_found:
 *                 summary: 404 예시
 *                 value:
 *                   errorCode: "ROUTE-404-001"
 *                   statusCode: 404
 *                   message: "폴리라인 데이터를 찾을 수 없습니다."
 *                   result: null
 *       410:
 *         description: route_token 만료
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errorCode: { type: string, example: "ROUTE-410-001" }
 *                 statusCode: { type: number, example: 410 }
 *                 message: { type: string, example: "route_token이 만료되었습니다." }
 *                 result: { type: object, nullable: true }
 *             examples:
 *               gone:
 *                 summary: 410 예시
 *                 value:
 *                   errorCode: "ROUTE-410-001"
 *                   statusCode: 410
 *                   message: "route_token이 만료되었습니다."
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

router.get("/polylines/:route_token", getRoutePolyline);

export default router;
