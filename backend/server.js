import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`[SERVER] Express Backend running on http://localhost:${PORT}`);
  console.log(`[DOCS] Swagger API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`[DOCS] OpenAPI Spec JSON: http://localhost:${PORT}/api/openapi.json`);
  console.log(`[STATUS] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[STATUS] Integrations status: http://localhost:${PORT}/api/integrations/status`);
});

export default server;
