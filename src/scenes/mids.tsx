// صحنه‌های میانی؛ هر ویدیو ۳ یا ۴ تا از این‌ها را با ترتیب متفاوت می‌گیرد.
// فریم افکت‌ها در src/plan.ts (sceneCues) با همین انیمیشن‌ها هماهنگ است.
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing, Img} from 'remotion';
import {BRAND, faDigits} from '../brand';
import {base, Chip, display, LogoMark, ProductImage, resolveSrc} from '../components';
import {checklistItems, notifyItems, packNumber, words} from '../plan';
import {BlurredBg, BoxNote, clampI, Particles, SceneProps} from './shared';

// شیشه‌ای سه‌بعدی
export const Glass: React.FC<SceneProps> = ({p, ac, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: f, fps, config: {damping: 14}});
  const rot = interpolate(f, [0, dur], [-14, 10]);
  const sweep = interpolate(f, [10, 70], [-120, 220], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${ac.glow}, ${ac.a} 45%, ${BRAND.navyDeep} 100%)`}}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{position: 'absolute', width: 120 + i * 40, height: 120 + i * 40, borderRadius: '50%', left: `${(i * 37) % 90}%`, top: `${(i * 53 + f * 0.4) % 100}%`, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.25)'}} />
      ))}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', perspective: 1400}}>
        <div style={{width: 820, height: 1100, borderRadius: 60, background: 'linear-gradient(145deg, rgba(255,255,255,.95), rgba(255,255,255,.75))', boxShadow: `0 60px 120px rgba(0,0,0,.45), inset 0 2px 0 #fff, 0 0 80px ${ac.glow}88`, transform: `rotateY(${rot}deg) rotateX(4deg) scale(${0.7 + enter * 0.3}) translateY(${(1 - enter) * 300}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative'}}>
          <ProductImage src={p.imageSrc} height={800} style={{boxShadow: 'none'}} />
          <div style={{...display, fontSize: 96, color: BRAND.navy, lineHeight: 1}}>{p.productFa}</div>
          <div style={{position: 'absolute', top: 0, bottom: 0, width: 160, left: `${sweep}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent)', transform: 'skewX(-18deg)'}} />
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 120, width: '100%', display: 'flex', justifyContent: 'center', opacity: clampI(f, [20, 35], [0, 1])}}>
        <Chip text={`${p.category} • ${p.packInfo}`} color={BRAND.navy} dark size={40} />
      </div>
    </AbsoluteFill>
  );
};

// نئون / تکنو
export const Neon: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = p.ingredients.slice(0, 4);
  const badgeStart = 22 + items.length * 14;
  return (
    <AbsoluteFill style={{background: BRAND.navyDeep}}>
      <AbsoluteFill style={{background: `repeating-linear-gradient(0deg, ${ac.glow}22 0 2px, transparent 2px 80px), repeating-linear-gradient(90deg, ${ac.glow}22 0 2px, transparent 2px 80px)`, transform: `perspective(900px) rotateX(58deg) translateY(${(f * 4) % 80}px) scale(2)`, transformOrigin: '50% 100%', top: '45%'}} />
      <AbsoluteFill style={{padding: '170px 80px', ...base, alignItems: 'stretch'}}>
        <div style={{...display, fontSize: 92, color: '#fff', textAlign: 'center', textShadow: `0 0 24px ${ac.glow}, 0 0 60px ${ac.a}`}}>روی جعبه چی نوشته؟</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 30, marginTop: 70}}>
          {items.map((t, i) => {
            const s = spring({frame: f - 10 - i * 14, fps, config: {damping: 12, stiffness: 160}});
            const c = i % 2 ? ac.b : ac.glow;
            const flicker = f - 10 - i * 14 < 8 && Math.floor(f / 2) % 2 ? 0.4 : 1;
            return (
              <div key={t} style={{fontSize: 58, fontWeight: 900, color: '#fff', padding: '30px 40px', borderRadius: 30, border: `3px solid ${c}`, boxShadow: `0 0 30px ${c}, inset 0 0 22px ${c}66`, background: 'rgba(6,22,46,.6)', transform: `translateX(${(1 - s) * 700}px)`, opacity: s * flicker, display: 'flex', alignItems: 'center', gap: 24}}>
                <span style={{color: c, fontSize: 46}}>◆</span>
                {t}
              </div>
            );
          })}
        </div>
        <div style={{display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 50}}>
          {p.badges.slice(0, 3).map((b, i) => {
            const s = spring({frame: f - badgeStart - i * 5, fps, config: {damping: 10, stiffness: 220}});
            return (
              <div key={b} style={{transform: `scale(${s})`}}>
                <Chip text={b} color="#fff" size={32} />
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// پوستر بولد
export const Poster: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 11, stiffness: 140}});
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <div style={{position: 'absolute', inset: 0, background: ac.b, clipPath: `polygon(0 0, 100% 0, 100% ${clampI(f, [0, 14], [0, 46])}%, 0 ${clampI(f, [0, 14], [0, 58])}%)`}} />
      <AbsoluteFill style={{alignItems: 'center', padding: '200px 70px', ...base}}>
        <div style={{...display, fontSize: 130, color: '#fff', lineHeight: 1.05, textAlign: 'center', transform: `scale(${s})`}}>{p.productFa}</div>
        <div style={{flex: 1}} />
        <div style={{...display, fontSize: 104, color: BRAND.navy, textAlign: 'center', lineHeight: 1.25, transform: `translateY(${(1 - s) * 200}px)`, opacity: s}}>{p.boxClaim}</div>
        <div style={{marginTop: 34, opacity: clampI(f, [20, 34], [0, 1])}}>
          <BoxNote />
        </div>
        <div style={{flex: 1}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// اعلان‌های گوشی (ترند UI): هر ۱۶ فریم یک کارت از بالا می‌آید
export const Notify: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = notifyItems(p);
  return (
    <AbsoluteFill>
      <BlurredBg src={p.imageSrc} tint={BRAND.navyDeep} dim={0.45} />
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${ac.a}55, transparent 40%)`}} />
      <div style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center', ...base, color: '#fff'}}>
        <div style={{fontSize: 36, fontWeight: 700, opacity: 0.85}}>{p.category} تازه</div>
        <div style={{fontFamily: 'Vazirmatn', fontWeight: 400, fontSize: 200, lineHeight: 1.1}}>{p.productFa}</div>
      </div>
      <div style={{position: 'absolute', top: 640, left: 60, right: 60, display: 'flex', flexDirection: 'column', gap: 26}}>
        {items.map((t, i) => {
          const s = spring({frame: f - 10 - i * 16, fps, config: {damping: 13, stiffness: 170}});
          return (
            <div key={i} style={{transform: `translateY(${(1 - s) * -420}px) scale(${0.92 + s * 0.08})`, opacity: s, background: 'rgba(255,255,255,.86)', borderRadius: 46, padding: '28px 34px', boxShadow: '0 20px 50px rgba(0,0,0,.25)', ...base}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
                <div style={{width: 76, height: 76, borderRadius: 20, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.12)'}}>
                  <LogoMark size={56} />
                </div>
                <div style={{fontSize: 32, fontWeight: 700, color: BRAND.ink, flex: 1}}>{BRAND.name}</div>
                <div style={{fontSize: 28, color: '#6B7A90'}}>اکنون</div>
              </div>
              {i === 0 && <div style={{fontSize: 28, fontWeight: 700, color: ac.a, marginTop: 14}}>طبق نوشتهٔ روی جعبه</div>}
              <div style={{fontSize: i === 0 ? 46 : 50, fontWeight: 900, color: BRAND.ink, marginTop: 10, lineHeight: 1.35}}>{t}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// زیرنویس کلمه‌به‌کلمه (ترند کپ‌کات): هر ۷ فریم یک کلمه، گروه‌های ۳تایی
export const Karaoke: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const w = words(p.boxClaim);
  const k = Math.max(0, Math.min(w.length - 1, Math.floor((f - 10) / 7)));
  const g = Math.floor(k / 3);
  const group = w.slice(g * 3, g * 3 + 3);
  const img = spring({frame: f, fps, config: {damping: 14}});
  return (
    <AbsoluteFill>
      <BlurredBg src={p.imageSrc} tint={BRAND.navyDeep} dim={0.5} />
      <div style={{position: 'absolute', top: 170, width: '100%', display: 'flex', justifyContent: 'center', transform: `scale(${0.85 + img * 0.15}) rotate(${(1 - img) * -6}deg)`, opacity: img}}>
        <ProductImage src={p.imageSrc} height={800} />
      </div>
      <div style={{position: 'absolute', top: 1110, left: 40, right: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18, direction: 'rtl'}}>
        {f >= 10 &&
          group.map((word, i) => {
            const idx = g * 3 + i;
            const active = idx === k;
            const shown = idx <= k;
            const s = spring({frame: f - 10 - idx * 7, fps, config: {damping: 12, stiffness: 260}});
            return (
              <span key={idx} style={{...display, fontSize: 118, lineHeight: 1.2, padding: '6px 26px', borderRadius: 28, color: '#fff', background: active ? ac.b : 'transparent', textShadow: active ? 'none' : '0 6px 0 rgba(0,0,0,.45), 0 0 18px rgba(0,0,0,.5)', transform: `scale(${shown ? 0.85 + s * (active ? 0.25 : 0.15) : 0})`, opacity: shown ? 1 : 0}}>
                {word}
              </span>
            );
          })}
      </div>
      <div style={{position: 'absolute', bottom: 170, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <BoxNote dark />
      </div>
    </AbsoluteFill>
  );
};

// مدار: محصول وسط، ترکیبات دورش می‌چرخند
export const Orbit: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = p.ingredients.slice(0, 4);
  const enter = spring({frame: f, fps, config: {damping: 13}});
  const chips = items.map((t, i) => {
    const ang = f * 0.035 + (i * Math.PI * 2) / Math.max(1, items.length);
    const depth = Math.sin(ang);
    const s = spring({frame: f - 8 - i * 6, fps, config: {damping: 11, stiffness: 200}});
    return {t, x: Math.cos(ang) * 400, y: depth * 150, depth, s, i};
  });
  const chip = (c: (typeof chips)[number]) => (
    <div key={c.i} style={{position: 'absolute', left: 540 + c.x, top: 860 + c.y, transform: `translate(-50%, -50%) scale(${(0.78 + 0.28 * (c.depth + 1) / 2) * c.s})`, opacity: c.s * (0.55 + 0.45 * (c.depth + 1) / 2), ...base, fontSize: 44, fontWeight: 900, color: BRAND.ink, background: 'rgba(255,255,255,.92)', padding: '18px 34px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: `0 0 30px ${ac.glow}88`}}>
      {c.t}
    </div>
  );
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, ${ac.a}, ${BRAND.navyDeep} 70%)`}}>
      <Particles color={ac.glow} seed={`o${p.seed}`} />
      {chips.filter((c) => c.depth < 0).map(chip)}
      <div style={{position: 'absolute', top: 860, left: 540, transform: `translate(-50%, -50%) perspective(1200px) rotateY(${Math.sin(f / 18) * 14}deg) scale(${0.6 + enter * 0.4})`}}>
        <ProductImage src={p.imageSrc} height={700} />
      </div>
      {chips.filter((c) => c.depth >= 0).map(chip)}
      <div style={{position: 'absolute', bottom: 240, width: '100%', textAlign: 'center', ...display, fontSize: 120, color: '#fff', textShadow: `0 0 40px ${ac.glow}`, opacity: clampI(f, [14, 26], [0, 1])}}>{p.productFa}</div>
    </AbsoluteFill>
  );
};

// شبکهٔ ۲×۲: چهار کاشی پاپ می‌شوند، بعد یکی بزرگ می‌شود
export const Grid: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const tints = [BRAND.lightBlue, '#E3F5EA', '#FFFFFF', ac.glow + '55'];
  const pos = [[60, 220], [560, 220], [60, 900], [560, 900]];
  const collapse = clampI(f, [38, 46], [0, 1], Easing.inOut(Easing.cubic));
  const name = spring({frame: f - 44, fps, config: {damping: 9, stiffness: 180}});
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <AbsoluteFill style={{background: `repeating-linear-gradient(45deg, ${ac.a}0D 0 30px, transparent 30px 60px)`}} />
      {pos.map(([x, y], i) => {
        const s = spring({frame: f - 4 - i * 5, fps, config: {damping: 10, stiffness: 200}});
        const main = i === 0;
        const tx = main ? x + (140 - x) * collapse : x + (x < 300 ? -700 : 700) * collapse;
        const ty = main ? y + (200 - y) * collapse : y + (y < 500 ? -400 : 600) * collapse;
        const w = main ? 460 + 340 * collapse : 460;
        const h = main ? 640 + 360 * collapse : 640;
        return (
          <div key={i} style={{position: 'absolute', left: tx, top: ty, width: w, height: h, borderRadius: 44, background: tints[i], overflow: 'hidden', transform: `scale(${s}) rotate(${(1 - s) * (i % 2 ? 8 : -8)}deg)`, boxShadow: '0 20px 50px rgba(14,42,84,.18)', opacity: main ? 1 : 1 - collapse, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Img src={resolveSrc(p.imageSrc)} style={{width: '88%', height: '88%', objectFit: 'contain', borderRadius: 24}} />
          </div>
        );
      })}
      <div style={{position: 'absolute', top: 1270, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, transform: `scale(${name})`, opacity: name}}>
        <div style={{...display, fontSize: 140, color: BRAND.navy}}>{p.productFa}</div>
        <Chip text={`${p.category} • ${p.packInfo}`} color={ac.a} dark size={40} />
      </div>
    </AbsoluteFill>
  );
};

// چک‌لیست: تیک‌ها یکی‌یکی کشیده می‌شوند (click در 20+12i)
export const Checklist: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const items = checklistItems(p);
  const card = spring({frame: f, fps, config: {damping: 14}});
  return (
    <AbsoluteFill style={{background: ac.a}}>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(-45deg, rgba(255,255,255,.07) 0 22px, transparent 22px 44px)'}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: '0 60px'}}>
      <div style={{alignSelf: 'stretch', background: '#fff', borderRadius: 60, padding: '70px 60px 80px', transform: `translateY(${(1 - card) * 1800}px)`, ...base, display: 'flex', flexDirection: 'column', boxShadow: '0 40px 90px rgba(0,0,0,.25)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
          <ProductImage src={p.imageSrc} height={300} style={{boxShadow: '0 10px 24px rgba(14,42,84,.15)'}} />
          <div>
            <div style={{...display, fontSize: 96, color: BRAND.navy, lineHeight: 1.05}}>{p.productFa}</div>
            <div style={{fontSize: 36, fontWeight: 700, color: ac.a, marginTop: 8}}>{p.packInfo}</div>
          </div>
        </div>
        <div style={{...display, fontSize: 80, color: BRAND.navy, marginTop: 70}}>روی جعبه:</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 46, marginTop: 40}}>
          {items.map((t, i) => {
            const draw = clampI(f, [14 + i * 12, 20 + i * 12], [1, 0]);
            const row = spring({frame: f - 16 - i * 12, fps, config: {damping: 12, stiffness: 200}});
            return (
              <div key={t} style={{display: 'flex', alignItems: 'center', gap: 30}}>
                <svg width="110" height="110" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="44" fill={draw < 1 ? BRAND.green : '#EEF3F8'} />
                  <path d="M28 50 L42 63 L69 34" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
                </svg>
                <div style={{fontSize: 68, fontWeight: 900, color: BRAND.ink, transform: `translateX(${(1 - row) * -80}px)`, opacity: row}}>{t}</div>
              </div>
            );
          })}
        </div>
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// شمارنده: عدد بسته از صفر بالا می‌رود (riser 6→36، boom در 36)
export const Counter: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const N = packNumber(p.packInfo);
  const prog = clampI(f, [6, 36], [0, 1], Easing.out(Easing.cubic));
  const val = Math.round(N * prog);
  const unit = p.packInfo.replace(/[0-9۰-۹]+/, '').trim();
  const hit = spring({frame: f - 36, fps, config: {damping: 8, stiffness: 220}});
  const R = 300;
  const C = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${ac.a}AA, ${BRAND.navyDeep} 72%)`, alignItems: 'center'}}>
      <Particles color={ac.glow} n={18} seed={`c${p.seed}`} />
      <div style={{position: 'absolute', top: 300, width: 700, height: 700}}>
        <svg width="700" height="700" viewBox="0 0 700 700" style={{position: 'absolute', transform: 'rotate(-90deg)'}}>
          <circle cx="350" cy="350" r={R} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="26" />
          <circle cx="350" cy="350" r={R} fill="none" stroke={ac.glow} strokeWidth="26" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - prog)} style={{filter: `drop-shadow(0 0 18px ${ac.glow})`}} />
        </svg>
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + hit * 0.08 - (f > 36 ? 0.08 : 0)})`}}>
          <div style={{...display, fontSize: 300, color: '#fff', lineHeight: 1}}>{faDigits(String(val))}</div>
          <div style={{...base, fontSize: 64, fontWeight: 900, color: ac.glow}}>{unit}</div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 1140, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, opacity: hit, transform: `translateY(${(1 - hit) * 80}px)`}}>
        <div style={{...display, fontSize: 130, color: '#fff'}}>{p.productFa}</div>
        <Chip text={p.category} color="#fff" size={40} />
      </div>
    </AbsoluteFill>
  );
};
