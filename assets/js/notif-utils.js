/* ---------------- bildirim yardımcıları ----------------
   DOM'a bağımlı değildir; hem app.js hem de birim testleri tarafından
   ortak kullanılır. Bu dosya index.html içinde app.js'ten ÖNCE
   yüklenmelidir. */

/* Bildirim ekranındaki filtre çipleri. 'all' ve 'unread' dışındaki
   anahtarlar doğrudan bildirimin type alanıyla eşleşir. */
const NOTIF_FILTERS = [
  { key: 'all',      label: 'Tümü' },
  { key: 'unread',   label: 'Okunmamış' },
  { key: 'deal',     label: 'Fırsatlar' },
  { key: 'booking',  label: 'Rezervasyon' },
  { key: 'event',    label: 'Etkinlik' },
  { key: 'favorite', label: 'Favoriler' },
  { key: 'system',   label: 'Sistem' }
];

/* Liste zaman gruplarına ayrılır; sıralama bu dizideki sıradır. */
const NOTIF_GROUPS = [
  { key: 'today',   label: 'Bugün' },
  { key: 'week',    label: 'Bu hafta' },
  { key: 'earlier', label: 'Daha önce' }
];

const NOTIF_TYPE_LABELS = {
  deal: 'Fırsat',
  booking: 'Rezervasyon',
  event: 'Etkinlik',
  favorite: 'Favori',
  system: 'Sistem'
};

function filterNotifications(list, filter) {
  const items = Array.isArray(list) ? list : [];
  if (!filter || filter === 'all') return items.slice();
  if (filter === 'unread') return items.filter(n => !!n.unread);
  return items.filter(n => n.type === filter);
}

/* Yalnızca dolu gruplar döner; böylece boş bir "Bugün" başlığı çizilmez. */
function groupNotifications(list) {
  const items = Array.isArray(list) ? list : [];
  return NOTIF_GROUPS
    .map(group => ({
      key: group.key,
      label: group.label,
      items: items.filter(n => n.group === group.key)
    }))
    .filter(group => group.items.length > 0);
}

function countUnreadNotifications(list) {
  return filterNotifications(list, 'unread').length;
}

/* Zil ikonundaki rozet: 0 ise boş metin, 99'dan büyükse "99+". */
function formatNotifCount(count) {
  const n = Number(count) || 0;
  if (n <= 0) return '';
  return n > 99 ? '99+' : String(n);
}

function getNotifTypeLabel(type) {
  return NOTIF_TYPE_LABELS[type] || 'Bildirim';
}

/* Başlığın altındaki özet satırı. */
function notifSummaryText(count) {
  const n = Number(count) || 0;
  return n > 0 ? `${n} okunmamış bildirim` : 'Tüm bildirimler okundu';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NOTIF_FILTERS,
    NOTIF_GROUPS,
    NOTIF_TYPE_LABELS,
    filterNotifications,
    groupNotifications,
    countUnreadNotifications,
    formatNotifCount,
    getNotifTypeLabel,
    notifSummaryText
  };
}
