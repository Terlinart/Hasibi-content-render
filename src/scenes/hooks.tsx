// هوک‌ها: ۲ ثانیهٔ اول؛ هر ویدیو یکی از این چهار سبک را می‌گیرد.
import React from 'react';
import {AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BRAND} from '../brand';
import {base, display, Logo, LogoMark, ProductImage} from '../components';
import {words} from '../plan';
import {clampI, SceneProps} from './shared';

// ۱) تایپوگرافی کوبنده: کلمه‌ها یکی‌یکی می‌پرند (pop در فریم 4+4i)
export const HookSlam: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - 12, fps, config: {damping: 9, stiffness: 180}});
  return (
    <AbsoluteFill style={{background: ac.a, alignItems: 'center', justifyContent: 'center'}}>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(-30deg, rgba(255,255,255,.09) 0 40px, transparent 40px 80px)', transform: `translateX(${-f * 6}px)`}} />
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, direction: 'rtl', padding: '0 60px'}}>
        {words(p.hook).map((w, i) => {
          const ws = spring({frame: f - 4 - i * 4, fps, config: {damping: 10, stiffness: 220}});
          return (
            <span key={i} style={{...display, fontSize: 190, color: i % 2 ? BRAND.navy : '#fff', transform: `translateY(${(1 - ws) * 120}px) scale(${0.6 + ws * 0.4})`, opacity: ws, textShadow: '0 12px 0 rgba(0,0,0,.15)'}}>
              {w}
            </span>
          );
        })}
      </div>
      <div style={{position: 'absolute', bottom: 250, transform: `scale(${s})`}}>
        <Logo size={150} />
      </div>
    </AbsoluteFill>
  );
};

// ۲) زوم‌تایپ: هر کلمه تمام‌صفحه، هر ۸ فریم یک برش (click)
export const HookZoomType: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const w = words(p.hook);
  const i = Math.min(w.length - 1, Math.floor(f / 8));
  const lf = f - i * 8;
  const bgs = [ac.a, BRAND.navy, '#FFFFFF', ac.b];
  const bg = bgs[i % bgs.length];
  const fg = bg === '#FFFFFF' ? BRAND.navy : '#fff';
  const done = f >= w.length * 8;
  const end = spring({frame: f - w.length * 8, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{background: bg, alignItems: 'center', justifyContent: 'center'}}>
      {!done ? (
        <div style={{...display, fontSize: 300, color: fg, transform: `scale(${clampI(lf, [0, 7], [2.6, 1])})`, filter: `blur(${clampI(lf, [0, 3], [14, 0])}px)`, whiteSpace: 'nowrap'}}>{w[i]}</div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, transform: `scale(${0.8 + end * 0.2})`}}>
          <div style={{...display, fontSize: 140, color: fg, textAlign: 'center', padding: '0 60px', lineHeight: 1.15}}>{p.hook}</div>
          <LogoMark size={190 * end} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ۳) دراپ: محصول از بالا می‌افتد (boom در فریم 11) و جمله کلمه‌به‌کلمه می‌آید
export const HookDrop: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = spring({frame: f, fps, config: {damping: 9, stiffness: 120, mass: 0.9}});
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, #FFFFFF 0%, ${BRAND.lightBlue} 100%)`, alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 260, opacity: 0.07}}>
        <LogoMark size={1100} />
      </div>
      <div style={{marginTop: 210, transform: `translateY(${(1 - d) * -1700}px) rotate(${(1 - d) * 14}deg)`}}>
        <ProductImage src={p.imageSrc} height={940} />
      </div>
      <div style={{width: 520 * Math.min(1, d), height: 40, borderRadius: '50%', background: 'rgba(14,42,84,.18)', filter: 'blur(14px)', marginTop: 10}} />
      <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22, direction: 'rtl', marginTop: 60, padding: '0 60px'}}>
        {words(p.hook).map((w, i) => {
          const ws = spring({frame: f - 18 - i * 5, fps, config: {damping: 11, stiffness: 240}});
          return (
            <span key={i} style={{...display, fontSize: 130, color: i % 2 ? ac.b : ac.a, transform: `scale(${ws})`, opacity: ws}}>
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ۴) گلیچ: متن با جابه‌جایی رنگ قرمز/فیروزه‌ای (glitch در فریم 0 و 24)
export const HookGlitch: React.FC<SceneProps> = ({p, ac}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const hot = f < 10 || (f >= 24 && f < 30);
  const j = (k: string) => (hot ? (random(`${k}${f}`) - 0.5) * 50 : 0);
  const sub = spring({frame: f - 30, fps, config: {damping: 12}});
  const layer = (color: string, dx: number, dy: number, blend?: string) => (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translate(${dx}px, ${dy}px)`, mixBlendMode: blend as any}}>
      <div style={{...display, fontSize: 170, color, textAlign: 'center', padding: '0 60px', lineHeight: 1.15}}>{p.hook}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{background: BRAND.navyDeep}}>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 2px, transparent 2px 7px)'}} />
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, ${ac.a}88, transparent 60%)`}} />
      {layer('#FF2D6F', j('r') - 8, j('ry'), 'screen')}
      {layer('#00E5FF', j('c') + 8, j('cy'), 'screen')}
      {layer('#FFFFFF', 0, 0)}
      {hot && <div style={{position: 'absolute', left: 0, right: 0, top: 600 + random(`b${f}`) * 600, height: 40 + random(`h${f}`) * 80, background: `${ac.glow}55`, mixBlendMode: 'screen'}} />}
      <div style={{position: 'absolute', bottom: 260, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, opacity: sub, transform: `translateY(${(1 - sub) * 60}px)`}}>
        <LogoMark size={150} />
        <div style={{...base, color: '#fff', fontWeight: 900, fontSize: 44}}>{p.productFa}</div>
      </div>
    </AbsoluteFill>
  );
};
