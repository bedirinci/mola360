/* Hesabım (5. adım): account-engine.js kuralları ve veri kapısının hesap
   uçları. Kararlar:
     - Molapuan tura katılınca kazanılır, tura göre değişir (loyalty.points)
     - yeni üyeye kişiye özel %15 kupon, yalnızca ilk rezervasyonda
     - deneme sürümünde şifre yok; hesap bu tarayıcıda */
import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const A = require('../assets/js/account-engine.js');
const R = require('../assets/js/booking-engine.js');
const { MolaVeri } = require('../assets/js/data-gateway.js');

const an = (g, s) => new Date(2026, 8, g, s || 10, 0);
const efes = () => MolaVeri.urun('tour', 'efes-sirince');

function rez(ek) {
  return Object.assign({
    kod: 'M360-ABCDEF', tip: 'tour', slug: 'efes-sirince', baslik: 'Efes', hesapId: 'U1',
    olusturma: an(20).toISOString(),
    baslangic: { tarih: '2026-10-06', saat: '08:15', bitis: '' },
    secim: { date: '2026-10-06', adults: 2 },
    odeme: { sekil: 'kapora', simdi: 516, kalan: 2064, kalanTercih: 'aracta', aramaTarihi: '2026-10-05' },
    iptalKosullari: [
      { etiket: '48 saat', oran: 1, sonAn: '2026-10-04T08:15', iade: 516 },
      { etiket: '24 saat', oran: 0.5, sonAn: '2026-10-05T08:15', iade: 0 },
      { etiket: 'Son 24 saat', oran: 0, sonAn: null, iade: 0 }
    ],
    iletisim: { ad: 'Ayşe', soyad: 'Yılmaz', eposta: 'ayse@example.com' },
    katilimcilar: [{ rol: 'yetiskin', ad: 'Ayşe', soyad: 'Yılmaz', yas: null }, { rol: 'cocuk', ad: 'Ela', soyad: 'Yılmaz', yas: 7 }]
  }, ek || {});
}

describe('üyelik', () => {
  it('form: ad, soyad, e-posta ve aydınlatma onayı zorunlu', () => {
    expect(A.hspUyelikHatalari({}).map(h => h.alan)).toEqual(['ad', 'soyad', 'eposta', 'kvkk']);
    expect(A.hspUyelikHatalari({ ad: 'Ali', soyad: 'Kaya', eposta: 'a@b.co', kvkk: true })).toEqual([]);
    expect(A.hspUyelikHatalari({ ad: 'Ali', soyad: 'Kaya', eposta: 'a@b.co', kvkk: true, telefon: '123' }).map(h => h.alan)).toEqual(['telefon']);
  });

  it('yeni hesaba 90 gün geçerli kişisel hoş geldin kuponu', () => {
    const h = A.hspYeniHesap({ ad: ' Ali ', soyad: 'Kaya', eposta: 'ALI@B.CO' }, an(27), () => 0);
    expect(h.ad).toBe('Ali');
    expect(h.eposta).toBe('ali@b.co');
    expect(h.kuponlar).toEqual([{ kod: 'HOSGELDIN-AAAAA', kampanya: 'yeni-uye', olusturma: an(27).toISOString(), sonGun: '2026-12-26', kullanildi: null }]);
  });
});

