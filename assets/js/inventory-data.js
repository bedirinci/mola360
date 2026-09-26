/* ---------------- örnek kontenjan ve kur (backend yerine geçici) ----------------
   BU DOSYA BACKEND GELİNCE SİLİNECEK. Görevi, backend'in kontenjan
   uç noktasının vereceği cevabın AYNISINI bugün depodaki veriden
   üretmek: ekranlar gerçek bir kontenjan cevabıyla çalışmayı şimdiden
   öğrensin, backend geldiğinde hiçbir ekran değişmesin.

   Ekranlar bu dosyayı DOĞRUDAN ÇAĞIRMAZ; MolaVeri.musaitlik() üzerinden
   gelir (data-gateway.js). Cevabın biçimi docs/veri-sozlesmesi.md
   bölüm 6'da.

   NEDEN BÖYLE: önceki sürümde kalan yer tarih metninin karma değerinden
   üretiliyordu (seatsLeft). Hiçbir satışla ilgisi olmayan bir "son 3 yer"
   yazısıydı, "doldu" durumu hiç oluşmuyordu ve otel yalnızca giriş
   gecesine bakıyordu. Burada kalan yer, backend'in yapacağı gibi
   KAPASİTEDEN SATILANI DÜŞEREK hesaplanıyor. Satılanlar da aşağıdaki
   örnek rezervasyonlar. */

const ENVANTER_NODE = (typeof require === 'function' && typeof module !== 'undefined' && module.exports);
const ENVANTER_TUR = ENVANTER_NODE ? require('./tour-data.js') : null;
const ENVANTER_ETKINLIK = ENVANTER_NODE ? require('./event-data.js') : null;
const ENVANTER_MEKAN = ENVANTER_NODE ? require('./venue-data.js') : null;

/* Yardımcı ad çözümü: Node'da modülden, tarayıcıda üst kapsamdan. Ad
   ÇAĞRI ANINDA çözülüyor; o tipin veri dosyası yüklenmemiş bir sayfada
   dosya yüklenirken patlamasın (catalog.js'teki hatanın aynısı). */
function envanterFn(ad, modul, yerel) {
  if (modul && typeof modul[ad] === 'function') return modul[ad];
  return typeof yerel === 'function' ? yerel : null;
}
const envAsDate = (v) => envanterFn('asDate', ENVANTER_TUR, typeof asDate !== 'undefined' ? asDate : null)(v);
const envToISO = (v) => envanterFn('toISODate', ENVANTER_TUR, typeof toISODate !== 'undefined' ? toISODate : null)(v);

/* ---------------- örnek rezervasyonlar ----------------
   Backend'de bunlar gerçek rezervasyonlar olacak. Tarih yerine SIRA ile
   yazılıyorlar (order: 0 = bugünden sonraki ilk satılabilir gün / kalkış /
   temsil), çünkü sabit tarih birkaç hafta sonra geçmişte kalır ve örnek
   hiçbir şey göstermez olur.

   Amaç ekranın her durumunu gerçek veriyle göstermek: bol yer, az yer,
   dolu tarih, istenen kişiye yetmeyen kontenjan.

   item   ürünün satılan birimi: turda 'departure', otelde oda id'si,
          aktivitede paket id'si, etkinlikte bilet kategorisi id'si,
          mekânda alan veya hizmet id'si
   time   saatli birimlerde saat; mekânda slotIndex (o günün kaçıncı
          seansı), aktivitede session (seans id'si) de verilebilir
   quantity  satılan adet (kişi, oda, bilet, masa) */
