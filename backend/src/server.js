import { uygulamaOlustur } from './app.js';
import { config } from './config/index.js';
import { log } from './lib/logger.js';
import { pool, kapat } from './db/pool.js';

const app = uygulamaOlustur();

/* Veritabanı erişilemezse sunucu AÇILMASIN. Açılıp her isteği 500 ile
   reddeden bir servis, sağlık kontrolünü geçip trafiği üstüne çeker. */
try {
  await pool.query('SELECT 1');
} catch (e) {
  log.error('Veritabanına bağlanılamadı, sunucu başlatılmıyor', { err: e.message });
  process.exit(1);
}

const sunucu = app.listen(config.PORT, () => {
  log.info('mola360 API ayakta', { port: config.PORT, env: config.NODE_ENV });
});

/* Düzgün kapanış: devam eden istekler bitirilir, havuz kapatılır.
   Olmazsa, deploy sırasında işlenen bir rezervasyon yarıda kalır. */
for (const sinyal of ['SIGTERM', 'SIGINT']) {
  process.on(sinyal, () => {
    log.info('Kapanıyor', { signal: sinyal });
    sunucu.close(async () => { await kapat(); process.exit(0); });
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
