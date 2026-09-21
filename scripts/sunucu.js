#!/usr/bin/env node
/* ---------------- yerel önizleme sunucusu ----------------
   `npm run dev` ile çalışır: depoyu GitHub Pages'in davrandığı gibi
   sunar.

   NEDEN VAR: index.html'i çift tıklayıp tarayıcıda açmak (file://)
   siteyi ÇALIŞIR GİBİ gösteriyor ama bağlar ölü. Sebebi şu: kart
   bağları /otel/<slug>/ biçiminde, yani bir DİZİN adresi. Sunucu böyle
   bir adresi index.html'e çözer; file:// protokolünde çözen kimse
   yoktur, tarayıcı ya dizin listesi gösterir ya hiçbir şey yapmaz.
   "Karta tıklıyorum, sayfa açılmıyor" şikâyetinin bir sebebi buydu.

   Üçüncü parti bir pakete bağlanmadı: tek iş dizin adresini index.html'e
   çözmek ve doğru içerik tipini yollamak. */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const KOK = path.resolve(__dirname, '..');

const TIPLER = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

/* Adresten disk yolu. Saf fonksiyon: tests/sunucu.test.js doğrudan çağırır.

   İki kural var ve ikisi de GitHub Pages'in davranışı:
     /otel/kordon-butik-otel/  -> otel/kordon-butik-otel/index.html
     /                         -> index.html
   Üçüncüsü bizim: kök dışına çıkmaya çalışan adres (../../etc/passwd)
   reddedilir. */
function istenenDosya(pathname) {
  let yol;
  try {
    yol = decodeURIComponent(String(pathname || '/').split('?')[0].split('#')[0]);
  } catch (_) {
    return null;
  }
  if (yol.endsWith('/')) yol += 'index.html';
  const tam = path.resolve(KOK, '.' + path.posix.normalize(yol));
  if (tam !== KOK && !tam.startsWith(KOK + path.sep)) return null;
  return tam;
}

function sun(req, res) {
  const dosya = istenenDosya(req.url);
  if (!dosya) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Kök dışına çıkılamaz');
    return;
  }

  fs.stat(dosya, (hata, bilgi) => {
    /* Uzantısız dizin adresi (/otel/kordon-butik-otel) da çalışsın:
       GitHub Pages bunu sondaki eğik çizgiye yönlendiriyor. */
    if (!hata && bilgi.isDirectory()) {
      res.writeHead(301, { Location: req.url.replace(/\/?$/, '/') });
      res.end();
      return;
    }

    if (hata) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<meta charset="utf-8"><h1>404</h1><p>Bulunamadı: '
        + req.url + '</p><p><a href="/">Anasayfa</a></p>');
      return;
    }

    /* Önbellek kapalı: geliştirirken eski dosyayı görmek, olmayan bir
       hatayı saatlerce aramaya yol açıyor. */
    res.writeHead(200, {
      'Content-Type': TIPLER[path.extname(dosya).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(dosya).pipe(res);
  });
}

if (require.main === module) {
  const port = Number(process.argv[2] || process.env.PORT || 8000);
  http.createServer(sun).listen(port, () => {
    console.log('mola360 yerel önizleme:  http://localhost:' + port + '/');
    console.log('Durdurmak için Ctrl+C.');
  });
}

module.exports = { istenenDosya, KOK, TIPLER };