const SAMPLE_BOOKINGS = [
  { type: 'tour', slug: 'efes-sirince', item: 'departure', order: 0, quantity: 12 },
  { type: 'tour', slug: 'efes-sirince', item: 'departure', order: 1, quantity: 16 },
  { type: 'tour', slug: 'efes-sirince', item: 'departure', order: 3, quantity: 7 },

  { type: 'tour', slug: 'kapadokya-3-gece', item: 'departure', order: 0, quantity: 15 },
  { type: 'tour', slug: 'kapadokya-3-gece', item: 'departure', order: 2, quantity: 18 },
  { type: 'tour', slug: 'kapadokya-3-gece', item: 'departure', order: 4, quantity: 9 },

  { type: 'hotel', slug: 'kordon-butik-otel', item: 'standart', order: 0, quantity: 9 },
  { type: 'hotel', slug: 'kordon-butik-otel', item: 'standart', order: 1, quantity: 12 },
  { type: 'hotel', slug: 'kordon-butik-otel', item: 'deniz',    order: 0, quantity: 8 },
  { type: 'hotel', slug: 'kordon-butik-otel', item: 'suit',     order: 2, quantity: 2 },

  { type: 'activity', slug: 'kapadokya-balon-turu', item: 'standart', order: 0, session: 'gun-dogumu', quantity: 17 },
  { type: 'activity', slug: 'kapadokya-balon-turu', item: 'ozel',     order: 0, session: 'gun-dogumu', quantity: 4 },
  { type: 'activity', slug: 'kapadokya-balon-turu', item: 'konfor',   order: 1, session: 'ikinci-tur', quantity: 12 },

  { type: 'event', slug: 'aspendos-opera-bale-festivali', item: 'loca',     order: 0, quantity: 117 },
  { type: 'event', slug: 'aspendos-opera-bale-festivali', item: 'orkestra', order: 0, quantity: 900 },
  { type: 'event', slug: 'aspendos-opera-bale-festivali', item: 'orta',     order: 1, quantity: 2150 },

  { type: 'venue', slug: 'kum-beach-club', item: 'loca',    order: 0, slotIndex: 0, quantity: 8 },
  { type: 'venue', slug: 'kum-beach-club', item: 'sedir',   order: 0, slotIndex: 0, quantity: 21 },
  { type: 'venue', slug: 'kum-beach-club', item: 'sezlong', order: 1, slotIndex: 1, quantity: 55 },

  { type: 'venue', slug: 'kordon-spa-masaj', item: 'klasik', order: 0, slotIndex: 1, quantity: 2 },
  { type: 'venue', slug: 'kordon-spa-masaj', item: 'cift',   order: 0, slotIndex: 0, quantity: 1 }
];

/* ---------------- tarih yardımcıları ---------------- */
function envGunEkle(iso, gun) {
  const d = envAsDate(iso);
  return d ? envToISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + gun)) : '';
}

/* bas'tan bit'e (dahil) her gün. */
function envGunler(bas, bit) {
  const out = [];
  let g = envToISO(bas);
  const son = envToISO(bit);
  for (let i = 0; g && son && g <= son && i < 800; i++) {
    out.push(g);
    g = envGunEkle(g, 1);
  }
  return out;
}

/* "≈ 05:45" -> "05:45". Balon seansının saati gün doğumuna bağlı, veride
   yaklaşık yazılı; envanterin anahtarı ise makine saati. Ekranlar aynı
   işi data-gateway.js/saatAnahtari ile yapıyor; bu dosya backend gelince
   silineceği için kapıya bağımlı yazılmadı. tests/veri-kapisi.test.js
   ikisinin aynı sonucu verdiğini ölçüyor. */
function envSaat(metin) {
  const m = String(metin || '').match(/(\d{1,2}):(\d{2})/);
  return m ? m[1].padStart(2, '0') + ':' + m[2] : null;
}

/* ---------------- satılabilir birimler ----------------
   Bir ürünün bugünden `bit` gününe kadar SATILABİLİR günleri (sıralı) ve
   her gün için satılan birimler. Backend'de bunlar inventory tablosunun
   satırları; burada ürün kaydının kendi takviminden üretiliyor, yani
   sayfanın gösterdiği takvimle aynı kuraldan.

   Dönüş: [{ date, units: [{ item, time, capacity }] }] */
function envanterBirimleri(tip, kayit, bugun, bit) {
  if (!kayit) return [];
  const p = kayit.pricing || {};
  const bas = envToISO(bugun);
  const bekleme = Math.max(0, Math.round(Number(p.leadDays) || 0));

  if (tip === 'tour') {
    const sonraki = envanterFn('nextDepartureDates', ENVANTER_TUR,
      typeof nextDepartureDates !== 'undefined' ? nextDepartureDates : null);
    /* Kalkış haftada en az bir gün; gün sayısı kadar kalkış istemek her
       zaman bit'i geçer, fazlası süzülüyor. */
    const gunSayisi = envGunler(bas, bit).length + 7;
    return sonraki(bas, p.departureDays, gunSayisi, p.leadDays)
      .filter(g => g <= bit)
      .map(date => ({ date, units: [{ item: 'departure', time: p.startTime || null,
        capacity: Math.max(0, Number(p.seatsPerDeparture) || 0) }] }));
  }

  if (tip === 'hotel') {
    /* Otelde birim GECE: 3 gecelik konaklama 3 satır tüketir. */
    return envGunler(envGunEkle(bas, bekleme), bit).map(date => ({
      date,
      units: (kayit.rooms || []).map(o => ({ item: o.id, time: null, capacity: Number(o.count) || 0 }))
    }));
  }

  if (tip === 'activity') {
    return envGunler(envGunEkle(bas, bekleme), bit).map(date => ({
      date,
      units: (kayit.packages || []).flatMap(pk => (kayit.sessions || []).map(s => ({
        item: pk.id, time: envSaat(s.time), session: s.id, capacity: Number(pk.capacity) || 0
      })))
    }));
  }

  if (tip === 'event') {
    const yaklasan = envanterFn('upcomingPerformances', ENVANTER_ETKINLIK,
      typeof upcomingPerformances !== 'undefined' ? upcomingPerformances : null);
    return yaklasan(kayit, bas)
      .filter(t => t.date <= bit)
      .map(t => ({ date: t.date, units: (kayit.categories || []).map(k => ({
        item: k.id, time: envSaat(t.time), capacity: Number(k.seats) || 0 })) }));
  }

  if (tip === 'venue') {
    const saatler = envanterFn('venueHoursFor', ENVANTER_MEKAN,
      typeof venueHoursFor !== 'undefined' ? venueHoursFor : null);
    const seanslar = envanterFn('venueSlots', ENVANTER_MEKAN,
      typeof venueSlots !== 'undefined' ? venueSlots : null);
    const secenekler = kayit.booking === 'randevu' ? (kayit.services || []) : (kayit.areas || []);
    return envGunler(envGunEkle(bas, bekleme), bit)
      /* Kapalı günde envanter yok: kapalı güne rezervasyon alınmaz. */
      .filter(date => { const h = saatler(kayit, envAsDate(date).getDay()); return !(h && h.closed); })
      .map(date => ({ date, units: secenekler.flatMap(o => seanslar(kayit, date).map((saat, i) => ({
        item: o.id, time: saat, slotIndex: i, capacity: Number(o.count) || 0 }))) }));
  }
  return [];
}

