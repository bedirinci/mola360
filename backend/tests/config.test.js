/* Ortam değişkenleri: açılışta doğrulanıyor. Her durum ayrı bir süreçte
   denenir, çünkü yapılandırma modülü yüklenirken bir kez okunur ve geçersiz
   değerde süreci durdurur. Veritabanı gerekmez. */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const KOK = fileURLToPath(new URL('..', import.meta.url));

function ac(ortam) {
  const env = { PATH: process.env.PATH, DATABASE_URL: 'postgres://x@127.0.0.1/x', ...ortam };
  const r = spawnSync(process.execPath, ['--input-type=module', '-e',
    "import { config } from './src/config/index.js'; console.log(JSON.stringify({ secure: config.COOKIE_SECURE }));"],
  { cwd: KOK, env, encoding: 'utf8' });
  return { kod: r.status, cikti: r.stdout.trim(), hata: r.stderr };
}

describe('COOKIE_SECURE', () => {
  it('"false" yazınca gerçekten kapalı (z.coerce.boolean bunu true sayıyordu)', () => {
    expect(ac({ COOKIE_SECURE: 'false' }).cikti).toBe('{"secure":false}');
    expect(ac({ COOKIE_SECURE: '0' }).cikti).toBe('{"secure":false}');
  });

  it('"true" açık, verilmezse geliştirmede kapalı', () => {
    expect(ac({ COOKIE_SECURE: 'true' }).cikti).toBe('{"secure":true}');
    expect(ac({}).cikti).toBe('{"secure":false}');
  });

  it('tanınmayan değer açılışı durduruyor', () => {
    const r = ac({ COOKIE_SECURE: 'belki' });
    expect(r.kod).toBe(1);
    expect(r.hata).toMatch(/COOKIE_SECURE/);
  });

  it('üretimde verilmezse açık, kapatılamıyor', () => {
    const uretim = { NODE_ENV: 'production', SESSION_SECRET: 'u'.repeat(40) };
    expect(ac(uretim).cikti).toBe('{"secure":true}');
    const r = ac({ ...uretim, COOKIE_SECURE: 'false' });
    expect(r.kod).toBe(1);
    expect(r.hata).toMatch(/Üretimde COOKIE_SECURE true olmalı/);
  });
});
