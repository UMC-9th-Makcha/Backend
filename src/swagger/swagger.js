import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Makcha Backend API",
      version: "1.0.0",
      description: "Makcha Backend API Documentation",
    },
    servers: [
      {
        url: "https://api.makcha.store",
        description: "Production server",
      },
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            successCode: { type: "string" },
            statusCode: { type: "number" },
            message: { type: "string" },
            result: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            errorCode: { type: "string" },
            message: { type: "string" },
            path: { type: "string" },
            result: { type: "object" },
          },
        },

        // 최근 목적지 조회 result
        RecentDestination: {
          type: "object",
          properties: {
            recentId: { type: "string", example: "4" },
            userId: { type: "string", example: "2" },
            title: { type: "string", example: "스타벅스 강남역점" },
            roadAddress: {
              type: "string",
              example: "서울 서초구 강남대로 375",
            },
            detailAddress: { type: "string", nullable: true, example: "2층" },
            placeId: { type: "string", example: "1234567890" },
            latitude: { type: "number", example: 37.497942 },
            longitude: { type: "number", example: 127.027621 },
            usedAt: {
              type: "string",
              format: "date-time",
              example: "2026-01-15T13:12:29.942Z",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2026-01-15T13:07:43.477Z",
            },
          },
        },
        RecentDestinationListResult: {
          type: "object",
          properties: {
            recentDestinations: {
              type: "array",
              items: { $ref: "#/components/schemas/RecentDestination" },
            },
          },
        },

        // 최근 목적지 삭제 result
        RecentDestinationDeleteResult: {
          type: "object",
          properties: {
            recentId: { type: "string", example: "5" },
          },
        },

        // myplaces 테이블 엔티티 (HOME/PLACE 공용)
        MyPlace: {
          type: "object",
          properties: {
            myplace_id: { type: "string", example: "4" },
            user_id: { type: "string", example: "2" },
            place_type: {
              type: "string",
              enum: ["PLACE", "HOME"],
              example: "PLACE",
            },
            provider_place_id: {
              type: "string",
              nullable: true,
              example: "123456",
            },
            place_address: {
              type: "string",
              example: "서울특별시 강남구 테헤란로 212",
            },
            place_detail_address: {
              type: "string",
              nullable: true,
              example: "12층",
            },
            latitude: {
              type: "number",
              example: 37.501274,
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: "number",
              example: 127.039585,
              minimum: -180,
              maximum: 180,
            },
            created_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-01-16T13:20:57.132Z",
            },
            updated_at: {
              type: "string",
              format: "date-time",
              nullable: true,
              example: "2026-01-16T13:36:45.783Z",
            },
          },
        },

        // PLACE 생성 request
        MyPlaceCreateRequest: {
          type: "object",
          required: ["place_address", "latitude", "longitude"],
          properties: {
            provider_place_id: {
              type: "string",
              nullable: true,
              example: "123456",
            },
            place_address: {
              type: "string",
              example: "서울특별시 강남구 테헤란로 212",
            },
            place_detail_address: {
              type: "string",
              nullable: true,
              example: "12층",
            },
            latitude: {
              type: "number",
              example: 37.501274,
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: "number",
              example: 127.039585,
              minimum: -180,
              maximum: 180,
            },
          },
        },

        // PLACE 수정 request (부분 갱신)
        MyPlaceUpdateRequest: {
          type: "object",
          description:
            "아래 필드 중 하나 이상 필수. 전달된 필드만 수정됨. place_type 수정 불가.",
          properties: {
            provider_place_id: {
              type: "string",
              nullable: true,
              example: "123456",
            },
            place_address: {
              type: "string",
              example: "서울특별시 강남구 테헤란로 212",
            },
            place_detail_address: {
              type: "string",
              nullable: true,
              example: "302호",
            },
            latitude: {
              type: "number",
              example: 37.501274,
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: "number",
              example: 127.039585,
              minimum: -180,
              maximum: 180,
            },
          },
        },

        // HOME upsert request
        HomeUpsertRequest: {
          type: "object",
          required: ["place_address", "latitude", "longitude"],
          properties: {
            provider_place_id: {
              type: "string",
              nullable: true,
              example: "123",
            },
            place_address: { type: "string", example: "서울시 ..." },
            place_detail_address: {
              type: "string",
              nullable: true,
              example: "101동",
            },
            latitude: {
              type: "number",
              example: 37.5665,
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: "number",
              example: 126.978,
              minimum: -180,
              maximum: 180,
            },
          },
        },

        // CREATE result (PLACE 생성)
        MyPlaceCreateResult: {
          $ref: "#/components/schemas/MyPlace",
        },

        // HOME result
        HomeResult: {
          $ref: "#/components/schemas/MyPlace",
        },

        // DELETE result (PLACE 삭제)
        MyPlaceDeleteResult: {
          type: "object",
          properties: {
            myplace_id: { type: "string", example: "4" },
          },
        },

        // 내 장소 조회 result (HOME 1개 + PLACE 리스트)
        MyPlacesGetResult: {
          type: "object",
          properties: {
            home: { $ref: "#/components/schemas/MyPlace", nullable: true },
            places: {
              type: "array",
              items: { $ref: "#/components/schemas/MyPlace" },
            },
          },
        },



        // 내 정보 조회 result
        MyInfoResult: {
          type: "object",
          properties: {
            userId: { type: "string", example: "2" },
            name: { type: "string", example: "서막차" },
            email: { type: "string", example: "makcha@kakao.com" },
            phone: {
              type: "string",
              example: "01012345678",
              description: "전화번호. 없으면 빈 문자열",
            },
          },
        },

        // 내 정보 수정 request
        UpdateMyPhoneRequest: {
          type: "object",
          required: ["phone"],
          properties: {
            phone: {
              type: "string",
              example: "010-1234-5678",
              description: "숫자 외 문자 제거 후 10~11자리만 허용",
            },
          },
        },

        // 세이브 리포트 차트 아이템
        SaveReportChartItem: {
          type: "object",
          properties: {
            month: {
              type: "string",
              example: "2025-12",
              description: "YYYY-MM",
            },
            savedAmount: {
              type: "number",
              example: 45000,
              description: "누적 절약 금액(원)",
            },
            totalCount: {
              type: "number",
              example: 9,
              description: "절약 기록 건수",
            },
            highlight: {
              type: "boolean",
              example: true,
              description: "선택 월 여부",
            },
          },
        },

        // 세이브 리포트 아이템 (상세 내역)
        SaveReportItem: {
          type: "object",
          properties: {
            notificationHistoryId: { type: "string", example: "2" },
            originName: { type: "string", example: "홍대입구" },
            destinationName: { type: "string", example: "잠실" },
            departureDatetime: {
              type: "string",
              format: "date-time",
              example: "2025-12-18T18:05:00.000Z",
            },
            arrivalDatetime: {
              type: "string",
              format: "date-time",
              example: "2025-12-18T18:55:00.000Z",
            },
            savedFareWon: { type: "number", example: 2300 },
          },
        },

        // 세이브 리포트 result
        SaveReportResult: {
          type: "object",
          properties: {
            selectedMonth: {
              type: "string",
              example: "2025-12",
              description: "YYYY-MM",
            },
            range: {
              type: "object",
              properties: {
                from: {
                  type: "string",
                  example: "2025-11",
                  description: "YYYY-MM",
                },
                to: {
                  type: "string",
                  example: "2026-01",
                  description: "YYYY-MM",
                },
              },
            },
            chart: {
              type: "array",
              items: { $ref: "#/components/schemas/SaveReportChartItem" },
            },
            items: {
              type: "array",
              description:
                "highlight=true(선택 월)에 해당하는 상세 리스트만 제공",
              items: { $ref: "#/components/schemas/SaveReportItem" },
            },
          },
        },
        RouteCandidatesRequest: {
          type: "object",
          required: ["origin", "destination"],
          properties: {
            origin: {
              type: "object",
              required: ["lat", "lng"],
              properties: {
                lat: { type: "number", example: 37.6175836 },
                lng: { type: "number", example: 127.0760294 },
              },
            },
            destination: {
              type: "object",
              required: ["lat", "lng"],
              properties: {
                lat: { type: "number", example: 37.6260506 },
                lng: { type: "number", example: 127.0937494 },
              },
            },
          },
        },

        RouteCandidatesResponse: {
          type: "object",
          properties: {
            successCode: { type: "string", example: "ROUTE-200-001" },
            statusCode: { type: "number", example: 200 },
            message: { type: "string", example: "후보 경로 조회 성공" },
            result: { $ref: "#/components/schemas/RouteCandidatesResult" },
          },
        },

        RouteCandidatesResult: {
          type: "object",
          properties: {
            candidates: {
              type: "array",
              items: { $ref: "#/components/schemas/RouteCandidate" },
            },
          },
        },

        RouteCandidate: {
          type: "object",
          properties: {
            candidate_key: { type: "string", example: "tmp_1769239744553_6" },
            route_token: {
              type: "string",
              nullable: true,
              example: "rt_iNR1QytQDnuycCITER-WDg",
              description:
                "폴리라인/알림 확정용 토큰 (picked에 대해서만 발급, TTL 30분)",
            },
            station_id: { type: "number", nullable: true, example: 645 },
            is_supported: { type: "boolean", example: true },
            is_possible: { type: "boolean", example: true },
            is_optimal: { type: "boolean", example: true },
            reason: {
              type: "string",
              nullable: true,
              example: "FIRST_LEG_LAST_TIME_UNKNOWN",
            },
            message: {
              type: "string",
              nullable: true,
              example: "첫 구간 막차 정보를 알 수 없습니다.",
            },
            tags: {
              type: "array",
              items: { type: "string", enum: ["SUBWAY", "BUS"] },
              example: ["SUBWAY"],
            },
            card: { $ref: "#/components/schemas/RouteCandidateCard" },
            detail: { $ref: "#/components/schemas/RouteCandidateDetail" },
            warnings: {
              type: "array",
              items: { type: "string" },
              example: [],
            },
          },
        },

        RouteCandidateCard: {
          type: "object",
          properties: {
            traveled_time: { type: "number", example: 21 },
            transfer_count: { type: "number", example: 0 },
            public_transit_fare: {
              type: "number",
              nullable: true,
              example: 1550,
            },
            walk_time: { type: "number", example: 17 },
            deadline_at: {
              type: "string",
              nullable: true,
              example: "2026-01-28T14:31:00.000Z",
            },
            minutes_left: { type: "number", nullable: true, example: 1142 },
          },
        },

        RouteCandidateDetail: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: { $ref: "#/components/schemas/RouteCandidateStep" },
            },
          },
        },

        RouteCandidateStep: {
          type: "object",
          properties: {
            type: { type: "string", example: "SUBWAY_6" },
            points: {
              type: "array",
              items: { $ref: "#/components/schemas/RouteCandidatePoint" },
            },
            section_time: { type: "number", example: 2 },
            distance: { type: "number", example: 107 },
            station_count: { type: "number", nullable: true, example: 4 },
            from: { $ref: "#/components/schemas/RouteCandidatePlace" },
            to: { $ref: "#/components/schemas/RouteCandidatePlace" },
            bus_numbers: {
              type: "array",
              nullable: true,
              items: { type: "string" },
              example: ["1132"],
            },
            bus_types: {
              type: "array",
              nullable: true,
              items: { type: "number" },
              example: [12],
            },
            subway_lines: {
              type: "array",
              nullable: true,
              items: { type: "string" },
              example: ["수도권 6호선"],
            },
            way: {
              type: "string",
              nullable: true,
              example: "봉화산(서울의료원)",
            },
            way_code: { type: "number", nullable: true, example: 2 },
            subway_type: { type: "number", nullable: true, example: 6 },
          },
        },

        RouteCandidatePoint: {
          type: "object",
          properties: {
            lat: { type: "number", example: 37.6175836 },
            lng: { type: "number", example: 127.0760294 },
          },
        },

        RouteCandidatePlace: {
          type: "object",
          nullable: true,
          properties: {
            name: { type: "string", example: "태릉입구" },
            lat: { type: "number", example: 37.617357 },
            lng: { type: "number", example: 127.074854 },
            id: { type: "number", example: 645 },
          },
        },

        RoutePolylineResponse: {
          type: "object",
          properties: {
            successCode: { type: "string", example: "ROUTE-200-002" },
            statusCode: { type: "number", example: 200 },
            message: { type: "string", example: "폴리라인 조회 성공" },
            result: { $ref: "#/components/schemas/RoutePolylineResult" },
          },
        },

        RoutePolylineResult: {
          type: "object",
          properties: {
            route_token: {
              type: "string",
              example: "rt_iNR1QytQDnuycCITER-WDg",
            },
            map_object: {
              type: "string",
              description: "ODsay loadLane 호출용 mapObject(디버그용)",
              example: "0:0@6:2:645:647",
            },
            paths: {
              type: "array",
              items: { $ref: "#/components/schemas/RoutePolylinePath" },
            },
            boundary: {
              type: "object",
              properties: {
                top: { type: "number", example: 37.619884 },
                left: { type: "number", example: 127.074854 },
                bottom: { type: "number", example: 37.617366 },
                right: { type: "number", example: 127.091336 },
              },
            },
          },
        },

        RoutePolylinePath: {
          type: "object",
          description: "지도에 그릴 경로 구간(polyline)",
          properties: {
            class: {
              type: "number",
              description: "ODsay loadLane 기준 (1=버스, 2=지하철) WALK는 0",
              example: 2,
            },
            type: {
              type: "number",
              description: "ODsay 노선 타입 코드 WALK는 0",
              example: 6,
            },
            map_type: {
              type: "string",
              description: "구간 타입 (프론트 스타일링 기준)",
              example: "SUBWAY_6",
            },
            order: {
              type: "number",
              nullable: true,
              description: `
(선택) 경로 순서 힌트.
- candidates detail.steps index 기반
- WALK 구간에 한해 제공될 수 있음
- paths 배열의 순서를 보장하지는 않음
      `.trim(),
              example: 0,
            },
            points: {
              type: "array",
              description: "polyline 좌표 배열",
              items: { $ref: "#/components/schemas/RouteCandidatePoint" },
            },
          },
        },
      },
    },
  },

  // routes 폴더의 Swagger 주석만 읽음
  apis: ["./src/routes/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
