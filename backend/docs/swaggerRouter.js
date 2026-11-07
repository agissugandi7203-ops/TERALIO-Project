import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swaggerSpec.js';

const docsRouter = Router();

// Endpoint untuk mengambil raw JSON spesifikasi OpenAPI 3.0
docsRouter.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.json(swaggerSpec);
});

docsRouter.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return res.json(swaggerSpec);
});

const swaggerUiOptions = {
  customSiteTitle: 'Teralio API Documentation',
  customCss: `
    .swagger-ui .topbar {
      background-color: #0f172a;
      border-bottom: 2px solid #2563eb;
    }
    .swagger-ui .topbar .topbar-wrapper .link {
      display: flex;
      align-items: center;
      font-weight: 700;
      color: #ffffff;
      font-size: 1.1rem;
    }
    .swagger-ui .info {
      margin: 28px 0 20px 0;
    }
    .swagger-ui .info .title {
      font-family: system-ui, -apple-system, sans-serif;
      color: #0f172a;
      font-weight: 750;
    }
    .swagger-ui .opblock.opblock-get {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }
    .swagger-ui .opblock.opblock-post {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }
    .swagger-ui .btn.authorize {
      color: #2563eb;
      border-color: #2563eb;
    }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
  },
};

// Render Swagger UI di root dari sub-router
docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

export { docsRouter, swaggerSpec };
export default docsRouter;
