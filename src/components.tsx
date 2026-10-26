import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, Img, staticFile} from 'remotion';
import QRCode from 'qrcode';
import {BRAND} from './brand';

export const resolveSrc = (src: string) => (/^https?:|^data:/.test(src) ? src : staticFile(src));

// بارگذاری فونت‌ها قبل از رندر
const FONTS: [string, string, string][] = [
  ['Vazirmatn', 'fonts/vazirmatn-arabic-400-normal.woff2', '400'],
  ['Vazirmatn', 'fonts/vazirmatn-arabic-700-normal.woff2', '700'],
  ['Vazirmatn', 'fonts/vazirmatn-arabic-900-normal.woff2', '900'],
  ['Lalezar', 'fonts/lalezar-arabic-400-normal.woff2', '400'],
];
let fontsReady: Promise<void> | null = null;
export const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    if (!fontsReady) {
      fontsReady = Promise.all(
        FONTS.map(([family, file, weight]) => {
          const f = new FontFace(family, `url(${staticFile(file)})`, {weight});
          return f.load().then((loaded) => {
            (document.fonts as any).add(loaded);
          });
        })
      ).then(() => undefined);
    }
    fontsReady.then(() => continueRender(handle)).catch(() => continueRender(handle));
  }, [handle]);
};

export const base: React.CSSProperties = {
  fontFamily: 'Vazirmatn, sans-serif',
  direction: 'rtl',
  color: BRAND.ink,
};
export const display: React.CSSProperties = {fontFamily: 'Lalezar, Vazirmatn, sans-serif', fontWeight: 400, direction: 'rtl'};

// لوگو: «ح» + علامت به‌علاوه + برگ، روی دیسک سفید در قاب سرمه‌ای با حس پرس‌شده
export const Logo: React.FC<{size: number}> = ({size}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, #16346A, ${BRAND.navy} 60%, ${BRAND.navyDeep})`,
      boxShadow: 'inset 0 4px 10px rgba(255,255,255,.18), inset 0 -6px 14px rgba(0,0,0,.55), 0 10px 30px rgba(0,0,0,.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 100 100">
      <defs>
        <radialGradient id="disc" cx="40%" cy="35%">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E3ECF5" />
        </radialGradient>
        <filter id="deboss">
          <feOffset dx="0" dy="1.4" />
          <feGaussianBlur stdDeviation="0.9" result="o" />
          <feComposite in="SourceGraphic" in2="o" operator="over" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#disc)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(11,36,71,.25)" strokeWidth="1.5" />
      <text
        x="47"
        y="66"
        textAnchor="middle"
        fontFamily="Lalezar, Vazirmatn"
        fontSize="56"
        fill={BRAND.blue}
        filter="url(#deboss)"
      >
        ح
      </text>
      {/* به‌علاوه */}
      <rect x="66" y="20" width="16" height="5" rx="1.5" fill={BRAND.green} />
      <rect x="71.5" y="14.5" width="5" height="16" rx="1.5" fill={BRAND.green} />
      {/* برگ */}
      <path d="M24 30 C 22 18, 34 12, 42 14 C 42 24, 34 32, 24 30 Z" fill={BRAND.green} />
      <path d="M26 28 L 40 16" stroke="#fff" strokeWidth="1.2" />
    </svg>
  </div>
);

// قاب سرمه‌ای با بافت پرس‌شده دور کل کادر
export const NavyFrame: React.FC<{thickness?: number; children: React.ReactNode; bg?: string}> = ({
  thickness = 26,
  children,
  bg,
}) => (
  <AbsoluteFill style={{background: BRAND.navy}}>
    <AbsoluteFill
      style={{
        background:
          'repeating-linear-gradient(45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 6px), radial-gradient(circle at 30% 20%, #17386F, transparent 60%)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: thickness,
        borderRadius: 38,
        overflow: 'hidden',
        background: bg ?? 'linear-gradient(180deg,#FFFFFF 0%, #EEF5FC 100%)',
        boxShadow: 'inset 0 6px 16px rgba(0,0,0,.35), inset 0 -2px 6px rgba(255,255,255,.4), 0 0 0 2px rgba(255,255,255,.08)',
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

export const Chip: React.FC<{text: string; color: string; dark?: boolean; size?: number}> = ({
  text,
  color,
  dark,
  size = 34,
}) => (
  <div
    style={{
      ...base,
      fontWeight: 700,
      fontSize: size,
      padding: `${size * 0.35}px ${size * 0.8}px`,
      borderRadius: 999,
      color: dark ? '#fff' : color,
      background: dark ? color : `${color}14`,
      border: `2px solid ${color}55`,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

export const QR: React.FC<{size: number; color: string; dots?: boolean}> = ({size, color, dots}) => {
  const qr = QRCode.create(BRAND.instagramUrl, {errorCorrectionLevel: 'M'});
  const n = qr.modules.size;
  const cell = size / (n + 4);
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (qr.modules.get(y, x))
        cells.push(
          dots ? (
            <circle key={`${x}-${y}`} cx={(x + 2.5) * cell} cy={(y + 2.5) * cell} r={cell * 0.46} fill={color} />
          ) : (
            <rect key={`${x}-${y}`} x={(x + 2) * cell} y={(y + 2) * cell} width={cell + 0.3} height={cell + 0.3} rx={cell * 0.2} fill={color} />
          )
        );
  return (
    <svg width={size} height={size} style={{background: '#fff', borderRadius: size * 0.08}}>
      {cells}
    </svg>
  );
};

// عکس محصول روی کارت سفید با گوشه‌های گرد — برای هر عکسی که کارفرما بفرستد جواب می‌دهد
export const ProductImage: React.FC<{src: string; height: number; style?: React.CSSProperties}> = ({src, height, style}) => (
  <div
    style={{
      height,
      aspectRatio: '4 / 5',
      background: '#fff',
      borderRadius: height * 0.07,
      padding: height * 0.035,
      boxShadow: '0 30px 60px rgba(11,36,71,.28), 0 0 0 1px rgba(11,36,71,.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      ...style,
    }}
  >
    <Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: 'contain', borderRadius: height * 0.04}} />
  </div>
);

export const Footer: React.FC<{size?: number; dark?: boolean}> = ({size = 28, dark}) => {
  const c = dark ? '#fff' : BRAND.ink;
  const item = (icon: string, text: string) => (
    <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
      <span style={{fontSize: size * 1.05}}>{icon}</span>
      <span>{text}</span>
    </div>
  );
  return (
    <div
      style={{
        ...base,
        color: c,
        fontWeight: 700,
        fontSize: size,
        display: 'flex',
        justifyContent: 'center',
        gap: size * 1.4,
        flexWrap: 'wrap',
      }}
    >
      {item('📍', BRAND.address)}
      {item('📞', BRAND.phone)}
      {item('🕘', BRAND.hours)}
    </div>
  );
};

export const Disclaimer: React.FC<{dark?: boolean; size?: number}> = ({dark, size = 22}) => (
  <div style={{...base, fontSize: size, color: dark ? 'rgba(255,255,255,.75)' : '#5B6B80', textAlign: 'center'}}>
    ادعا فقط طبق نوشتهٔ روی جعبه • {BRAND.consult}
  </div>
);
