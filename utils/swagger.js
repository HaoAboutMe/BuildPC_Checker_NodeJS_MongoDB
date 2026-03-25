const swaggerJSDoc = require("swagger-jsdoc");

const port = process.env.PORT || 3000;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BuildPC Checker API",
      version: "1.0.0",
      description: "API Documentation for BuildPC Checker NodeJS & MongoDB",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Development server",
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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: "Auth", description: "Authentication management" },
      { name: "User", description: "User profile and management" },
      { name: "Role", description: "Role management (Admin only)" },
      { name: "File", description: "File upload management" },
      {
        name: "Support Entities",
        description: "PC Component support entities",
      },
      { name: "PC Components", description: "PC hardware components" },
      { name: "Builds", description: "PC Build compatibility and optimization" },
    ],
  },
  apis: ["./routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
