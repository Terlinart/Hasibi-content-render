import { workflow, node, trigger, sticky, newCredential, ifElse, switchCase, expr } from '@n8n/workflow-sdk';

const botTrigger = trigger({
  type: 'n8n-nodes-base.telegramTrigger',
  version: 1.5,
  config: {
    name: 'Hasibi Content Bot',
    parameters: {
      updates: ['message', 'callback_query'],
      additionalFields: { download: true, imageSize: 'large' }
    },
    credentials: { telegramApi: newCredential('Hasibi Content Bot') },
    position: [0, 300]
  },
  output: [{ message: { chat: { id: 111 }, from: { id: 111, first_name: 'Fateme' }, caption: 'کاهش خستگی', photo: [{ file_id: 'AAA' }] } }]
});

const readUpdate = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Read Update',
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `// آیدی عددی تلگرام کسانی که اجازهٔ ساخت محتوا دارند (دکتر حصیبی و ترلین).
// هر کس /start بزند آیدی‌اش را می‌بیند؛ آن را اینجا اضافه کنید.
const ALLOWED_USER_IDS = [];

const u = $json;
const msg = u.message || {};
const cb = u.callback_query;
const from = (cb ? cb.from : msg.from) || {};
const chatId = String(cb ? cb.message.chat.id : ((msg.chat || {}).id || ''));
const userId = String(from.id || '');
const allowed = ALLOWED_USER_IDS.map(String).includes(userId);
const text = String(msg.caption || msg.text || '').trim();
const photos = msg.photo || [];
let kind = 'help';
if (cb && cb.data === 'regen') kind = 'regen';
else if (/^\\/(start|id)/.test(text)) kind = 'start';
else if (photos.length) kind = 'photo';
if ((kind === 'photo' || kind === 'regen') && !allowed) kind = 'blocked';
return {
  json: { kind, chatId, userId, allowed, text, queryId: cb ? cb.id : '', fileId: photos.length ? photos[photos.length - 1].file_id : '' },
  binary: $input.item.binary
};`
    },
    position: [220, 300]
  },
  output: [{ kind: 'photo', chatId: '111', userId: '111', allowed: true, text: 'کاهش خستگی', queryId: '', fileId: 'AAA' }]
});

const route = switchCase({
  version: 3.4,
  config: {
    name: 'Route Message',
    parameters: {
      mode: 'rules',
      rules: {
        values: [
          { outputKey: 'start', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'start' }], combinator: 'and' } },
          { outputKey: 'photo', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'photo' }], combinator: 'and' } },
          { outputKey: 'regen', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'regen' }], combinator: 'and' } },
          { outputKey: 'blocked', conditions: { options: { caseSensitive: false, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'blocked' }], combinator: 'and' } }
        ]
      },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'help' }
    },
    position: [440, 300]
  },
  output: [{ kind: 'photo' }]
});

const replyStart = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Reply Start',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $json.chatId }}'),
      text: expr('سلام! 👋\nآیدی شما: <code>{{ $json.userId }}</code>\n{{ $json.allowed ? "✅ دسترسی شما فعال است." : "این آیدی را برای ترلین بفرستید تا دسترسی فعال شود." }}\n\nروش کار:\n۱. از روبه‌روی جعبهٔ محصول یک عکس واضح بگیرید.\n۲. همان عکس را بفرستید و متن را در کپشن عکس بنویسید.\n۳. حدود ۵ دقیقه بعد ریلز، پست و ۲ استوری همین‌جا می‌آید.\n\n⚠️ فقط مکمل، آرایشی و بهداشتی. ادعاهایی که روی جعبه نیست خودکار حذف می‌شود.'),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Hasibi Content Bot') },
    position: [700, 40]
  },
  output: [{ ok: true }]
});

