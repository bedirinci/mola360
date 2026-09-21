/* Ortam değişkenleri TEK YERDE okunuyor ve AÇILIŞTA doğrulanıyor.

   Sebep: process.env'e kodun her yerinden bakmak, eksik bir değişkeni
   ancak o satır çalıştığında — çoğu zaman üretimde, bir istek sırasında —
   fark ettiriyor. Burada eksik/geçersiz değer sunucuyu HİÇ BAŞLATMIYOR.

   Üretimde zayıf varsayılanlar kabul edilmiyor: SESSION_SECRET verilmemişse
   sunucu açılmıyor. Geliştirmede sabit bir varsayılan var ki `npm run dev`
   ek kurulum istemesin. */
import { z } from 'zod';

const ortam = process.env.NODE_ENV || 'development';
const uretim = ortam === 'production';

const sema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL zorunlu'),
  /* Oturum çerezini imzalayan sır. Üretimde en az 32 karakter. */
  SESSION_SECRET: uretim
    ? z.string().min(32, 'Üretimde SESSION_SECRET en az 32 karakter olmalı')
    : z.string().min(8).default('gelistirme-icin-yeterince-uzun-sir'),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(12),
  /* Panelin ve sitenin adresleri; CORS ve canonical üretimi bunları kullanır. */
  ADMIN_ORIGIN: z.string().default('http://localhost:4000'),
  SITE_ORIGIN: z.string().default('http://localhost:8000'),
  PUBLIC_BASE_URL: z.string().default('https://bedirinci.github.io/mola360'),
  /* Çerez yalnızca HTTPS üzerinden gitsin mi. Üretimde zorunlu true. */
  COOKIE_SECURE: z.coerce.boolean().default(uretim),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
  /* Giriş denemesi sınırları. */
  LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_LOCK_MINUTES: z.coerce.number().int().positive().default(15),
  /* Rezervasyon sırasında koltuğun tutulduğu süre. */
  HOLD_MINUTES: z.coerce.number().int().positive().default(10),
});

const sonuc = sema.safeParse(process.env);
if (!sonuc.success) {
  const satirlar = sonuc.error.issues.map(i => `  ${i.path.join('.')}: ${i.message}`);
  console.error('Ortam yapılandırması geçersiz:\n' + satirlar.join('\n'));
  process.exit(1);
}

export const config = Object.freeze({
  ...sonuc.data,
  isProduction: sonuc.data.NODE_ENV === 'production',
  isTest: sonuc.data.NODE_ENV === 'test',
});
