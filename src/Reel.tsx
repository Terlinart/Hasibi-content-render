import React from 'react';
import {AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {ACCENTS, BRAND, ContentProps, pick} from './brand';
import {base, Chip, Disclaimer, display, Footer, Logo, NavyFrame, ProductImage, QR, useFonts} from './components';

export const REEL_FPS = 30;
// زمان‌بندی صحنه‌ها (فریم) — scripts/audio.py همین را برای افکت‌ها می‌خواند.
export const SCENE_LEN = {hook: 54, glass: 120, neon: 150, poster: 96, outro: 120};
export const REEL_FRAMES = Object.values(SCENE_LEN).reduce((a, b) => a + b, 0); // 540 = 18s

type Ac = {a: string; b: string; glow: string};

const clampI = (f: number, i: number[], o: number[], ease = Easing.out(Easing.cubic)) =>
  interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

// فلش سفید + پانچ زوم روی هر برش
const Punch: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const scale = clampI(f, [0, 8], [1.12, 1]);
  const flash = clampI(f, [0, 6], [0.85, 0]);
  return (
    <AbsoluteFill style={{transform: `scale(${scale})`}}>
      {children}
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

// ۱) هوک سریع — پوستر بولد
const Hook: React.FC<{p: ContentProps; ac: Ac}> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 9, stiffness: 180}});
  const words = p.hook.split(' ');
  return (
    <AbsoluteFill style={{background: ac.a, alignItems: 'center', justifyContent: 'center'}}>
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(-30deg, rgba(255,255,255,.08) 0 40px, transparent 40px 80px)`,
          transform: `translateX(${-f * 6}px)`,
        }}
      />
      <div style={{...display, fontSize: 70, color: '#fff', opacity: clampI(f, [0, 6], [0, 1])}}>{BRAND.greeting}</div>
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, direction: 'rtl', padding: '0 60px'}}>
        {words.map((w, i) => {
          const ws = spring({frame: f - 4 - i * 4, fps, config: {damping: 10, stiffness: 220}});
          return (
            <span
              key={i}
              style={{
                ...display,
                fontSize: 190,
                color: i % 2 ? BRAND.navy : '#fff',
                transform: `translateY(${(1 - ws) * 120}px) scale(${0.6 + ws * 0.4})`,
                opacity: ws,
                textShadow: '0 12px 0 rgba(0,0,0,.15)',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', bottom: 260, transform: `scale(${s})`}}>
        <Logo size={150} />
      </div>
    </AbsoluteFill>
  );
};

// ۲) سه‌بعدی / شیشه‌ای
const Glass: React.FC<{p: ContentProps; ac: Ac}> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const enter = spring({frame: f, fps, config: {damping: 14}});
  const rot = interpolate(f, [0, durationInFrames], [-14, 10]);
  const sweep = interpolate(f, [10, 70], [-120, 220], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${ac.glow}, ${ac.a} 45%, ${BRAND.navyDeep} 100%)`}}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 120 + i * 40,
            height: 120 + i * 40,
            borderRadius: '50%',
            left: `${(i * 37) % 90}%`,
            top: `${(i * 53 + f * 0.4) % 100}%`,
            background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.25)',
            backdropFilter: 'blur(4px)',
          }}
        />
      ))}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', perspective: 1400}}>
        <div
          style={{
            width: 820,
            height: 1100,
            borderRadius: 60,
            background: 'linear-gradient(145deg, rgba(255,255,255,.95), rgba(255,255,255,.75))',
            boxShadow: `0 60px 120px rgba(0,0,0,.45), inset 0 2px 0 #fff, 0 0 80px ${ac.glow}88`,
            transform: `rotateY(${rot}deg) rotateX(4deg) scale(${0.7 + enter * 0.3}) translateY(${(1 - enter) * 300}px)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <ProductImage src={p.imageSrc} height={800} style={{boxShadow: 'none'}} />
          <div style={{...display, fontSize: 96, color: BRAND.navy, lineHeight: 1}}>{p.productFa}</div>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 160,
              left: `${sweep}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent)',
              transform: 'skewX(-18deg)',
            }}
          />
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 120, width: '100%', display: 'flex', justifyContent: 'center', opacity: clampI(f, [20, 35], [0, 1])}}>
        <Chip text={`${p.category} • ${p.packInfo}`} color={BRAND.navy} dark size={40} />
      </div>
    </AbsoluteFill>
  );
};

