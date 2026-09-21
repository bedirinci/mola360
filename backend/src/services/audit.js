/* Denetim kaydı.

   "Bedir admin, Kapadokya Turunun fiyatını 2990 TL → 3290 TL değiştirdi."
   Bu cümleyi kurabilmek için öncesi ve sonrası birlikte saklanıyor.

   İKİ TASARIM KARARI:

   1) actor_email KOPYALANIYOR. Yalnızca actor_id tutulsaydı, hesap
      silindiğinde (ON DELETE SET NULL) kaydın kim tarafından yapıldığı
      kaybolurdu. Denetim kaydının işi tam da bunu korumak.

   2) Yalnızca DEĞİŞEN alanlar yazılıyor. Kaydın tamamını iki kez yazmak,
      yirmi alanlık bir içerikte tek bir fiyat değişikliğini kırk satırlık
      bir yığının içinde görünmez kılar.

   Denetim yazımı iş akışını DÜŞÜRMEZ: kayıt atılamazsa işlem geri alınmaz,
   hata günlüğe yazılır. Ters tercih (denetim yazılamazsa fiyat da
   değişmesin) daha "güvenli" görünür ama pratikte günlük tablosundaki
   geçici bir sorun bütün paneli durdurur. */
import { sorgu } from '../db/pool.js';
import { log } from '../lib/logger.js';

export function fark(once, sonra) {
  const a = once || {};
  const b = sonra || {};
  const oncesi = {};
  const sonrasi = {};
  for (const anahtar of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (JSON.stringify(a[anahtar]) === JSON.stringify(b[anahtar])) continue;
    oncesi[anahtar] = a[anahtar] ?? null;
    sonrasi[anahtar] = b[anahtar] ?? null;
  }
  return { oncesi, sonrasi, degistiMi: Object.keys(sonrasi).length > 0 };
}

export async function denetimYaz(req, { action, entityType, entityId, before, after, force = false }) {
  try {
    const d = fark(before, after);
    if (!d.degistiMi && !force) return;
    await sorgu(
      `INSERT INTO audit_logs
         (actor_id, actor_email, action, entity_type, entity_id, before_data, after_data, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        req?.user?.id || null,
        req?.user?.email || 'system',
        action,
        entityType,
        entityId != null ? String(entityId) : null,
        Object.keys(d.oncesi).length ? JSON.stringify(d.oncesi) : null,
        Object.keys(d.sonrasi).length ? JSON.stringify(d.sonrasi) : null,
        req?.ip || null,
        String(req?.get?.('user-agent') || '').slice(0, 500),
      ]);
  } catch (e) {
    log.error('Denetim kaydı yazılamadı', { err: e.message, action, entityType });
  }
}
