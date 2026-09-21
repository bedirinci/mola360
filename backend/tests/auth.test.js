/* Kimlik doğrulama testleri.

   Panelin eski sürümünde şifre TARAYICIDA karşılaştırılıyordu; kod açıktı,
   özet de oradaydı. Buradaki testler yeni akışın gerçekten sunucu tarafında
   olduğunu ve bilinen saldırılara kapalı olduğunu ölçüyor. */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { uygulamaOlustur } from '../src/app.js';
import { semayiKur, temizle, yoneticiOlustur, cerezAl } from './yardim.js';
import { sorgu, kapat } from '../src/db/pool.js';
import { sifreOzetle, sifreDogrula, yenidenOzetleGerekli } from '../src/lib/password.js';

const app = uygulamaOlustur();

beforeAll(async () => { await semayiKur(); });
beforeEach(async () => { await temizle(); });
afterAll(async () => { await kapat(); });

describe('şifre özeti', () => {
  it('düz metin saklamıyor ve her seferinde farklı özet üretiyor', async () => {
    const a = await sifreOzetle('AyniSifre123');
    const b = await sifreOzetle('AyniSifre123');
    expect(a).not.toContain('AyniSifre123');
    /* Farklı tuz, farklı özet: veritabanı sızsa bile aynı şifreyi kullanan
       iki hesap aynı satırdan tanınamaz. */
    expect(a).not.toBe(b);
    expect(await sifreDogrula('AyniSifre123', a)).toBe(true);
    expect(await sifreDogrula('AyniSifre123', b)).toBe(true);
  });

  it('yanlış şifreyi ve bozuk özeti reddediyor', async () => {
    const ozet = await sifreOzetle('DogruSifre123');
    expect(await sifreDogrula('YanlisSifre123', ozet)).toBe(false);
    expect(await sifreDogrula('DogruSifre123', 'bozuk')).toBe(false);
    expect(await sifreDogrula('DogruSifre123', '')).toBe(false);
    expect(await sifreDogrula(null, ozet)).toBe(false);
  });

  it('kısa şifre kabul edilmiyor', async () => {
    await expect(sifreOzetle('kisa')).rejects.toThrow();
  });

  it('eski maliyetli özet yeniden özetleme gerektiriyor', () => {
    expect(yenidenOzetleGerekli('scrypt$16384$8$1$dGVzdA==$dGVzdA==')).toBe(true);
    expect(yenidenOzetleGerekli('scrypt$65536$8$1$dGVzdA==$dGVzdA==')).toBe(false);
    expect(yenidenOzetleGerekli('bcrypt$...')).toBe(true);
  });
});

describe('giriş', () => {
  it('doğru bilgiyle giriş yapılıyor ve çerez httpOnly geliyor', async () => {
    const y = await yoneticiOlustur();
    const cevap = await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: y.sifre });

    expect(cevap.status).toBe(200);
    expect(cevap.body.success).toBe(true);
    expect(cevap.body.data.email).toBe(y.email);
    /* Jeton gövdede DÖNMÜYOR: JavaScript'in eline geçmemeli. */
    expect(JSON.stringify(cevap.body)).not.toMatch(/token/i);

    const cerez = (cevap.headers['set-cookie'] || []).join(';');
    expect(cerez).toMatch(/HttpOnly/i);
    expect(cerez).toMatch(/SameSite=Strict/i);
  });

  it('yanlış şifre reddediliyor ve aynı mesajı veriyor', async () => {
    const y = await yoneticiOlustur();
    const yanlisSifre = await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: 'YanlisSifre123' });
    const yokKullanici = await request(app).post('/api/admin/auth/login')
      .send({ email: 'olmayan@mola360.test', password: 'YanlisSifre123' });

    expect(yanlisSifre.status).toBe(401);
    expect(yokKullanici.status).toBe(401);
    /* İki durum AYNI mesajı veriyor: farklı mesaj, hangi e-postaların
       kayıtlı olduğunu sızdırır (kullanıcı numaralandırma). */
    expect(yanlisSifre.body.error.message).toBe(yokKullanici.body.error.message);
  });

  it('her deneme kayda geçiyor', async () => {
    const y = await yoneticiOlustur();
    await request(app).post('/api/admin/auth/login').send({ email: y.email, password: 'Yanlis123456' });
    await request(app).post('/api/admin/auth/login').send({ email: y.email, password: y.sifre });
    const { rows } = await sorgu(
      'SELECT success FROM login_attempts WHERE lower(email) = lower($1) ORDER BY id', [y.email]);
    expect(rows.map(r => r.success)).toEqual([false, true]);
  });

  it('ardışık hatalı denemeden sonra hesap kilitleniyor', async () => {
    const y = await yoneticiOlustur();
    let son;
    for (let i = 0; i < 5; i++) {
      son = await request(app).post('/api/admin/auth/login')
        .send({ email: y.email, password: 'Yanlis1234567' });
    }
    expect(son.status).toBe(423);
    expect(son.body.error.code).toBe('ACCOUNT_LOCKED');

    /* Kilitliyken DOĞRU şifre de çalışmıyor — kilidin anlamı bu. */
    const dogru = await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: y.sifre });
    expect(dogru.status).toBe(423);
  });

  it('başarılı giriş sayacı sıfırlıyor', async () => {
    const y = await yoneticiOlustur();
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/admin/auth/login').send({ email: y.email, password: 'Yanlis1234567' });
    }
    await request(app).post('/api/admin/auth/login').send({ email: y.email, password: y.sifre });
    const { rows } = await sorgu('SELECT failed_attempts FROM admin_users WHERE id = $1', [y.id]);
    expect(rows[0].failed_attempts).toBe(0);
  });

  it('geçersiz gövde 422 ve alan hatası döndürüyor', async () => {
    const cevap = await request(app).post('/api/admin/auth/login')
      .send({ email: 'eposta-degil', password: '' });
    expect(cevap.status).toBe(422);
    expect(cevap.body.error.code).toBe('VALIDATION_ERROR');
    expect(cevap.body.error.fieldErrors).toHaveProperty('email');
    expect(cevap.body.error.fieldErrors).toHaveProperty('password');
  });
});

