/* Kurumsal ve yasal sayfalar (6. adım): corporate-data.js içeriği ve
   corporate-page.js işaretlemesi. Ölçülenler:
     - her menü satırının içerik kaydı var, adları aynı
     - metindeki kural sayıları kural tablosuyla aynı (kapora, taksit,
       hoş geldin kuponu, hava iadesi)
     - metindeki her bağ gerçek bir sayfaya gidiyor
     - şirket kimliği uydurulmuyor; eksik alan işaretli
     - çerez politikası koddaki depo anahtarları ve dış kaynaklarla aynı */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const K = require('../assets/js/corporate-data.js');
const S = require('../assets/js/corporate-page.js');
const R = require('../assets/js/booking-engine.js');
const T = require('../assets/js/taxonomy-data.js');
const HB = require('../assets/js/home-blocks.js');
const { MolaVeri } = require('../assets/js/data-gateway.js');

const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');
const tumMetinler = () => {
  const out = [];
  K.KRM_SSS.forEach(x => { out.push(x.soru, x.cevap); });
  K.KRM_SAYFALAR.forEach(s => s.bolumler.forEach(b => {
    out.push(b.baslik);
    b.icerik.forEach(i => {
      if (typeof i === 'string') out.push(i);
      else if (i.liste) out.push(...i.liste);
      else if (i.tablo) i.tablo.satirlar.forEach(r => out.push(...r));
    });
  }));
  return out.filter(Boolean);
};

describe('sayfalar ve menü', () => {
  it('her kurumsal sayfa adrese çözülüyor', () => {
    K.KRM_SAYFALAR.forEach(s => {
      const a = MolaVeri.adres('kurumsal/' + s.slug + '/');
      expect(a, s.slug).toEqual({ kind: 'corporate', path: 'kurumsal/' + s.slug, slug: s.slug });
      expect(MolaVeri.sayfaModeli(a, '2026-09-27').baslik).toBe(s.baslik);
    });
    expect(MolaVeri.adres('kurumsal/boyle-sayfa-yok')).toBe(null);
  });

  it('Kurumsal menüsündeki her satırın içerik kaydı var ve adı aynı', () => {
    const kurumsal = T.TAXONOMY_MENU.find(d => d.label === 'Kurumsal');
    kurumsal.children.forEach(c => {
      const s = K.krmSayfa(c.path.split('/')[1]);
      expect(s, c.path).toBeTruthy();
      expect(c.label, c.path).toBe(s.menuAdi && s.menuAdi !== 'KVKK' ? s.menuAdi : (s.menuAdi || s.baslik));
    });
  });

  it('metindeki her bağ gerçek bir sayfaya gidiyor', () => {
    tumMetinler().forEach(m => [...m.matchAll(/\]\(([^)]*)\)/g)].forEach(([, yol]) => {
      const temiz = yol.split(/[?#]/)[0];
      expect(MolaVeri.adres(temiz), m.slice(0, 40) + ' → ' + yol).toBeTruthy();
    }));
  });

  it('her yer tutucu çözülüyor (şirket alanı değilse boş kalmıyor)', () => {
    const b = S.krsBaglam();
    const sirketAlanlari = K.KRM_SIRKET_ALANLARI.map(a => a[0]);
    tumMetinler().forEach(m => [...m.matchAll(/\{([a-zA-Z]+)\}/g)].forEach(([, ad]) => {
      if (sirketAlanlari.indexOf(ad) !== -1) return;
      expect(b[ad], ad + ' (' + m.slice(0, 30) + ')').toBeTruthy();
    }));
  });
});

