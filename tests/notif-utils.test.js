import { describe, it, expect } from 'vitest';
import {
  NOTIF_FILTERS,
  filterNotifications,
  groupNotifications,
  countUnreadNotifications,
  formatNotifCount,
  getNotifTypeLabel,
  notifSummaryText,
} from '../assets/js/notif-utils.js';

const sample = [
  { id: 'a', type: 'deal',    group: 'today',   unread: true,  title: 'Fırsat' },
  { id: 'b', type: 'booking', group: 'today',   unread: false, title: 'Rezervasyon' },
  { id: 'c', type: 'deal',    group: 'week',    unread: true,  title: 'İkinci fırsat' },
  { id: 'd', type: 'system',  group: 'earlier', unread: false, title: 'Sistem' },
];

describe('filterNotifications', () => {
  it('filtre verilmezse veya "all" ise listenin tamamını döndürür', () => {
    expect(filterNotifications(sample, 'all')).toHaveLength(4);
    expect(filterNotifications(sample)).toHaveLength(4);
  });

  it('"unread" yalnızca okunmamışları döndürür', () => {
    expect(filterNotifications(sample, 'unread').map(n => n.id)).toEqual(['a', 'c']);
  });

  it('tür anahtarıyla o türe ait bildirimleri döndürür', () => {
    expect(filterNotifications(sample, 'deal').map(n => n.id)).toEqual(['a', 'c']);
    expect(filterNotifications(sample, 'favorite')).toEqual([]);
  });

  it('kaynağı değiştirmez (kopya döndürür)', () => {
    const result = filterNotifications(sample, 'all');
    result.pop();
    expect(sample).toHaveLength(4);
  });

  it('geçersiz girdide boş liste döndürür', () => {
    expect(filterNotifications(null, 'all')).toEqual([]);
    expect(filterNotifications(undefined, 'unread')).toEqual([]);
  });
});

describe('groupNotifications', () => {
  it('grupları Bugün → Bu hafta → Daha önce sırasıyla döndürür', () => {
    expect(groupNotifications(sample).map(g => g.key)).toEqual(['today', 'week', 'earlier']);
    expect(groupNotifications(sample)[0].label).toBe('Bugün');
  });

  it('boş grupları atar', () => {
    const onlyToday = groupNotifications(sample.filter(n => n.group === 'today'));
    expect(onlyToday).toHaveLength(1);
    expect(onlyToday[0].items.map(n => n.id)).toEqual(['a', 'b']);
  });

  it('liste boşsa hiç grup döndürmez', () => {
    expect(groupNotifications([])).toEqual([]);
  });
});

describe('countUnreadNotifications', () => {
  it('okunmamışları sayar', () => {
    expect(countUnreadNotifications(sample)).toBe(2);
    expect(countUnreadNotifications([])).toBe(0);
  });
});

describe('formatNotifCount', () => {
  it('sıfır ve altını boş metne çevirir', () => {
    expect(formatNotifCount(0)).toBe('');
    expect(formatNotifCount(-3)).toBe('');
  });

  it('99 üstünü kısaltır', () => {
    expect(formatNotifCount(20)).toBe('20');
    expect(formatNotifCount(99)).toBe('99');
    expect(formatNotifCount(120)).toBe('99+');
  });
});

describe('getNotifTypeLabel', () => {
  it('bilinen türler için Türkçe etiket verir', () => {
    expect(getNotifTypeLabel('deal')).toBe('Fırsat');
    expect(getNotifTypeLabel('favorite')).toBe('Favori');
  });

  it('bilinmeyen tür için genel etikete düşer', () => {
    expect(getNotifTypeLabel('bilinmeyen')).toBe('Bildirim');
  });
});

describe('notifSummaryText', () => {
  it('okunmamış varsa sayıyı yazar', () => {
    expect(notifSummaryText(6)).toBe('6 okunmamış bildirim');
  });

  it('okunmamış yoksa tamamlanmış mesajı verir', () => {
    expect(notifSummaryText(0)).toBe('Tüm bildirimler okundu');
  });
});

describe('NOTIF_FILTERS', () => {
  it('tüm filtreler tekil anahtara sahiptir ve "all" ile başlar', () => {
    const keys = NOTIF_FILTERS.map(f => f.key);
    expect(keys[0]).toBe('all');
    expect(new Set(keys).size).toBe(keys.length);
  });
});
