/* Hız sınırı.

   İKİ AYRI SINIR var ve ikisi farklı saldırıyı karşılıyor:

   girisSiniri   IP başına giriş denemesi — çok hesaba az deneme yapan
                 (credential stuffing) saldırıyı yavaşlatır.
   genelSinir    Genel API kullanımı; bir hatanın veya kötü niyetli bir
                 istemcinin sunucuyu doldurmasını engeller.

   Hesap bazlı kilit AYRICA auth servisinde: tek hesaba çok deneme yapan
   saldırı IP değiştirerek bu sınırı aşabilir, hesap kilidi aşamaz. */
import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

const yanit = (_req, res) => {
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Çok fazla istek. Biraz bekleyin.', fieldErrors: null },
  });
};

export const girisSiniri = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: config.isTest ? 1000 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  /* Başarılı giriş sayaca yazılmıyor: doğru şifreyi bilen kişinin gün içinde
     birkaç kez giriş yapması normaldir. */
  skipSuccessfulRequests: true,
  handler: yanit,
});

export const genelSinir = rateLimit({
  windowMs: 60 * 1000,
  limit: config.isTest ? 100000 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: yanit,
});
