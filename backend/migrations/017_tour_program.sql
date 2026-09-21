-- ============================================================================
-- 017 — Konaklamalı tur: kalkış şehri ve konaklama bilgisi
--
-- Göç raporu üç alanın hedefsiz kaldığını gösterdi: program, accommodation,
-- departureCities. Üçü de gerçek veri; ikisi FİYATI etkiliyor.
--
-- departureCities AYRI TABLO çünkü fiyat boyutu: "İzmir çıkışlı +350 TL".
-- content_blocks içinde JSONB olarak dursaydı fiyat motoru ona tip güvenli
-- erişemez, panelden fiyat düzenlenemezdi. tour-data.js'teki departureCity()
-- fonksiyonu zaten bu farkı hesaplıyor — tablo onun kaynağı oluyor.
--
-- accommodation ise ANLATIM: hangi otelde kalınacağı, oda tipleri, pansiyon
-- notu. Tek fiyat boyutu olan tek kişilik oda farkı zaten tours tablosunda
-- (single_room_supplement). Kalanı blok olarak duruyor.
-- ============================================================================

CREATE TABLE tour_departure_cities (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  code       text NOT NULL,
  city_id    int REFERENCES cities(id) ON DELETE SET NULL,
  label      text NOT NULL,
  -- Bu şehirden katılmanın kişi başı farkı. 0 = fark yok.
  fee        numeric(12,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  note       text NOT NULL DEFAULT '',
  position   int NOT NULL DEFAULT 0,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  UNIQUE (content_id, code)
);

ALTER TABLE content_blocks DROP CONSTRAINT content_blocks_kind_check;
ALTER TABLE content_blocks ADD CONSTRAINT content_blocks_kind_check CHECK (kind IN (
  'highlight','description','badge','fact','trust','included','excluded',
  'bring','important','requirement','rule','policy','amenity_group',
  'itinerary','menu_group','weather','social','rating_aspect','cancellation',
  'similar_unresolved','accommodation'));

-- Program günü artık öğün ve konaklama bilgisini de taşıyor.
COMMENT ON COLUMN tour_itinerary_days.meal IS 'O günün öğünleri (kahvaltı, öğle, akşam).';
COMMENT ON COLUMN tour_itinerary_days.accommodation IS 'O gece nerede kalınıyor.';
