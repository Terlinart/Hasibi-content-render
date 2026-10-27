// «مغز موجودی» داروخانه: دیتابیس D1، API مینی‌اپ اسکن، هشدار روزانه، گزارش شنبه و خروجی اکسل.
// هشدارها و گزارش‌ها فقط برای ADMIN_IDS (دکتر حصیبی) فرستاده می‌شوند.
import {daysBetween, faDigits, isoToFa, isoToFaMonth, tehranIsoDate, tehranNow, toJalali} from './jalali.js';

export const CATEGORIES = ['مکمل', 'آرایشی و بهداشتی', 'دارو', 'تجهیزات', 'سایر'];

const ids = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
export const roles = (env) => {
  const admins = ids(env.ADMIN_IDS);
  const content = ids(env.ALLOWED_USER_IDS);
  const staff = ids(env.STAFF_IDS);
  const scanners = [...new Set([...admins, ...content, ...staff])];
  return {admins, content, staff, scanners};
};

// ---------- دیتابیس ----------
let schemaReady = false;
export async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS products (barcode TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT, min_qty INTEGER DEFAULT 2, created_at TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS lots (id INTEGER PRIMARY KEY AUTOINCREMENT, barcode TEXT NOT NULL, expiry TEXT NOT NULL, batch TEXT, qty INTEGER NOT NULL DEFAULT 0, updated_at TEXT, counted_at TEXT, UNIQUE(barcode, expiry))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS missed (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT, item TEXT, category TEXT, note TEXT, by_user TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS alerts (key TEXT PRIMARY KEY, sent_at TEXT)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS log (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT, user_id TEXT, action TEXT, barcode TEXT, expiry TEXT, qty INTEGER)`),
  ]);
  schemaReady = true;
}

// ---------- احراز هویت مینی‌اپ تلگرام (initData) ----------
const enc = new TextEncoder();
const hmac = async (key, data) => {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? enc.encode(key) : key, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data)));
};
const hex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

export async function verifyInitData(initData, botToken) {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheck = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = await hmac('WebAppData', botToken);
  if (hex(await hmac(secret, dataCheck)) !== hash) return null;
  const authDate = Number(params.get('auth_date') || 0);
  if (Date.now() / 1000 - authDate > 86400) return null; // حداکثر ۲۴ ساعت
  try {
    return JSON.parse(params.get('user') || 'null');
  } catch {
    return null;
  }
}

// ---------- API مینی‌اپ ----------
const json = (o, status = 200) => new Response(JSON.stringify(o), {status, headers: {'Content-Type': 'application/json; charset=utf-8'}});
const nowIso = () => new Date().toISOString();

export async function handleApi(request, env, path) {
  const body = await request.json().catch(() => ({}));
  const user = await verifyInitData(body.initData, env.TELEGRAM_BOT_TOKEN);
  if (!user) return json({error: 'auth'}, 401);
  const uid = String(user.id);
  const r = roles(env);
  if (!r.scanners.includes(uid)) return json({error: 'forbidden', uid}, 403);
  const isAdmin = r.admins.includes(uid);
  await ensureSchema(env);
  const DB = env.DB;

  if (path === '/api/me') return json({uid, name: user.first_name || '', isAdmin, categories: CATEGORIES});

  if (path === '/api/lookup') {
    const code = String(body.barcode || '').trim();
    if (!code) return json({error: 'barcode'}, 400);
    const product = await DB.prepare('SELECT * FROM products WHERE barcode = ?').bind(code).first();
    const lots = (await DB.prepare('SELECT id, expiry, batch, qty FROM lots WHERE barcode = ? AND qty > 0 ORDER BY expiry').bind(code).all()).results;
    return json({product, lots: lots.map((l) => ({...l, expiryFa: isoToFa(l.expiry)}))});
  }

  if (path === '/api/save') {
    const code = String(body.barcode || '').trim();
    const name = String(body.name || '').trim().slice(0, 80);
    const category = CATEGORIES.includes(body.category) ? body.category : 'سایر';
    const minQty = Math.max(0, Math.min(999, parseInt(body.min_qty, 10) || 0));
    const expiry = String(body.expiry || '');
    const qty = Math.max(0, Math.min(99999, parseInt(body.qty, 10) || 0));
    const mode = body.mode === 'count' ? 'count' : 'in';
    if (!code || !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return json({error: 'input'}, 400);
    const existing = await DB.prepare('SELECT * FROM products WHERE barcode = ?').bind(code).first();
    if (!existing && !name) return json({error: 'name'}, 400);
    const stmts = [];
    if (!existing) {
      stmts.push(DB.prepare('INSERT INTO products (barcode, name, category, min_qty, created_at) VALUES (?, ?, ?, ?, ?)').bind(code, name, category, minQty || 2, nowIso()));
    } else if (name || body.category || body.min_qty !== undefined) {
      stmts.push(DB.prepare('UPDATE products SET name = ?, category = ?, min_qty = ? WHERE barcode = ?').bind(name || existing.name, body.category ? category : existing.category, body.min_qty !== undefined && body.min_qty !== '' ? minQty : existing.min_qty, code));
    }
    if (mode === 'in') {
      stmts.push(
        DB.prepare(`INSERT INTO lots (barcode, expiry, batch, qty, updated_at) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(barcode, expiry) DO UPDATE SET qty = qty + excluded.qty, batch = COALESCE(excluded.batch, batch), updated_at = excluded.updated_at`).bind(code, expiry, body.batch || null, qty, nowIso())
      );
    } else {
      stmts.push(
        DB.prepare(`INSERT INTO lots (barcode, expiry, batch, qty, updated_at, counted_at) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(barcode, expiry) DO UPDATE SET qty = excluded.qty, batch = COALESCE(excluded.batch, batch), updated_at = excluded.updated_at, counted_at = excluded.counted_at`).bind(code, expiry, body.batch || null, qty, nowIso(), nowIso())
      );
    }
    stmts.push(DB.prepare('INSERT INTO log (at, user_id, action, barcode, expiry, qty) VALUES (?, ?, ?, ?, ?, ?)').bind(nowIso(), uid, mode, code, expiry, qty));
    await DB.batch(stmts);
    const total = await DB.prepare('SELECT COALESCE(SUM(qty),0) AS t FROM lots WHERE barcode = ?').bind(code).first();
    return json({ok: true, total: total.t});
  }

  if (path === '/api/missed') {
    const item = String(body.item || '').trim().slice(0, 100);
    if (!item) return json({error: 'item'}, 400);
    await DB.prepare('INSERT INTO missed (created_at, item, category, note, by_user) VALUES (?, ?, ?, ?, ?)')
      .bind(nowIso(), item, CATEGORIES.includes(body.category) ? body.category : 'سایر', String(body.note || '').slice(0, 200), uid)
      .run();
    return json({ok: true});
  }

  if (path === '/api/status') {
    if (!isAdmin) return json({error: 'admin'}, 403);
    const s = await snapshot(env);
    return json({
      products: s.productCount,
      units: s.unitCount,
      expired: s.expired.map(liteLot),
      soon: s.soon.map(liteLot),
      low: s.low.map((p) => ({name: p.name, total: p.total, min: p.min_qty})),
      missed: s.missedWeek,
    });
  }

  return json({error: 'not found'}, 404);
}

const liteLot = (l) => ({name: l.name, qty: l.qty, expiryFa: isoToFaMonth(l.expiry), days: l.days});

// ---------- عکس لحظه‌ای از وضعیت ----------
export async function snapshot(env) {
  await ensureSchema(env);
  const today = tehranIsoDate();
  const DB = env.DB;
  const lots = (await DB.prepare(`SELECT l.id, l.barcode, l.expiry, l.batch, l.qty, l.counted_at, p.name, p.category, p.min_qty
      FROM lots l JOIN products p ON p.barcode = l.barcode WHERE l.qty > 0 ORDER BY l.expiry`).all()).results.map((l) => ({...l, days: daysBetween(today, l.expiry)}));
  const products = (await DB.prepare(`SELECT p.barcode, p.name, p.category, p.min_qty, COALESCE(SUM(l.qty),0) AS total, MAX(l.counted_at) AS counted_at
      FROM products p LEFT JOIN lots l ON l.barcode = p.barcode GROUP BY p.barcode ORDER BY p.name`).all()).results;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const missedWeek = (await DB.prepare(`SELECT item, category, COUNT(*) AS n FROM missed WHERE created_at >= ? GROUP BY item ORDER BY n DESC LIMIT 15`).bind(weekAgo).all()).results;
  const lastCount = (await DB.prepare(`SELECT MAX(counted_at) AS c FROM lots`).first())?.c || null;
  return {
    today,
    lots,
    products,
    productCount: products.length,
    unitCount: lots.reduce((a, l) => a + l.qty, 0),
    expired: lots.filter((l) => l.days < 0),
    d30: lots.filter((l) => l.days >= 0 && l.days <= 30),
    soon: lots.filter((l) => l.days >= 0 && l.days <= 90),
    low: products.filter((p) => p.min_qty > 0 && p.total < p.min_qty),
    missedWeek,
    lastCount,
  };
}

// ---------- پیام‌ها ----------
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lotLine = (l) => `• ${esc(l.name)} — ${faDigits(l.qty)} عدد — ${isoToFaMonth(l.expiry)}${l.days < 0 ? '' : ` (${faDigits(l.days)} روز)`}`;
const limit = (arr, n, fmt) => arr.slice(0, n).map(fmt).join('\n') + (arr.length > n ? `\n… و ${faDigits(arr.length - n)} مورد دیگر` : '');

export function weeklyReport(s) {
  const j = toJalali(...s.today.split('-').map(Number));
  let t = `📊 <b>گزارش هفتگی موجودی</b> — ${faDigits(`${j.jy}/${j.jm}/${j.jd}`)}\n`;
  t += `${faDigits(s.productCount)} قلم کالا • ${faDigits(s.unitCount)} عدد در قفسه\n`;
  if (s.expired.length) t += `\n⛔ <b>منقضی‌شده؛ از قفسه جمع شود (${faDigits(s.expired.length)})</b>\n${limit(s.expired, 15, lotLine)}\n`;
  if (s.d30.length) t += `\n🔴 <b>کمتر از ۳۰ روز تا انقضا (${faDigits(s.d30.length)})</b>\n${limit(s.d30, 15, lotLine)}\n`;
  const d90 = s.soon.filter((l) => l.days > 30);
  if (d90.length) t += `\n🟠 <b>۱ تا ۳ ماه تا انقضا (${faDigits(d90.length)})</b>\n${limit(d90, 15, lotLine)}\n`;
  const buy = [
    ...s.low.map((p) => `• ${esc(p.name)} — موجودی ${faDigits(p.total)} از حداقل ${faDigits(p.min_qty)}`),
    ...s.missedWeek.map((m) => `• ${esc(m.item)} — ${faDigits(m.n)} بار «نداشتیم»`),
  ];
  if (buy.length) t += `\n🛒 <b>لیست خرید پیشنهادی (${faDigits(buy.length)})</b>\n${buy.slice(0, 25).join('\n')}\n`;
  if (!s.expired.length && !s.soon.length && !buy.length) t += '\n✅ همه‌چیز مرتب است: نه کالای نزدیک انقضا، نه کمبود.\n';
  const countAge = s.lastCount ? daysBetween(s.lastCount.slice(0, 10), s.today) : null;
  if (countAge === null || countAge > 35) t += `\n📋 شمارش ماهانه ${countAge === null ? 'هنوز انجام نشده' : `${faDigits(countAge)} روز است انجام نشده`}.`;
  return t;
}

export function csvExport(s) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['نام کالا', 'دسته', 'بارکد', 'شماره سری', 'تاریخ انقضا (شمسی)', 'روز تا انقضا', 'تعداد', 'حداقل موجودی', 'وضعیت']];
  const lowSet = new Set(s.low.map((p) => p.barcode));
  for (const l of s.lots) {
    const status = l.days < 0 ? 'منقضی' : l.days <= 30 ? 'کمتر از ۳۰ روز' : l.days <= 90 ? 'نزدیک انقضا' : lowSet.has(l.barcode) ? 'کم‌موجود' : 'سالم';
    rows.push([l.name, l.category, l.barcode, l.batch || '', isoToFa(l.expiry), l.days, l.qty, l.min_qty, status]);
  }
  for (const p of s.products) if (p.total === 0) rows.push([p.name, p.category, p.barcode, '', '', '', 0, p.min_qty, 'تمام شده']);
  return '﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n');
}

// ---------- ارسال به تلگرام ----------
async function tgSend(env, chatId, text, extra = {}) {
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra}),
  });
}
export async function sendCsv(env, chatId, s) {
  const fd = new FormData();
  fd.append('chat_id', chatId);
  fd.append('caption', `📎 فایل موجودی — ${isoToFa(s.today)}\nبا اکسل یا Google Sheets باز می‌شود.`);
  fd.append('document', new Blob([csvExport(s)], {type: 'text/csv'}), `inventory-${s.today}.csv`);
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`, {method: 'POST', body: fd});
}

