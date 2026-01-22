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
              message: { type: "string" },
              result: { type: "object" },
            },
          },
        },
      },
    },
  

  // routes 폴더의 Swagger 주석만 읽음
  apis: ["./src/routes/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
