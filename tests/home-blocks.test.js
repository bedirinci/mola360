import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  HOME_BLOCK_PLACEMENT,
  UPCOMING_FILTERS,
  UPCOMING_DAY_KEYS,
  THEME_COLLECTIONS,
  GRID_COLLECTIONS,
  VENUES,
  PROMO_BANDS,
  NEWSLETTER_PERKS,
  CONTACT,
  SEO_LINK_GROUPS,
  SEO_RELATED_SEARCHES,
  SEO_ARTICLE,
  SEO_FAQ,
  filterUpcomingItems,
  isValidEmail,
  isValidPhone,
} from '../assets/js/home-blocks.js';

const ornek = [
  { title: 'Uzak',      inDays: 12 },
  { title: 'Cumartesi', inDays: 1, dayKey: 'cumartesi' },
  { title: 'Cuma',      inDays: 0, dayKey: 'cuma' },
  { title: 'Pazar',     inDays: 2, dayKey: 'pazar' },
  { title: 'Üç gün',    inDays: 3 },
];

describe('filterUpcomingItems', () => {
  it('"tümü" listenin tamamını en yakın tarihten uzağa sıralar', () => {
    expect(filterUpcomingItems(ornek, 'tumu').map(i => i.title))
      .toEqual(['Cuma', 'Cumartesi', 'Pazar', 'Üç gün', 'Uzak']);
  });

  it('bilinmeyen anahtar da tüm listeyi sıralı döndürür', () => {
    expect(filterUpcomingItems(ornek, 'yok')).toHaveLength(5);
  });

  it('gün filtreleri yalnızca o günün kayıtlarını alır', () => {
    expect(filterUpcomingItems(ornek, 'cuma').map(i => i.title)).toEqual(['Cuma']);
    expect(filterUpcomingItems(ornek, 'cumartesi').map(i => i.title)).toEqual(['Cumartesi']);
    expect(filterUpcomingItems(ornek, 'pazar').map(i => i.title)).toEqual(['Pazar']);
  });

  it('günü olmayan kayıtlar gün filtrelerine düşmez', () => {
    UPCOMING_DAY_KEYS.forEach(gun => {
      filterUpcomingItems(ornek, gun).forEach(item => expect(item.dayKey).toBe(gun));
    });
  });

  it('kaynağı değiştirmez', () => {
    filterUpcomingItems(ornek, 'tumu').pop();
    expect(ornek).toHaveLength(5);
    expect(ornek[0].title).toBe('Uzak');
  });

  it('geçersiz girdide boş liste döndürür', () => {
    expect(filterUpcomingItems(null, 'tumu')).toEqual([]);
  });
});

describe('isValidEmail', () => {
  it('geçerli adresleri kabul eder', () => {
    expect(isValidEmail('bedir@ornek.com')).toBe(true);
    expect(isValidEmail('  a.b@alt.ornek.com.tr  ')).toBe(true);
  });

  it('geçersiz adresleri reddeder', () => {
    ['', 'yanlis', 'a@b', 'a@b.c', 'bosluk var@ornek.com', '@ornek.com', null, undefined]
      .forEach(deger => expect(isValidEmail(deger)).toBe(false));
  });
});

describe('isValidPhone', () => {
  it('yazım biçiminden bağımsız olarak Türkiye numaralarını kabul eder', () => {
    ['05551112233', '5551112233', '0555 111 22 33', '+90 555 111 22 33', '(0555) 111-22-33']
      .forEach(deger => expect(isValidPhone(deger)).toBe(true));
  });

  it('eksik, fazla veya hatalı numaraları reddeder', () => {
    ['', '123', '555111223', '05551112233444', '0055511122', null, undefined]
      .forEach(deger => expect(isValidPhone(deger)).toBe(false));
  });
});