describe('rezervasyonlar', () => {
  it('hesabın rezervasyonları: hesapla yapılan + aynı e-postayla misafir olarak yapılan', () => {
    const h = { id: 'U1', eposta: 'ayse@example.com' };
    const liste = [rez(), rez({ kod: 'M360-MISAFR', hesapId: null, iletisim: { eposta: 'AYSE@example.com' } }),
      rez({ kod: 'M360-BASKA1', hesapId: 'U2', iletisim: { eposta: 'baska@x.co' } })];
    expect(A.hspHesabinRezervasyonlari(h, liste).map(r => r.kod)).toEqual(['M360-ABCDEF', 'M360-MISAFR']);
    expect(A.hspHesabinRezervasyonlari(null, liste)).toEqual([]);
  });

  it('durum: yaklaşan, dönüş günü geçince tamamlandı, iptal', () => {
    expect(A.hspRezervasyonDurumu(rez(), an(27))).toBe('yaklasan');
    expect(A.hspRezervasyonDurumu(rez(), new Date(2026, 9, 6, 23))).toBe('yaklasan');
    expect(A.hspRezervasyonDurumu(rez(), new Date(2026, 9, 7, 1))).toBe('tamamlandi');
    expect(A.hspRezervasyonDurumu(rez({ baslangic: { tarih: '2026-10-06', bitis: '2026-10-09' } }), new Date(2026, 9, 8))).toBe('yaklasan');
    expect(A.hspRezervasyonDurumu(rez({ iptalBilgisi: { t: '', iade: 0 } }), an(27))).toBe('iptal');
  });

  it('iptal: şimdiki kademenin iadesi; başlangıçtan sonra iptal yok', () => {
    expect(A.hspIptalOnizleme(rez(), an(27))).toMatchObject({ mumkun: true, iade: 516, kesinti: 0 });
    expect(A.hspIptalOnizleme(rez(), new Date(2026, 9, 4, 12))).toMatchObject({ mumkun: true, iade: 0, kesinti: 516 });
    expect(A.hspIptalOnizleme(rez(), new Date(2026, 9, 6, 9)).mumkun).toBe(false);
    const iptal = A.hspIptalEt(rez(), an(27));
    expect(iptal.iptalBilgisi).toMatchObject({ iade: 516, kademe: '48 saat' });
    expect(A.hspIptalEt(iptal, an(27))).toBe(null);
  });

  it('ilk sürümün kayıtlarında kademeler "iptal" alanında', () => {
    const eski = rez({ iptalKosullari: undefined, iptal: rez().iptalKosullari });
    expect(A.hspIptalKosullari(eski).length).toBe(3);
    expect(A.hspRezervasyonDurumu(eski, an(27))).toBe('yaklasan');
  });
});

describe('biletler', () => {
  it('turda katılımcı başına, numaralı', () => {
    const b = A.hspBiletler(rez());
    expect(b.map(x => x.no)).toEqual(['M360-ABCDEF-01', 'M360-ABCDEF-02']);
    expect(b[1]).toMatchObject({ tur: 'Çocuk', ad: 'Ela Yılmaz', tarih: '2026-10-06', saat: '08:15' });
  });

  it('etkinlikte bilet başına (tam + öğrenci); otelde tek belge; iptalde bilet yok', () => {
    const e = A.hspBiletler(rez({ tip: 'event', secim: { full: 2, student: 1 } }));
    expect(e.map(x => x.tur)).toEqual(['Tam bilet', 'Tam bilet', 'Öğrenci bileti']);
    expect(A.hspBiletler(rez({ tip: 'hotel' })).length).toBe(1);
    expect(A.hspBiletler(rez({ iptalBilgisi: { iade: 0 } }))).toEqual([]);
  });
});

describe('Molapuan ve seviye', () => {
  it('puan tura göre, tur bitince kazanılıyor; iptalde düşüyor; tur dışı puan yok', () => {
    const liste = [rez(), rez({ kod: 'M360-IPTAL1', iptalBilgisi: { iade: 0 } }), rez({ kod: 'M360-OTEL01', tip: 'hotel', slug: 'kordon-butik-otel' })];
    const once = A.hspPuanHareketleri(liste, MolaVeri.urun, an(27));
    expect(once.map(h => [h.kod, h.puan, h.durum])).toEqual([['M360-ABCDEF', efes().loyalty.points, 'bekliyor'], ['M360-IPTAL1', efes().loyalty.points, 'iptal']]);
    const sonra = A.hspPuanHareketleri(liste, MolaVeri.urun, new Date(2026, 9, 7));
    expect(A.hspPuanOzeti(sonra)).toEqual({ bakiye: efes().loyalty.points, bekleyen: 0 });
  });

  it('her tam kayıtlı turun puanı var ve turlar arasında farklı', () => {
    const turlar = MolaVeri.urunler('tour').filter(k => !k.sample);
    turlar.forEach(k => expect(k.loyalty && k.loyalty.points, k.slug).toBeGreaterThan(0));
    expect(new Set(turlar.map(k => k.loyalty.points)).size).toBe(turlar.length);
  });

  it('seviye eşikleri ve ilerleme', () => {
    expect(A.hspSeviye(0)).toMatchObject({ seviye: { id: 'classic' }, kalan: 500, ilerleme: 0 });
    expect(A.hspSeviye(1000)).toMatchObject({ seviye: { id: 'silver' }, kalan: 500, ilerleme: 0.5 });
    expect(A.hspSeviye(9999)).toMatchObject({ seviye: { id: 'platinum' }, sonraki: null, ilerleme: 1 });
  });
});

