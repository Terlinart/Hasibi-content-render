import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ACCENTS, BRAND, ContentProps, pick} from './brand';
import {base, Chip, Disclaimer, display, Footer, Logo, NavyFrame, ProductImage, QR, useFonts} from './components';

const Header: React.FC<{dark?: boolean}> = ({dark}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
    <Logo size={96} />
    <div style={{...base}}>
      <div style={{...display, fontSize: 44, color: dark ? '#fff' : BRAND.navy, lineHeight: 1.1}}>{BRAND.name}</div>
      <div style={{fontSize: 24, fontWeight: 700, color: dark ? 'rgba(255,255,255,.7)' : BRAND.blue, direction: 'ltr', textAlign: 'right'}}>@{BRAND.instagram}</div>
    </div>
  </div>
);

// پست ۱۰۸۰×۱۳۵۰
export const Post: React.FC<ContentProps> = (p) => {
  useFonts();
  const ac = pick(ACCENTS, p.seed);
  return (
    <NavyFrame>
      <AbsoluteFill style={{padding: '48px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Header />
          <Chip text={p.category} color={ac.b} dark size={30} />
        </div>
        <div style={{...display, fontSize: 118, color: BRAND.navy, marginTop: 22, lineHeight: 1}}>{p.productFa}</div>
        <div style={{...base, fontSize: 32, fontWeight: 700, color: ac.a, letterSpacing: 2, direction: 'ltr'}}>{p.productEn}</div>
        <div style={{position: 'relative', marginTop: 10, height: 520, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div
            style={{
              position: 'absolute',
              width: 520,
              height: 520,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ac.glow}55, transparent 68%)`,
            }}
          />
          <ProductImage src={p.imageSrc} height={500} />
        </div>
        <div style={{...base, fontSize: 40, fontWeight: 900, color: BRAND.navy, textAlign: 'center', marginTop: 4}}>{p.boxClaim}</div>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20, maxWidth: 980}}>
          {p.ingredients.map((t, i) => (
            <Chip key={t} text={t} color={i % 2 ? ac.b : ac.a} size={25} />
          ))}
        </div>
        <div style={{flex: 1}} />
        <div
          style={{
            alignSelf: 'stretch',
            background: BRAND.navy,
            borderRadius: 26,
            padding: '22px 24px',
            boxShadow: 'inset 0 3px 8px rgba(255,255,255,.12)',
          }}
        >
          <Footer size={28} dark />
        </div>
        <div style={{marginTop: 12}}>
          <Disclaimer size={20} />
        </div>
      </AbsoluteFill>
    </NavyFrame>
  );
};

// استوری ۱: معرفی
export const Story1: React.FC<ContentProps> = (p) => {
  useFonts();
  const ac = pick(ACCENTS, p.seed, 1);
  return (
    <NavyFrame bg={`linear-gradient(170deg, #FFFFFF 0%, #EAF3FC 55%, ${ac.glow}55 100%)`}>
      <AbsoluteFill style={{padding: '90px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Header />
        <div style={{...display, fontSize: 92, color: ac.a, marginTop: 70}}>{p.hook}</div>
        <div style={{position: 'relative', height: 860, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20}}>
          <div style={{position: 'absolute', width: 760, height: 760, borderRadius: '50%', background: `radial-gradient(circle, ${ac.glow}66, transparent 66%)`}} />
          <ProductImage src={p.imageSrc} height={780} />
        </div>
        <div style={{...display, fontSize: 104, color: BRAND.navy, lineHeight: 1}}>{p.productFa}</div>
        <div style={{display: 'flex', gap: 16, marginTop: 26}}>
          <Chip text={p.packInfo} color={ac.a} dark size={34} />
          <Chip text="موجود شد ✅" color={ac.b} dark size={34} />
        </div>
        <div style={{flex: 1}} />
        <Footer size={30} />
      </AbsoluteFill>
    </NavyFrame>
  );
};

// استوری ۲: ترکیبات + راه ارتباط
export const Story2: React.FC<ContentProps> = (p) => {
  useFonts();
  const ac = pick(ACCENTS, p.seed, 2);
  const qrColor = pick([BRAND.navy, BRAND.blue, BRAND.green, '#0D47A1'], p.seed, 3);
  return (
    <NavyFrame bg={`linear-gradient(180deg, ${BRAND.navy} 0%, ${BRAND.navyDeep} 100%)`}>
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(0deg, ${ac.glow}12 0 1px, transparent 1px 60px), repeating-linear-gradient(90deg, ${ac.glow}12 0 1px, transparent 1px 60px)`,
        }}
      />
      <AbsoluteFill style={{padding: '90px 64px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Header dark />
        <div style={{...display, fontSize: 84, color: '#fff', marginTop: 60, textShadow: `0 0 30px ${ac.glow}`}}>روی جعبه چی نوشته؟</div>
        <div style={{...base, fontSize: 40, fontWeight: 700, color: ac.glow, marginTop: 10, textAlign: 'center'}}>{p.boxClaim}</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 30, marginTop: 70, alignSelf: 'stretch'}}>
          {p.ingredients.map((t, i) => (
            <div
              key={t}
              style={{
                ...base,
                fontSize: 54,
                fontWeight: 900,
                color: '#fff',
                padding: '32px 40px',
                borderRadius: 28,
                background: 'rgba(255,255,255,.06)',
                border: `2px solid ${i % 2 ? ac.b : ac.a}`,
                boxShadow: `0 0 26px ${(i % 2 ? ac.b : ac.a)}55, inset 0 0 18px ${(i % 2 ? ac.b : ac.a)}33`,
              }}
            >
              {t}
            </div>
          ))}
        </div>
        <div style={{display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 34}}>
          {p.badges.map((b) => (
            <Chip key={b} text={b} color="#fff" size={28} />
          ))}
        </div>
        <div style={{flex: 1}} />
        <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
          <QR size={230} color={qrColor} dots={p.seed % 2 === 0} />
          <div style={{...base, color: '#fff'}}>
            <div style={{...display, fontSize: 50}}>مشاوره رایگان</div>
            <div style={{fontSize: 30, fontWeight: 700, opacity: 0.85}}>با دکتر حصیبی</div>
            <div style={{fontSize: 30, fontWeight: 700, marginTop: 8}}>📞 {BRAND.phone}</div>
          </div>
        </div>
        <div style={{marginTop: 34}}>
          <Footer size={28} dark />
        </div>
        <div style={{marginTop: 14}}>
          <Disclaimer dark size={22} />
        </div>
      </AbsoluteFill>
    </NavyFrame>
  );
};