describe('blok verileri', () => {
  it('filtre listesi "tümü" ile başlar ve anahtarları tekildir', () => {
    const anahtarlar = UPCOMING_FILTERS.map(f => f.key);
    expect(anahtarlar[0]).toBe('tumu');
    expect(new Set(anahtarlar).size).toBe(anahtarlar.length);
  });

  it('gün filtreleri listedeki anahtarlarla birebir örtüşür', () => {
    const gunler = UPCOMING_FILTERS.slice(1).map(f => f.key);
    expect(gunler).toEqual(UPCOMING_DAY_KEYS);
  });

  it('kaldırılan bloklar yerleşim haritasında yok', () => {
    const yerlesenler = Object.values(HOME_BLOCK_PLACEMENT).flat();
    expect(yerlesenler).not.toContain('weekend');
    expect(yerlesenler).not.toContain('trust');
  });

  it('koleksiyon blokları beklenen sayıda', () => {
    expect(THEME_COLLECTIONS.length).toBeGreaterThanOrEqual(6);
    expect(GRID_COLLECTIONS.length).toBeGreaterThanOrEqual(8);
    const basliklar = GRID_COLLECTIONS.map(k => k.title);
    expect(new Set(basliklar).size).toBe(basliklar.length);
  });

  it('temalar ile koleksiyonlar aynı başlığı paylaşmaz', () => {
    /* Temalar aktivite türü, koleksiyonlar kitle/durum başlığı taşır;
       ikisi çakışırsa aynı fikir sayfada iki kez görünür. */
    const temalar = THEME_COLLECTIONS.map(t => t.title);
    const koleksiyonlar = GRID_COLLECTIONS.map(k => k.title);
    expect(temalar.filter(t => koleksiyonlar.includes(t))).toEqual([]);
  });

  it('mekan kayıtlarında gerekli alanlar var ve başlıklar tekil', () => {
    /* Masaüstünde 6 mekan / 8 koleksiyon görünmesi isteniyor. */
    expect(VENUES.length).toBeGreaterThanOrEqual(6);
    VENUES.forEach(mekan => {
      ['img', 'type', 'title', 'area', 'rating', 'reviews', 'hours'].forEach(alan => {
        expect(String(mekan[alan] || '')).not.toBe('');
      });
      expect(typeof mekan.open).toBe('boolean');
    });
    const basliklar = VENUES.map(m => m.title);
    expect(new Set(basliklar).size).toBe(basliklar.length);
  });

  it('kampanya bandı yaklaşan planların altında geliyor', () => {
    expect(HOME_BLOCK_PLACEMENT['Yaklaşan Planlar']).toContain('promo');
    expect(HOME_BLOCK_PLACEMENT['Günübirlik Turlar']).not.toContain('promo');
  });

  it('kampanya kartlarında gerekli alanlar var', () => {
    expect(PROMO_BANDS.length).toBeGreaterThan(1);
    PROMO_BANDS.forEach(kampanya => {
      ['img', 'badge', 'title', 'text', 'cta'].forEach(alan => {
        expect(String(kampanya[alan] || '')).not.toBe('');
      });
    });
  });

  it('bülten ve iletişim ayrı bloklar olarak yerleşir', () => {
    const otelAltinda = HOME_BLOCK_PLACEMENT['Oteller'];
    expect(otelAltinda).toContain('newsletter');
    expect(otelAltinda).toContain('support');
    expect(NEWSLETTER_PERKS.length).toBeGreaterThan(0);
  });

  it('iletişim bağlantıları doğru biçimde', () => {
    expect(CONTACT.phoneHref.startsWith('tel:')).toBe(true);
    expect(CONTACT.whatsappHref.startsWith('https://wa.me/')).toBe(true);
  });
  /* ---- alt SEO blogu ---- */

  it('SEO bloğu destek kartından sonra yerleşir', () => {
    const otelAltinda = HOME_BLOCK_PLACEMENT['Oteller'];
    expect(otelAltinda).toContain('seo');
    expect(otelAltinda.indexOf('seo')).toBeGreaterThan(otelAltinda.indexOf('support'));
  });

  it('iç bağlantı ağı yeterince geniş ve bağlantılar geçerli', () => {
    expect(SEO_LINK_GROUPS.length).toBeGreaterThanOrEqual(4);
    const tumu = SEO_LINK_GROUPS.flatMap(g => g.links).concat(SEO_RELATED_SEARCHES);
    expect(tumu.length).toBeGreaterThanOrEqual(60);
    tumu.forEach(bag => {
      expect(bag.label.trim()).not.toBe('');
      expect(bag.href.startsWith('#/')).toBe(true);
    });
  });

  it('aynı hedefe iki kez bağlanılmaz', () => {
    const hedefler = SEO_LINK_GROUPS.flatMap(g => g.links)
      .concat(SEO_RELATED_SEARCHES)
      .map(b => b.href);
    expect(new Set(hedefler).size).toBe(hedefler.length);
  });

  it('SEO metni başlıklı ve uzun', () => {
    expect(SEO_ARTICLE.length).toBeGreaterThanOrEqual(8);
    SEO_ARTICLE.forEach(bolum => {
      expect(bolum.h.trim()).not.toBe('');
      expect(bolum.p.length).toBeGreaterThan(0);
    });
    const kelime = SEO_ARTICLE
      .flatMap(b => b.p)
      .join(' ')
      .split(/\s+/)
      .filter(Boolean).length;
    expect(kelime).toBeGreaterThan(700);
  });

  it('SSS soruları ve cevapları dolu', () => {
    expect(SEO_FAQ.length).toBeGreaterThanOrEqual(8);
    SEO_FAQ.forEach(sss => {
      expect(sss.q.trim()).not.toBe('');
      expect(sss.a.length).toBeGreaterThan(60);
    });
  });

  it('index.html içindeki FAQPage yapısal verisi SSS ile birebir aynı', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const bloklar = [...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
    )].map(m => JSON.parse(m[1]));

    const faq = bloklar.find(b => b['@type'] === 'FAQPage');
    expect(faq).toBeTruthy();

    const htmlSorular = faq.mainEntity.map(s => s.name);
    const veriSorular = SEO_FAQ.map(s => s.q);
    expect(htmlSorular).toEqual(veriSorular);

    const htmlCevaplar = faq.mainEntity.map(s => s.acceptedAnswer.text);
    expect(htmlCevaplar).toEqual(SEO_FAQ.map(s => s.a));
  });
  /* ---- arastirma temelli SEO olcutleri (bkz. docs/seo-arastirma.md) ---- */

  it('her metin bölümü çıkarılabilir pasaj bandında (130-170 kelime)', () => {
    /* Uretken arama sayfayi bolum bolum alip puanliyor; olculen tercih
       araligi 134-167 kelime. Band biraz genis tutuldu. */
    SEO_ARTICLE.forEach(bolum => {
      const kelime = bolum.p.join(' ').split(/\s+/).filter(Boolean).length;
      expect(kelime, bolum.h).toBeGreaterThanOrEqual(130);
      expect(kelime, bolum.h).toBeLessThanOrEqual(170);
    });
  });

  it('bölüm başlıkları soru biçimli', () => {
    SEO_ARTICLE.forEach(bolum => {
      expect(bolum.h.trim().endsWith('?'), bolum.h).toBe(true);
    });
  });

  it('metinde yeterli varlık (yer adı) yoğunluğu var', () => {
    /* 15+ bagli varlik, secilme olasiligini belirgin artiriyor. */
    const yerler = ['İstanbul','İzmir','Ankara','Antalya','Bursa','Kapadokya','Göreme',
      'Nevşehir','Uludağ','Erciyes','Alaçatı','Çeşme','Alsancak','Konak','Kemeraltı',
      'Efes','Selçuk','Pamukkale','Yalova','Abant','Sapanca','Şile','İznik','Ayvalık',
      'Cunda','Bodrum','Fethiye','Ölüdeniz','Manavgat','Muğla','Harbiye','Aspendos'];
    const metin = SEO_ARTICLE.flatMap(b => b.p).join(' ');
    const gecen = yerler.filter(y => metin.includes(y));
    expect(gecen.length).toBeGreaterThanOrEqual(25);
  });
});

