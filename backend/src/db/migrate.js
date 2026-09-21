/* Göç (migration) çalıştırıcısı.

   Üçüncü parti bir araca bağlanmadı: iş, sıralı SQL dosyalarını bir kez
   çalıştırmak ve hangilerinin çalıştığını kaydetmek.

   İKİ GÜVENCE:
   1) Her dosya KENDİ transaction'ında çalışıyor. Ortasında patlayan bir göç
      yarım şema bırakmıyor.
   2) Çalışmış bir dosyanın içeriği SONRADAN değiştirilirse fark ediliyor
      (sha256). Bu, "bende çalışıyor ama üretimde tablo yok" sınıfının en
      sinsi sebebidir: kimse çalışmış bir göçü düzenlememeli, yenisini
      yazmalı. */
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';
import { log } from '../lib/logger.js';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIZIN = path.join(KOK, 'migrations');

function dosyalar() {
  return readdirSync(DIZIN).filter(a => a.endsWith('.sql')).sort();
}
const ozet = (metin) => createHash('sha256').update(metin).digest('hex');

async function tabloyuKur(istemci) {
  await istemci.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       text PRIMARY KEY,
      checksum   text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
}

export async function durum() {
  const istemci = await pool.connect();
  try {
    await tabloyuKur(istemci);
    const { rows } = await istemci.query('SELECT name, checksum FROM schema_migrations');
    const uygulanan = new Map(rows.map(r => [r.name, r.checksum]));
    return dosyalar().map(ad => {
      const icerik = readFileSync(path.join(DIZIN, ad), 'utf8');
      const simdiki = ozet(icerik);
      const eski = uygulanan.get(ad);
      return {
        ad,
        uygulandi: !!eski,
        degisti: !!eski && eski !== simdiki,
      };
    });
  } finally {
    istemci.release();
  }
}

export async function yukari() {
  const istemci = await pool.connect();
  const calisanlar = [];
  try {
    await tabloyuKur(istemci);
    const { rows } = await istemci.query('SELECT name, checksum FROM schema_migrations');
    const uygulanan = new Map(rows.map(r => [r.name, r.checksum]));

    for (const ad of dosyalar()) {
      const icerik = readFileSync(path.join(DIZIN, ad), 'utf8');
      const simdiki = ozet(icerik);
      const eski = uygulanan.get(ad);

      if (eski) {
        if (eski !== simdiki) {
          throw new Error(
            `Göç dosyası çalıştıktan SONRA değiştirilmiş: ${ad}\n` +
            'Çalışmış bir göç düzenlenmez — değişikliği yeni bir dosyaya yazın.');
        }
        continue;
      }

      await istemci.query('BEGIN');
      try {
        await istemci.query(icerik);
        await istemci.query(
          'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [ad, simdiki]);
        await istemci.query('COMMIT');
        calisanlar.push(ad);
        log.info('Göç uygulandı', { migration: ad });
      } catch (e) {
        await istemci.query('ROLLBACK');
        throw new Error(`Göç başarısız: ${ad}\n${e.message}`);
      }
    }
    return calisanlar;
  } finally {
    istemci.release();
  }
}

/* Şemayı tamamen siler ve yeniden kurar. ÜRETİMDE ÇALIŞMAZ — bu korumayı
   kaldırmak, tek bir yanlış komutla bütün veriyi silmek demek. */
export async function sifirla() {
  const { config } = await import('../config/index.js');
  if (config.isProduction) {
    throw new Error('reset üretim ortamında çalıştırılamaz.');
  }
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  log.warn('Şema sıfırlandı');
  return yukari();
}
