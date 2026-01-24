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
            roadAddress: { type: "string", example: "서울 서초구 강남대로 375" },
            detailAddress: { type: "string", nullable: true, example: "2층" },
            placeId: { type: "string", example: "1234567890" },
            latitude: { type: "number", example: 37.497942 },
            longitude: { type: "number", example: 127.027621 },
            usedAt: { type: "string", format: "date-time", example: "2026-01-15T13:12:29.942Z" },
            createdAt: { type: "string", format: "date-time", example: "2026-01-15T13:07:43.477Z" },
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

        // 자주 가는 장소 생성 request
        MyPlaceCreateRequest: {
          type: "object",
          required: ["place_address", "latitude", "longitude"],
          properties: {
            provider_place_id: { type: "string", nullable: true, example: "123456" },
            place_address: { type: "string", example: "서울특별시 강남구 테헤란로 212" },
            place_detail_address: { type: "string", nullable: true, example: "12층" },
            latitude: { type: "number", example: 37.501274, minimum: -90, maximum: 90 },
            longitude: { type: "number", example: 127.039585, minimum: -180, maximum: 180 },
          },
        },

        // 자주 가는 장소 갱신 request
        MyPlaceUpdateRequest: {
          type: "object",
          description: "아래 필드 중 하나 이상 필수. 전달된 필드만 수정됨. place_type 수정 불가.",
          properties: {
            provider_place_id: { type: "string", nullable: true, example: "123456" },
            place_address: { type: "string", example: "서울특별시 강남구 테헤란로 212" },
            place_detail_address: { type: "string", nullable: true, example: "302호" },
            latitude: { type: "number", example: 37.501274, minimum: -90, maximum: 90 },
            longitude: { type: "number", example: 127.039585, minimum: -180, maximum: 180 },
          },
        },

        // 자주 가는 장소
        MyPlace: {
          type: "object",
          properties: {
            myplace_id: { type: "string", example: "4" },
            user_id: { type: "string", example: "2" },
            place_type: { type: "string", example: "PLACE", enum: ["PLACE", "HOME"] },
            provider_place_id: { type: "string", nullable: true, example: "123456" },
            place_address: { type: "string", example: "서울특별시 강남구 테헤란로 212" },
            place_detail_address: { type: "string", nullable: true, example: "12층" },
            latitude: { type: "number", example: 37.501274 },
            longitude: { type: "number", example: 127.039585 },
            created_at: { type: "string", format: "date-time", example: "2026-01-16T13:20:57.132Z" },
            updated_at: { type: "string", format: "date-time", example: "2026-01-16T13:36:45.783Z" },
          },
        },

        // 자주 가는 장소 생성 result
        MyPlaceCreateResult: {
          allOf: [
            { $ref: "#/components/schemas/MyPlace" },
            {
              type: "object",
              description: "생성 응답은 updated_at이 없을 수 있음",
              properties: {
                updated_at: { type: "string", format: "date-time", nullable: true },
              },
            },
          ],
        },

        // 자주 가는 장소 삭제 result
        MyPlaceDeleteResult: {
          type: "object",
          properties: {
            myplace_id: { type: "string", example: "4" },
          },
        },
      },
    },
  },
  

  // routes 폴더의 Swagger 주석만 읽음
  apis: ["./src/routes/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
