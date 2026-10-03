/* ---------------- hesap motoru: üyelik, favori, kupon, puan, bilet ----------------
   Hesabım panelinin bütün kuralları burada ve SAF: depo yok, zaman ve
   veri dışarıdan veriliyor. Depolama ve sunucu çağrıları veri kapısında
   (data-gateway.js, MolaVeri); backend gelince kurallar sunucuya taşınıp
   bu dosya ön izleme için kalacak.

   KARARLAR:
     - Molapuan TURA KATILINCA kazanılır ve tura göre değişir (kullanıcı:
       "turlara katılındığında tura göre farklı puanlar"). Puan ürün
       kaydında: loyalty.points. Tur tamamlanınca (dönüş günü geçince)
       "kazanıldı", öncesinde "bekliyor", iptalde düşer. Puan
       rezervasyon başına (hesap sahibinin katılımı).
     - Puan HARCAMA kuralı ve seviye avantajları belirlenmedi: panel
       yalnızca bakiyeyi ve örnek eşiklerle seviyeyi gösteriyor, bir
       avantaj vaat etmiyor.
     - Yeni üyeye kişiye özel %15 kupon (REZ_KAMPANYALAR 'yeni-uye'):
       ilk rezervasyonda, 90 gün geçerli, tek kullanım.

   ADLAR: üst seviye adlar HSP_ / hsp ile başlıyor. */

const HSP_NODE = (typeof require === 'function' && typeof module !== 'undefined' && module.exports);
const HSP_REZ = HSP_NODE ? require('./booking-engine.js') : null;
function hspRez(ad) {
  if (HSP_REZ && HSP_REZ[ad] !== undefined) return HSP_REZ[ad];
  const g = (typeof globalThis !== 'undefined') ? globalThis : {};
  return typeof g[ad] === 'function' ? g[ad] : null;
}

/* Seviye eşikleri: kazanılmış toplam puan. ÖRNEK; kural belirlenince
   güncellenecek. Avantaj metni yok. */
const HSP_SEVIYELER = [
  { id: 'classic', ad: 'Classic', enAz: 0 },
  { id: 'silver', ad: 'Silver', enAz: 500 },
  { id: 'gold', ad: 'Gold', enAz: 1500 },
  { id: 'platinum', ad: 'Platinum', enAz: 3000 }
];
const HSP_HOSGELDIN = { kampanya: 'yeni-uye', onEk: 'HOSGELDIN', gun: 90 };
const HSP_KOD_HARFLER = 'ABCDEFGHJKLMNPRSTUVYZ23456789';

/* ---------------- zaman ---------------- */
function hspAn(deger) {
  if (deger instanceof Date) return deger;
  if (!deger) return new Date();
  const d = new Date(deger);
  if (!isNaN(d.getTime()) && /T/.test(String(deger))) return d;
  const m = String(deger).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date();
}
function hspISO(d) {
  const x = hspAn(d);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}
function hspGunEkle(iso, gun) {
  const d = hspAn(iso);
  return hspISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + gun));
}
function hspGunFarki(a, b) {
  const x = hspAn(hspISO(a)), y = hspAn(hspISO(b));
  return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate())
    - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 86400000);
}
/* "5 dakika önce", "Dün", "3 gün önce", ileri tarih "yarın", "3 gün sonra" */
function hspZamanMetni(t, simdi) {
  const an = hspAn(t), s = hspAn(simdi);
  const fark = (s.getTime() - an.getTime()) / 60000;
  if (fark >= 0 && fark < 1) return 'Az önce';
  if (fark >= 0 && fark < 60) return Math.floor(fark) + ' dakika önce';
  const gun = hspGunFarki(an, s);
  if (gun === 0) return fark >= 0 ? Math.floor(fark / 60) + ' saat önce' : 'Bugün';
  if (gun === 1) return 'Dün';
  if (gun === -1) return 'Yarın';
  if (gun > 1 && gun < 7) return gun + ' gün önce';
  if (gun >= 7 && gun < 30) return Math.floor(gun / 7) + ' hafta önce';
  if (gun < -1) return (-gun) + ' gün sonra';
  return hspISO(an);
}
/* Bildirim grubu: bugün / bu hafta / daha önce (notif-utils.js). */
function hspZamanGrubu(t, simdi) {
  const gun = hspGunFarki(t, simdi);
  if (gun <= 0) return 'today';
  return gun < 7 ? 'week' : 'earlier';
}

