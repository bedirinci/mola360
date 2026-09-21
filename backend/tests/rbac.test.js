/* Yetki testleri.

   KURAL: yetki kontrolü YALNIZCA sunucuda. Panelin düğmeyi gizlemesi bir
   kolaylıktır; bu testler düğme gizlenmese bile isteğin reddedildiğini
   ölçüyor — saldırgan zaten düğmeye basmıyor, isteği doğrudan atıyor. */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Router } from 'express';
import { uygulamaOlustur } from '../src/app.js';
import { semayiKur, temizle, yoneticiOlustur, cerezAl } from './yardim.js';
import { kapat, sorgu } from '../src/db/pool.js';
import { izinleriGetir } from '../src/services/auth.js';
import { ROLLER, IZIN_ANAHTARLARI, IZINLER } from '../src/services/rbac.js';
import { girisGerekli, izinGerekli, izinlerdenBiri } from '../src/middleware/auth.js';

/* Gerçek uygulamaya, yalnızca test için birkaç korumalı uç nokta ekleniyor.
   Sahte bir Express kurmak yerine GERÇEK middleware zinciri kullanılıyor:
   oturum yükleme, yetki kontrolü, hata biçimi — hepsi üretimdeki hâliyle. */
const deneme = Router();
deneme.get('/publish', girisGerekli, izinGerekli('content.publish'), (_q, r) => r.json({ success: true }));
deneme.get('/refund', girisGerekli, izinGerekli('booking.refund'), (_q, r) => r.json({ success: true }));
deneme.get('/admin', girisGerekli, izinGerekli('admin.manage'), (_q, r) => r.json({ success: true }));
deneme.get('/ikili', girisGerekli, izinGerekli('content.update', 'content.publish'),
  (_q, r) => r.json({ success: true }));
deneme.get('/biri', girisGerekli, izinlerdenBiri('booking.refund', 'content.publish'),
  (_q, r) => r.json({ success: true }));
const app = uygulamaOlustur({ ekRotalar: [{ yol: '/api/admin/_test', rota: deneme }] });

async function girisYapVeCerezAl(rol) {
  const y = await yoneticiOlustur({ rol });
  const cevap = await request(app).post('/api/admin/auth/login')
    .send({ email: y.email, password: y.sifre });
  return { cerez: cerezAl(cevap), kullanici: y };
}

beforeAll(async () => { await semayiKur(); });
beforeEach(async () => { await temizle(); });
afterAll(async () => { await kapat(); });

describe('rol tanımları', () => {
  it('her rolün izni gerçekten tanımlı bir izin', () => {
    /* Yazım hatası olan bir izin adı sessizce HİÇBİR ŞEY yapmaz: rol o
       yetkiye sahip görünür ama middleware onu hiç tanımaz. */
    const tanimli = new Set(IZIN_ANAHTARLARI);
    for (const rol of ROLLER) {
      for (const izin of rol.permissions) {
        if (izin === '*') continue;
        expect(tanimli.has(izin), `${rol.key} rolünde tanımsız izin: ${izin}`).toBe(true);
      }
    }
  });

  it('izin anahtarları tekil ve <alan>.<eylem> biçiminde', () => {
    expect(new Set(IZIN_ANAHTARLARI).size).toBe(IZIN_ANAHTARLARI.length);
    for (const [key] of IZINLER) expect(key, key).toMatch(/^[a-z]+\.[a-z_]+$/);
  });

  it('yalnızca SUPER_ADMIN sınırsız', () => {
    const sinirsiz = ROLLER.filter(r => r.permissions.includes('*'));
    expect(sinirsiz.map(r => r.key)).toEqual(['SUPER_ADMIN']);
  });
});