describe('metin kurallarla aynı', () => {
  const sss = (id) => K.KRM_SSS.find(x => x.id === id);
  const b = S.krsBaglam();

  it('kapora: oran, kalan seçenekleri ve 2 gün sınırı', () => {
    expect(R.REZ_KAPORA.oran).toBe(0.2);
    expect(R.REZ_KAPORA.enAzGun).toBe(2);
    expect(sss('kapora').cevap).toContain('%20');
    expect(sss('kapora').cevap).toContain('iki günden az');
    expect(b.kaporaOrani).toBe('%20');
    expect(R.REZ_KAPORA.tipler).toEqual(['tour']);
  });

  it('taksit: 2 ve 3 taksit her ailede vade farksız; aileler ve alt sınır tablodan', () => {
    R.REZ_TAKSIT.aileler.forEach(a => { expect(a.oranlar[2], a.id).toBe(0); expect(a.oranlar[3], a.id).toBe(0); });
    const metin = K.krmDuzMetin(sss('taksit').cevap, b);
    R.REZ_TAKSIT.aileler.forEach(a => expect(metin).toContain(a.ad));
    expect(metin).toContain('500 TL');
  });

  it('hoş geldin kuponu ve hava iadesi', () => {
    expect(K.krmDuzMetin(sss('uyelik').cevap, b)).toContain('%15');
    expect(K.krmDuzMetin(sss('uyelik').cevap, b)).toContain('90 gün');
    expect(MolaVeri.urun('activity', 'kapadokya-balon-turu').cancellation.weatherRefund).toBe(1);
  });

  it('anasayfa SSS düz metin ve tek kaynaktan', () => {
    const ana = K.KRM_SSS.filter(x => x.anasayfa);
    expect(ana.length).toBeGreaterThanOrEqual(8);
    ana.forEach(x => { expect(x.cevap, x.id).not.toMatch(/\{|\]\(/); });
    expect(HB.SEO_FAQ).toEqual(ana.map(x => ({ q: x.soru, a: x.cevap })));
  });

  it('sitede olmayan şey vaat edilmiyor (sepet, tesiste ödeme, 7/24)', () => {
    const hepsi = tumMetinler().join(' ');
    ['sepete', 'tesiste ödeme', '7/24'].forEach(x => expect(hepsi, x).not.toContain(x));
    ['index.html', '404.html', 'tur/efes-sirince/index.html'].forEach(f => expect(oku(f), f).not.toContain('7/24 destek'));
  });

  it('SSS kategorileri dolu, kimlikler tekil', () => {
    const idler = K.KRM_SSS.map(x => x.id);
    expect(new Set(idler).size).toBe(idler.length);
    K.KRM_SSS_KATEGORILER.forEach(k => expect(K.KRM_SSS.some(x => x.kategori === k.id), k.id).toBe(true));
  });
});

describe('şirket kimliği', () => {
  it('uydurulmuyor: bilinmeyen alan boş ve işaretli gösteriliyor', () => {
    K.KRM_SIRKET_ALANLARI.forEach(([ad]) => {
      const v = K.KRM_SIRKET[ad];
      expect(v === null || (typeof v === 'string' && v.trim().length > 3), ad).toBe(true);
    });
    const html = K.krmMetin('Satıcı: {unvan}', {});
    expect(html).toContain('<mark class="krm-eksik">[Ticari unvan eklenecek]</mark>');
    expect(K.krmEksikAlanlar({ unvan: 'X A.Ş.' }).map(x => x.ad)).not.toContain('unvan');
  });

  it('şirket tablosu her alanı gösteriyor', () => {
    const html = S.krsSirketMarkup(S.krsBaglam());
    K.KRM_SIRKET_ALANLARI.forEach(([, etiket]) => expect(html).toContain(etiket));
  });
});

describe('çerez politikası gerçekle aynı', () => {
  const kodlar = readdirSync(new URL('../assets/js/', import.meta.url)).filter(f => f.endsWith('.js'))
    .map(f => oku('assets/js/' + f)).join('\n');

  it('çerez yazılmıyor', () => {
    expect(kodlar).not.toMatch(/document\.cookie/);
  });

  it('koddaki her depo anahtarı listede, listedeki her anahtar kodda', () => {
    const koddaki = new Set([...kodlar.matchAll(/'(mola360\.[a-zA-Z]+|m360-admin-[a-z]+)'/g)].map(m => m[1]));
    const listede = new Set(K.KRM_DEPO.map(d => d.anahtar));
    koddaki.forEach(a => expect(listede.has(a), a).toBe(true));
    listede.forEach(a => expect(koddaki.has(a), a).toBe(true));
  });

  it('yüklenen dış kaynakların hepsi sayfada adıyla yazılı', () => {
    const cerez = K.krmSayfa('cerez-politikasi').bolumler.map(b => b.icerik.filter(i => typeof i === 'string').join(' ')).join(' ');
    const adlar = { 'fonts.googleapis.com': 'Google Fonts', 'fonts.gstatic.com': 'Google Fonts', 'images.unsplash.com': 'Unsplash',
      'commons.wikimedia.org': 'Wikimedia', 'upload.wikimedia.org': 'Wikimedia', 'picsum.photos': 'Picsum',
      'www.google.com': 'Google Haritalar', 'wa.me': 'WhatsApp' };
    const sayfalar = ['index.html', '404.html'].concat(readdirSync(new URL('../', import.meta.url), { withFileTypes: true })
      .filter(d => d.isDirectory() && ['tur', 'otel', 'aktivite', 'etkinlik', 'mekan'].includes(d.name))
      .flatMap(d => readdirSync(new URL('../' + d.name + '/', import.meta.url)).map(x => d.name + '/' + x + '/index.html')));
    const metin = kodlar + sayfalar.map(oku).join('\n') + readdirSync(new URL('../assets/css/', import.meta.url)).map(f => oku('assets/css/' + f)).join('\n');
    const hostlar = new Set([...metin.matchAll(/https:\/\/([a-z0-9.-]+\.[a-z]{2,})/g)].map(m => m[1])
      .filter(h => !['bedirinci.github.io', 'schema.org', 'www.w3.org'].includes(h)));
    hostlar.forEach(h => {
      expect(adlar[h], h + ' çerez politikasında yok').toBeTruthy();
      expect(cerez, h).toContain(adlar[h]);
    });
  });
});

describe('işaretleme', () => {
  it('iptal tablosu ürünlerin kendi kademelerinden', () => {
    const urunler = MolaVeri.urunler().filter(k => !k.sample);
    const html = S.krsIptalTablosuMarkup(urunler, () => 'Tur', (k) => MolaVeri.seo(MolaVeri.icerikTipi(k), k).path);
    urunler.forEach(k => {
      expect(html).toContain(k.title.replace(/&/g, '&amp;'));
      k.cancellation.tiers.forEach(t => expect(html).toContain(t.label));
    });
    expect(S.krsIadeMetni(1)).toBe('Tamamı iade');
    expect(S.krsIadeMetni(0.7)).toBe('%70 iade');
    expect(S.krsIadeMetni(0)).toBe('İade yok');
  });

  it('ödeme ekranındaki belgeler rezervasyonun kendi bilgileriyle', () => {
    const t = R.rezTeklif('tour', MolaVeri.urun('tour', 'efes-sirince'), { date: '2026-10-06', adults: 2 }, { odeme: 'kapora', kalan: 'aracta' }, '2026-09-27');
    const on = S.krsSozlesmeMarkup('on-bilgilendirme', t);
    expect(on).toContain('Efes Antik Kenti');
    expect(on).toContain('516 TL');
    expect(on).toContain('tur günü araçta');
    expect(on).toContain('Cayma hakkı');
    expect(on).toContain('[yayından önce eklenecek]');
    const sozlesme = S.krsSozlesmeMarkup('mesafeli-satis-sozlesmesi', t);
    expect(sozlesme).toContain('2.580 TL');
    expect(sozlesme).toContain('İptal ve iade');
    expect(S.krsSozlesmeMarkup('boyle-belge-yok', t)).toBe('');
  });

  it('SSS araması soru ve cevapta arıyor; bulunamazsa iletişime yönlendiriyor', () => {
    const b = S.krsBaglam();
    const html = S.krsSssMarkup(K.KRM_SSS, K.KRM_SSS_KATEGORILER, b, 'kapora');
    expect((html.match(/<details class="krs-faq"/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(S.krsSssMarkup(K.KRM_SSS, K.KRM_SSS_KATEGORILER, b, 'qqqzzz')).toContain('kurumsal/iletisim/');
    expect(S.krsSssMarkup(K.KRM_SSS, K.KRM_SSS_KATEGORILER, b, '<b>')).toContain('&lt;b&gt;');
  });

  it('iletişim kanalları yer tutucu numarayı söylüyor', () => {
    expect(HB.CONTACT.yerTutucu).toBe(true);
    expect(S.krsIletisimKanallariMarkup(S.krsBaglam())).toContain('yer tutucu');
  });
});

describe('iletişim talebi', () => {
  it('form doğrulanıyor, deneme olarak kaydediliyor', async () => {
    const bos = await MolaVeri.iletisimTalebi({});
    expect(bos.hatalar.map(h => h.alan)).toEqual(['ad', 'eposta', 'konu', 'mesaj', 'kvkk']);
    const ok = await MolaVeri.iletisimTalebi({ ad: 'Ayşe Yılmaz', eposta: 'a@b.co', konu: 'Rezervasyon', mesaj: 'Grup fiyatı rica ediyorum.', kvkk: true });
    expect(ok).toMatchObject({ tamam: true, deneme: true });
    expect(ok.kod).toMatch(/^T-[A-Z0-9]{6}$/);
    expect((await MolaVeri.iletisimTalebi({ tur: 'geri-arama', telefon: '123' })).tamam).toBe(false);
    expect((await MolaVeri.iletisimTalebi({ tur: 'geri-arama', telefon: '0532 123 45 67' })).tamam).toBe(true);
  });

  it('Beni Ara ve iletişim formu talebin ekibe iletilmediğini söylüyor', () => {
    expect(oku('assets/js/app.js')).toContain('talepler henüz ekibe iletilmiyor');
    expect(S.krsIletisimFormuMarkup(['Rezervasyon'])).toContain('henüz ekibe iletilmez');
  });
});

describe('sayfa bağları', () => {
  it('alt bilgideki Gizlilik, Çerezler, Kullanım Koşulları bağlı', () => {
    ['index.html', '404.html', 'tur/efes-sirince/index.html', 'mekan/kordon-spa-masaj/index.html'].forEach(f => {
      const html = oku(f);
      ['kurumsal/kvkk/', 'kurumsal/cerez-politikasi/', 'kurumsal/kullanim-kosullari/'].forEach(y => expect(html, f + ' ' + y).toContain(y + '">'));
    });
  });

  it('yönlendirici kurumsal betiklerini yüklüyor; anasayfa SSS kaynağını home-blocks.js\'ten önce', () => {
    const y = oku('404.html');
    expect(y.indexOf('src="assets/js/corporate-data.js"')).toBeLessThan(y.indexOf('src="assets/js/home-blocks.js"'));
    expect(y.indexOf('src="assets/js/corporate-page.js"')).toBeLessThan(y.indexOf('src="assets/js/listing-page.js"'));
    expect(y).toContain('href="assets/css/corporate.css"');
    const ana = oku('index.html');
    expect(ana.indexOf('assets/js/corporate-data.js')).toBeLessThan(ana.indexOf('assets/js/home-blocks.js'));
    expect(ana).not.toContain('hizliresim');
  });
});
