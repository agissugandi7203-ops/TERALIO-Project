import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 Express Backend running on http://localhost:${PORT}`);
  console.log(`📌 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📌 Integrations status: http://localhost:${PORT}/api/integrations/status`);
});

export default server;
