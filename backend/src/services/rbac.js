/* Rol ve izin tanımları — TEK KAYNAK.

   İzinler burada listeleniyor, rollere buradan dağıtılıyor ve seed bu
   listeden besleniyor. İki yerde tutulsaydı (kodda bir liste, veritabanında
   başka bir liste) biri güncellenip diğeri unutulurdu; sonuç, panelde
   görünen ama sunucunun tanımadığı bir yetki olurdu.

   İZİN ADLANDIRMA: <alan>.<eylem>. Alan bazlı kontrol yapmak isteyen kod
   önekten süzebiliyor (content.*).

   KURAL: yetki kontrolü YALNIZCA sunucuda yapılır. Panelin izinleri bilmesi
   sadece menüyü ve düğmeleri gizlemek için; her istek ayrıca middleware'den
   geçer. Yalnızca arayüzde saklanan bir düğme, doğrudan API çağrısıyla
   atlatılabilir. */

export const IZINLER = [
  // İçerik
  ['content.read',        'content', 'İçerikleri görüntüleme'],
  ['content.create',      'content', 'Yeni içerik oluşturma'],
  ['content.update',      'content', 'İçerik düzenleme'],
  ['content.delete',      'content', 'İçerik silme (yumuşak silme)'],
  ['content.publish',     'content', 'İçeriği yayına alma ve yayından kaldırma'],
  ['content.restore',     'content', 'Eski sürümü geri yükleme'],
  // Envanter ve fiyat
  ['inventory.read',      'inventory', 'Kontenjan ve takvimi görüntüleme'],
  ['inventory.manage',    'inventory', 'Kontenjan, kapalı tarih ve seans yönetimi'],
  ['pricing.read',        'pricing', 'Fiyat kurallarını görüntüleme'],
  ['pricing.manage',      'pricing', 'Fiyat ve fiyat kuralı değiştirme'],
  // Rezervasyon
  ['booking.read',        'booking', 'Rezervasyonları görüntüleme'],
  ['booking.create',      'booking', 'Panelden rezervasyon oluşturma'],
  ['booking.update',      'booking', 'Rezervasyon değiştirme'],
  ['booking.cancel',      'booking', 'Rezervasyon iptali'],
  ['booking.refund',      'booking', 'İade işlemi'],
  ['payment.read',        'booking', 'Ödeme bilgilerini görüntüleme'],
  // Müşteri
  ['customer.read',       'customer', 'Müşterileri görüntüleme'],
  ['customer.update',     'customer', 'Müşteri bilgisi düzenleme'],
  ['customer.delete',     'customer', 'Müşteri silme / anonimleştirme'],
  ['customer.export',     'customer', 'Müşteri verisi dışa aktarma (KVKK)'],
  // Yorum
  ['review.read',         'review', 'Yorumları görüntüleme'],
  ['review.moderate',     'review', 'Yorum onaylama, reddetme, yanıtlama'],
  // Pazarlama
  ['campaign.read',       'marketing', 'Kampanya ve kuponları görüntüleme'],
  ['campaign.manage',     'marketing', 'Kampanya ve kupon yönetimi'],
  ['homepage.manage',     'marketing', 'Anasayfa yerleşimi yönetimi'],
  // Medya ve SEO
  ['media.read',          'media', 'Medya kütüphanesini görüntüleme'],
  ['media.manage',        'media', 'Görsel yükleme, değiştirme, silme'],
  ['seo.manage',          'seo', 'SEO alanları ve yönlendirme yönetimi'],
  // Raporlar
  ['report.read',         'report', 'Raporları görüntüleme'],
  ['report.export',       'report', 'Rapor dışa aktarma'],
  // Sistem
  ['settings.manage',     'system', 'Site ayarlarını değiştirme'],
  ['audit.read',          'system', 'Denetim kayıtlarını görüntüleme'],
  ['admin.manage',        'system', 'Yönetici hesabı ve rol yönetimi'],
  ['backup.manage',       'system', 'Yedekleme ve geri yükleme'],
];

export const IZIN_ANAHTARLARI = IZINLER.map(([k]) => k);

/* '*' = bütün izinler. SUPER_ADMIN dışında kimsede yok; yeni bir izin
   eklendiğinde süper yöneticiye elle vermeyi unutmak mümkün olmasın diye. */
export const ROLLER = [
  {
    key: 'SUPER_ADMIN',
    name: 'Süper Yönetici',
    description: 'Sınırsız yetki. Yedek geri yükleme ve oturum sonlandırma dâhil.',
    permissions: ['*'],
  },
  {
    key: 'ADMIN',
    name: 'Yönetici',
    description: 'Yedekleme dışında her şey.',
    permissions: IZIN_ANAHTARLARI.filter(k => k !== 'backup.manage'),
  },
  {
    key: 'CONTENT_MANAGER',
    name: 'İçerik Müdürü',
    description: 'İçerik, medya, SEO ve anasayfa; yayına alma yetkisi var.',
    permissions: [
      'content.read', 'content.create', 'content.update', 'content.delete',
      'content.publish', 'content.restore',
      'inventory.read', 'pricing.read',
      'media.read', 'media.manage', 'seo.manage', 'homepage.manage',
      'review.read', 'review.moderate', 'report.read',
    ],
  },
  {
    key: 'EDITOR',
    name: 'Editör',
    description: 'İçerik yazar ve düzenler ama YAYINLAYAMAZ; kullanıcı ve ödeme göremez.',
    permissions: [
      'content.read', 'content.create', 'content.update',
      'media.read', 'media.manage',
      'review.read', 'inventory.read',
    ],
  },
  {
    key: 'RESERVATION_MANAGER',
    name: 'Rezervasyon Müdürü',
    description: 'Rezervasyon, kontenjan ve iade; içerik düzenleyemez.',
    permissions: [
      'content.read', 'inventory.read', 'inventory.manage', 'pricing.read',
      'booking.read', 'booking.create', 'booking.update', 'booking.cancel',
      'booking.refund', 'payment.read',
      'customer.read', 'customer.update', 'report.read', 'report.export',
    ],
  },
  {
    key: 'MARKETING_MANAGER',
    name: 'Pazarlama Müdürü',
    description: 'Kampanya, kupon, anasayfa ve raporlar.',
    permissions: [
      'content.read', 'pricing.read',
      'campaign.read', 'campaign.manage', 'homepage.manage',
      'media.read', 'media.manage', 'seo.manage',
      'report.read', 'report.export', 'customer.read',
    ],
  },
  {
    key: 'SUPPORT',
    name: 'Destek',
    description: 'Rezervasyon ve müşteri görüntüleme, yorum moderasyonu. İade yapamaz.',
    permissions: [
      'content.read', 'inventory.read',
      'booking.read', 'booking.update',
      'customer.read', 'review.read', 'review.moderate',
    ],
  },
];

/* Bir kullanıcının izin kümesini çözüyor. '*' varsa hepsi.

   Set döndürülüyor, dizi değil: izin kontrolü her istekte çalışıyor ve
   dizide arama istek sayısıyla birlikte pahalılaşır. */
export function izinKumesi(satirlar) {
  const kume = new Set();
  for (const s of satirlar) {
    if (s.permission_key === '*') return new Set(IZIN_ANAHTARLARI);
    kume.add(s.permission_key);
  }
  return kume;
}

export function izinVarMi(kume, gerekli) {
  if (!kume) return false;
  return kume.has(gerekli);
}
