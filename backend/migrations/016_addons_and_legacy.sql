-- ============================================================================
-- 016 — Ek hizmetler ve göç desteği
--
-- EK HİZMETLER AYRI TABLO: fiyatlandırılan ve rezervasyon kalemi olarak
-- satılan şeyler. content_blocks içinde JSONB olarak durursa fiyat motoru
-- onlara tip güvenli erişemez ve booking_items ile ilişkilendirilemez.
--
-- `per` çarpanı üç değerden biri ve üçü BİLEREK farklı:
--   booking  bir kez (havalimanı transferi)
--   night    gece başına (otopark)
--   guest    kişi başına (teras akşam yemeği)
-- ============================================================================

CREATE TABLE content_addons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  code       text NOT NULL,
  label      text NOT NULL,
  description text NOT NULL DEFAULT '',
  price      numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  per        text NOT NULL DEFAULT 'booking'
             CHECK (per IN ('booking','night','guest','ticket','room')),
  max_quantity int,
  position   int NOT NULL DEFAULT 0,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  UNIQUE (content_id, code)
);

-- Eski verideki "benzer içerikler" kartlarının bir kısmı GERÇEK bir kayda
-- işaret etmiyor: içerik sayfası olmayan örnek kartlar. Göç sırasında
-- gerçek kayda çözülenler content_relations'a giriyor; çözülemeyenler
-- burada bekliyor ki hiçbir alan sessizce kaybolmasın.
--
-- Gerçek kayıt eklendiğinde panel bunları "ilişkiye çevir" diye önerecek.
ALTER TABLE content_blocks DROP CONSTRAINT content_blocks_kind_check;
ALTER TABLE content_blocks ADD CONSTRAINT content_blocks_kind_check CHECK (kind IN (
  'highlight','description','badge','fact','trust','included','excluded',
  'bring','important','requirement','rule','policy','amenity_group',
  'itinerary','menu_group','weather','social','rating_aspect','cancellation',
  'similar_unresolved'));
