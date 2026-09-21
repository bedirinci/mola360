/* Tek hata yanıtı üreticisi ve 404.

   Beklenmeyen hatanın MESAJI kullanıcıya gitmiyor; günlüğe tam hâliyle,
   yanıta ise genel bir metin yazılıyor. Ham hata metni veritabanı şemasını,
   dosya yolunu veya sorgu içeriğini sızdırabilir. */
import { AppError, hata, pgHatasiniCevir } from '../lib/errors.js';
import { log } from '../lib/logger.js';
import { config } from '../config/index.js';

export function bulunamadiIsleyici(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Uç nokta yok: ${req.method} ${req.path}`, fieldErrors: null },
  });
}

// eslint-disable-next-line no-unused-vars
export function hataIsleyici(e, req, res, _next) {
  let uygulama = e instanceof AppError ? e : pgHatasiniCevir(e);

  if (!uygulama) {
    log.error('Beklenmeyen hata', {
      err: e && e.message, stack: e && e.stack,
      method: req.method, path: req.path,
    });
    uygulama = hata.sunucu();
  } else if (uygulama.status >= 500) {
    log.error('Sunucu hatası', { err: e && e.message, path: req.path });
  }

  const govde = {
    success: false,
    error: {
      code: uygulama.code,
      message: uygulama.message,
      fieldErrors: uygulama.fieldErrors || null,
    },
  };
  /* Geliştirmede yığın izi yardımcı; üretimde asla. */
  if (!config.isProduction && uygulama.status >= 500 && e && e.stack) {
    govde.error.stack = e.stack;
  }
  res.status(uygulama.status || 500).json(govde);
}

/* async route işleyicilerinin reddedilen promise'lerini Express'e taşır.
   Bu sarmalayıcı olmadan bir `await` hatası sessizce yutulur ve istek
   zaman aşımına kadar asılı kalır. */
export const yakala = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
