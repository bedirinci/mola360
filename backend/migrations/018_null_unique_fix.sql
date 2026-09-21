-- ============================================================================
-- 018 — NULL içeren tekillik kısıtlarının onarımı
--
-- BULUNAN AÇIK: SQL'de NULL hiçbir şeye eşit değildir, KENDİSİNE de. Bu
-- yüzden `UNIQUE (content_id, item_type, item_id, on_date, start_time)`
-- kısıtı, start_time NULL olan İKİ satırı çakışma saymıyordu.
--
-- Somut sonucu: saati olmayan bir kaynak (otel odası, günlük kalkış) için
-- aynı tarihte iki envanter satırı açılabiliyordu. Her satırın kendi
-- kapasitesi olduğu için toplam kapasite İKİYE KATLANIYOR ve 011'deki çift
-- satış koruması satır bazında doğru çalıştığı hâlde toplamda delik
-- veriyordu. Envanter motorunun bütün vaadi bu satıra dayanıyor.
--
-- Çözüm: PostgreSQL 15 ile gelen NULLS NOT DISTINCT — NULL'lar tekillikte
-- birbirine eşit sayılıyor. Aynı hata iki yerde daha vardı (kalkış ve
-- temsil tarihleri, ikisinde de saat boş bırakılabiliyor).
--
-- tests/schema.test.js bu üçünü ayrı ayrı ölçüyor.
-- ============================================================================

ALTER TABLE inventory
  DROP CONSTRAINT inventory_content_id_item_type_item_id_on_date_start_time_key;
ALTER TABLE inventory
  ADD CONSTRAINT inventory_kaynak_tarih_key
  UNIQUE NULLS NOT DISTINCT (content_id, item_type, item_id, on_date, start_time);

ALTER TABLE tour_departures
  DROP CONSTRAINT tour_departures_content_id_depart_date_depart_time_key;
ALTER TABLE tour_departures
  ADD CONSTRAINT tour_departures_tarih_key
  UNIQUE NULLS NOT DISTINCT (content_id, depart_date, depart_time);

ALTER TABLE event_performances
  DROP CONSTRAINT event_performances_content_id_perf_date_perf_time_key;
ALTER TABLE event_performances
  ADD CONSTRAINT event_performances_tarih_key
  UNIQUE NULLS NOT DISTINCT (content_id, perf_date, perf_time);
