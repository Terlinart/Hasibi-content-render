// «نقشهٔ» هر ریلز: از روی seed تصمیم می‌گیرد کدام هوک، کدام صحنه‌ها با چه ترتیبی، کدام ترنزیشن‌ها،
// کدام پالت، کدام بافت و چه ضرب‌آهنگی. افکت‌های صوتی (cues) هم همین‌جا با فریم دقیق ساخته می‌شوند
// و scripts/audio.py آن‌ها را می‌خواند؛ پس تصویر و صدا همیشه هماهنگ‌اند.
import type {ContentProps} from './brand';

export const FPS = 30;

export type HookType = 'slam' | 'zoomType' | 'drop' | 'glitch';
export type MidType = 'glass' | 'neon' | 'poster' | 'notify' | 'karaoke' | 'orbit' | 'grid' | 'checklist' | 'counter';
export type OutroType = 'studio' | 'minimal' | 'card';
export type Transition = 'punch' | 'whip' | 'zoom' | 'glitch' | 'circle' | 'slideUp';
export type SceneType = HookType | MidType | OutroType;

export type Segment = {kind: 'hook' | 'mid' | 'outro'; type: SceneType; from: number; dur: number; transition: Transition | 'none'; v: number};
export type Cue = {f: number; fx: string; g: number; d?: number};
export type Plan = {seed: number; bpm: number; palette: number; overlay: 'grain' | 'leak' | 'vignette' | 'none'; pulse: boolean; segments: Segment[]; total: number; cues: Cue[]};