/* ---------------- üyelik ---------------- */
function hspKod(onEk, rastgele, uzunluk) {
  const r = typeof rastgele === 'function' ? rastgele : Math.random;
  let s = '';
  for (let i = 0; i < (uzunluk || 5); i++) s += HSP_KOD_HARFLER[Math.floor(r() * HSP_KOD_HARFLER.length) % HSP_KOD_HARFLER.length];
  return onEk + '-' + s;
}

/* Üye olma formu: { ad, soyad, eposta, telefon?, kvkk, izinEposta?, izinSms? } */
function hspUyelikHatalari(form) {
  const f = form || {};
  const ad = hspRez('rezAdGecerli') || (x => String(x || '').trim().length >= 2);
  const eposta = hspRez('rezEpostaGecerli') || (x => /@/.test(String(x || '')));
  const tel = hspRez('rezTelefonGecerli') || (() => true);
  const h = [];
  if (!ad(f.ad)) h.push({ alan: 'ad', mesaj: 'Adını yaz.' });
  if (!ad(f.soyad)) h.push({ alan: 'soyad', mesaj: 'Soyadını yaz.' });
  if (!eposta(f.eposta)) h.push({ alan: 'eposta', mesaj: 'Geçerli bir e-posta adresi yaz.' });
  if (f.telefon && !tel(f.telefon)) h.push({ alan: 'telefon', mesaj: 'Geçerli bir cep telefonu yaz.' });
  if (!f.kvkk) h.push({ alan: 'kvkk', mesaj: 'Üyelik için aydınlatma metnini onayla.' });
  return h;
}

function hspYeniHesap(form, simdi, rastgele) {
  const f = form || {};
  const an = hspAn(simdi);
  return {
    id: hspKod('U', rastgele, 8),
    ad: String(f.ad || '').trim(),
    soyad: String(f.soyad || '').trim(),
    eposta: String(f.eposta || '').trim().toLowerCase(),
    telefon: String(f.telefon || '').trim(),
    olusturma: an.toISOString(),
    izinler: { eposta: !!f.izinEposta, sms: !!f.izinSms },
    kuponlar: [{
      kod: hspKod(HSP_HOSGELDIN.onEk, rastgele, 5),
      kampanya: HSP_HOSGELDIN.kampanya,
      olusturma: an.toISOString(),
      sonGun: hspGunEkle(hspISO(an), HSP_HOSGELDIN.gun),
      kullanildi: null
    }]
  };
}

function hspAdSoyad(hesap) {
  return hesap ? [hesap.ad, hesap.soyad].filter(Boolean).join(' ') : '';
}

/* ---------------- rezervasyonlar ---------------- */
/* Hesabın rezervasyonları: hesapla yapılanlar + aynı e-postayla misafir
   olarak yapılanlar (e-postanla yaptığın rezervasyonlar hesabında). */
function hspHesabinRezervasyonlari(hesap, liste) {
  if (!hesap) return [];
  const e = String(hesap.eposta || '').toLowerCase();
  return (liste || []).filter(r => r && (r.hesapId === hesap.id
    || (e && String((r.iletisim || {}).eposta || '').toLowerCase() === e)));
}

/* Rezervasyon kaydında iki ayrı alan: iptalKosullari (rezervasyon
   anındaki kademeler, 4. adım) ve iptalBilgisi (iptal edildiyse ne zaman,
   ne kadar iade). İlk sürümün kayıtlarında kademeler "iptal" alanındaydı. */
function hspIptalKosullari(r) {
  if (!r) return [];
  if (Array.isArray(r.iptalKosullari)) return r.iptalKosullari;
  return Array.isArray(r.iptal) ? r.iptal : [];
}
function hspIptalBilgisi(r) {
  return (r && r.iptalBilgisi) || null;
}

