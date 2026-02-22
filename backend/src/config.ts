import * as path from 'path';
import * as fs from 'fs';

// Load .env file if present (dev only; production uses actual env vars)
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? '',
  corsOrigin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  // AI translation — set via environment variable; use a secrets manager in production
  groqApiKey: process.env.GROQ_API_KEY ?? '',
};

if (!config.databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}