// ---------- ابزار ----------
export const rngFrom = (seed: number) => {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const shuffle = <T,>(arr: T[], r: () => number) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const choose = <T,>(arr: T[], r: () => number) => arr[Math.floor(r() * arr.length)];

export const words = (s: string) => String(s || '').trim().split(/\s+/).filter(Boolean);
export const packNumber = (pack: string) => {
  const en = String(pack || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const m = en.match(/\d+/);
  return m ? Number(m[0]) : 0;
};
export const checklistItems = (p: ContentProps) => (p.badges.length >= 2 ? p.badges : p.ingredients).slice(0, 4);
export const notifyItems = (p: ContentProps) => [p.boxClaim, ...p.ingredients].filter(Boolean).slice(0, 4);

// ---------- طول هر صحنه (فریم) ----------
export const durationOf = (type: SceneType, p: ContentProps): number => {
  const nIng = Math.min(4, p.ingredients.length);
  switch (type) {
    case 'slam': return 54;
    case 'zoomType': return Math.max(40, words(p.hook).length * 8 + 22);
    case 'drop': return 60;
    case 'glitch': return 50;
    case 'glass': return 110;
    case 'neon': return 40 + nIng * 14 + 40;
    case 'poster': return 90;
    case 'notify': return 24 + notifyItems(p).length * 16 + 34;
    case 'karaoke': return Math.min(130, Math.max(70, words(p.boxClaim).length * 7 + 36));
    case 'orbit': return 110;
    case 'grid': return 84;
    case 'checklist': return 34 + checklistItems(p).length * 12 + 30;
    case 'counter': return 80;
    case 'studio': return 120;
    case 'minimal': return 105;
    case 'card': return 120;
  }
};

// ---------- افکت‌های داخل هر صحنه (فریم نسبت به شروع صحنه) ----------
// این عددها با انیمیشن‌های src/Reel.tsx یکی هستند؛ اگر انیمیشنی جابه‌جا شد، این‌جا هم عوض شود.
export const sceneCues = (type: SceneType, p: ContentProps, dur: number): Cue[] => {
  const c: Cue[] = [];
  const add = (f: number, fx: string, g: number, d?: number) => c.push({f, fx, g, d});
  switch (type) {
    case 'slam':
      words(p.hook).forEach((_, i) => add(4 + i * 4, 'pop', 0.75));
      add(12, 'ding', 0.35);
      break;
    case 'zoomType': {
      const w = words(p.hook);
      w.forEach((_, i) => add(i * 8, i === w.length - 1 ? 'boom' : 'click', i === w.length - 1 ? 0.8 : 0.7));
      add(w.length * 8 + 4, 'shimmer', 0.3, 0.8);
      break;
    }
    case 'drop':
      add(0, 'whoosh', 0.6, 0.35);
      add(11, 'boom', 0.85);
      words(p.hook).forEach((_, i) => add(18 + i * 5, 'pop', 0.6));
      break;
    case 'glitch':
      add(0, 'glitch', 0.8);
      add(8, 'zap', 0.55);
      add(24, 'glitch', 0.7);
      add(30, 'boom', 0.6);
      break;
    case 'glass':
      add(0, 'whoosh_down', 0.5, 0.5);
      add(10, 'shimmer', 0.45, 1.6);
      add(22, 'click', 0.6);
      break;
    case 'neon': {
      const n = Math.min(4, p.ingredients.length);
      for (let i = 0; i < n; i++) {
        add(10 + i * 14, 'zap', 0.6);
        add(14 + i * 14, 'click', 0.35);
      }
      p.badges.slice(0, 3).forEach((_, i) => add(22 + n * 14 + i * 5, 'pop', 0.5));
      break;
    }
    case 'poster':
      add(0, 'whoosh', 0.6, 0.35);
      add(6, 'boom', 0.7);
      add(22, 'click', 0.5);
      break;
    case 'notify':
      notifyItems(p).forEach((_, i) => add(10 + i * 16, i === 0 ? 'ding' : 'pop', i === 0 ? 0.5 : 0.65));
      break;
    case 'karaoke':
      add(0, 'whoosh', 0.45, 0.4);
      words(p.boxClaim).forEach((_, i) => add(10 + i * 7, 'tick', 0.45));
      break;
    case 'orbit':
      add(0, 'whoosh_down', 0.5, 0.5);
      add(16, 'shimmer', 0.4, 1.4);
      p.ingredients.slice(0, 4).forEach((_, i) => add(8 + i * 6, 'pop', 0.55));
      break;
    case 'grid':
      [0, 1, 2, 3].forEach((i) => add(4 + i * 5, 'pop', 0.65));
      add(34, 'riser', 0.35, 0.3);
      add(44, 'boom', 0.8);
      break;
    case 'checklist':
      checklistItems(p).forEach((_, i) => add(20 + i * 12, 'click', 0.7));
      add(24 + checklistItems(p).length * 12, 'ding', 0.4);
      break;
    case 'counter':
      add(6, 'riser', 0.45, 1.0);
      add(36, 'boom', 0.85);
      add(42, 'ding', 0.45);
      break;
    case 'studio':
      add(0, 'riser', 0.4, 0.5);
      add(14, 'boom', 0.6);
      add(20, 'shutter', 0.6);
      add(28, 'ding', 0.4);
      add(30, 'shimmer', 0.3, 1.2);
      break;
    case 'minimal':
      add(4, 'boom', 0.75);
      add(6, 'shimmer', 0.35, 1.2);
      add(18, 'pop', 0.55);
      add(24, 'pop', 0.55);
      add(34, 'shutter', 0.55);
      break;
    case 'card':
      add(0, 'whoosh', 0.5, 0.4);
      add(8, 'boom', 0.7);
      add(30, 'whoosh', 0.55, 0.45);
      add(46, 'click', 0.6);
      add(52, 'ding', 0.45);
      break;
  }
  return c.filter((x) => x.f < dur);
};

const transitionCues = (t: Transition, from: number): Cue[] => {
  switch (t) {
    case 'punch': return [{f: from - 14, fx: 'riser', g: 0.3, d: 0.45}, {f: from, fx: 'boom', g: 0.8}];
    case 'whip': return [{f: from - 4, fx: 'whoosh', g: 0.75, d: 0.3}];
    case 'zoom': return [{f: from - 18, fx: 'riser', g: 0.4, d: 0.6}, {f: from, fx: 'pop', g: 0.6}];
    case 'glitch': return [{f: from, fx: 'glitch', g: 0.8}];
    case 'circle': return [{f: from, fx: 'pop', g: 0.6}, {f: from + 2, fx: 'shimmer', g: 0.35, d: 0.7}];
    case 'slideUp': return [{f: from - 3, fx: 'whoosh_down', g: 0.65, d: 0.35}];
  }
};

// ---------- ساخت نقشه ----------
export const makePlan = (p: ContentProps): Plan => {
  const seed = Math.abs(Math.floor(p.seed || 1));
  const r = rngFrom(seed);

  const hook = choose<HookType>(['slam', 'zoomType', 'drop', 'glitch'], r);

  // سه صحنهٔ میانی، هر کدام از یک گروه تا همیشه «ادعای روی جعبه»، «ترکیبات» و «تصویر محصول» دیده شوند
  const claimGroup: MidType[] = ['poster', 'karaoke', 'notify'];
  const ingGroup: MidType[] = p.ingredients.length ? ['neon', 'orbit', 'checklist'] : ['checklist'];
  const visGroup: MidType[] = ['glass', 'grid', 'orbit'];
  const mids: MidType[] = [];
  for (const g of shuffle([claimGroup, ingGroup, visGroup], r)) {
    const options = g.filter((x) => !mids.includes(x));
    if (options.length) mids.push(choose(options, r));
  }
  if (!mids.includes('orbit') && hook !== 'drop' && !mids.some((m) => m === 'glass' || m === 'grid')) mids.push('glass');
  const order = shuffle(mids, r);
  if (packNumber(p.packInfo) > 0 && r() < 0.45) order.splice(1 + Math.floor(r() * order.length), 0, 'counter');

  const outro = choose<OutroType>(['studio', 'minimal', 'card'], r);

  const transitions = shuffle<Transition>(['punch', 'whip', 'zoom', 'glitch', 'circle', 'slideUp'], r);

  const segments: Segment[] = [];
  let from = 0;
  const push = (kind: Segment['kind'], type: SceneType, i: number) => {
    const dur = durationOf(type, p);
    segments.push({kind, type, from, dur, transition: i === 0 ? 'none' : transitions[(i - 1) % transitions.length], v: r()});
    from += dur;
  };
  push('hook', hook, 0);
  order.forEach((m, i) => push('mid', m, i + 1));
  push('outro', outro, order.length + 1);

  const bpm = choose([96, 100, 104, 110, 116, 122], r);
  const cues: Cue[] = [];
  for (const s of segments) {
    if (s.transition !== 'none') cues.push(...transitionCues(s.transition, s.from));
    for (const c of sceneCues(s.type, p, s.dur)) cues.push({...c, f: c.f + s.from});
  }

  return {
    seed,
    bpm,
    palette: Math.floor(r() * 6),
    overlay: choose(['grain', 'leak', 'vignette', 'none'] as const, r),
    pulse: r() < 0.6,
    segments,
    total: from,
    cues: cues.filter((c) => c.f >= 0 && c.f < from).sort((a, b) => a.f - b.f),
  };
};
