import { Router } from 'express';
import { authRouter } from './auth.js';
import { yakala } from '../middleware/error.js';
import { sorgu } from '../db/pool.js';
import { IZINLER, ROLLER } from '../services/rbac.js';
import { girisGerekli, izinGerekli } from '../middleware/auth.js';

export const apiRouter = Router();

/* Sağlık kontrolü: yük dengeleyici ve deploy betiği bunu yoklar.
   Veritabanına gerçekten sorgu atıyor — sadece "süreç ayakta" demek,
   veritabanı düşmüşken de 200 döndürür ve arızayı gizler. */
apiRouter.get('/health', yakala(async (_req, res) => {
  const baslangic = Date.now();
  await sorgu('SELECT 1');
  res.json({
    success: true,
    data: { status: 'ok', db: 'ok', dbLatencyMs: Date.now() - baslangic, uptimeSec: Math.round(process.uptime()) },
  });
}));

apiRouter.use('/auth', authRouter);

/* Rol ve izin kataloğu — panelin rol ekranı buradan besleniyor. */
apiRouter.get('/rbac/catalog', girisGerekli, izinGerekli('admin.manage'), (_req, res) => {
  res.json({
    success: true,
    data: {
      permissions: IZINLER.map(([key, group, description]) => ({ key, group, description })),
      roles: ROLLER.map(r => ({ key: r.key, name: r.name, description: r.description,
                                permissions: r.permissions })),
    },
  });
});
