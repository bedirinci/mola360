-- ============================================================================
-- 001 — Çekirdek: ortak yardımcılar
--
-- Bu dosyada tablo yok; her tablonun kullandığı iki şey var:
--   1) updated_at'i kendiliğinden güncelleyen tetikleyici fonksiyonu
--   2) yumuşak silme (soft delete) için ortak sözleşme
--
-- NEDEN TETİKLEYİCİ: updated_at'i uygulama katmanında set etmek, tek bir
-- UPDATE'i unutunca sessizce eskiyen bir zaman damgası bırakıyor. Veritabanı
-- seviyesinde yapılınca unutulamaz.
--
-- NEDEN ENUM DEĞİL, CHECK: durum kümeleri (booking status, content status)
-- zamanla büyüyor. PostgreSQL'de ENUM'a değer eklemek ALTER TYPE gerektirir
-- ve eski sürüme dönmek imkânsıza yakındır. text + CHECK aynı güvenceyi
-- verir, göçü basittir.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Slug biçimi tek yerde tanımlı: küçük harf, rakam ve tire.
-- Türkçe karakterler slug'a girmez (URL'de sorun çıkarır); dönüşümü
-- uygulama katmanındaki slugify yapar.
CREATE OR REPLACE FUNCTION is_slug(v text) RETURNS boolean AS $$
  SELECT v ~ '^[a-z0-9]+(-[a-z0-9]+)*$';
$$ LANGUAGE sql IMMUTABLE;
