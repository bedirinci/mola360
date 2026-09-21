/* Tek bağlantı havuzu ve transaction yardımcısı.

   HER YAZMA İŞİ TRANSACTION İÇİNDE. Bu bir üslup tercihi değil: rezervasyon
   bir kayda dokunmuyor — kontenjan düşüyor, rezervasyon satırı açılıyor,
   kalem satırları yazılıyor, kupon sayacı artıyor, denetim kaydı ekleniyor.
   Ortada kalan bir hata, hiçbiri olmamış gibi geri alınmazsa kontenjan
   kaybolur veya çift satış olur. */
import pg from 'pg';
import { config } from '../config/index.js';
import { log } from '../lib/logger.js';

/* numeric/decimal (OID 1700) varsayılan olarak STRING dönüyor. Bu bilinçli
   bir pg davranışı (çok büyük sayılarda JS hassasiyeti yetmez) ama bizim
   tutarlarımız numeric(12,2) — güvenle Number'a çevrilebilir. Çevirmezsek
   fiyat hesabı "1950" + 450 gibi metin birleştirmesine döner. */
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
/* int8 (OID 20) da string döner; sayaçlarımız Number sınırının çok altında. */
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));
/* date (OID 1082) Date nesnesine çevrilirken saat dilimi kayması yapıyor.
   Tarihleri ISO metin olarak tutmak, "bir gün öncesi" hatalarını kesiyor. */
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: config.isTest ? 4 : 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (e) => log.error('Havuz bağlantı hatası', { err: e.message }));

export function sorgu(metin, parametreler) {
  return pool.query(metin, parametreler);
}

/* İş fonksiyonuna bir istemci verip transaction'ı yönetiyor.
   Hata olursa ROLLBACK, olmazsa COMMIT — çağıran tarafın unutma ihtimali yok. */
export async function transaction(is) {
  const istemci = await pool.connect();
  try {
    await istemci.query('BEGIN');
    const sonuc = await is(istemci);
    await istemci.query('COMMIT');
    return sonuc;
  } catch (e) {
    try { await istemci.query('ROLLBACK'); } catch (geri) {
      log.error('ROLLBACK başarısız', { err: geri.message });
    }
    throw e;
  } finally {
    istemci.release();
  }
}

export async function kapat() {
  await pool.end();
}
