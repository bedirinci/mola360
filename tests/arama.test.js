/* Arama: başlıktaki kutu ve arama sayfası (/arama/?q=) AYNI kuralla
   eşleşiyor (veri kapısı: kapiAramaPuani). Son aramalar ve son
   görüntülenenler ziyaretçinin kendi geçmişi (visitor-history.js). */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MolaVeri, kapiNormal, kapiAramaPuani } = require('../assets/js/data-gateway.js');
const M = require('../assets/js/listing-engine.js');
const G = require('../assets/js/visitor-history.js');
const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');
const BUGUN = '2026-09-21';
const slug = (liste) => liste.map(k => k.slug);

describe('metin eşleşmesi', () => {
  it('büyük/küçük harf, Türkçe karakter ve şapka farkı yok', () => {
    expect(kapiNormal('İZMİR Şile Ağva')).toBe('izmir sile agva');
    expect(slug(MolaVeri.hizliAra('ŞİLE', BUGUN))).toEqual(slug(MolaVeri.hizliAra('sile', BUGUN)));
  });

  it('her kelime bir yerde geçmeli (VE)', () => {
    expect(slug(MolaVeri.hizliAra('bodrum tekne', BUGUN))).toEqual(['bodrum-tekne-turu']);
    expect(MolaVeri.hizliAra('bodrum kayak', BUGUN)).toEqual([]);
  });

  it('Türkçe ek: "kapadokyada", "otelleri"', () => {
    expect(slug(MolaVeri.hizliAra('kapadokyada', BUGUN))).toContain('kapadokya-3-gece');
    expect(slug(MolaVeri.hizliAra('izmir otelleri', BUGUN))).toEqual(['kordon-butik-otel']);
  });

  it('sınıflandırmadan: tema, şehir, bölge adıyla bulunuyor', () => {
    expect(slug(MolaVeri.hizliAra('gastronomi', BUGUN))).toContain('alacati-pazar-turu');
    expect(slug(MolaVeri.hizliAra('karadeniz', BUGUN))).toContain('karadeniz-yaylalari');
  });

  it('başlıkta geçen, yalnızca yerinde geçenden önde', () => {
    const k1 = MolaVeri.urun('tour', 'efes-sirince');
    const k2 = MolaVeri.urun('venue', 'kum-beach-club');
    expect(kapiAramaPuani(k1, 'efes')).toBeGreaterThan(kapiAramaPuani(k2, 'izmir') - 10);
    expect(kapiAramaPuani(k1, 'efes')).toBeGreaterThan(kapiAramaPuani(k1, 'izmir'));
  });

  it('kutu ve arama sayfası aynı sonucu veriyor', async () => {
    for (const q of ['izmir', 'kapadokya', 'konser', 'tekne']) {
      const sonuc = await MolaVeri.liste({ temel: { q }, durum: { secim: {}, siralama: 'alaka', sayfa: 5 }, bugun: BUGUN });
      expect(sonuc.toplam, q).toBe(MolaVeri.listele({ q }, BUGUN).length);
      expect(slug(MolaVeri.hizliAra(q, BUGUN, 50)).sort(), q).toEqual(sonuc.satirlar.map(s => s.slug).sort());
      /* En alakalı sıralaması puana göre. */
      const puanlar = sonuc.satirlar.map(s => s.alaka);
      expect(puanlar, q).toEqual(puanlar.slice().sort((a, b) => b - a));
    }
  });

  it('adı eşleşen liste sayfaları kısayol olarak', () => {
    expect(MolaVeri.aramaSayfalari('kapadokya').map(x => x.path)).toContain('turlar/kapadokya-turlari');
    expect(MolaVeri.aramaSayfalari('konser').map(x => x.path)).toContain('etkinlikler/konserler');
    expect(MolaVeri.aramaSayfalari('')).toEqual([]);
  });
});