/* Örnek rezervasyonun bir birime denk gelip gelmediği. */
function envEslesir(rez, birim) {
  if (rez.item !== birim.item) return false;
  if (rez.session !== undefined) return rez.session === birim.session;
  if (rez.slotIndex !== undefined) return rez.slotIndex === birim.slotIndex;
  if (rez.time !== undefined) return rez.time === birim.time;
  return true;
}

/* ---------------- kontenjan cevabı ----------------
   MolaVeri.musaitlik'in bugünkü kaynağı. Biçim backend'in vereceğiyle
   aynı: docs/veri-sozlesmesi.md bölüm 6.

   secenek.today yalnızca testler için: gerçek çağrıda bugünün tarihi. */
function ornekMusaitlik(tip, kayit, secenek) {
  const s = secenek || {};
  const bugun = envToISO(s.today || new Date());
  const bas = envToISO(s.from || bugun);
  const bit = envToISO(s.to || envGunEkle(bugun, 30));
  const cevap = { type: tip, slug: kayit ? kayit.slug : '', from: bas, to: bit, items: [] };
  if (!kayit || !bas || !bit) return cevap;

  const rezler = SAMPLE_BOOKINGS.filter(r => r.type === tip && r.slug === kayit.slug);
  envanterBirimleri(tip, kayit, bugun, bit).forEach((gun, sira) => {
    if (gun.date < bas) return;
    gun.units.forEach(birim => {
      /* Kapasitesi tanımsız birim (ör. kontenjanı girilmemiş örnek kayıt)
         için satır YAZILMIYOR: "0 yer" demek doldu demek olurdu; satırın
         yokluğu ise "bilinmiyor", yani satış engellenmez. */
      if (!(birim.capacity > 0)) return;
      const satilan = rezler
        .filter(r => r.order === sira && envEslesir(r, birim))
        .reduce((t, r) => t + (Number(r.quantity) || 0), 0);
      cevap.items.push({
        item: birim.item,
        date: gun.date,
        time: birim.time,
        capacity: birim.capacity,
        remaining: Math.max(0, birim.capacity - satilan),
        status: 'open'
      });
    });
  });
  return cevap;
}

/* ---------------- örnek döviz kuru ----------------
   Döviz fiyatlı üründe (yurt dışı turlar) fiyat kendi para biriminde
   gösteriliyor ama TAHSİLAT TL (kullanıcı kararı). Listedeki TL fiyat
   süzgeci, fiyat sıralaması ve "yaklaşık TL karşılığı" bu kurla
   hesaplanıyor. Bağlayıcı kur rezervasyon anında sabitlenip
   rezervasyona yazılacak (4. adım).

   BU DEĞERLER ÖRNEK: gerçek kur değil. Canlıda kaynak, sözleşmeli
   bankanın günlük döviz satış kuru; backend her gün yazacak ve kapı
   (MolaVeri.kur) aynı biçimde verecek. */
const ORNEK_KURLAR = {
  tarih: '2026-09-21',
  kaynak: 'örnek',
  oranlar: { EUR: 50, USD: 43 }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SAMPLE_BOOKINGS, ORNEK_KURLAR, envanterBirimleri, ornekMusaitlik, envSaat };
}