describe('kuponlar', () => {
  const hesap = { id: 'U1', kuponlar: [{ kod: 'HOSGELDIN-AAAAA', kampanya: 'yeni-uye', sonGun: '2026-12-26', kullanildi: null }] };
  const bilgi = { tip: 'tour', kayit: efes(), hesap: {}, baslangic: { tarih: '2026-10-06' }, toplamTL: 2580, bugun: '2026-09-27' };

  it('kişisel kod kampanyanın kuralıyla bulunuyor; başkasının kodu bulunmuyor', () => {
    const k = R.rezKuponBul('hosgeldin-aaaaa', A.hspUyeBaglami(hesap, []));
    expect(k.kod).toBe('yeni-uye');
    expect(k.kuponKodu).toBe('HOSGELDIN-AAAAA');
    expect(R.rezKuponBul('HOSGELDIN-AAAAA', null)).toBe(null);
    expect(R.rezKuponBul('HOSGELDIN-BBBBB', A.hspUyeBaglami(hesap, []))).toBe(null);
  });

  it('%15, yalnızca ilk rezervasyonda, kullanılmamış ve süresi dolmamışsa', () => {
    const ilk = A.hspUyeBaglami(hesap, []);
    const k = R.rezKuponBul('HOSGELDIN-AAAAA', ilk);
    expect(R.rezKampanyaIndirimi(k, Object.assign({}, bilgi, { uye: ilk })).tutar).toBe(Math.round(2580 * 0.15));
    const ikinci = A.hspUyeBaglami(hesap, [rez()]);
    expect(R.rezKampanyaIndirimi(k, Object.assign({}, bilgi, { uye: ikinci })).neden).toContain('ilk rezervasyon');
    expect(A.hspUyeBaglami(hesap, [rez({ iptalBilgisi: { iade: 0 } })]).rezervasyonSayisi).toBe(0);
    const kullanildi = A.hspUyeBaglami(A.hspKuponKullan(hesap, 'hosgeldin-aaaaa', 'M360-X'), []);
    expect(R.rezKampanyaIndirimi(R.rezKuponBul('HOSGELDIN-AAAAA', kullanildi), Object.assign({}, bilgi, { uye: kullanildi })).neden).toBe('Bu kupon kullanıldı.');
    expect(R.rezKampanyaIndirimi(k, Object.assign({}, bilgi, { uye: ilk, bugun: '2026-12-27' })).neden).toBe('Kuponun süresi doldu.');
  });

  it('kupon listesi: kişisel durumlarıyla + herkese açık kodlar', () => {
    const l = A.hspKuponlar(hesap, an(27));
    expect(l.map(k => [k.kod, k.durum, k.kisisel])).toEqual([['HOSGELDIN-AAAAA', 'gecerli', true], ['MOLA100', 'gecerli', false]]);
    expect(A.hspKuponlar(hesap, new Date(2027, 0, 1)).map(k => k.durum)).toEqual(['suresi-doldu']);
  });
});

describe('favoriler ve yorumlar', () => {
  it('favori ekle/çıkar; en yeni başta', () => {
    let l = A.hspFavoriDegistir([], 'tour', 'a', an(1));
    l = A.hspFavoriDegistir(l, 'hotel', 'b', an(2));
    expect(l.map(x => x.slug)).toEqual(['b', 'a']);
    expect(A.hspFavoriDegistir(l, 'tour', 'a', an(3)).map(x => x.slug)).toEqual(['b']);
  });

  it('yorum yalnızca tamamlanan rezervasyona, bir kez; puan ve uzunluk kuralı', () => {
    const sonra = new Date(2026, 9, 7);
    expect(A.hspYorumYazilabilir(rez(), [], an(27))).toBe(false);
    expect(A.hspYorumYazilabilir(rez(), [], sonra)).toBe(true);
    expect(A.hspYorumYazilabilir(rez(), [{ kod: 'M360-ABCDEF' }], sonra)).toBe(false);
    expect(A.hspYorumHatalari({ puan: 0, metin: 'kısa' }).map(h => h.alan)).toEqual(['puan', 'metin']);
    expect(A.hspYorumHatalari({ puan: 5, metin: 'Rehber çok bilgiliydi, program dengeliydi.' })).toEqual([]);
  });
});

