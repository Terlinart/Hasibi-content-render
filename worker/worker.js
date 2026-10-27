// ربات تولید محتوای داروخانه دکتر حصیبی — نسخهٔ Cloudflare Workers (رایگان)
// عکس جعبه + متن در تلگرام → Gemini متن جعبه را می‌خواند → ادعای خارج از جعبه حذف، دارو مسدود
// → GitHub Actions ریلز + پست + ۲ استوری را می‌سازد و به همان چت می‌فرستد.
//
// Secrets لازم (در داشبورد Cloudflare → Settings → Variables and Secrets):
//   TELEGRAM_BOT_TOKEN  توکن ربات از BotFather
//   GEMINI_API_KEY      کلید رایگان از aistudio.google.com
//   GITHUB_TOKEN        توکن fine-grained با دسترسی Contents: Read and write روی مخزن رندر
//   WEBHOOK_SECRET      یک رمز دلخواه (فقط حروف و عدد) برای امنیت وب‌هوک
// Variable معمولی:
//   ALLOWED_USER_IDS    آیدی‌های مجاز با کاما، مثل 336633779,96650098
// KV binding:
//   JOBS                برای دکمهٔ «یک نسخهٔ دیگر»

const REPO = 'Terlinart/Hasibi-content-render';
const MODELS = ['gemini-3.8-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // یک‌بار بعد از نصب: https://<worker>/setup?key=<WEBHOOK_SECRET>
    // وب‌هوک تلگرام را به همین Worker وصل می‌کند. رمز لازم ندارد چون فقط به خود همین Worker اشاره می‌کند.
    if (url.pathname === '/setup') {
      if (!env.WEBHOOK_SECRET) return new Response('WEBHOOK_SECRET is not set in Cloudflare', { status: 500 });
      const hook = `${url.origin}/telegram`;
      const r = await tg(env, 'setWebhook', {
        url: hook,
        secret_token: String(env.WEBHOOK_SECRET).trim(),
        allowed_updates: ['message', 'callback_query'],
      });
      return json(r);
    }

    // فقط می‌گوید کدام تنظیمات وجود دارد (مقدارها هرگز نمایش داده نمی‌شوند)
    if (url.pathname === '/health') {
      const has = (k) => (env[k] ? 'OK' : 'MISSING');
      return json({
        TELEGRAM_BOT_TOKEN: has('TELEGRAM_BOT_TOKEN'),
        GEMINI_API_KEY: has('GEMINI_API_KEY'),
        GITHUB_TOKEN: has('GITHUB_TOKEN'),
        WEBHOOK_SECRET: has('WEBHOOK_SECRET'),
        WEBHOOK_SECRET_length: String(env.WEBHOOK_SECRET || '').length,
        WEBHOOK_SECRET_has_spaces: /\s/.test(String(env.WEBHOOK_SECRET || '')),
        ALLOWED_USER_IDS: has('ALLOWED_USER_IDS'),
        JOBS: env.JOBS ? 'OK' : 'MISSING',
      });
    }

    if (url.pathname === '/telegram' && request.method === 'POST') {
      if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== String(env.WEBHOOK_SECRET || '').trim()) {
        return new Response('forbidden', { status: 403 });
      }
      const update = await request.json();
      try {
        await handle(update, env);
      } catch (e) {
        const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
        if (chatId) await send(env, chatId, '⚠️ خطای غیرمنتظره. دوباره بفرستید؛ اگر تکرار شد به ترلین خبر بدهید.');
        console.log('error', e && e.stack);
      }
      return new Response('ok'); // همیشه ok تا تلگرام پیام را دوباره نفرستد
    }

    return new Response('Hasibi content bot is running.');
  },
};

