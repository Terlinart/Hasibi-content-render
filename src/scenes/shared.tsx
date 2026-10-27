import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, random, useCurrentFrame} from 'remotion';
import type {Accent, ContentProps} from '../brand';
import {BRAND} from '../brand';
import {resolveSrc} from '../components';
import type {Transition} from '../plan';

export type SceneProps = {p: ContentProps; ac: Accent; dur: number; v: number};

export const clampI = (f: number, i: number[], o: number[], ease = Easing.out(Easing.cubic)) =>
  interpolate(f, i, o, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

// تصویر محصول تمام‌صفحه و مات برای پس‌زمینهٔ صحنه‌های «اپ‌گونه»
export const BlurredBg: React.FC<{src: string; tint?: string; dim?: number}> = ({src, tint = BRAND.navyDeep, dim = 0.55}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: tint}}>
      <Img
        src={resolveSrc(src)}
        style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(46px) saturate(1.4)', transform: `scale(${1.35 + f * 0.0015})`}}
      />
      <AbsoluteFill style={{background: tint, opacity: dim}} />
    </AbsoluteFill>
  );
};

// ذرات نورانی شناور
export const Particles: React.FC<{color: string; n?: number; seed?: string}> = ({color, n = 28, seed = 'p'}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({length: n}).map((_, i) => {
        const x = random(`${seed}x${i}`) * 1080;
        const y = (random(`${seed}y${i}`) * 1920 - f * (1 + random(`${seed}s${i}`) * 3) + 1920 * 2) % 1920;
        const r = 3 + random(`${seed}r${i}`) * 7;
        return (
          <div
            key={i}
            style={{position: 'absolute', left: x, top: y, width: r, height: r, borderRadius: '50%', background: color, opacity: 0.25 + 0.5 * random(`${seed}o${i}`), boxShadow: `0 0 ${r * 3}px ${color}`}}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ورود هر صحنه با یک ترنزیشن (صحنهٔ قبلی چند فریم زیرش ادامه دارد)
export const Enter: React.FC<{t: Transition | 'none'; children: React.ReactNode}> = ({t, children}) => {
  const f = useCurrentFrame();
  let style: React.CSSProperties = {};
  let overlay: React.ReactNode = null;
  switch (t) {
    case 'punch':
      style = {transform: `scale(${clampI(f, [0, 8], [1.14, 1])})`};
      overlay = <AbsoluteFill style={{background: '#fff', opacity: clampI(f, [0, 6], [0.9, 0])}} />;
      break;
    case 'whip':
      style = {transform: `translateX(${clampI(f, [0, 7], [1100, 0])}px)`, filter: `blur(${clampI(f, [0, 7], [40, 0])}px)`};
      break;
    case 'zoom':
      style = {transform: `scale(${clampI(f, [0, 9], [0.5, 1])}) rotate(${clampI(f, [0, 9], [-9, 0])}deg)`, opacity: clampI(f, [0, 4], [0, 1])};
      break;
    case 'glitch': {
      const on = f < 8;
      const jx = on ? (random(`gx${f}`) - 0.5) * 120 : 0;
      style = {transform: `translateX(${jx}px)`, filter: on ? `hue-rotate(${((f % 3) - 1) * 25}deg) saturate(1.8) contrast(1.3)` : undefined};
      overlay = on ? (
        <AbsoluteFill style={{background: `repeating-linear-gradient(0deg, rgba(255,0,90,.25) 0 ${6 + (f % 3) * 4}px, transparent 0 ${30 + (f % 4) * 9}px)`, mixBlendMode: 'screen'}} />
      ) : null;
      break;
    }
    case 'circle':
      style = {clipPath: `circle(${clampI(f, [0, 11], [0, 85], Easing.inOut(Easing.cubic))}% at 50% 50%)`};
      break;
    case 'slideUp':
      style = {transform: `translateY(${clampI(f, [0, 8], [1920, 0], Easing.out(Easing.exp))}px)`};
      break;
  }
  return (
    <AbsoluteFill style={style}>
      {children}
      {overlay}
    </AbsoluteFill>
  );
};

// بافت‌های روی کل ویدیو
export const Overlay: React.FC<{kind: 'grain' | 'leak' | 'vignette' | 'none'; ac: Accent}> = ({kind, ac}) => {
  const f = useCurrentFrame();
  if (kind === 'grain')
    return (
      <AbsoluteFill style={{opacity: 0.13, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
        <svg width="1080" height="1920">
          <filter id="grainF">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 30} />
          </filter>
          <rect width="1080" height="1920" filter="url(#grainF)" />
        </svg>
      </AbsoluteFill>
    );
  if (kind === 'leak')
    return (
      <AbsoluteFill
        style={{
          mixBlendMode: 'screen',
          opacity: 0.35,
          background: `radial-gradient(circle at ${50 + 40 * Math.sin(f / 40)}% ${30 + 20 * Math.cos(f / 55)}%, ${ac.glow}AA, transparent 45%), radial-gradient(circle at ${20 + 30 * Math.cos(f / 33)}% 85%, #FFD9A855, transparent 40%)`,
        }}
      />
    );
  if (kind === 'vignette') return <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,.45) 100%)'}} />;
  return null;
};