describe('arama sayfası', () => {
  it('/arama/ yönlendiricide çözülüyor; model sorgudan', () => {
    expect(MolaVeri.adres('arama').kind).toBe('search');
    const m = MolaVeri.aramaModeli('kapadokya');
    expect(m.temel).toEqual({ q: 'kapadokya' });
    expect(m.baslik).toBe('“kapadokya” için sonuçlar');
    expect(MolaVeri.aramaModeli('').temel).toBe(null);
    expect(MolaVeri.aramaModeli('x'.repeat(200)).q.length).toBe(80);
  });

  it('"en alakalı" yalnızca arama sayfasının seçeneği ve orada varsayılan', () => {
    const alaka = M.SUZ_SIRALAMALAR.find(s => s.slug === 'alaka');
    expect(alaka.arama).toBe(true);
    expect(M.suzOku('?q=x', [], 'alaka').siralama).toBe('alaka');
    expect(M.suzYaz({ secim: {}, siralama: 'alaka' }, [], 'alaka')).toBe('');
    expect(M.suzYaz({ secim: {}, siralama: 'alaka' }, [])).toBe('sirala=alaka');
  });

  it('Google için site içi arama adresi arama sayfası', () => {
    expect(oku('index.html')).toContain('"urlTemplate": "https://bedirinci.github.io/mola360/arama/?q={search_term_string}"');
  });

  it('başlıktaki kutu Enter ile arama sayfasına gidiyor; son aramalar elle yazılmıyor', () => {
    const app = oku('assets/js/app.js');
    expect(app).toContain("'arama/?q='");
    expect(app).not.toMatch(/const recentSearchTerms = \[/);
    /* Masaüstünde yazı başlıktaki kutuya: salt okunurluk açılıyor. */
    expect(app).toContain('baslikKutusu.readOnly = false');
  });
});

describe('ziyaretçi geçmişi', () => {
  const sahteDepo = () => {
    const v = {};
    return { getItem: (k) => (k in v ? v[k] : null), setItem: (k, d) => { v[k] = String(d); }, _v: v };
  };

  it('son aramalar: en yeni başta, tekrar yok, sınırlı', () => {
    const d = sahteDepo();
    G.gecAramaEkle('İzmir', d);
    G.gecAramaEkle('kapadokya', d);
    G.gecAramaEkle('izmir', d);
    expect(G.gecOku('arama', d)).toEqual(['izmir', 'kapadokya']);
    G.gecAramaEkle('a', d);
    expect(G.gecOku('arama', d).length).toBe(2);
    for (let i = 0; i < 20; i++) G.gecAramaEkle('arama ' + i, d);
    expect(G.gecOku('arama', d).length).toBe(G.GEC_SINIR.arama);
    G.gecAramaSil('arama 19', d);
    expect(G.gecOku('arama', d)).not.toContain('arama 19');
  });

  it('son görüntülenenler: kimlik saklanıyor, ürün kapıdan okunuyor; yayından kalkan düşüyor', () => {
    const d = sahteDepo();
    G.gecUrunEkle('tour', 'efes-sirince', 1, d);
    G.gecUrunEkle('hotel', 'kordon-butik-otel', 2, d);
    G.gecUrunEkle('tour', 'efes-sirince', 3, d);
    G.gecUrunEkle('tour', 'kaldirilmis-tur', 4, d);
    const kayitli = G.gecOku('urun', d);
    expect(kayitli.map(x => x.slug)).toEqual(['kaldirilmis-tur', 'efes-sirince', 'kordon-butik-otel']);
    /* Kopya yok: ad veya fiyat saklanmıyor. */
    expect(Object.keys(kayitli[0]).sort()).toEqual(['slug', 't', 'tip']);
    const urunler = G.gecUrunler(MolaVeri, 10, null, d);
    expect(urunler.map(k => k.slug)).toEqual(['efes-sirince', 'kordon-butik-otel']);
    expect(G.gecUrunler(MolaVeri, 10, { tip: 'tour', slug: 'efes-sirince' }, d).map(k => k.slug)).toEqual(['kordon-butik-otel']);
  });

  it('depo yoksa ya da bozuksa sessizce boş', () => {
    expect(G.gecOku('arama', null)).toEqual([]);
    const bozuk = { getItem: () => '{bozuk', setItem: () => { throw new Error('kota'); } };
    expect(G.gecOku('arama', bozuk)).toEqual([]);
    expect(() => G.gecAramaEkle('izmir', bozuk)).not.toThrow();
  });
});
