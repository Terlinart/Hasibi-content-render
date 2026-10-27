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
  ['Poppins', 'fonts/poppins-latin-600-normal.woff2', '600'],
  ['Poppins', 'fonts/poppins-latin-700-normal.woff2', '700'],
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

// لوگوی DrHasibi Pharmacy — بازسازی برداری دقیق از فایل public/brand/logo-original.png
// دو قرص عمودی (آبی/آبی‌روشن و آبی‌روشن/سرمه‌ای) + صلیب سبز = حرف H
export const LogoMarkPaths: React.FC = () => (
  <g>
    <defs>
      <clipPath id="lgL"><rect x="406" y="318" width="87" height="313" rx="43.5" /></clipPath>
      <clipPath id="lgR"><rect x="586" y="318" width="87" height="313" rx="43.5" /></clipPath>
    </defs>
    <g clipPath="url(#lgL)">
      <rect x="406" y="318" width="87" height="157" fill={BRAND.blue} />
      <rect x="406" y="475" width="87" height="156" fill={BRAND.lightBlue} />
    </g>
    <g clipPath="url(#lgR)">
      <rect x="586" y="318" width="87" height="157" fill={BRAND.lightBlue} />
      <rect x="586" y="475" width="87" height="156" fill={BRAND.navy} />
    </g>
    <rect x="464" y="442" width="152" height="66" rx="33" fill={BRAND.green} />
    <rect x="517" y="403" width="46" height="144" rx="23" fill={BRAND.green} />
  </g>
);

// فقط نشانهٔ H (بدون دایره و متن)
export const LogoMark: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
  <svg width={size * (280 / 326)} height={size} viewBox="400 312 280 326" style={style}>
    <LogoMarkPaths />
  </svg>
);

// لوگوی کامل: دیسک سفید + حلقهٔ سرمه‌ای + H؛ در اندازهٔ بزرگ، متن DrHasibi PHARMACY هم می‌آید
export const Logo: React.FC<{size: number; text?: boolean; ring?: boolean}> = ({size, text, ring = true}) => {
  const withText = text ?? size >= 170;
  return (
    <svg width={size} height={size} viewBox="28 28 1024 1024" style={{flexShrink: 0, direction: 'ltr', filter: 'drop-shadow(0 10px 24px rgba(7,25,53,.28))'}}>
      <circle cx="540" cy="540" r="498" fill="#fff" />
      {ring && <circle cx="540" cy="540" r="485" fill="none" stroke={BRAND.navy} strokeWidth="27" />}
      <g transform={withText ? undefined : 'translate(540 540) scale(1.75) translate(-539.5 -474.5)'}>
        <LogoMarkPaths />
      </g>
      {withText && (
        <>
          <text x="369" y="757" fontFamily="Poppins" fontWeight={700} fontSize="80" textLength="343" lengthAdjust="spacingAndGlyphs">
            <tspan fill={BRAND.navy}>Dr</tspan>
            <tspan fill={BRAND.blue}>Hasibi</tspan>
          </text>
          <text x="421" y="811" fontFamily="Poppins" fontWeight={600} fontSize="27" fill={BRAND.green} textLength="233" lengthAdjust="spacing">
            PHARMACY
          </text>
        </>
      )}
    </svg>
  );
};

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
    {BRAND.consult}
  </div>
);
