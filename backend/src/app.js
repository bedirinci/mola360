/* Express uygulaması. server.js'ten AYRI dosya: testler uygulamayı porta
   bağlamadan (listen çağırmadan) supertest ile sürebilsin diye. */
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { apiRouter } from './routes/index.js';
import { oturumYukle } from './middleware/auth.js';
import { genelSinir } from './middleware/rate-limit.js';
import { hataIsleyici, bulunamadiIsleyici } from './middleware/error.js';

/* ekRotalar: API yönlendiricisinden SONRA, 404 işleyicisinden ÖNCE bağlanan
   ek yönlendiriciler. Express'te 404 ve hata işleyicileri zincirin SONUNDA
   olmak zorunda; uygulama kurulduktan sonra app.use ile eklenen bir rotaya
   istek hiç ulaşmaz, 404 döner. Bu yüzden bağlama noktası parametre.

   Testler gerçek middleware zincirini (oturum, hız sınırı, hata biçimi)
   kullanarak korumalı uç nokta deneyebilsin diye var; ileride modüller ayrı
   paketlere bölündüğünde de aynı noktadan bağlanacaklar. */
export function uygulamaOlustur({ ekRotalar = [] } = {}) {
  const app = express();

  /* Ters vekil (nginx, Fly, Railway) arkasında req.ip doğru olsun.
     Bu ayar olmadan hız sınırı ve denetim kaydı bütün istekleri tek bir
     vekil IP'sinden geliyor sanır. */
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({
    /* API JSON döndürüyor; CSP panel statik dosyalarını sunan katmanda
       tanımlanıyor. Burada açık bırakmak, API yanıtlarına gereksiz başlık
       eklemekten ibaret olurdu. */
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  }));

  /* Gövde boyutu sınırlı: sınırsız JSON kabul etmek, tek bir istekle
     belleği doldurmaya açık kapı bırakır. */
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use(genelSinir);
  app.use(oturumYukle);

  app.use('/api/admin', apiRouter);
  for (const { yol, rota } of ekRotalar) app.use(yol, rota);

  app.use(bulunamadiIsleyici);
  app.use(hataIsleyici);
  return app;
}