/* yaklasan | tamamlandi | iptal. Bitiş: konaklamada çıkış/dönüş günü. */
function hspRezervasyonDurumu(r, simdi) {
  if (!r) return null;
  if (hspIptalBilgisi(r)) return 'iptal';
  const b = r.baslangic || {};
  const son = b.bitis || b.tarih;
  if (!son) return 'yaklasan';
  return hspGunFarki(son, simdi) > 0 ? 'tamamlandi' : 'yaklasan';
}

/* İptal ön izlemesi: rezervasyona yazılmış kademelerden şimdiki kademe.
   Kademenin iadesi rezervasyon anında hesaplandı (ödenenden; kaporalıda
   kesinti toplamdan, rezIptalTakvimi). Başlangıç geçtiyse iptal yok. */
function hspIptalOnizleme(r, simdi) {
  const an = hspAn(simdi);
  if (!r) return { mumkun: false, neden: 'Rezervasyon bulunamadı.' };
  if (hspIptalBilgisi(r)) return { mumkun: false, neden: 'Rezervasyon zaten iptal edildi.' };
  const b = r.baslangic || {};
  const baslangic = b.tarih ? hspAn(b.tarih + 'T' + (b.saat || '00:00')) : null;
  if (!baslangic || baslangic.getTime() <= an.getTime()) return { mumkun: false, neden: 'Başlangıç saati geçtiği için iptal edilemez.' };
  const liste = hspIptalKosullari(r);
  const kademe = liste.find(k => !k.sonAn || an.getTime() < hspAn(k.sonAn).getTime()) || liste[liste.length - 1] || null;
  const odenen = Number((r.odeme || {}).simdi) || 0;
  const iade = kademe ? Math.min(odenen, Math.max(0, Number(kademe.iade) || 0)) : 0;
  return { mumkun: true, kademe, odenen, iade, kesinti: odenen - iade };
}

function hspIptalEt(r, simdi) {
  const o = hspIptalOnizleme(r, simdi);
  if (!o.mumkun) return null;
  return Object.assign({}, r, {
    iptalBilgisi: { t: hspAn(simdi).toISOString(), iade: o.iade, kademe: o.kademe ? o.kademe.etiket : '' },
    durum: 'iptal'
  });
}

/* ---------------- biletler ----------------
   Etkinlikte bilet başına, tur ve aktivitede katılımcı başına, otel ve
   mekânda rezervasyon başına bir karekod. Numara: M360-XXXXXX-01. */
function hspBiletler(r) {
  if (!r || hspIptalBilgisi(r)) return [];
  const kisiler = (r.katilimcilar || []);
  let satirlar;
  if (r.tip === 'event') {
    const s = r.secim || {};
    const tam = Math.max(0, Number(s.full) || 0), ogr = Math.max(0, Number(s.student) || 0);
    satirlar = [];
    for (let i = 0; i < tam; i++) satirlar.push({ tur: 'Tam bilet' });
    for (let i = 0; i < ogr; i++) satirlar.push({ tur: 'Öğrenci bileti' });
    if (!satirlar.length) satirlar.push({ tur: 'Bilet' });
    const sahip = kisiler[0] ? [kisiler[0].ad, kisiler[0].soyad].filter(Boolean).join(' ') : '';
    satirlar.forEach(x => { x.ad = sahip; });
  } else if (r.tip === 'tour' || r.tip === 'activity') {
    satirlar = kisiler.map(k => ({
      tur: { yetiskin: 'Yetişkin', cocuk: 'Çocuk', bebek: 'Bebek' }[k.rol] || 'Katılımcı',
      ad: [k.ad, k.soyad].filter(Boolean).join(' ') || (k.yas !== null && k.yas !== undefined ? k.yas + ' yaş' : '')
    }));
  } else {
    satirlar = [{ tur: r.tip === 'hotel' ? 'Konaklama belgesi' : 'Rezervasyon', ad: [r.iletisim && r.iletisim.ad, r.iletisim && r.iletisim.soyad].filter(Boolean).join(' ') }];
  }
  return satirlar.map((x, i) => Object.assign({ no: r.kod + '-' + String(i + 1).padStart(2, '0'), kod: r.kod, baslik: r.baslik,
    tarih: (r.baslangic || {}).tarih || '', saat: (r.baslangic || {}).saat || '', deneme: !!r.deneme }, x));
}