describe('oturum', () => {
  it('jetonun kendisi değil ÖZETİ saklanıyor', async () => {
    const y = await yoneticiOlustur();
    const cevap = await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: y.sifre });
    const jeton = cerezAl(cevap).split('=')[1];

    const { rows } = await sorgu('SELECT token_hash FROM admin_sessions');
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(jeton);
    expect(rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('oturumsuz istek 401 alıyor', async () => {
    const cevap = await request(app).get('/api/admin/auth/me');
    expect(cevap.status).toBe(401);
    expect(cevap.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('çıkış sonrası çerez artık çalışmıyor', async () => {
    const y = await yoneticiOlustur();
    const giris = await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: y.sifre });
    const cerez = cerezAl(giris);

    expect((await request(app).get('/api/admin/auth/me').set('Cookie', cerez)).status).toBe(200);
    await request(app).post('/api/admin/auth/logout').set('Cookie', cerez);
    expect((await request(app).get('/api/admin/auth/me').set('Cookie', cerez)).status).toBe(401);
  });

  it('süresi dolmuş oturum reddediliyor', async () => {
    const y = await yoneticiOlustur();
    const giris = await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: y.sifre });
    const cerez = cerezAl(giris);
    await sorgu(`UPDATE admin_sessions SET expires_at = now() - interval '1 hour'`);
    expect((await request(app).get('/api/admin/auth/me').set('Cookie', cerez)).status).toBe(401);
  });

  it('şifre değişince BÜTÜN oturumlar kapanıyor', async () => {
    const y = await yoneticiOlustur();
    const birinci = cerezAl(await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: y.sifre }));
    const ikinci = cerezAl(await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: y.sifre }));

    const degistir = await request(app).post('/api/admin/auth/change-password')
      .set('Cookie', ikinci)
      .send({ currentPassword: y.sifre, newPassword: 'YeniCokGucluSifre456' });
    expect(degistir.status).toBe(200);

    /* Çalınmış bir oturumun şifre değişikliğinden sonra yaşaması kabul
       edilemez: ikisi de kapanmalı. */
    expect((await request(app).get('/api/admin/auth/me').set('Cookie', birinci)).status).toBe(401);
    expect((await request(app).get('/api/admin/auth/me').set('Cookie', ikinci)).status).toBe(401);

    const yeni = await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: 'YeniCokGucluSifre456' });
    expect(yeni.status).toBe(200);
  });

  it('yanlış mevcut şifreyle şifre değiştirilemiyor', async () => {
    const y = await yoneticiOlustur();
    const cerez = cerezAl(await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: y.sifre }));
    const cevap = await request(app).post('/api/admin/auth/change-password')
      .set('Cookie', cerez)
      .send({ currentPassword: 'Yanlis1234567', newPassword: 'YeniCokGucluSifre456' });
    expect(cevap.status).toBe(401);
  });

  it('askıya alınmış hesabın açık oturumu geçersizleşiyor', async () => {
    const y = await yoneticiOlustur();
    const cerez = cerezAl(await request(app).post('/api/admin/auth/login')
      .send({ email: y.email, password: y.sifre }));
    await sorgu(`UPDATE admin_users SET status = 'suspended' WHERE id = $1`, [y.id]);
    expect((await request(app).get('/api/admin/auth/me').set('Cookie', cerez)).status).toBe(401);
  });
});
