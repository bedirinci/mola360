import { Router } from 'express';
import { z } from 'zod';
import { girisYap, cikisYap, profilGetir, tumOturumlariKapat,
         COOKIE_ADI, cerezSecenekleri } from '../services/auth.js';
import { govdeDogrula } from '../middleware/validate.js';
import { girisGerekli } from '../middleware/auth.js';
import { girisSiniri } from '../middleware/rate-limit.js';
import { yakala } from '../middleware/error.js';
import { denetimYaz } from '../services/audit.js';
import { sifreOzetle, sifreDogrula } from '../lib/password.js';
import { sorgu } from '../db/pool.js';
import { hata } from '../lib/errors.js';

export const authRouter = Router();

const girisSemasi = z.object({
  email: z.string().email('Geçerli bir e-posta girin').max(320),
  password: z.string().min(1, 'Şifre boş olamaz').max(200),
});

authRouter.post('/login', girisSiniri, govdeDogrula(girisSemasi), yakala(async (req, res) => {
  const { jeton, kullanici } = await girisYap({
    email: req.body.email,
    password: req.body.password,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  res.cookie(COOKIE_ADI, jeton, cerezSecenekleri());
  res.json({ success: true, data: kullanici });
}));

authRouter.post('/logout', girisGerekli, yakala(async (req, res) => {
  await cikisYap(req.user.sessionId);
  res.clearCookie(COOKIE_ADI, { ...cerezSecenekleri(), maxAge: undefined });
  res.json({ success: true, data: { loggedOut: true } });
}));

authRouter.get('/me', girisGerekli, yakala(async (req, res) => {
  res.json({ success: true, data: await profilGetir(req.user.id) });
}));

const sifreSemasi = z.object({
  currentPassword: z.string().min(1),
  /* En az 10 karakter: bu bir yönetim paneli, 8 karakterlik bir alt sınır
     bugünkü donanımda yeterli değil. */
  newPassword: z.string().min(10, 'Yeni şifre en az 10 karakter olmalı').max(200),
});

authRouter.post('/change-password', girisGerekli, govdeDogrula(sifreSemasi),
  yakala(async (req, res) => {
    const { rows } = await sorgu('SELECT password_hash FROM admin_users WHERE id = $1', [req.user.id]);
    if (!rows[0] || !await sifreDogrula(req.body.currentPassword, rows[0].password_hash)) {
      throw hata.kimlikYok('Mevcut şifre hatalı.');
    }
    await sorgu('UPDATE admin_users SET password_hash = $2 WHERE id = $1',
      [req.user.id, await sifreOzetle(req.body.newPassword)]);

    /* Şifre değişince BÜTÜN oturumlar kapanır — çalınmış bir oturumun
       şifre değişikliğinden sonra yaşamaya devam etmesi kabul edilemez.
       Kullanıcının kendi oturumu da kapanır; yeniden giriş yapar. */
    await tumOturumlariKapat(req.user.id, req.user.id);
    await denetimYaz(req, {
      action: 'admin.password_changed', entityType: 'admin_user',
      entityId: req.user.id, force: true,
    });
    res.clearCookie(COOKIE_ADI, { ...cerezSecenekleri(), maxAge: undefined });
    res.json({ success: true, data: { passwordChanged: true, sessionsRevoked: true } });
  }));

authRouter.get('/sessions', girisGerekli, yakala(async (req, res) => {
  const { rows } = await sorgu(
    `SELECT id, ip, user_agent, created_at, last_seen_at, expires_at,
            (id = $2) AS current
       FROM admin_sessions
      WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
      ORDER BY last_seen_at DESC`, [req.user.id, req.user.sessionId]);
  res.json({ success: true, data: rows });
}));
