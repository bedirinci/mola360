/* Yapılandırılmış, seviyeli günlük. Dışarıdan paket getirmeye değmeyecek
   kadar küçük; JSON satırları üretiyor ki üretimde bir toplayıcı okuyabilsin. */
import { config } from '../config/index.js';

const SIRA = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };
const esik = SIRA[config.LOG_LEVEL] ?? SIRA.info;

function yaz(seviye, mesaj, ek) {
  if (SIRA[seviye] < esik) return;
  const satir = { ts: new Date().toISOString(), level: seviye, msg: mesaj, ...(ek || {}) };
  const akis = seviye === 'error' || seviye === 'warn' ? process.stderr : process.stdout;
  akis.write(JSON.stringify(satir) + '\n');
}

export const log = {
  debug: (m, e) => yaz('debug', m, e),
  info:  (m, e) => yaz('info', m, e),
  warn:  (m, e) => yaz('warn', m, e),
  error: (m, e) => yaz('error', m, e),
};