// ---------- کرون روزانه (۰۹:۰۰ تهران) ----------
export async function dailyJob(env, {force = false} = {}) {
  const s = await snapshot(env);
  const r = roles(env);
  const DB = env.DB;
  const tn = tehranNow();
  const isSaturday = tn.getUTCDay() === 6;

  // هشدارهای تازه (هر مورد فقط یک بار)
  const candidates = [
    ...s.expired.map((l) => ({key: `lot:${l.id}:${l.expiry}:expired`, line: lotLine(l), kind: 'expired'})),
    ...s.d30.map((l) => ({key: `lot:${l.id}:${l.expiry}:d30`, line: lotLine(l), kind: 'd30'})),
    ...s.soon.filter((l) => l.days > 30).map((l) => ({key: `lot:${l.id}:${l.expiry}:d90`, line: lotLine(l), kind: 'd90'})),
    ...s.low.map((p) => ({key: `low:${p.barcode}`, line: `• ${esc(p.name)} — ${faDigits(p.total)} از حداقل ${faDigits(p.min_qty)}`, kind: 'low'})),
  ];
  const sent = new Set((await DB.prepare('SELECT key FROM alerts').all()).results.map((x) => x.key));
  const fresh = candidates.filter((c) => !sent.has(c.key));
  // کالایی که دیگر کم‌موجود نیست، دفعهٔ بعد دوباره هشدار بگیرد
  const lowKeys = new Set(s.low.map((p) => `low:${p.barcode}`));
  const stale = [...sent].filter((k) => k.startsWith('low:') && !lowKeys.has(k));

  let delivered = true;
  if (!isSaturday && fresh.length) {
    const group = (k, title) => {
      const xs = fresh.filter((c) => c.kind === k);
      return xs.length ? `\n${title}\n${xs.slice(0, 20).map((c) => c.line).join('\n')}\n` : '';
    };
    const text = `🔔 <b>هشدار موجودی امروز</b>\n` + group('expired', '⛔ منقضی شد؛ از قفسه جمع شود:') + group('d30', '🔴 کمتر از ۳۰ روز تا انقضا:') + group('d90', '🟠 کمتر از ۳ ماه تا انقضا:') + group('low', '🛒 کم‌موجود:');
    for (const a of r.admins) {
      const res = await tgSend(env, a, text).catch(() => null);
      if (!res || !res.ok) delivered = false;
    }
  }
  if (isSaturday || force) {
    for (const a of r.admins) {
      await tgSend(env, a, weeklyReport(s));
      if (s.lots.length) await sendCsv(env, a, s);
    }
  }
  const stmts = [
    // اگر ارسال ناموفق بود، فردا دوباره هشدار داده شود
    ...(delivered ? fresh : []).map((c) => DB.prepare('INSERT OR IGNORE INTO alerts (key, sent_at) VALUES (?, ?)').bind(c.key, nowIso())),
    ...stale.map((k) => DB.prepare('DELETE FROM alerts WHERE key = ?').bind(k)),
  ];
  if (stmts.length) await DB.batch(stmts);

  // اول هر ماه شمسی: یادآور شمارش برای همهٔ کسانی که اسکن می‌کنند
  const j = toJalali(tn.getUTCFullYear(), tn.getUTCMonth() + 1, tn.getUTCDate());
  if (j.jd === 1) {
    for (const u of r.scanners) {
      await tgSend(env, u, '📋 اول ماه است: لطفاً امروز شمارش ماهانهٔ قفسه‌ها را انجام دهید.\nدکمهٔ «📦 موجودی» ← «شمارش ماهانه» را بزنید و کالاها را اسکن کنید.');
    }
  }
  return {fresh: fresh.length, saturday: isSaturday};
}