describe('bildirimler', () => {
  const hesap = A.hspYeniHesap({ ad: 'Ayşe', soyad: 'Yılmaz', eposta: 'ayse@example.com' }, an(20), () => 0);

  it('hesabın durumundan türetiliyor; elle yazılmış bildirim yok', () => {
    const l = A.hspBildirimler({ hesap, rezervasyonlar: [rez()], favoriler: [], urunBul: MolaVeri.urun, simdi: new Date(2026, 9, 4, 9) });
    const idler = l.map(n => n.id);
    expect(idler).toEqual(expect.arrayContaining(['hosgeldin-' + hesap.id, 'rez-M360-ABCDEF', 'kalan-M360-ABCDEF', 'kupon-HOSGELDIN-AAAAA']));
    const yaklasan = l.find(n => n.id.startsWith('yaklasan-'));
    expect(yaklasan.title).toContain('2 gün sonra');
    expect(yaklasan.time).toBe('Bugün');
    expect(yaklasan.group).toBe('today');
    expect(l.find(n => n.id === 'kalan-M360-ABCDEF').title).toContain('seni arayacağız');
  });

  it('tamamlanan turda puan, iptalde iade bildirimi; gelecekteki olay listelenmiyor', () => {
    const sonra = A.hspBildirimler({ hesap, rezervasyonlar: [rez()], urunBul: MolaVeri.urun, simdi: new Date(2026, 9, 8) });
    expect(sonra.find(n => n.id === 'puan-M360-ABCDEF').title).toContain(efes().loyalty.points + ' Molapuan');
    const iptal = A.hspBildirimler({ hesap: null, rezervasyonlar: [rez({ iptalBilgisi: { t: an(27).toISOString(), iade: 516 } })], simdi: an(27, 12) });
    expect(iptal.find(n => n.id === 'iptal-M360-ABCDEF').title).toContain('516 TL iade');
    const once = A.hspBildirimler({ hesap, rezervasyonlar: [], simdi: an(19) });
    expect(once).toEqual([]);
  });

  it('zaman metni', () => {
    expect(A.hspZamanMetni(new Date(2026, 8, 27, 9, 55), an(27))).toBe('5 dakika önce');
    expect(A.hspZamanMetni(new Date(2026, 8, 26, 9), an(27))).toBe('Dün');
    expect(A.hspZamanMetni(new Date(2026, 8, 24, 9), an(27))).toBe('3 gün önce');
    expect(A.hspZamanGrubu(new Date(2026, 8, 24), an(27))).toBe('week');
  });
});

