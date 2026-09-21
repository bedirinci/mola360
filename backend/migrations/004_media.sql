-- ============================================================================
-- 004 — Medya kütüphanesi
--
-- Görseller bugün Wikimedia Commons dosya adından deterministik olarak
-- kuruluyor (docs/gorsel-kaynaklari.md) ve depoda durmuyor. Bu model
-- KORUNUYOR ama genelleştiriliyor: storage_driver alanı görselin nerede
-- durduğunu söylüyor.
--
--   commons  → Wikimedia Commons; url dosya adından üretiliyor
--   local    → sunucudaki dosya
--   s3 / r2  → nesne deposu
--
-- Kod hiçbir yerde "bu bir Commons görseli" varsayımı yapmıyor; adres her
-- zaman storage soyutlamasından (src/services/storage) geliyor. Depolama
-- değiştiğinde tek satır veri güncellenecek, kod değişmeyecek.
--
-- TELİF ALANLARI ZORUNLU BİR İHTİYAÇ: Commons görselleri lisans ve atıf
-- gerektiriyor. Bu bilgi görselin yanında durmazsa, görsel sayfada kullanılır
-- ve atıf unutulur.
-- ============================================================================

CREATE TABLE media (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Eski veri dosyalarındaki sözlük anahtarı (kordonBoyu, efesKutuphane…).
  -- Göç sırasında eşleştirmeyi ve geriye dönük referansları taşıyor.
  legacy_key      text,
  storage_driver  text NOT NULL DEFAULT 'commons'
                  CHECK (storage_driver IN ('commons','local','s3','r2','supabase')),
  storage_path    text NOT NULL,          -- Commons dosya adı veya nesne anahtarı
  mime_type       text NOT NULL DEFAULT 'image/jpeg',
  byte_size       bigint,
  width           int,
  height          int,
  -- Kırpma ve odak noktası: farklı en-boy oranlarında (kart 4:3, galeri 16:9)
  -- görselin neresinin korunacağı. Otomatik varyant üretimi bunu kullanır.
  focal_x         numeric(4,3) NOT NULL DEFAULT 0.5,
  focal_y         numeric(4,3) NOT NULL DEFAULT 0.5,
  crop_data       jsonb,
  alt             text NOT NULL DEFAULT '',
  title           text NOT NULL DEFAULT '',
  caption         text NOT NULL DEFAULT '',
  -- Telif ve kullanım hakkı
  source          text NOT NULL DEFAULT '',
  source_url      text NOT NULL DEFAULT '',
  copyright_owner text NOT NULL DEFAULT '',
  license         text NOT NULL DEFAULT '',
  license_url     text NOT NULL DEFAULT '',
  attribution     text NOT NULL DEFAULT '',
  usage_permission text NOT NULL DEFAULT 'unknown'
                  CHECK (usage_permission IN ('unknown','granted','restricted','denied')),
  created_by      uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
CREATE UNIQUE INDEX media_legacy_key_key ON media (legacy_key) WHERE legacy_key IS NOT NULL;
CREATE INDEX media_driver_idx ON media (storage_driver) WHERE deleted_at IS NULL;
CREATE TRIGGER media_updated BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
