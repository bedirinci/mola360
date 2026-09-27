-- ============================================================================
-- 020 — Molapuan: turun kazandırdığı puan
--
-- Kural (kullanıcı kararı): puan TURA KATILINCA kazanılır ve tura göre
-- değişir. Ön yüzde ürün kaydının loyalty.points alanı; burada turun
-- kendi satırında. Müşterinin bakiyesi 012'deki customers.loyalty_points;
-- kazanılan/bekleyen/iptal hareketleri ileride ayrı bir defterde
-- (docs/veri-sozlesmesi.md bölüm 11 ve 14).
-- ============================================================================

ALTER TABLE tours
  ADD COLUMN loyalty_points int NOT NULL DEFAULT 0
  CONSTRAINT tours_loyalty_points_nonneg CHECK (loyalty_points >= 0);