describe('veri kapısı: hesap', () => {
  beforeEach(async () => {
    await MolaVeri.cikisYap();
  });

  it('üye ol, çıkış yap, aynı e-postayla giriş yap; ikinci kez aynı e-postayla üyelik yok', async () => {
    const e = 'test-' + Math.random().toString(36).slice(2) + '@example.com';
    const u = await MolaVeri.uyeOl({ ad: 'Deniz', soyad: 'Ak', eposta: e, kvkk: true });
    expect(u.tamam).toBe(true);
    expect(MolaVeri.oturum().eposta).toBe(e);
    await MolaVeri.cikisYap();
    expect(MolaVeri.oturum()).toBe(null);
    expect((await MolaVeri.girisYap('yok@example.com')).tamam).toBe(false);
    expect((await MolaVeri.girisYap(e.toUpperCase())).tamam).toBe(true);
    expect((await MolaVeri.uyeOl({ ad: 'Deniz', soyad: 'Ak', eposta: e, kvkk: true })).hatalar[0].alan).toBe('eposta');
  });

  it('kişisel kupon ödemede uygulanıyor ve bir kez kullanılıyor', async () => {
    const e = 'kupon-' + Math.random().toString(36).slice(2) + '@example.com';
    const u = await MolaVeri.uyeOl({ ad: 'Can', soyad: 'Er', eposta: e, kvkk: true });
    const kod = u.hesap.kuponlar[0].kod;
    const secim = { date: '2026-10-06', adults: 2 };
    const t = await MolaVeri.fiyatTeklifi('tour', 'efes-sirince', secim, { kupon: kod }, '2026-09-26');
    expect(t.kupon.gecerli).toBe(true);
    expect(t.toplam).toBe(2580 - Math.round(2580 * 0.15));
    const form = { iletisim: { ad: 'Can', soyad: 'Er', eposta: e, telefon: '5321234567' },
      katilimcilar: [{ ad: 'Can', soyad: 'Er', tc: '10000000146' }, { ad: 'Ada', soyad: 'Er', tc: '10000000146' }], sozlesme: true };
    const r = await MolaVeri.rezervasyonOlustur({ tip: 'tour', slug: 'efes-sirince', secim, secenek: { kupon: kod }, form, beklenenTahsilat: t.tahsilat, bugun: '2026-09-26' });
    expect(r.tamam).toBe(true);
    expect(r.rezervasyon.hesapId).toBe(u.hesap.id);
    expect(MolaVeri.oturum().kuponlar[0].kullanildi).toBe(r.kod);
    const tekrar = await MolaVeri.fiyatTeklifi('tour', 'efes-sirince', secim, { kupon: kod }, '2026-09-26');
    expect(tekrar.kupon.gecerli).toBe(false);

    const panel = await MolaVeri.hesapPaneli(an(26));
    expect(panel.rezervasyonlar.map(x => x.kod)).toContain(r.kod);
    expect(panel.biletler.filter(b => b.kod === r.kod).length).toBe(2);
    expect(panel.puan.bekleyen).toBe(efes().loyalty.points);

    const iptal = await MolaVeri.rezervasyonIptal(r.kod, an(26));
    expect(iptal.tamam).toBe(true);
    expect((await MolaVeri.rezervasyonIptal(r.kod, an(26))).tamam).toBe(false);
    expect(await MolaVeri.rezervasyonSorgula(r.kod, e)).toBeTruthy();
    expect(await MolaVeri.rezervasyonSorgula(r.kod, 'baska@example.com')).toBe(null);
  });

  it('başka hesabın rezervasyonu iptal edilemiyor', async () => {
    const r = (await MolaVeri.rezervasyonlar())[0];
    await MolaVeri.uyeOl({ ad: 'Baş', soyad: 'Ka', eposta: 'baska-' + Math.random().toString(36).slice(2) + '@example.com', kvkk: true });
    if (r) expect((await MolaVeri.rezervasyonIptal(r.kod, an(26))).tamam).toBe(false);
  });

  it('favori: misafir de ekleyebilir; yayında olmayan ürün eklenmiyor', async () => {
    const once = MolaVeri.favoriMi('hotel', 'kordon-butik-otel');
    expect(await MolaVeri.favoriDegistir('hotel', 'kordon-butik-otel')).toBe(!once);
    expect(MolaVeri.favoriMi('hotel', 'kordon-butik-otel')).toBe(!once);
    expect(await MolaVeri.favoriDegistir('hotel', 'boyle-otel-yok')).toBe(false);
  });

  it('bildirim okundu ve kaldırıldı işaretleri kalıcı', async () => {
    await MolaVeri.uyeOl({ ad: 'Bil', soyad: 'Dir', eposta: 'bildirim-' + Math.random().toString(36).slice(2) + '@example.com', kvkk: true });
    const l = MolaVeri.bildirimler();
    const ilk = l[0];
    expect(ilk.unread).toBe(true);
    MolaVeri.bildirimOkundu(ilk.id);
    expect(MolaVeri.bildirimler().find(n => n.id === ilk.id).unread).toBe(false);
    MolaVeri.bildirimKaldir(ilk.id);
    expect(MolaVeri.bildirimler().some(n => n.id === ilk.id)).toBe(false);
  });

  it('profil güncelleme doğrulanıyor', async () => {
    await MolaVeri.uyeOl({ ad: 'Pro', soyad: 'Fil', eposta: 'profil-' + Math.random().toString(36).slice(2) + '@example.com', kvkk: true });
    expect((await MolaVeri.profilGuncelle({ ad: 'Pro', soyad: 'Fil', eposta: 'gecersiz' })).tamam).toBe(false);
    const ok = await MolaVeri.profilGuncelle({ ad: 'Yeni', soyad: 'Ad', eposta: 'profil-yeni-' + Math.random().toString(36).slice(2) + '@example.com', telefon: '05321234567' });
    expect(ok.tamam).toBe(true);
    expect(MolaVeri.oturum().ad).toBe('Yeni');
    expect((await MolaVeri.hesabiSil()).tamam).toBe(true);
    expect(MolaVeri.oturum()).toBe(null);
  });
});