async function handle(update, env) {
  const allowedIds = String(env.ALLOWED_USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const msg = update.message || {};
  const cb = update.callback_query;
  const from = (cb ? cb.from : msg.from) || {};
  const chatId = String(cb ? cb.message.chat.id : msg.chat?.id || '');
  const userId = String(from.id || '');
  const allowed = allowedIds.includes(userId);
  const text = String(msg.caption || msg.text || '').trim();
  const photos = msg.photo || [];
  const doc = msg.document && /^image\//.test(msg.document.mime_type || '') ? msg.document : null;
  const fileId = photos.length ? photos[photos.length - 1].file_id : doc ? doc.file_id : '';
  if (!chatId) return;

  if (cb) {
    await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: allowed ? 'نسخهٔ جدید در راه است 🔁' : 'دسترسی ندارید' });
    if (cb.data !== 'regen' || !allowed) return;
    return regen(env, chatId);
  }

  if (/^\/(start|id)/.test(text)) {
    return send(env, chatId,
      `سلام! 👋\nآیدی شما: <code>${userId}</code>\n` +
      (allowed ? '✅ دسترسی شما فعال است.' : 'این آیدی را برای ترلین بفرستید تا دسترسی فعال شود.') +
      '\n\nروش کار:\n۱. از روبه‌روی جعبهٔ محصول یک عکس واضح بگیرید.\n۲. همان عکس را بفرستید و متن را در کپشن عکس بنویسید.\n۳. حدود ۵ دقیقه بعد ریلز، پست و ۲ استوری همین‌جا می‌آید.\n\n⚠️ فقط مکمل، آرایشی و بهداشتی. ادعاهایی که روی جعبه نیست خودکار حذف می‌شود.');
  }

  if (!fileId) return send(env, chatId, '📸 عکس روبه‌روی جعبهٔ محصول را بفرستید و متن را در کپشن همان عکس بنویسید.');
  if (!allowed) return send(env, chatId, `⛔️ دسترسی شما به ربات محتوا فعال نیست.\nآیدی شما: <code>${userId}</code>`);

  await tg(env, 'sendChatAction', { chat_id: chatId, action: 'typing' });

  // دانلود عکس از تلگرام
  const f = await tg(env, 'getFile', { file_id: fileId });
  const imgRes = await fetch(`https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${f.result.file_path}`);
  const bytes = new Uint8Array(await imgRes.arrayBuffer());
  const mime = doc?.mime_type || 'image/jpeg';

  const a = await readBox(env, b64(bytes), mime, text);
  if (!a) return send(env, chatId, '⏳ سرویس هوش مصنوعی (Gemini) الان شلوغ است و جعبه را نتوانست بخواند.\nلطفاً ۲ تا ۳ دقیقهٔ دیگر همان عکس و متن را دوباره بفرستید.');

  const built = buildContent(a);
  if (!built.ok) return send(env, chatId, built.message);

  const payload = { chatId, fileId, job: built.job, caption: built.caption };
  if (env.JOBS) await env.JOBS.put(`last:${chatId}`, JSON.stringify(payload));
  const ok = await dispatch(env, payload);
  if (!ok) return send(env, chatId, '⚠️ ارسال به موتور ساخت ویدیو ناموفق بود. چند دقیقهٔ دیگر دوباره بفرستید یا به ترلین خبر بدهید.');
  return send(env, chatId, built.report);
}

async function regen(env, chatId) {
  const raw = env.JOBS ? await env.JOBS.get(`last:${chatId}`) : null;
  if (!raw) return send(env, chatId, 'هنوز محتوایی ساخته نشده. اول عکس جعبه را بفرستید.');
  const p = JSON.parse(raw);
  p.job.seed = (p.job.seed || 1) + 1;
  p.job.hook = hooks(p.job.category)[p.job.seed % 4];
  await env.JOBS.put(`last:${chatId}`, JSON.stringify(p));
  const ok = await dispatch(env, p);
  return send(env, chatId, ok
    ? '🔁 نسخهٔ جدید با رنگ، ترتیب صحنه، موزیک و افکت متفاوت در حال ساخت است (حدود ۵ دقیقه).'
    : '⚠️ ارسال به موتور ساخت ویدیو ناموفق بود. چند دقیقهٔ دیگر دوباره امتحان کنید.');
}

// ---------- Gemini: اول مدل اصلی، اگر شلوغ بود مدل‌های پشتیبان ----------
async function readBox(env, imageB64, mime, staffText) {
  const prompt = `You check Instagram content for an Iranian pharmacy. Read ONLY what is printed on the product box in the image.
The pharmacy staff also sent this text (it may contain claims): <<<${staffText}>>>

Return ONLY valid JSON:
{"is_product_box": true, "category": "مکمل", "is_prescription_drug": false, "productFa": "", "productEn": "", "boxClaim": "", "ingredients": [], "badges": [], "packInfo": "", "user_claims": [{"claim": "", "on_box": false, "reason": ""}]}

Rules:
- category: one of مکمل, آرایشی, بهداشتی, دارو.
- is_prescription_drug: true if this is a medicine that needs a prescription.
- productEn: brand name exactly as printed. productFa: Persian transliteration of it.
- boxClaim: Persian translation of ONLY the benefit statement literally printed on the box, starting with «برای» (example: "Healthy Muscles, Bones & Nervous System" -> "برای سلامت عضلات، استخوان‌ها و سیستم عصبی"). Add nothing that is not printed. Empty string if none.
- ingredients: up to 4 key ingredients or features printed on the box, in Persian, keep vitamin codes in Latin (e.g. "ویتامین B1 و B6"), each under 22 characters.
- badges: up to 3 free-from or quality labels printed on the box, in Persian, each under 16 characters.
- packInfo: amount and form with Persian digits, e.g. "۳۲ کپسول". Empty if not visible.
- user_claims: split the staff text into separate claims. on_box is true ONLY if the same meaning is printed on the box. reason: short Persian explanation.
- Never invent claims, doses, diagnoses or medical advice. If the image is not a product box, set is_product_box false.`;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: imageB64 } }] }],
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1500, temperature: 0.1 },
  });

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      });
      if (r.ok) {
        const d = await r.json();
        const t = d.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
        try {
          const clean = t.replace(/```json|```/g, '');
          return JSON.parse(clean.slice(clean.indexOf('{'), clean.lastIndexOf('}') + 1));
        } catch (e) { break; } // جواب خراب بود؛ مدل بعدی
      }
      if (r.status === 404 || r.status === 400) break; // این مدل در دسترس نیست؛ مدل بعدی
      await sleep(2500);
    }
  }
  return null;
}

