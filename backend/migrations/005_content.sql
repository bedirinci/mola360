-- ============================================================================
-- 005 — İçerik çekirdeği
--
-- Beş içerik türünün (tur, otel, aktivite, etkinlik, mekân) ORTAK gövdesi bu
-- tabloda; türe özgü alanlar 006–010 arasındaki tablolarda, content_id ile
-- birebir bağlı. Böylece "bütün içerikler" sorgusu tek tablodan dönüyor
-- (liste, arama, anasayfa), tür detayı ise gerektiğinde join'leniyor.
--
-- ----------------------------------------------------------------------------
-- content_blocks NEDEN GENEL BİR TABLO
--
-- highlights, description, badges, facts, trust, included, excluded, bring,
-- important, requirements, rules, policies, amenities — on üç alan. Hepsi
-- "sıralı küçük kayıt listesi" ve hiçbiri içerikten BAĞIMSIZ sorgulanmıyor;
-- her zaman kaydın tamamıyla birlikte okunuyorlar.
--
-- On üç ayrı tablo, on üç kez aynı şemayı (id, content_id, position, birkaç
-- metin alanı) yazmak demekti. Tek tablo + kind + JSONB gövde aynı işi
-- yapıyor; PostgreSQL'de JSONB indekslenebilir ve sorgulanabilir olduğu için
-- kaybedilen bir şey yok.
--
-- BAĞIMSIZ SORGULANAN şeyler ise ayrı tabloda: SSS (moderasyon ve arama),
-- yorumlar (moderasyon, puan hesabı), medya (kullanım raporu), ilişkiler
-- (çift yönlü gezinme), SEO (ayrı yetki), etiketler (filtre).
-- ----------------------------------------------------------------------------
--
-- İLİŞKİLER ID ÜZERİNDEN: eski veride "benzer içerikler" slug ve başlık
-- KOPYALAYARAK tutuluyordu; başlık değişince kopya eskiyordu. content_relations
-- artık hedef kaydın id'sini tutuyor, başlık her zaman kaynaktan okunuyor.
-- ============================================================================

CREATE TABLE content (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL CHECK (type IN ('tour','hotel','activity','event','venue')),
  slug          text NOT NULL CHECK (is_slug(slug)),

  -- YAYIN DURUMU: draft → (scheduled) → published → unpublished/archived
  status        text NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','scheduled','published','unpublished','archived')),
  visibility    text NOT NULL DEFAULT 'public'
                CHECK (visibility IN ('public','unlisted','private')),
  featured      boolean NOT NULL DEFAULT false,
  sponsored     boolean NOT NULL DEFAULT false,

  title         text NOT NULL,
  tagline       text NOT NULL DEFAULT '',
  category_id   int REFERENCES categories(id) ON DELETE SET NULL,
  -- İnsanın yazdığı konum cümlesi; city_id'nin yerini tutmaz, onu tamamlar.
  area          text NOT NULL DEFAULT '',
  region_id     int REFERENCES regions(id) ON DELETE SET NULL,
  city_id       int REFERENCES cities(id) ON DELETE SET NULL,
  product_code  text,

  -- Anasayfa kartının türetilemeyen alanları (fiyat/puan/tarih kayıttan
  -- türetilir, burada DURMAZ — docs/icerik-katalogu.md).
  card_media_id uuid REFERENCES media(id) ON DELETE SET NULL,
  card_title    text NOT NULL DEFAULT '',
  card_meta     text NOT NULL DEFAULT '',
  card_badges   jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Zaman çizgisi
  published_at  timestamptz,
  scheduled_at  timestamptz,
  archived_at   timestamptz,
  created_by    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by    uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,

  -- SCHEDULED durumu yayın anı olmadan anlamsız; kural veritabanında.
  CONSTRAINT content_scheduled_needs_time
    CHECK (status <> 'scheduled' OR scheduled_at IS NOT NULL)
);

-- Slug tür içinde tekil VE yalnızca silinmemiş kayıtlar arasında: bir kaydı
-- arşivleyip aynı slug ile yenisini açmak mümkün olmalı.
CREATE UNIQUE INDEX content_type_slug_key ON content (type, slug) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX content_product_code_key ON content (upper(product_code))
  WHERE deleted_at IS NULL AND product_code IS NOT NULL;
CREATE INDEX content_status_idx   ON content (status) WHERE deleted_at IS NULL;
CREATE INDEX content_type_idx     ON content (type, status) WHERE deleted_at IS NULL;
CREATE INDEX content_region_idx   ON content (region_id) WHERE deleted_at IS NULL;
CREATE INDEX content_city_idx     ON content (city_id) WHERE deleted_at IS NULL;
CREATE INDEX content_scheduled_idx ON content (scheduled_at) WHERE status = 'scheduled';
-- Türkçe arama: başlık + özet + konum üzerinde tam metin indeksi.
CREATE INDEX content_search_idx ON content
  USING gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(tagline,'') || ' ' || coalesce(area,'')));