/* ---------------- Molapuan ----------------
   urunBul(tip, slug) → ürün kaydı (loyalty.points). */
function hspPuanHareketleri(rezervasyonlar, urunBul, simdi) {
  return (rezervasyonlar || []).filter(r => r && r.tip === 'tour').map(r => {
    const kayit = urunBul ? urunBul(r.tip, r.slug) : null;
    const puan = Math.max(0, Math.round(Number(kayit && kayit.loyalty && kayit.loyalty.points) || 0));
    if (!puan) return null;
    const durum = hspRezervasyonDurumu(r, simdi);
    return {
      kod: r.kod, baslik: r.baslik, puan,
      durum: durum === 'tamamlandi' ? 'kazanildi' : (durum === 'iptal' ? 'iptal' : 'bekliyor'),
      tarih: ((r.baslangic || {}).bitis || (r.baslangic || {}).tarih || '')
    };
  }).filter(Boolean);
}
function hspPuanOzeti(hareketler) {
  const h = hareketler || [];
  const toplam = (d) => h.filter(x => x.durum === d).reduce((t, x) => t + x.puan, 0);
  return { bakiye: toplam('kazanildi'), bekleyen: toplam('bekliyor') };
}
function hspSeviye(puan) {
  const p = Math.max(0, Number(puan) || 0);
  let i = 0;
  HSP_SEVIYELER.forEach((s, k) => { if (p >= s.enAz) i = k; });
  const sonraki = HSP_SEVIYELER[i + 1] || null;
  const bu = HSP_SEVIYELER[i];
  return {
    seviye: bu,
    sonraki,
    kalan: sonraki ? sonraki.enAz - p : 0,
    ilerleme: sonraki ? Math.min(1, (p - bu.enAz) / (sonraki.enAz - bu.enAz)) : 1
  };
}

/* ---------------- kuponlar ---------------- */
/* Kişiye özel kuponların durumu + herkese açık kupon kampanyaları. */
function hspKuponlar(hesap, simdi) {
  const bugun = hspISO(simdi);
  const kampanyalar = hspRez('REZ_KAMPANYALAR') || (typeof REZ_KAMPANYALAR !== 'undefined' ? REZ_KAMPANYALAR : []);
  const bul = (kod) => kampanyalar.find(k => k.kod === kod) || null;
  const kisisel = ((hesap && hesap.kuponlar) || []).map(k => {
    const kampanya = bul(k.kampanya);
    return {
      kod: k.kod, kisisel: true, ad: kampanya ? kampanya.ad : k.kampanya, aciklama: kampanya ? kampanya.aciklama : '',
      sonGun: k.sonGun,
      durum: k.kullanildi ? 'kullanildi' : (k.sonGun && bugun > k.sonGun ? 'suresi-doldu' : 'gecerli'),
      kullanildi: k.kullanildi || null
    };
  });
  const genel = kampanyalar.filter(k => k.tur === 'kupon' && k.kuponKodu && !(k.bitis && bugun > k.bitis))
    .map(k => ({ kod: k.kuponKodu, kisisel: false, ad: k.ad, aciklama: k.aciklama, sonGun: k.bitis || null, durum: 'gecerli', ornek: !!k.ornek }));
  return kisisel.concat(genel);
}

/* Teklife verilen üyelik bağlamı (booking-engine: opt.uye). */
function hspUyeBaglami(hesap, rezervasyonlar) {
  if (!hesap) return null;
  return {
    id: hesap.id,
    kuponlar: (hesap.kuponlar || []).slice(),
    rezervasyonSayisi: (rezervasyonlar || []).filter(r => !hspIptalBilgisi(r)).length
  };
}