/* ---------------- ekranlar ---------------- */
import { readFileSync } from 'node:fs';
const P = require('../assets/js/account-page.js');
const oku = (yol) => readFileSync(new URL('../' + yol, import.meta.url), 'utf8');

describe('Hesabım paneli', () => {
  const panel = () => ({
    hesap: { id: 'U1', ad: 'Ayşe', soyad: 'Yılmaz', eposta: 'a@b.co', izinler: {} },
    rezervasyonlar: [Object.assign(rez(), { durumu: 'yaklasan', iptalOnizleme: A.hspIptalOnizleme(rez(), an(27)), toplam: 2580, deneme: true })],
    biletler: A.hspBiletler(Object.assign(rez(), { deneme: true })),
    puan: Object.assign({ hareketler: [], bakiye: 0, bekleyen: 60 }, { seviye: A.hspSeviye(0) }),
    kuponlar: A.hspKuponlar({ kuponlar: [{ kod: 'HOSGELDIN-AAAAA', kampanya: 'yeni-uye', sonGun: '2026-12-26' }] }, an(27)),
    favoriler: [], yorumlar: [], bildirimler: []
  });

  it('tek panel: talimattaki 12 bölüm; misafire yalnızca favoriler', () => {
    expect(P.HSA_BOLUMLER.map(b => b.ad)).toEqual(['Genel Bakış', 'Rezervasyonlarım', 'Biletlerim', 'Favorilerim', 'Kuponlarım',
      'Mola Puanlarım', 'Üyelik Seviyem', 'Yorumlarım', 'Bildirimlerim', 'Kişisel Bilgilerim', 'Ödeme Yöntemlerim', 'Ayarlar']);
    expect((P.hsaNavMarkup('genel', true).match(/data-bolum=/g) || []).length).toBe(12);
    expect((P.hsaNavMarkup('genel', false).match(/data-bolum="([a-z-]+)"/g) || [])).toEqual(['data-bolum="favorilerim"']);
    P.HSA_BOLUMLER.forEach(b => expect(MolaVeri.adres('hesabim').kind).toBe('account'));
  });

  it('biletlerde karekod, bilet numarası ve deneme uyarısı', () => {
    const html = P.hsaBiletlerMarkup(panel());
    expect((html.match(/<svg class="karekod"/g) || []).length).toBe(2);
    expect(html).toContain('M360-ABCDEF-01');
    expect(html).toContain('DENEME');
    expect(html).toContain('bilet geçerli değil');
  });

  it('rezervasyon kartı iptalde iade tutarını önceden söylüyor', () => {
    const html = P.hsaRezervasyonKart(panel().rezervasyonlar[0]);
    expect(html).toContain('data-iptal-ac="M360-ABCDEF"');
    expect(html).toContain('<strong>516 TL</strong> iade edilir');
    expect(html).toContain('Kapora 516 TL');
  });

  it('seviye eşikleri örnek olduğunu söylüyor; avantaj vaat etmiyor', () => {
    const html = P.hsaSeviyeMarkup(panel().puan, A.HSP_SEVIYELER);
    expect(html).toContain('Eşikler örnek');
    expect(html).not.toMatch(/%\d+|indirim/);
  });

  it('ödeme yöntemleri kart bilgisi tutmuyor; ayarlarda şifre olmadığı yazıyor', () => {
    expect(P.hsaOdemeMarkup()).toContain('tutulmaz');
    expect(P.hsaAyarlarMarkup(panel().hesap)).toContain('şifre yok');
    expect(P.hsaKuponlarMarkup(panel().kuponlar)).toContain('data-kopyala="HOSGELDIN-AAAAA"');
  });

  it('başlık kaçışlı', () => {
    const r = Object.assign(panel().rezervasyonlar[0], { baslik: '<b>x</b>' });
    expect(P.hsaRezervasyonKart(r)).toContain('&lt;b&gt;x&lt;/b&gt;');
  });
});

