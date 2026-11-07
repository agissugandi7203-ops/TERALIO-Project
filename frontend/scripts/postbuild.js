import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[postbuild] dist/index.html not found, skipping SPA fallback generation.');
  process.exit(0);
}

const indexContent = fs.readFileSync(indexPath, 'utf-8');

const spaRoutes = [
  '404.html',
  'auth/callback/index.html',
  'login/index.html',
  'signup/index.html',
  'dashboard/index.html',
  'schedule/index.html',
  'visit-schedule/index.html',
];

for (const route of spaRoutes) {
  const targetPath = path.join(distDir, route);
  const targetDir = path.dirname(targetPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(targetPath, indexContent, 'utf-8');
  console.log(`[postbuild] Generated SPA fallback: ${route}`);
}

console.log('[postbuild] Successfully generated all SPA fallback files.');
