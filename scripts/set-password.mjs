#!/usr/bin/env node
/**
 * Usage: node scripts/set-password.mjs <new-password>
 *
 * Generates a bcrypt hash and prints the line to paste into .env
 */
import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/set-password.mjs <new-password>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

// Try to find bcrypt in node_modules
let bcrypt;
try {
  bcrypt = require(path.resolve(__dirname, '../node_modules/bcrypt'));
} catch {
  console.error('bcrypt not found. Run: npm install from the repo root.');
  process.exit(1);
}

bcrypt.hash(password, 12, (err, hash) => {
  if (err) { console.error(err.message); process.exit(1); }

  console.log('\nGenerated hash:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);

  // Offer to update .env automatically
  const envPath = path.resolve(__dirname, '../.env');
  try {
    let env = readFileSync(envPath, 'utf-8');
    if (env.includes('ADMIN_PASSWORD_HASH=')) {
      env = env.replace(/^ADMIN_PASSWORD_HASH=.*/m, `ADMIN_PASSWORD_HASH=${hash}`);
      writeFileSync(envPath, env, 'utf-8');
      console.log('\n✓ .env updated automatically. Restart the backend to apply.');
    } else {
      console.log('\nAdd the line above to your .env file, then restart the backend.');
    }
  } catch {
    console.log('\nAdd the line above to your .env file, then restart the backend.');
  }
});
