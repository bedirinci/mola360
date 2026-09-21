#!/usr/bin/env node
/* node scripts/migrate.js up | status | reset */
import { yukari, durum, sifirla } from '../src/db/migrate.js';
import { kapat } from '../src/db/pool.js';

const komut = process.argv[2] || 'up';

try {
  if (komut === 'status') {
    const liste = await durum();
    for (const g of liste) {
      const isaret = g.degisti ? '!' : (g.uygulandi ? '+' : ' ');
      console.log(`${isaret} ${g.ad}${g.degisti ? '  (DOSYA DEĞİŞMİŞ)' : ''}`);
    }
    const bekleyen = liste.filter(g => !g.uygulandi).length;
    console.log(`\n${liste.length} göç, ${bekleyen} bekliyor.`);
  } else if (komut === 'reset') {
    const c = await sifirla();
    console.log(`Şema sıfırlandı, ${c.length} göç uygulandı.`);
  } else {
    const c = await yukari();
    console.log(c.length ? `${c.length} göç uygulandı:\n  ${c.join('\n  ')}` : 'Bekleyen göç yok.');
  }
  await kapat();
} catch (e) {
  console.error(e.message);
  await kapat();
  process.exit(1);
}
