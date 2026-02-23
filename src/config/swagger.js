

const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FinTrack API",
      version: "1.0.0",
      description: "Expense Tracking API with JWT Cookie Authentication",
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production"
          ? "https://fintrack-backend-8rrh.onrender.com"
          : "http://localhost:5001",
        description: "API Server"
      }
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsDoc(options);