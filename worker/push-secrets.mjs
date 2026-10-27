// موقع build در Cloudflare اجرا می‌شود: مقدارهای امنی را که در «Build → Variables and secrets»
// گذاشته شده‌اند، به‌عنوان Secret روی خود Worker می‌گذارد. هیچ مقداری چاپ نمی‌شود.
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KEYS = ['TELEGRAM_BOT_TOKEN', 'GEMINI_API_KEY', 'GITHUB_TOKEN', 'WEBHOOK_SECRET'];
const secrets = {};
for (const k of KEYS) if (process.env[k] && process.env[k].trim()) secrets[k] = process.env[k].trim();

const names = Object.keys(secrets);
console.log('build secrets found:', names.length ? names.join(', ') : 'none');
if (!names.length) process.exit(0);

const file = path.join(os.tmpdir(), `s-${Date.now()}.json`);
fs.writeFileSync(file, JSON.stringify(secrets), {mode: 0o600});
try {
  execSync(`npx wrangler secret bulk ${file}`, {stdio: 'inherit'});
} catch (e) {
  console.log('secret upload failed (deploy continues):', e.message.split('\n')[0]);
} finally {
  fs.unlinkSync(file);
}