const readBox = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini',
  version: 1.2,
  config: {
    name: 'Read Box with Gemini',
    parameters: {
      resource: 'image',
      operation: 'analyze',
      modelId: { __rl: true, mode: 'id', value: 'models/gemini-3.8-flash' },
      inputType: 'binary',
      binaryPropertyName: 'data',
      text: expr('You check Instagram content for an Iranian pharmacy. Read ONLY what is printed on the product box in the image.\nThe pharmacy staff also sent this text (it may contain claims): <<<{{ $json.text }}>>>\n\nReturn ONLY valid JSON, no markdown:\n{"is_product_box": true, "category": "مکمل", "is_prescription_drug": false, "productFa": "", "productEn": "", "boxClaim": "", "ingredients": [], "badges": [], "packInfo": "", "user_claims": [{"claim": "", "on_box": false, "reason": ""}]}\n\nRules:\n- category: one of مکمل, آرایشی, بهداشتی, دارو.\n- is_prescription_drug: true if this is a medicine that needs a prescription.\n- productEn: brand name exactly as printed. productFa: Persian transliteration of it.\n- boxClaim: Persian translation of ONLY the benefit statement literally printed on the box, starting with «برای» (example: "Healthy Muscles, Bones & Nervous System" -> "برای سلامت عضلات، استخوان‌ها و سیستم عصبی"). Add nothing that is not printed. Empty string if none.\n- ingredients: up to 4 key ingredients or features printed on the box, in Persian, keep vitamin codes in Latin (e.g. "ویتامین B1 و B6"), each under 22 characters.\n- badges: up to 3 free-from or quality labels printed on the box, in Persian, each under 16 characters.\n- packInfo: amount and form with Persian digits, e.g. "۳۲ کپسول". Empty if not visible.\n- user_claims: split the staff text into separate claims. on_box is true ONLY if the same meaning is printed on the box. reason: short Persian explanation.\n- Never invent claims, doses, diagnoses or medical advice. If the image is not a product box, set is_product_box false.'),
      simplify: true,
      options: { maxOutputTokens: 1500 }
    },
    credentials: { googlePalmApi: { id: 'BZozboLXTtaUcu2Q', name: 'Google Gemini(PaLM) Api account' } },
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 3000,
    position: [700, 260]
  },
  output: [{ content: { parts: [{ text: '{"is_product_box":true}' }] } }]
});

const buildJob = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Build Safe Content',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const src = $('Read Update').first().json;
const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fa = (t) => String(t || '').replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const findText = (o) => {
  if (typeof o === 'string') return o.includes('{') ? o : null;
  if (o && typeof o === 'object') { for (const k of Object.keys(o)) { const r = findText(o[k]); if (r) return r; } }
  return null;
};
const fail = (m) => [{ json: { ok: false, chatId: src.chatId, message: m } }];
let raw = (findText($input.first().json) || '').replace(/\`\`\`json|\`\`\`/g, '');
let a;
try { a = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)); } catch (e) {
  return fail('⚠️ نتوانستم متن جعبه را بخوانم. یک عکس واضح‌تر از روبه‌روی جعبه، در نور خوب، بفرستید.');
}
if (!a.is_product_box) return fail('📦 این عکس جعبهٔ محصول نیست. لطفاً از روبه‌روی جعبه عکس بگیرید.');
if (a.is_prescription_drug || a.category === 'دارو') {
  return fail('⛔️ این محصول «دارو» تشخیص داده شد. تبلیغ دارو ممنوع است و برای آن محتوا ساخته نمی‌شود.\\nفقط مکمل، آرایشی و بهداشتی. اگر اشتباه تشخیص داده شده، به ترلین خبر بدهید.');
}
const category = ['مکمل', 'آرایشی', 'بهداشتی'].includes(a.category) ? a.category : 'مکمل';
const seed = Math.floor(Math.random() * 1000) + 1;
const hooks = [category + ' جدید رسید!', 'تازه رسید!', 'جدید در قفسهٔ ما!', 'ببینید چی رسید!'];
const job = {
  productFa: String(a.productFa || a.productEn || 'محصول جدید').slice(0, 24),
  productEn: String(a.productEn || '').slice(0, 30),
  category,
  hook: hooks[seed % hooks.length],
  boxClaim: String(a.boxClaim || 'مشخصات کامل روی جعبهٔ محصول').slice(0, 70),
  ingredients: (a.ingredients || []).slice(0, 4).map((x) => String(x).slice(0, 24)),
  badges: (a.badges || []).slice(0, 3).map((x) => String(x).slice(0, 18)),
  packInfo: fa(a.packInfo || category),
  seed
};
if (!job.ingredients.length) job.ingredients = [job.category, job.packInfo];
const claims = a.user_claims || [];
const removed = claims.filter((c) => !c.on_box);
const kept = claims.filter((c) => c.on_box);
const tag = (t) => '#' + String(t).replace(/\\s+/g, '_').replace(/[^\\p{L}\\p{N}_]/gu, '');
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
  ['#داروخانه_دکتر_حصیبی', '#کوهپایه', '#کرمان', tag(job.category), tag(job.productFa)].join(' ')
].filter((l, i, arr) => l !== '' || (arr[i - 1] !== '' && i > 0)).join('\\n');
let report = '✅ عکس دریافت شد. ریلز، پست و ۲ استوری در حال ساخت است (حدود ۵ دقیقه).\\n\\n';
report += '📦 محصول: ' + esc(job.productFa) + ' — ' + esc(job.category) + '\\n';
report += '📝 ادعای روی جعبه: ' + esc(a.boxClaim || 'چیزی پیدا نشد') + '\\n';
if (kept.length) report += '\\n✔️ ادعاهای تأییدشده (روی جعبه هست):\\n' + kept.map((c) => '• ' + esc(c.claim)).join('\\n') + '\\n';
if (removed.length) report += '\\n🚫 حذف شد چون روی جعبه نیست (ادعای درمانی ممنوع):\\n' + removed.map((c) => '• ' + esc(c.claim) + (c.reason ? ' — ' + esc(c.reason) : '')).join('\\n') + '\\n';
report += '\\n💡 برای مشاورهٔ این موارد، مشتری را به دکتر حصیبی ارجاع دهید.';
const st = $getWorkflowStaticData('global');
st.jobs = st.jobs || {};
st.jobs[src.chatId] = { job, caption, fileId: src.fileId };
return [{ json: { ok: true, chatId: src.chatId, fileId: src.fileId, job, caption, report } }];`
    },
    position: [920, 260]
  },
  output: [{ ok: true, chatId: '111', fileId: 'AAA', job: { productFa: 'مگنی‌فورت', seed: 5 }, caption: '...', report: '...' }]
});

