// پایان‌بندی‌ها؛ همه آدرس «کرمان، کوهپایه»، تلفن، ساعت کاری، QR و جملهٔ ارجاع به دکتر را دارند.
import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {BRAND, pick} from '../brand';
import {base, Disclaimer, display, Footer, Logo, NavyFrame, QR} from '../components';
import {clampI, Particles, SceneProps} from './shared';

const qrColorFor = (seed: number) => pick([BRAND.navy, BRAND.blue, BRAND.green, '#0D47A1'], seed, 3);

// استودیویی (قاب سرمه‌ای)
export const OutroStudio: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - 4, fps, config: {damping: 13}});
  return (
    <NavyFrame thickness={34} bg={`radial-gradient(circle at 50% 30%, #FFFFFF, #E6F0FA 60%, ${ac.glow}66)`}>
      <AbsoluteFill style={{alignItems: 'center', padding: '100px 60px', ...base}}>
        <div style={{transform: `scale(${s}) rotate(${(1 - s) * -90}deg)`}}>
          <Logo size={380} />
        </div>
        <div style={{fontSize: 40, fontWeight: 700, color: ac.a, marginTop: 30, opacity: clampI(f, [10, 24], [0, 1])}}>{BRAND.consult}</div>
        <div style={{marginTop: 60, display: 'flex', alignItems: 'center', gap: 40, opacity: clampI(f, [18, 34], [0, 1])}}>
          <QR size={280} color={qrColorFor(p.seed)} dots={p.seed % 2 === 0} />
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

// مینیمال: موج‌های دایره‌ای پشت لوگو
export const OutroMinimal: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - 4, fps, config: {damping: 10, stiffness: 160}});
  const t1 = spring({frame: f - 18, fps, config: {damping: 12}});
  const t2 = spring({frame: f - 24, fps, config: {damping: 12}});
  const t3 = spring({frame: f - 34, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{background: '#fff', alignItems: 'center', ...base}}>
      {[0, 1, 2].map((i) => {
        const lf = (f - 4 - i * 10 + 60) % 60;
        return <div key={i} style={{position: 'absolute', top: 640 - 260, left: 540 - 260, width: 520, height: 520, borderRadius: '50%', border: `6px solid ${i % 2 ? ac.b : ac.a}`, transform: `scale(${1 + lf / 25})`, opacity: f < 4 ? 0 : clampI(lf, [0, 60], [0.6, 0], Easing.linear)}} />;
      })}
      <div style={{position: 'absolute', top: 380, transform: `scale(${s})`}}>
        <Logo size={520} />
      </div>
      <div style={{position: 'absolute', top: 960, width: '100%', textAlign: 'center'}}>
        <div style={{...display, fontSize: 110, color: BRAND.navy, transform: `translateY(${(1 - t1) * 60}px)`, opacity: t1}}>فالو کنید</div>
        <div style={{fontSize: 44, fontWeight: 700, color: BRAND.blue, direction: 'ltr', opacity: t2}}>@{BRAND.instagram}</div>
      </div>
      <div style={{position: 'absolute', top: 1220, left: 60, right: 60, display: 'flex', alignItems: 'center', gap: 34, opacity: t3, transform: `translateY(${(1 - t3) * 60}px)`}}>
        <QR size={230} color={qrColorFor(p.seed)} dots={p.seed % 2 === 1} />
        <div style={{flex: 1, fontSize: 34, fontWeight: 700, color: BRAND.ink, lineHeight: 1.8}}>
          <div>📍 {BRAND.address}</div>
          <div>📞 {BRAND.phone}</div>
          <div>🕘 {BRAND.hours}</div>
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 120, width: '100%', opacity: t3}}>
        <Disclaimer size={26} />
      </div>
    </AbsoluteFill>
  );
};

// کارت ویزیت که برمی‌گردد (چرخش در فریم 30 تا 46)
export const OutroCard: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame: f - 2, fps, config: {damping: 12}});
  const flip = clampI(f, [30, 46], [0, 180], Easing.inOut(Easing.cubic));
  const tail = spring({frame: f - 52, fps, config: {damping: 12}});
  const face: React.CSSProperties = {position: 'absolute', inset: 0, borderRadius: 50, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.45)'};
  return (
    <AbsoluteFill style={{background: `linear-gradient(160deg, ${BRAND.navy}, ${BRAND.navyDeep})`, ...base}}>
      <Particles color={ac.glow} n={20} seed={`k${p.seed}`} />
      <div style={{position: 'absolute', top: 420, left: 90, width: 900, height: 900, perspective: 2200}}>
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `translateY(${(1 - enter) * 1400}px) rotateY(${flip}deg) rotateZ(${(1 - enter) * -12}deg)`}}>
          <div style={{...face, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Logo size={760} ring={false} />
          </div>
          <div style={{...face, background: '#fff', transform: 'rotateY(180deg)', padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
            <div style={{...display, fontSize: 80, color: BRAND.navy}}>{BRAND.name}</div>
            <QR size={330} color={qrColorFor(p.seed)} dots={p.seed % 2 === 0} />
            <div style={{fontSize: 40, fontWeight: 700, color: BRAND.ink, lineHeight: 1.7, textAlign: 'center'}}>
              <div>📍 {BRAND.address}</div>
              <div>📞 {BRAND.phone} • 🕘 {BRAND.hours}</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{position: 'absolute', top: 1400, width: '100%', textAlign: 'center', opacity: tail, transform: `translateY(${(1 - tail) * 60}px)`}}>
        <div style={{...display, fontSize: 90, color: '#fff'}}>فالو کنید</div>
        <div style={{fontSize: 40, fontWeight: 700, color: ac.glow, direction: 'ltr'}}>@{BRAND.instagram}</div>
        <div style={{marginTop: 50}}>
          <Disclaimer dark size={26} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 1400, left: 0, right: 0, opacity: f < 52 ? clampI(f, [8, 20], [0, 1]) : 0}}>
        <Footer size={34} dark />
      </div>
    </AbsoluteFill>
  );
};