describe('sayfalar ve çerçeve', () => {
  it('kısa adresler panelin bölümüne gidiyor', () => {
    expect(MolaVeri.adres('favorilerim')).toEqual({ kind: 'account', path: 'hesabim', bolum: 'favorilerim' });
    expect(MolaVeri.adres('biletlerim').bolum).toBe('biletlerim');
    expect(MolaVeri.adres('kuponlarim').bolum).toBe('kuponlarim');
  });

  it('yönlendirici hesap betiklerini doğru sırada yüklüyor', () => {
    const y = oku('404.html');
    const sira = (d) => y.indexOf('src="assets/js/' + d + '"');
    expect(sira('account-engine.js')).toBeLessThan(sira('data-gateway.js'));
    expect(sira('qr-code.js')).toBeLessThan(sira('data-gateway.js'));
    expect(sira('account-page.js')).toBeGreaterThan(0);
    expect(sira('account-page.js')).toBeLessThan(sira('listing-page.js'));
    expect(y).toContain('href="assets/css/account.css"');
    const ana = oku('index.html');
    expect(ana.indexOf('assets/js/account-engine.js')).toBeLessThan(ana.indexOf('assets/js/data-gateway.js'));
  });

  it('anasayfada elle yazılmış profil sayısı, puan ve bildirim yok', () => {
    const ana = oku('index.html');
    ['Bedir İnci', 'Gold seviyesindesin', '2.480', '320 Mola Puanı', 'Toplam Bilet', 'Doğrulanmış hesap'].forEach(m =>
      expect(ana, m).not.toContain(m));
    const app = oku('assets/js/app.js');
    expect(app).not.toContain("name: 'Bedir İnci'");
    expect(app).not.toContain("Kapadokya Balon Turu\\'nda %20 indirim");
    expect(app).toContain('MolaVeri.bildirimler(');
  });

  it('çekmecedeki kampanya kartları yürürlükteki kurallardan', () => {
    /* Çekmece (sol menü) ortak çerçevede: her sayfada aynı. */
    const ana = oku('assets/js/site-chrome.js');
    const kartlar = [...ana.matchAll(/<a href="([^"]+)" class="drawer-promo-card">[\s\S]*?<span class="num">([^<]+)<\/span>/g)].map(m => [m[1], m[2]]);
    expect(kartlar.length).toBeGreaterThan(0);
    const R2 = require('../assets/js/booking-engine.js');
    kartlar.forEach(([yol, num]) => {
      expect(MolaVeri.adres(yol), yol).toBeTruthy();
      const tl = num.match(/^(\d[\d.]*) TL$/);
      if (tl) expect(R2.REZ_KAMPANYALAR.some(k => k.indirim.tutar === Number(tl[1].replace(/\./g, ''))), num).toBe(true);
      const oran = num.match(/^%(\d+)$/);
      if (oran) expect(R2.REZ_KAMPANYALAR.some(k => Math.round((k.indirim.oran || 0) * 100) === Number(oran[1])), num).toBe(true);
    });
    expect(ana).not.toContain("'a varan indirim");
  });

  it('giriş penceresi şifre almıyor; henüz çalışmayan sosyal giriş pasif', () => {
    const c = oku('assets/js/site-chrome.js');
    expect(c).not.toContain('type="password"');
    expect(c).toContain('şifre alınmaz');
    expect((c.match(/class="auth-social-btn [^"]+" type="button" disabled/g) || []).length).toBe(8);
    expect(c).toContain('href="hesabim/?bolum=biletlerim"');
  });

  it('ürün sayfalarının kalbi veri kapısındaki favoriye yazıyor', () => {
    ['tour', 'hotel', 'activity', 'event', 'venue'].forEach(t => {
      const kod = oku('assets/js/' + t + '-page.js');
      expect(kod, t).toContain('MolaVeri.favoriDegistir(');
      expect(kod, t).toContain('MolaVeri.favoriMi(');
    });
  });
});