const isSafe = ifElse({
  version: 2.2,
  config: {
    name: 'Content Allowed?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.ok }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [1140, 260]
  },
  output: [{ ok: true }]
});

const dispatchBody = expr('{{ JSON.stringify({ event_type: "render", client_payload: { chat_id: $json.chatId, file_id: $json.fileId, caption: $json.caption, job: $json.job } }) }}');

const dispatchNew = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Start Render (GitHub)',
    parameters: {
      method: 'POST',
      url: 'https://api.github.com/repos/Terlinart/Hasibi-content-render/dispatches',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }, { name: 'User-Agent', value: 'hasibi-content-bot' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: dispatchBody
    },
    credentials: { httpTemplatedCustomAuth: newCredential('GitHub Render Token') },
    position: [1360, 180]
  },
  output: [{}]
});

const reportNew = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Send Check Report',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr("{{ $('Build Safe Content').item.json.chatId }}"),
      text: expr("{{ $('Build Safe Content').item.json.report }}"),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Hasibi Content Bot') },
    position: [1580, 180]
  },
  output: [{ ok: true }]
});

const replyRejected = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Reply Not Allowed',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $json.chatId }}'),
      text: expr('{{ $json.message }}'),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Hasibi Content Bot') },
    position: [1360, 360]
  },
  output: [{ ok: true }]
});

const answerButton = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Answer Button',
    parameters: {
      resource: 'callback',
      operation: 'answerQuery',
      queryId: expr('{{ $json.queryId }}'),
      additionalFields: { text: 'نسخهٔ جدید در راه است 🔁' }
    },
    credentials: { telegramApi: newCredential('Hasibi Content Bot') },
    position: [700, 520]
  },
  output: [{ ok: true }]
});

const loadLast = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Load Last Content',
    parameters: {
      mode: 'runOnceForAllItems',
      language: 'javaScript',
      jsCode: `const src = $('Read Update').first().json;
const st = $getWorkflowStaticData('global');
const last = (st.jobs || {})[src.chatId];
if (!last) return [{ json: { ok: false, chatId: src.chatId, message: 'هنوز محتوایی ساخته نشده. اول عکس جعبه را بفرستید.' } }];
const hooks = [last.job.category + ' جدید رسید!', 'تازه رسید!', 'جدید در قفسهٔ ما!', 'ببینید چی رسید!'];
last.job.seed = (last.job.seed || 1) + 1;
last.job.hook = hooks[last.job.seed % hooks.length];
st.jobs[src.chatId] = last;
return [{ json: { ok: true, chatId: src.chatId, fileId: last.fileId, job: last.job, caption: last.caption, report: '🔁 نسخهٔ جدید با رنگ، ترتیب صحنه، موزیک و افکت متفاوت در حال ساخت است (حدود ۵ دقیقه).' } }];`
    },
    position: [920, 520]
  },
  output: [{ ok: true, chatId: '111', fileId: 'AAA', job: { seed: 6 }, caption: '...', report: '...' }]
});