// ۳) نئون / تکنو — ترکیبات روی جعبه
const Neon: React.FC<{p: ContentProps; ac: Ac}> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: BRAND.navyDeep}}>
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(0deg, ${ac.glow}22 0 2px, transparent 2px 80px), repeating-linear-gradient(90deg, ${ac.glow}22 0 2px, transparent 2px 80px)`,
          transform: `perspective(900px) rotateX(58deg) translateY(${(f * 4) % 80}px) scale(2)`,
          transformOrigin: '50% 100%',
          top: '45%',
        }}
      />
      <AbsoluteFill style={{padding: '170px 80px', ...base, alignItems: 'stretch'}}>
        <div style={{...display, fontSize: 92, color: '#fff', textAlign: 'center', textShadow: `0 0 24px ${ac.glow}, 0 0 60px ${ac.a}`}}>
          روی جعبه چی نوشته؟
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 30, marginTop: 70}}>
          {p.ingredients.map((t, i) => {
            const s = spring({frame: f - 10 - i * 14, fps, config: {damping: 12, stiffness: 160}});
            const c = i % 2 ? ac.b : ac.glow;
            const flicker = f - 10 - i * 14 < 8 && Math.floor(f / 2) % 2 ? 0.4 : 1;
            return (
              <div
                key={t}
                style={{
                  fontSize: 58,
                  fontWeight: 900,
                  color: '#fff',
                  padding: '30px 40px',
                  borderRadius: 30,
                  border: `3px solid ${c}`,
                  boxShadow: `0 0 30px ${c}, inset 0 0 22px ${c}66`,
                  background: 'rgba(6,22,46,.6)',
                  transform: `translateX(${(1 - s) * 700}px)`,
                  opacity: s * flicker,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                }}
              >
                <span style={{color: c, fontSize: 46}}>◆</span>
                {t}
              </div>
            );
          })}
        </div>
        <div style={{display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 50, opacity: clampI(f, [80, 100], [0, 1])}}>
          {p.badges.map((b) => (
            <Chip key={b} text={b} color="#fff" size={32} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ۴) پوستر بولد — ادعای روی جعبه
const Poster: React.FC<{p: ContentProps; ac: Ac}> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 11, stiffness: 140}});
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: ac.b,
          clipPath: `polygon(0 0, 100% 0, 100% ${clampI(f, [0, 14], [0, 46])}%, 0 ${clampI(f, [0, 14], [0, 58])}%)`,
        }}
      />
      <AbsoluteFill style={{alignItems: 'center', padding: '200px 70px', ...base}}>
        <div style={{...display, fontSize: 130, color: '#fff', lineHeight: 1.05, textAlign: 'center', transform: `scale(${s})`}}>{p.productFa}</div>
        <div style={{flex: 1}} />
        <div
          style={{
            ...display,
            fontSize: 104,
            color: BRAND.navy,
            textAlign: 'center',
            lineHeight: 1.25,
            transform: `translateY(${(1 - s) * 200}px)`,
            opacity: s,
          }}
        >
          {p.boxClaim}
        </div>
        <div style={{marginTop: 34, fontSize: 34, fontWeight: 700, color: '#5B6B80', opacity: clampI(f, [20, 34], [0, 1])}}>
          طبق نوشتهٔ روی جعبهٔ محصول
        </div>
        <div style={{flex: 1}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ۵) استودیویی / تیزر تلویزیونی — اوترو برند
const Outro: React.FC<{p: ContentProps; ac: Ac}> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f, fps, config: {damping: 13}});
  const qrColor = pick([BRAND.navy, BRAND.blue, BRAND.green, '#0D47A1'], p.seed, 3);
  return (
    <NavyFrame thickness={34} bg={`radial-gradient(circle at 50% 30%, #FFFFFF, #E6F0FA 60%, ${ac.glow}66)`}>
      <AbsoluteFill style={{alignItems: 'center', padding: '120px 60px', ...base}}>
        <div style={{transform: `scale(${s}) rotate(${(1 - s) * -90}deg)`}}>
          <Logo size={260} />
        </div>
        <div style={{...display, fontSize: 96, color: BRAND.navy, marginTop: 40, opacity: s}}>{BRAND.name}</div>
        <div style={{fontSize: 40, fontWeight: 700, color: ac.a, opacity: clampI(f, [10, 24], [0, 1])}}>{BRAND.consult}</div>
        <div style={{marginTop: 70, display: 'flex', alignItems: 'center', gap: 40, opacity: clampI(f, [18, 34], [0, 1])}}>
          <QR size={300} color={qrColor} dots={p.seed % 2 === 0} />
          <div>
            <div style={{...display, fontSize: 60, color: BRAND.navy}}>فالو کنید</div>
            <div style={{fontSize: 34, fontWeight: 700, color: BRAND.blue, direction: 'ltr'}}>@{BRAND.instagram}</div>
          </div>
        </div>
        <div style={{flex: 1}} />
        <div style={{alignSelf: 'stretch', background: BRAND.navy, borderRadius: 30, padding: '30px 20px', opacity: clampI(f, [26, 40], [0, 1])}}>
          <Footer size={36} dark />
        </div>
        <div style={{marginTop: 18}}>
          <Disclaimer size={26} />
        </div>
      </AbsoluteFill>
    </NavyFrame>
  );
};

export const Reel: React.FC<ContentProps> = (p) => {
  useFonts();
  const ac = pick(ACCENTS, p.seed);
  // ترتیب صحنه‌های میانی هر بار عوض می‌شود؛ هوک اول و اوترو آخر ثابت‌اند.
  const middles = [
    ['glass', 'neon', 'poster'],
    ['neon', 'glass', 'poster'],
    ['glass', 'poster', 'neon'],
  ][Math.abs(p.seed) % 3] as (keyof typeof SCENE_LEN)[];
  const order: (keyof typeof SCENE_LEN)[] = ['hook', ...middles, 'outro'];
  const C = {hook: Hook, glass: Glass, neon: Neon, poster: Poster, outro: Outro};
  let from = 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {order.map((k) => {
        const S = C[k];
        const start = from;
        from += SCENE_LEN[k];
        return (
          <Sequence key={k} from={start} durationInFrames={SCENE_LEN[k]}>
            <Punch>
              <S p={p} ac={ac} />
            </Punch>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const sceneOrderFor = (seed: number) => {
  const middles = [
    ['glass', 'neon', 'poster'],
    ['neon', 'glass', 'poster'],
    ['glass', 'poster', 'neon'],
  ][Math.abs(seed) % 3];
  return ['hook', ...middles, 'outro'];
};
