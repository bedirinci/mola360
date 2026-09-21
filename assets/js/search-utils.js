/* ---------------- saf yardımcı fonksiyonlar ----------------
   DOM'a bağımlı değildir; hem app.js hem de birim testleri tarafından
   ortak kullanılır. Bu dosya index.html içinde app.js'ten ÖNCE
   yüklenmelidir. */

function normalizeSearchText(value) {
  return String(value || '').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function getSearchCategoryIcon(name) {
  const iconMap = {
    'Fırsatlar':'percent',
    'Etkinlikler':'ticket',
    'Oteller':'home',
    'Aktiviteler':'compass',
    'Mekanlar':'mapPin',
    'Kuponlarım':'wallet',
    'Yeni Eklenenler':'star',
    'Bu Hafta':'calendar'
  };
  return iconMap[name] || 'compass';
}

/* Sonuc kartinin ustundeki tur etiketi. Kayit kendi turunu bildiriyorsa
   (icerik katalogundan gelen kartlar bildirir) o kullanilir; bildirmiyorsa
   seridin basligindan tahmin edilir.

   Tahmin tek basina yetmiyor: katalog bir turu hem "Gunubirlik Turlar"
   hem "Yaklasan Planlar" seridine koyuyor ve ikincisinin basliginda "tur"
   gecmedigi icin ayni tur orada "Etkinlik" diye etiketleniyordu. */
function getSearchCardType(sectionTitle, tip) {
  if (tip) return tip;
  if (sectionTitle.includes('Otel')) return 'Otel';
  if (sectionTitle.includes('Aktivit')) return 'Aktivite';
  if (sectionTitle.includes('Tur')) return 'Tur';
  return 'Etkinlik';
}

function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normalizeSearchText, getSearchCategoryIcon, getSearchCardType, getInitials };
}