/* Rezervasyonda kullanılan kişisel kuponu işaretle. */
function hspKuponKullan(hesap, kod, rezKod) {
  if (!hesap) return hesap;
  const k = String(kod || '').trim().toUpperCase();
  return Object.assign({}, hesap, {
    kuponlar: (hesap.kuponlar || []).map(x => x.kod === k && !x.kullanildi ? Object.assign({}, x, { kullanildi: rezKod }) : x)
  });
}

/* ---------------- favoriler ---------------- */
function hspFavoriDegistir(liste, tip, slug, simdi) {
  const l = (liste || []).filter(x => x && x.tip && x.slug);
  const var_ = l.some(x => x.tip === tip && x.slug === slug);
  return var_ ? l.filter(x => !(x.tip === tip && x.slug === slug))
    : [{ tip, slug, t: hspAn(simdi).toISOString() }].concat(l).slice(0, 200);
}

/* ---------------- yorumlar ----------------
   Tamamlanan (iptal olmayan) rezervasyona bir yorum. Yorum yayına
   girmeden önce onaydan geçer (backend + yönetim paneli). */
function hspYorumYazilabilir(r, yorumlar, simdi) {
  return hspRezervasyonDurumu(r, simdi) === 'tamamlandi' && !(yorumlar || []).some(y => y.kod === r.kod);
}
function hspYorumHatalari(y) {
  const h = [];
  const puan = Number(y && y.puan);
  if (!(puan >= 1 && puan <= 5 && Math.round(puan) === puan)) h.push({ alan: 'puan', mesaj: 'Yıldız seç.' });
  const metin = String((y && y.metin) || '').trim();
  if (metin.length < 20) h.push({ alan: 'metin', mesaj: 'En az 20 karakter yaz.' });
  if (metin.length > 1000) h.push({ alan: 'metin', mesaj: 'En fazla 1000 karakter.' });
  return h;
}

/* ---------------- bildirimler ----------------
   Hesabın durumundan TÜRETİLİYOR (elle yazılmış bildirim yok). Kimlik
   kararlı: okundu/kaldırıldı işareti yeniden hesapta kaybolmuyor.
   veri: { hesap, rezervasyonlar, favoriler: [kayıt], urunBul, simdi } */