describe('izin uygulaması', () => {
  it('SUPER_ADMIN bütün izinlere sahip — yeni izin eklenince de', async () => {
    const y = await yoneticiOlustur({ rol: 'SUPER_ADMIN' });
    const izinler = await izinleriGetir(y.id);
    /* '*' çözümü sorgudan geliyor; yeni bir izin eklendiğinde süper
       yöneticiye elle vermeyi unutmak mümkün değil. */
    for (const k of IZIN_ANAHTARLARI) expect(izinler.has(k), k).toBe(true);
  });

  it('EDITOR içerik YAYINLAYAMAZ', async () => {
    const { cerez } = await girisYapVeCerezAl('EDITOR');
    const cevap = await request(app).get('/api/admin/_test/publish').set('Cookie', cerez);
    expect(cevap.status).toBe(403);
    expect(cevap.body.error.code).toBe('FORBIDDEN');
    expect(cevap.body.error.message).toContain('content.publish');
  });

  it('EDITOR ödeme ve yönetici yetkisine erişemez', async () => {
    const { cerez } = await girisYapVeCerezAl('EDITOR');
    expect((await request(app).get('/api/admin/_test/refund').set('Cookie', cerez)).status).toBe(403);
    expect((await request(app).get('/api/admin/_test/admin').set('Cookie', cerez)).status).toBe(403);
  });

  it('CONTENT_MANAGER yayınlayabilir ama iade yapamaz', async () => {
    const { cerez } = await girisYapVeCerezAl('CONTENT_MANAGER');
    expect((await request(app).get('/api/admin/_test/publish').set('Cookie', cerez)).status).toBe(200);
    expect((await request(app).get('/api/admin/_test/refund').set('Cookie', cerez)).status).toBe(403);
  });

  it('RESERVATION_MANAGER iade yapabilir ama yayınlayamaz', async () => {
    const { cerez } = await girisYapVeCerezAl('RESERVATION_MANAGER');
    expect((await request(app).get('/api/admin/_test/refund').set('Cookie', cerez)).status).toBe(200);
    expect((await request(app).get('/api/admin/_test/publish').set('Cookie', cerez)).status).toBe(403);
  });

  it('SUPPORT iade YAPAMAZ', async () => {
    /* Destek ekibi rezervasyonu görür ve not düşer; para iadesi ayrı yetki. */
    const { cerez } = await girisYapVeCerezAl('SUPPORT');
    expect((await request(app).get('/api/admin/_test/refund').set('Cookie', cerez)).status).toBe(403);
  });

  it('birden çok izin istendiğinde HEPSİ gerekiyor', async () => {
    const editor = await girisYapVeCerezAl('EDITOR');           // update var, publish yok
    const yonetici = await girisYapVeCerezAl('CONTENT_MANAGER'); // ikisi de var
    expect((await request(app).get('/api/admin/_test/ikili').set('Cookie', editor.cerez)).status).toBe(403);
    expect((await request(app).get('/api/admin/_test/ikili').set('Cookie', yonetici.cerez)).status).toBe(200);
  });

  it('izinlerdenBiri: herhangi biri yeterli', async () => {
    const icerik = await girisYapVeCerezAl('CONTENT_MANAGER');  // publish var
    const rez = await girisYapVeCerezAl('RESERVATION_MANAGER'); // refund var
    const editor = await girisYapVeCerezAl('EDITOR');           // ikisi de yok
    expect((await request(app).get('/api/admin/_test/biri').set('Cookie', icerik.cerez)).status).toBe(200);
    expect((await request(app).get('/api/admin/_test/biri').set('Cookie', rez.cerez)).status).toBe(200);
    expect((await request(app).get('/api/admin/_test/biri').set('Cookie', editor.cerez)).status).toBe(403);
  });

  it('oturumsuz istek yetki kontrolünden ÖNCE 401 alıyor', async () => {
    const cevap = await request(app).get('/api/admin/_test/publish');
    expect(cevap.status).toBe(401);
  });

  it('rolü alınan kullanıcı yetkisini anında kaybediyor', async () => {
    const { cerez, kullanici } = await girisYapVeCerezAl('CONTENT_MANAGER');
    expect((await request(app).get('/api/admin/_test/publish').set('Cookie', cerez)).status).toBe(200);
    await sorgu('DELETE FROM admin_user_roles WHERE user_id = $1', [kullanici.id]);
    /* İzinler her istekte veritabanından çözülüyor; oturuma gömülmüyor.
       Gömülseydi, yetkisi alınan kişi oturumu boyunca yetkili kalırdı. */
    expect((await request(app).get('/api/admin/_test/publish').set('Cookie', cerez)).status).toBe(403);
  });
});

describe('hata biçimi', () => {
  it('bilinmeyen uç nokta standart biçimde 404 veriyor', async () => {
    const cevap = await request(app).get('/api/admin/boyle-bir-sey-yok');
    expect(cevap.status).toBe(404);
    expect(cevap.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: expect.stringContaining('Uç nokta yok'), fieldErrors: null },
    });
  });

  it('sağlık kontrolü veritabanına gerçekten sorgu atıyor', async () => {
    const cevap = await request(app).get('/api/admin/health');
    expect(cevap.status).toBe(200);
    expect(cevap.body.data.db).toBe('ok');
    expect(typeof cevap.body.data.dbLatencyMs).toBe('number');
  });

  it('rol kataloğu yalnızca admin.manage yetkisiyle görünüyor', async () => {
    const editor = await girisYapVeCerezAl('EDITOR');
    const yonetici = await girisYapVeCerezAl('SUPER_ADMIN');
    expect((await request(app).get('/api/admin/rbac/catalog').set('Cookie', editor.cerez)).status).toBe(403);
    const ok = await request(app).get('/api/admin/rbac/catalog').set('Cookie', yonetici.cerez);
    expect(ok.status).toBe(200);
    expect(ok.body.data.permissions.length).toBe(IZIN_ANAHTARLARI.length);
  });
});