CREATE TRIGGER content_updated BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE content_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN (
               'highlight','description','badge','fact','trust','included',
               'excluded','bring','important','requirement','rule','policy',
               'amenity_group','itinerary','menu_group','weather','social',
               'rating_aspect','cancellation')),
  position   int NOT NULL DEFAULT 0,
  payload    jsonb NOT NULL,
  UNIQUE (content_id, kind, position)
);
CREATE INDEX content_blocks_lookup_idx ON content_blocks (content_id, kind, position);

CREATE TABLE content_media (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  media_id   uuid NOT NULL REFERENCES media(id) ON DELETE RESTRICT,
  role       text NOT NULL DEFAULT 'gallery'
             CHECK (role IN ('cover','gallery','room','package','area','service','ticket','banner')),
  position   int NOT NULL DEFAULT 0,
  caption    text NOT NULL DEFAULT '',
  UNIQUE (content_id, role, position)
);
CREATE INDEX content_media_media_idx ON content_media (media_id);

CREATE TABLE content_tags (
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  tag_id     int  NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  position   int  NOT NULL DEFAULT 0,
  PRIMARY KEY (content_id, tag_id)
);

CREATE TABLE content_locations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  role        text NOT NULL DEFAULT 'meeting'
              CHECK (role IN ('main','meeting','pickup','dropoff','venue')),
  position    int NOT NULL DEFAULT 0,
  time_label  text NOT NULL DEFAULT '',
  detail      text NOT NULL DEFAULT ''
);
CREATE INDEX content_locations_idx ON content_locations (content_id, role, position);

CREATE TABLE content_faqs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  position   int NOT NULL DEFAULT 0,
  question   text NOT NULL,
  answer     text NOT NULL,
  status     text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_faqs_idx ON content_faqs (content_id, position);
CREATE TRIGGER content_faqs_updated BEFORE UPDATE ON content_faqs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE content_relations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  to_content_id   uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  relation_type   text NOT NULL DEFAULT 'similar'
                  CHECK (relation_type IN ('similar','related','bundle','nearby','upsell')),
  position     int NOT NULL DEFAULT 0,
  UNIQUE (from_content_id, to_content_id, relation_type),
  -- Bir kayıt kendisine benzer olamaz.
  CONSTRAINT content_relations_not_self CHECK (from_content_id <> to_content_id)
);
CREATE INDEX content_relations_to_idx ON content_relations (to_content_id);

CREATE TABLE content_seo (
  content_id       uuid PRIMARY KEY REFERENCES content(id) ON DELETE CASCADE,
  seo_title        text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  canonical_url    text NOT NULL DEFAULT '',
  og_title         text NOT NULL DEFAULT '',
  og_description   text NOT NULL DEFAULT '',
  og_media_id      uuid REFERENCES media(id) ON DELETE SET NULL,
  noindex          boolean NOT NULL DEFAULT false,
  nofollow         boolean NOT NULL DEFAULT false,
  schema_type      text NOT NULL DEFAULT '',
  robots           text NOT NULL DEFAULT '',
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER content_seo_updated BEFORE UPDATE ON content_seo
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Slug değişince eski adres ölmesin. Yayınlama akışı burayı kendisi yazar.
CREATE TABLE url_redirects (
  id          bigserial PRIMARY KEY,
  from_path   text NOT NULL UNIQUE,
  to_path     text NOT NULL,
  status_code int NOT NULL DEFAULT 301 CHECK (status_code IN (301,302,307,308)),
  content_id  uuid REFERENCES content(id) ON DELETE SET NULL,
  created_by  uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT url_redirects_no_loop CHECK (from_path <> to_path)
);

-- Her yayınlamada anlık görüntü. "Bu sürümü geri yükle" bundan besleniyor.
CREATE TABLE content_revisions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id     uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  version        int NOT NULL,
  snapshot       jsonb NOT NULL,
  change_summary text NOT NULL DEFAULT '',
  created_by     uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, version)
);

-- Yorumlar. customer_id / booking_id sütunları burada FK'sız duruyor;
-- ilgili tablolar 012 ve 013'te oluştuğu için kısıtlar orada ekleniyor.
-- Sütunu baştan koymak, göç sırasında iki kez ALTER TABLE yapmayı önlüyor.
CREATE TABLE reviews (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id     uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  customer_id    uuid,
  booking_id     uuid,
  author_name    text NOT NULL,
  rating         int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title          text NOT NULL DEFAULT '',
  body           text NOT NULL DEFAULT '',
  party_label    text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','hidden','spam')),
  verified_booking boolean NOT NULL DEFAULT false,
  admin_reply    text NOT NULL DEFAULT '',
  admin_reply_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_reply_at timestamptz,
  report_count   int NOT NULL DEFAULT 0,
  stayed_on      date,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);
CREATE INDEX reviews_content_idx ON reviews (content_id, status) WHERE deleted_at IS NULL;
CREATE INDEX reviews_moderation_idx ON reviews (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE TRIGGER reviews_updated BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