function hspBildirimler(veri) {
  const v = veri || {};
  const simdi = hspAn(v.simdi);
  const bugun = hspISO(simdi);
  const para = hspRez('rezPara') || (n => n + ' TL');
  const tarihMetni = hspRez('rezTarihMetni') || (x => x);
  const out = [];
  const ekle = (id, type, t, title, href, hatirlatma) => out.push({ id, type, t: hspAn(t).toISOString(), title, href: href || null, hatirlatma: !!hatirlatma });
  /* Hatırlatmalar (yaklaşan tur, kalan ödeme) bugünün bildirimi: zamanı
     bugünün başı, etiketi "Bugün". Okundu işareti kimlikle kalıcı. */
  const bugunBasi = hspAn(bugun);
  const hesapYolu = (bolum) => 'hesabim/?bolum=' + bolum;

  if (v.hesap) {
    ekle('hosgeldin-' + v.hesap.id, 'system', v.hesap.olusturma, 'Hoş geldin ' + (v.hesap.ad || '') + '! Hesabın hazır.', hesapYolu('genel'));
    hspKuponlar(v.hesap, simdi).filter(k => k.kisisel).forEach(k => {
      if (k.durum === 'gecerli') {
        const kalan = k.sonGun ? hspGunFarki(bugun, k.sonGun) : null;
        const kupon = (v.hesap.kuponlar || []).find(x => x.kod === k.kod) || {};
        ekle('kupon-' + k.kod, 'deal', kupon.olusturma || v.hesap.olusturma, 'İlk rezervasyonuna özel %15 indirim kodun: ' + k.kod, hesapYolu('kuponlarim'));
        if (kalan !== null && kalan >= 0 && kalan <= 7) {
          ekle('kupon-son-' + k.kod, 'deal', hspGunEkle(k.sonGun, -7), k.kod + ' kodunun son ' + (kalan + 1) + ' günü.', hesapYolu('kuponlarim'));
        }
      }
    });
  }

  (v.rezervasyonlar || []).forEach(r => {
    const durum = hspRezervasyonDurumu(r, simdi);
    const yol = hesapYolu('rezervasyonlarim');
    ekle('rez-' + r.kod, 'booking', r.olusturma, 'Rezervasyon talebin alındı: ' + r.baslik + ' (' + r.kod + ')', yol);
    const iptal = hspIptalBilgisi(r);
    if (iptal) {
      ekle('iptal-' + r.kod, 'booking', iptal.t, r.baslik + ' iptal edildi' + (iptal.iade ? '; ' + para(iptal.iade) + ' iade edilecek.' : '.'), yol);
      return;
    }
    const b = r.baslangic || {};
    const kalan = b.tarih ? hspGunFarki(bugun, b.tarih) : null;
    if (durum === 'yaklasan' && kalan !== null && kalan >= 0 && kalan <= 3) {
      ekle('yaklasan-' + r.kod + '-' + b.tarih + '-' + kalan, 'event', bugunBasi,
        r.baslik + (kalan === 0 ? ' bugün' : (kalan === 1 ? ' yarın' : ' ' + kalan + ' gün sonra')) + (b.saat ? ', ' + b.saat : '') + '. Biletin hesabında.', hesapYolu('biletlerim'), true);
    }
    const o = r.odeme || {};
    if (durum === 'yaklasan' && o.sekil === 'kapora' && o.aramaTarihi) {
      const gun = hspGunFarki(bugun, o.aramaTarihi);
      if (gun >= 0 && gun <= 7) {
        ekle('kalan-' + r.kod, 'booking', bugunBasi,
          'Kalan ödeme ' + para(o.kalan) + ' (' + (o.kalanTercih === 'aracta' ? 'tur günü araçta' : 'turdan 1 gün önce') + '). '
          + tarihMetni(o.aramaTarihi, true) + ' günü seni arayacağız.', yol, true);
      }
    }
  });

  hspPuanHareketleri(v.rezervasyonlar, v.urunBul, simdi).filter(h => h.durum === 'kazanildi').forEach(h => {
    ekle('puan-' + h.kod, 'system', hspGunEkle(h.tarih, 1), h.baslik + ' turundan ' + h.puan + ' Molapuan kazandın.', hesapYolu('puanlarim'));
  });

  (v.favoriler || []).forEach(f => {
    if (f.ozet && f.ozet.discounted && f.ozet.listPrice > f.ozet.price) {
      const oran = Math.round((1 - f.ozet.price / f.ozet.listPrice) * 100);
      ekle('favori-indirim-' + f.tip + '-' + f.slug + '-' + f.ozet.price, 'favorite', f.t,
        'Favorindeki ' + f.baslik + ' liste fiyatının %' + oran + ' altında.', f.yol || hesapYolu('favorilerim'));
    }
  });

  return out.filter(n => hspAn(n.t).getTime() <= simdi.getTime())
    .sort((a, b) => b.t.localeCompare(a.t))
    .map(n => Object.assign(n, { group: hspZamanGrubu(n.t, simdi), time: n.hatirlatma ? 'Bugün' : hspZamanMetni(n.t, simdi) }));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    HSP_SEVIYELER, HSP_HOSGELDIN,
    hspAn, hspISO, hspGunEkle, hspGunFarki, hspZamanMetni, hspZamanGrubu, hspKod,
    hspUyelikHatalari, hspYeniHesap, hspAdSoyad,
    hspHesabinRezervasyonlari, hspIptalKosullari, hspIptalBilgisi, hspRezervasyonDurumu, hspIptalOnizleme, hspIptalEt,
    hspBiletler, hspPuanHareketleri, hspPuanOzeti, hspSeviye,
    hspKuponlar, hspUyeBaglami, hspKuponKullan, hspFavoriDegistir,
    hspYorumYazilabilir, hspYorumHatalari, hspBildirimler
  };
}