describe('WhatsApp logosunun geometrisi', () => {
  /* Logo iç içe iki daireden oluşuyor: dış baloncuk (r=10) ve onu halka
     yapan delik (r=8.13). İkisi EŞMERKEZLİ olmak zorunda, yoksa halka
     bir yanda kalınlaşır.

     Bir dönem tam olarak bu oldu: iç yayın başlangıç noktası merkeze
     8.39 uzaktaydı, yani kendi dairesinin dışındaydı. SVG yayı iki uç
     noktadan geçmek zorunda olduğu için merkez 0.61 birim aşağı kayıyor,
     delik iniyor ve halka tepede 2.48 / dipte 1.27 birim çıkıyordu —
     küçük ölçülerde "iki ikon üst üste binmiş" gibi görünüyordu. */
  const kaynak = readFileSync(
    new URL('../assets/js/home-blocks.js', import.meta.url), 'utf8');
  const yol = kaynak.match(/const WHATSAPP_ICON_PATH = '([^']+)'/)[1];
  const say = (...a) => a.map(Number);

  /* Dış baloncuğun yay uçları: ...L<x> <y>A10 10 0 1 0 <x> <y>Z */
  const dis = yol.match(/L([\d.]+) ([\d.]+)A10 10 0 1 0 ([\d.]+) ([\d.]+)Z/);
  /* Deliğin yay uçları: M<x> <y>A8.13 8.13 0 1 1 <x> <y>L */
  const ic = yol.match(/M([\d.]+) ([\d.]+)A8\.13 8\.13 0 1 1 ([\d.]+) ([\d.]+)L/);

  it('her iki yay da yolda duruyor', () => {
    expect(dis, 'dış baloncuk yayı bulunamadı — örüntü ölmüş olabilir').not.toBe(null);
    expect(ic, 'delik yayı bulunamadı — örüntü ölmüş olabilir').not.toBe(null);
  });

  it('delik dış baloncukla eşmerkezli', () => {
    const [x1, y1, x2, y2] = say(dis[1], dis[2], dis[3], dis[4]);
    /* Dış yayın iki ucundan ve r=10'dan merkezi çöz; iki aday çıkar,
       kutunun ortasına (12,12) yakın olan gerçek merkez. */
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const kx = x2 - x1, ky = y2 - y1;
    const kiris = Math.hypot(kx, ky);
    const h = Math.sqrt(100 - (kiris / 2) ** 2);
    const adaylar = [1, -1].map(s => [
      mx + s * h * (ky / kiris) * -1,
      my + s * h * (kx / kiris),
    ]);
    const uzak = ([px, py], [qx, qy]) => Math.hypot(px - qx, py - qy);
    const C = adaylar.sort((a, b) => uzak(a, [12, 12]) - uzak(b, [12, 12]))[0];

    /* Dış uçlar tanım gereği 10 birimde; asıl sınanan deliğin uçları. */
    expect(uzak([x1, y1], C)).toBeCloseTo(10, 1);
    expect(uzak([x2, y2], C)).toBeCloseTo(10, 1);

    const [ax, ay, bx, by] = say(ic[1], ic[2], ic[3], ic[4]);
    expect(uzak([ax, ay], C), 'delik yayının başlangıcı kendi dairesinin dışında')
      .toBeCloseTo(8.13, 1);
    expect(uzak([bx, by], C), 'delik yayının sonu kendi dairesinin dışında')
      .toBeCloseTo(8.13, 1);
  });
});
