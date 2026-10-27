// برند داروخانه دکتر حصیبی — همهٔ ثابت‌ها اینجاست.
export const BRAND = {
  blue: '#1676D2',
  green: '#2F9E4F',
  white: '#FFFFFF',
  navy: '#0B2447',
  navyDeep: '#06162E',
  ink: '#10233F',
  name: 'داروخانه دکتر حصیبی',
  address: 'کرمان، کوهپایه',
  phone: '۰۹۰۵۱۲۵۹۶۷۵',
  hours: 'هر روز ۹ تا ۲۱',
  instagram: 'drhasibi_pharmacy',
  instagramUrl: 'https://instagram.com/drhasibi_pharmacy',
  consult: 'سؤال دارویی؟ با دکتر حصیبی مشورت کنید',
};

// ورودی هر محتوا — n8n این را می‌سازد.
export type ContentProps = {
  productFa: string; // نام فارسی محصول
  productEn: string; // نام لاتین روی جعبه
  category: 'مکمل' | 'آرایشی' | 'بهداشتی';
  hook: string; // جملهٔ اول ریلز (بدون ادعای درمانی)
  boxClaim: string; // فقط ادعای روی جعبه
  ingredients: string[]; // مواد/ویژگی‌های روی جعبه
  badges: string[]; // مثل «بدون گلوتن»
  packInfo: string; // مثل «۳۲ کپسول»
  imageSrc: string; // نام فایل در public یا URL
  seed: number; // تنوع رنگ، ترتیب و QR
};

export const defaultProps: ContentProps = {
  productFa: 'مگنی‌فورت',
  productEn: 'Magniforte',
  category: 'مکمل',
  hook: 'مکمل جدید رسید!',
  boxClaim: 'برای سلامت عضلات، استخوان‌ها و سیستم عصبی',
  ingredients: ['منیزیم دریایی', 'ویتامین B1 و B6', 'ویتامین D3 طبیعی', 'ویتامین K2'],
  badges: ['بدون گلوتن', 'بدون قند', 'بدون نگهدارنده'],
  packInfo: '۳۲ کپسول',
  imageSrc: 'samples/magniforte.jpg',
  seed: 1,
};

// پالت‌های چرخشی برای اینکه هر ویدیو حس متفاوتی داشته باشد.
export const ACCENTS = [
  {a: BRAND.blue, b: BRAND.green, glow: '#5FB4FF'},
  {a: BRAND.green, b: BRAND.blue, glow: '#7BE3A0'},
  {a: '#1E88E5', b: '#26A69A', glow: '#80DEEA'},
  {a: '#1565C0', b: '#43A047', glow: '#B3E5FC'},
];

export const pick = <T,>(arr: T[], seed: number, salt = 0): T =>
  arr[Math.abs(Math.floor(seed * 7919 + salt * 104729)) % arr.length];

export const faDigits = (s: string) => s.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