const hasLast = ifElse({
  version: 2.2,
  config: {
    name: 'Has Previous Content?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{ leftValue: expr('{{ $json.ok }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    },
    position: [1140, 520]
  },
  output: [{ ok: true }]
});

const dispatchAgain = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Start Re-render (GitHub)',
    parameters: {
      method: 'POST',
      url: 'https://api.github.com/repos/Terlinart/Hasibi-content-render/dispatches',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }, { name: 'User-Agent', value: 'hasibi-content-bot' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: dispatchBody
    },
    credentials: { httpTemplatedCustomAuth: newCredential('GitHub Render Token') },
    position: [1360, 460]
  },
  output: [{}]
});

const reportAgain = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Send Re-render Notice',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr("{{ $('Load Last Content').item.json.chatId }}"),
      text: expr("{{ $('Load Last Content').item.json.report }}"),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Hasibi Content Bot') },
    position: [1580, 460]
  },
  output: [{ ok: true }]
});

const replyNoLast = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Reply Nothing To Redo',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $json.chatId }}'),
      text: expr('{{ $json.message }}'),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Hasibi Content Bot') },
    position: [1360, 620]
  },
  output: [{ ok: true }]
});

const replyBlocked = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Reply No Access',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $json.chatId }}'),
      text: expr('⛔️ دسترسی شما به ربات محتوا فعال نیست.\nآیدی شما: <code>{{ $json.userId }}</code>'),
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Hasibi Content Bot') },
    position: [700, 720]
  },
  output: [{ ok: true }]
});

const replyHelp = node({
  type: 'n8n-nodes-base.telegram',
  version: 1.2,
  config: {
    name: 'Reply How To Use',
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: expr('{{ $json.chatId }}'),
      text: '📸 عکس روبه‌روی جعبهٔ محصول را به‌صورت «عکس» (نه فایل) بفرستید و متن را در کپشن همان عکس بنویسید.',
      additionalFields: { appendAttribution: false, parse_mode: 'HTML' }
    },
    credentials: { telegramApi: newCredential('Hasibi Content Bot') },
    position: [700, 880]
  },
  output: [{ ok: true }]
});

const note = sticky('## ربات محتوای داروخانه دکتر حصیبی\n۱. عکس جعبه + متن در تلگرام\n۲. Gemini متن جعبه را می‌خواند؛ ادعای خارج از جعبه حذف، دارو مسدود\n۳. GitHub Actions ریلز + پست + ۲ استوری را می‌سازد و به همان چت می‌فرستد\n\n**راه‌اندازی:** آیدی‌های مجاز را در Read Update بگذارید. توکن‌ها فقط در Credentials.', [botTrigger, readUpdate], { color: 5 });

export default workflow('hasibi-content-bot', 'Hasibi Content Bot')
  .add(botTrigger)
  .to(readUpdate)
  .to(route
    .onCase(0, replyStart)
    .onCase(1, readBox.to(buildJob).to(isSafe
      .onTrue(dispatchNew.to(reportNew))
      .onFalse(replyRejected)))
    .onCase(2, answerButton.to(loadLast).to(hasLast
      .onTrue(dispatchAgain.to(reportAgain))
      .onFalse(replyNoLast)))
    .onCase(3, replyBlocked)
    .onCase(4, replyHelp))
  .add(note)
  .group('New product content', [readBox, buildJob, isSafe, dispatchNew, reportNew, replyRejected], { description: 'Gemini reads the box, drops claims not printed on it, blocks medicines, then starts the GitHub render.' })
  .group('Make another version', [answerButton, loadLast, hasLast, dispatchAgain, reportAgain, replyNoLast], { description: 'Button press re-renders the last product with a new seed: colours, scene order, voice and music change.' });
