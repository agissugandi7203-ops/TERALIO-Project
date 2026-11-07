import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Express Backend running on http://localhost:${PORT}`);
  console.log(`📌 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📌 Supabase status: http://localhost:${PORT}/api/supabase-status`);
});

export default server;
