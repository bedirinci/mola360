import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  HOME_BLOCK_PLACEMENT,
  UPCOMING_FILTERS,
  UPCOMING_DAY_KEYS,
  homeThemeCards,
  homeCollectionCards,
  temaSayisiMetni,
  GEZI_NOKTALARI,
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
  supportOnline,
  istanbulSaati,
} from '../assets/js/home-blocks.js';
import { MolaVeri } from '../assets/js/data-gateway.js';
import { TAXONOMY_COLLECTIONS } from '../assets/js/taxonomy-data.js';

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
    expect(homeThemeCards().length).toBeGreaterThanOrEqual(6);
    expect(homeCollectionCards().length).toBeGreaterThanOrEqual(8);
    const basliklar = homeCollectionCards().map(k => k.title);
    expect(new Set(basliklar).size).toBe(basliklar.length);
  });

  it('tema sayısı temadaki ürünlerden hesaplanıyor, elle yazılmıyor', () => {
    /* Eskiden "31 tur", "15 etkinlik" gibi sayılar elle yazılıydı ve hiçbir
       ürüne karşılık gelmiyordu. */
    const kaynak = readFileSync(new URL('../assets/js/home-blocks.js', import.meta.url), 'utf8');
    expect(kaynak).not.toMatch(/count:\s*'\d+/);
    for (const t of homeThemeCards('2026-09-21')) {
      const urunler = MolaVeri.temaUrunleri(t.slug, '2026-09-21');
      expect(t.adet, t.title).toBe(urunler.length);
      expect(t.count.startsWith(urunler.length + ' '), t.title + ' · ' + t.count).toBe(true);
    }
  });

  it('tema sayısının birimi ürünlerin tipinden', () => {
    const kapi = MolaVeri;
    const tur = kapi.urun('tour', 'efes-sirince');
    const etkinlik = kapi.urun('event', 'aspendos-opera-bale-festivali');
    expect(temaSayisiMetni([tur], kapi)).toBe('1 tur');
    expect(temaSayisiMetni([etkinlik, etkinlik], kapi)).toBe('2 etkinlik');
    expect(temaSayisiMetni([tur, etkinlik], kapi)).toBe('2 seçenek');
  });

  it('ürünü olmayan tema gösterilmiyor', () => {
    /* Bütün temaların bugün ürünü var; ürünü olmayanı gizleyen kural,
       temaların sayısından az kart dönmesiyle değil süzgeçle ölçülüyor. */
    const kaynak = readFileSync(new URL('../assets/js/home-blocks.js', import.meta.url), 'utf8');
    const fn = kaynak.match(/function homeThemeCards\(bugun\) \{([\s\S]*?)\n\}/)[1];
    expect(fn).toContain('.filter(t => t.adet > 0)');
  });

  it('koleksiyonlar sınıflandırmadan: başlık, alt yazı, görsel', () => {
    const kartlar = homeCollectionCards();
    expect(kartlar.map(k => k.slug)).toEqual(TAXONOMY_COLLECTIONS.map(c => c.slug));
    kartlar.forEach((k, i) => {
      expect(k.title).toBe(TAXONOMY_COLLECTIONS[i].name);
      expect(k.text).toBe(TAXONOMY_COLLECTIONS[i].text);
    });
  });

  it('temalar ile koleksiyonlar aynı başlığı paylaşmaz', () => {
    /* Temalar aktivite türü, koleksiyonlar kitle/durum başlığı taşır;
       ikisi çakışırsa aynı fikir sayfada iki kez görünür. */
    const temalar = homeThemeCards().map(t => t.title);
    const koleksiyonlar = homeCollectionCards().map(k => k.title);
    expect(temalar.filter(t => koleksiyonlar.includes(t))).toEqual([]);
  });

  it('gezi noktalarında gerekli alanlar var, başlıklar tekil, uydurma puan yok', () => {
    expect(GEZI_NOKTALARI.length).toBeGreaterThanOrEqual(6);
    GEZI_NOKTALARI.forEach(yer => {
      ['img', 'type', 'title', 'area', 'hours', 'hedef'].forEach(alan => {
        expect(String(yer[alan] || ''), yer.title + ' ' + alan).not.toBe('');
      });
      /* Ölçülmüş puan ve anlık açık/kapalı verisi yok: yazılmıyor. */
      ['rating', 'reviews', 'open'].forEach(alan => expect(yer[alan], yer.title).toBeUndefined());
      /* Her kart gerçek bir sayfaya. */
      expect(MolaVeri.adres(yer.hedef.split('?')[0]), yer.hedef).toBeTruthy();
    });
    const basliklar = GEZI_NOKTALARI.map(m => m.title);
    expect(new Set(basliklar).size).toBe(basliklar.length);
  });

  it('"Mekanlar" bloğunda yalnızca rezervasyonlu mekânlar', () => {
    const blok = readFileSync(new URL('../assets/js/home-blocks.js', import.meta.url), 'utf8');
    const venues = blok.match(/venues: \(\) => `([\s\S]*?)<\/section>`,/)[1];
    expect(venues).not.toContain('GEZI_NOKTALARI');
    expect(HOME_BLOCK_PLACEMENT['Aktiviteler']).toEqual(['venues', 'sights']);
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
    /* Her bağ gerçek bir sayfaya: yönlendiricinin tanıdığı bir adres
       (ya da dosyası olan ürün) ve yalnızca bilinen parametreler. */
    const bilinen = new Set(MolaVeri.yuzeyTanimlari('2026-09-21').map(a => a.key).concat(['q', 'sirala', 'sayfa']));
    tumu.forEach(bag => {
      expect(bag.label.trim()).not.toBe('');
      expect(bag.href.startsWith('#'), bag.href + ' yer tutucu').toBe(false);
      const [yol, sorgu] = bag.href.split('#')[0].split('?');
      expect(MolaVeri.adres(yol), bag.label + ' → ' + bag.href).toBeTruthy();
      (sorgu || '').split('&').filter(Boolean).forEach(p =>
        expect(bilinen.has(p.split('=')[0]), bag.href).toBe(true));
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


describe('destek çevrimiçi göstergesi', () => {
  /* WhatsApp kartindaki yesil isik bu fonksiyona bagli. Sabit yesil
     olsaydi gece 3'te de "Cevrimici" yazardi. */
  const TR = (iso) => new Date(iso);   // Turkiye = UTC+3

  it('saatler Türkiye saatine göre okunuyor, cihazın yereline göre değil', () => {
    /* 06:00Z = Turkiye'de 09:00. Cihaz nerede olursa olsun ayni. */
    expect(istanbulSaati(TR('2026-09-20T06:00:00Z'))).toBeCloseTo(9, 5);
    expect(istanbulSaati(TR('2026-09-20T00:00:00Z'))).toBeCloseTo(3, 5);
  });

  it('mesai içinde açık', () => {
    expect(supportOnline(TR('2026-09-20T06:01:00Z'), 9, 22)).toBe(true);   // 09:01
    expect(supportOnline(TR('2026-09-20T12:00:00Z'), 9, 22)).toBe(true);   // 15:00
    expect(supportOnline(TR('2026-09-20T18:59:00Z'), 9, 22)).toBe(true);   // 21:59
  });

  it('mesai dışında kapalı', () => {
    expect(supportOnline(TR('2026-09-20T05:59:00Z'), 9, 22)).toBe(false);  // 08:59
    expect(supportOnline(TR('2026-09-20T19:01:00Z'), 9, 22)).toBe(false);  // 22:01
    expect(supportOnline(TR('2026-09-20T00:00:00Z'), 9, 22)).toBe(false);  // 03:00
  });

  it('sınırlar: açılışta açık, kapanışta kapalı', () => {
    expect(supportOnline(TR('2026-09-20T06:00:00Z'), 9, 22), 'tam 09:00 açık olmalı').toBe(true);
    expect(supportOnline(TR('2026-09-20T19:00:00Z'), 9, 22), 'tam 22:00 kapalı olmalı').toBe(false);
  });

  /* Yukaridakiler saf fonksiyonu sinar. Asagidakiler EKRANDA gecerli
     olan gercek yapilandirmayi sinar: WhatsApp 08:00 - 23:59. */
  const wa = (iso) => supportOnline(TR(iso),
    CONTACT.whatsappOpenHour, CONTACT.whatsappCloseHour);

  it('WhatsApp penceresi: 08:00 açık, 07:59 kapalı', () => {
    expect(wa('2026-09-20T05:00:00Z'), 'tam 08:00 açık olmalı').toBe(true);
    expect(wa('2026-09-20T04:59:00Z'), '07:59 kapalı olmalı').toBe(false);
  });

  it('WhatsApp penceresi: 23:59 hâlâ açık, 00:00 kapalı', () => {
    /* Istenen ust sinir 23:59. Kapanis 24 yazildigi icin gece yarisina
       kadar acik kaliyor; 23.98 gibi bir deger 23:59'u DISARIDA
       birakirdi. */
    expect(wa('2026-09-20T20:59:00Z'), '23:59 açık olmalı').toBe(true);
    expect(wa('2026-09-20T21:00:00Z'), '00:00 kapalı olmalı').toBe(false);
    expect(wa('2026-09-20T22:00:00Z'), 'gece 01:00 kapalı olmalı').toBe(false);
  });

  it('WhatsApp penceresi telefon hattını KAPSIYOR', () => {
    /* Tasarim karari: WhatsApp bilerek daha genis. Daraltilirsa
       telefon acikken WhatsApp "kapali" gorunur, bu tuhaf olurdu. */
    const m = CONTACT.hours.match(/(\d{2}):00\s*[–-]\s*(\d{2}):00/);
    expect(m, 'telefon saat metni beklenen biçimde değil: ' + CONTACT.hours).not.toBe(null);
    const telAcilis = Number(m[1]), telKapanis = Number(m[2]);
    expect(CONTACT.whatsappOpenHour,
      'WhatsApp telefondan geç açılıyor').toBeLessThanOrEqual(telAcilis);
    expect(CONTACT.whatsappCloseHour,
      'WhatsApp telefondan erken kapanıyor').toBeGreaterThanOrEqual(telKapanis);
  });
});