// ---------- ساخت محتوای امن (همان قوانین n8n) ----------
const hooks = (cat) => [cat + ' جدید رسید!', 'تازه رسید!', 'جدید در قفسهٔ ما!', 'ببینید چی رسید!'];

function buildContent(a) {
  const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fa = (t) => String(t || '').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  if (!a.is_product_box) return { ok: false, message: '📦 این عکس جعبهٔ محصول نیست. لطفاً از روبه‌روی جعبه عکس بگیرید.' };
  if (a.is_prescription_drug || a.category === 'دارو') {
    return { ok: false, message: '⛔️ این محصول «دارو» تشخیص داده شد. تبلیغ دارو ممنوع است و برای آن محتوا ساخته نمی‌شود.\nفقط مکمل، آرایشی و بهداشتی. اگر اشتباه تشخیص داده شده، به ترلین خبر بدهید.' };
  }
  const category = ['مکمل', 'آرایشی', 'بهداشتی'].includes(a.category) ? a.category : 'مکمل';
  const seed = Math.floor(Math.random() * 1000) + 1;
  const job = {
    productFa: String(a.productFa || a.productEn || 'محصول جدید').slice(0, 24),
    productEn: String(a.productEn || '').slice(0, 30),
    category,
    hook: hooks(category)[seed % 4],
    boxClaim: String(a.boxClaim || 'مشخصات کامل روی جعبهٔ محصول').slice(0, 70),
    ingredients: (a.ingredients || []).slice(0, 4).map((x) => String(x).slice(0, 24)),
    badges: (a.badges || []).slice(0, 3).map((x) => String(x).slice(0, 18)),
    packInfo: fa(a.packInfo || category),
    seed,
  };
  if (!job.ingredients.length) job.ingredients = [job.category, job.packInfo];
  const claims = a.user_claims || [];
  const removed = claims.filter((c) => !c.on_box);
  const kept = claims.filter((c) => c.on_box);
  const tag = (t) => '#' + String(t).replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_]/gu, '');
  const caption = [
    '✨ ' + job.productFa + (job.productEn ? ' (' + job.productEn + ')' : '') + ' در داروخانه دکتر حصیبی',
    '',
    '📦 ' + job.packInfo + ' | ' + job.category,
    a.boxClaim ? '✅ طبق نوشتهٔ روی جعبه: ' + job.boxClaim : '',
    ...job.ingredients.map((i) => '🔹 ' + i),
    job.badges.length ? '🌱 ' + job.badges.join(' • ') : '',
    '',
    '💬 سؤال دارویی دارید؟ با دکتر حصیبی مشورت کنید.',
    '👥 گروه مشاوره: t.me/drhasibi_pharmacy_group',
    '',
    '📍 کرمان، کوهپایه',
    '📞 ۰۹۰۵۱۲۵۹۶۷۵',
    '🕘 هر روز ۹ تا ۲۱',
    '',
    ['#داروخانه_دکتر_حصیبی', '#کوهپایه', '#کرمان', tag(job.category), tag(job.productFa)].join(' '),
  ].filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== '')).join('\n');

  let report = '✅ عکس دریافت شد. ریلز، پست و ۲ استوری در حال ساخت است (حدود ۵ دقیقه).\n\n';
  report += '📦 محصول: ' + esc(job.productFa) + ' — ' + esc(job.category) + '\n';
  report += '📝 ادعای روی جعبه: ' + esc(a.boxClaim || 'چیزی پیدا نشد') + '\n';
  if (kept.length) report += '\n✔️ ادعاهای تأییدشده (روی جعبه هست):\n' + kept.map((c) => '• ' + esc(c.claim)).join('\n') + '\n';
  if (removed.length) report += '\n🚫 حذف شد چون روی جعبه نیست (ادعای درمانی ممنوع):\n' + removed.map((c) => '• ' + esc(c.claim) + (c.reason ? ' — ' + esc(c.reason) : '')).join('\n') + '\n';
  report += '\n💡 برای مشاورهٔ این موارد، مشتری را به دکتر حصیبی ارجاع دهید.';
  return { ok: true, job, caption, report };
}

// ---------- ابزارها ----------
async function dispatch(env, p) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'hasibi-content-bot',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_type: 'render', client_payload: { chat_id: p.chatId, file_id: p.fileId, caption: p.caption, job: p.job } }),
  });
  return r.status === 204;
}

async function tg(env, method, body) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  return r.json();
}

const send = (env, chatId, text) => tg(env, 'sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true });
const json = (o) => new Response(JSON.stringify(o, null, 2), { headers: { 'Content-Type': 'application/json' } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function b64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
