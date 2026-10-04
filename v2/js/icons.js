/* Çizgi ikonlar (SVG). Bileşenler buradan alır. */
export const I={pin:'<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>',
clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
heart:'<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
bed:'<svg viewBox="0 0 24 24"><path d="M3 18V6M3 13h18v5M21 13v-2a3 3 0 0 0-3-3h-8v5"/><circle cx="7" cy="10" r="2"/></svg>',
chev:'<svg class="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>'};
export const CLOCK='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
export const STAR='<svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/></svg>';
/* Onaylı kullanıcı rozeti: daha önce Mola360'tan deneyim satın almış */
export const VERIFIED='<svg class="vf" viewBox="0 0 24 24" role="img" aria-label="Onaylı"><path d="M21.20 12.00A3.50 3.50 0 0 1 18.51 18.51A3.50 3.50 0 0 1 12.00 21.20A3.50 3.50 0 0 1 5.49 18.51A3.50 3.50 0 0 1 2.80 12.00A3.50 3.50 0 0 1 5.49 5.49A3.50 3.50 0 0 1 12.00 2.80A3.50 3.50 0 0 1 18.51 5.49A3.50 3.50 0 0 1 21.20 12.00Z"/><path class="vf-c" d="m8.2 12.2 2.6 2.6 5-5.2"/></svg>';
/* Ulaşım etiketi ikonları */
export const TRI={ucak:['Uçaklı','<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'],
 otobus:['Otobüslü','<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 18v3M16 18v3M8 14.5h.01M16 14.5h.01"/>'],
 feribot:['Feribotlu','<path d="M2 20c2 1 4 1 6 0s4-1 6 0 4 1 6 0"/><path d="M4 16l-1-5h18l-1 5M6 11V7h12v4M10 7V4h4v3"/>'],
 tren:['Trenli','<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 17l-2 4M15 17l2 4M9 14h.01M15 14h.01"/>']};
export const PIN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>';
export const chevL='<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',chevR='<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';

/* İskelet sayfaları için */
const s=p=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+p+'</svg>';
export const IC={
 more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/></svg>',
 link:s('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
 eyeoff:s('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.9 3.7M6.6 6.6A17 17 0 0 0 2.5 12S6 19 12 19a9.6 9.6 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
 info:s('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
 flag:s('<path d="M5 21V4h11l-1.5 4L16 12H5"/>'),
 trash:s('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
 back:s('<path d="m15 5-7 7 7 7"/>'),
 share:s('<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>'),
 comment:s('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>'),
 save:s('<path d="M6 3h12v18l-6-4.5L6 21z"/>'),
 check:s('<path d="m5 12.5 4.5 4.5L19 7"/>'),
 plus:s('<path d="M12 5v14M5 12h14"/>'),
 right:s('<path d="m9 6 6 6-6 6"/>'),
 calendar:s('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
 shield:s('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
 users:s('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 13.6a6.5 6.5 0 0 1 3.5 6.4"/>'),
 sliders:s('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
 heart:s('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'),
 bag:s('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2"/>'),
 grid:s('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
 bell:s('<path d="M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>'),
 menu:s('<path d="M4 7h16M4 12h16M4 17h10"/>'),
 image:s('<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>'),
 play:s('<path d="M8 5.5v13l11-6.5z"/>'),
 search:s('<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'),
 ticket:s('<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2.2"/>'),
 close:s('<path d="M6 6l12 12M18 6 6 18"/>'),
 send:s('<path d="M21.5 2.5 10.5 13.5"/><path d="M21.5 2.5 14.5 21.5l-4-8-8-4z"/>'),
 edit:s('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
 archive:s('<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>'),
 mute:s('<path d="M6 16v-5a6 6 0 0 1 9.4-4.9M18 11v5l2 2H8M10 20a2 2 0 0 0 4 0M3 3l18 18"/>')};
