/* Şifre özeti — scrypt (node:crypto).

   NEDEN scrypt, argon2 veya bcrypt DEĞİL: ikisi de yerel derleme gerektiren
   paketler. scrypt Node'un içinde, RFC 7914 standardı ve bu iş için yeterli:
   bellek-sert (memory-hard), yani GPU ile paralel kırmaya dirençli.

   Format:  scrypt$N$r$p$<tuz-base64>$<ozet-base64>
   Parametreler özetin İÇİNDE saklanıyor; ileride maliyet artırıldığında eski
   şifreler doğrulanmaya devam ediyor ve kullanıcı giriş yaptığında sessizce
   yeni parametrelerle yeniden özetlenebiliyor (yenidenOzetleGerekli). */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

/* N=2^16: masaüstü donanımda ~100 ms, 64 MiB bellek. maxmem varsayılanı
   (32 MiB) bunun altında kaldığı için AÇIKÇA yükseltiliyor; yükseltilmezse
   scrypt "memory limit exceeded" ile patlar. */
const VARSAYILAN = { N: 65536, r: 8, p: 1, keylen: 64, maxmem: 160 * 1024 * 1024 };

export async function sifreOzetle(sifre, parametre = VARSAYILAN) {
  if (typeof sifre !== 'string' || sifre.length < 8) {
    throw new Error('Şifre en az 8 karakter olmalı');
  }
  const { N, r, p, keylen, maxmem } = parametre;
  const tuz = randomBytes(16);
  const ozet = await scrypt(sifre, tuz, keylen, { N, r, p, maxmem });
  return ['scrypt', N, r, p, tuz.toString('base64'), ozet.toString('base64')].join('$');
}

export async function sifreDogrula(sifre, kayitliOzet) {
  if (typeof sifre !== 'string' || typeof kayitliOzet !== 'string') return false;
  const parca = kayitliOzet.split('$');
  if (parca.length !== 6 || parca[0] !== 'scrypt') return false;

  const N = Number(parca[1]), r = Number(parca[2]), p = Number(parca[3]);
  if (!N || !r || !p) return false;

  let tuz, beklenen;
  try {
    tuz = Buffer.from(parca[4], 'base64');
    beklenen = Buffer.from(parca[5], 'base64');
  } catch { return false; }

  let uretilen;
  try {
    uretilen = await scrypt(sifre, tuz, beklenen.length, { N, r, p, maxmem: VARSAYILAN.maxmem });
  } catch { return false; }

  /* Sabit zamanlı karşılaştırma: baytları tek tek karşılaştıran bir eşitlik
     kontrolü, doğru olan ön ekin uzunluğunu ZAMANDAN sızdırır. */
  if (uretilen.length !== beklenen.length) return false;
  return timingSafeEqual(uretilen, beklenen);
}

/* Maliyet parametreleri yükseltildiğinde eski özetleri tanır. */
export function yenidenOzetleGerekli(kayitliOzet) {
  const parca = String(kayitliOzet || '').split('$');
  if (parca.length !== 6 || parca[0] !== 'scrypt') return true;
  return Number(parca[1]) < VARSAYILAN.N;
}
