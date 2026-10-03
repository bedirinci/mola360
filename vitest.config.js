import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /* Kök testler YALNIZCA v2'ye ait (tests/). Klasik sitenin testleri
       arsiv/klasik/tests/ altında duruyor ve çalıştırılmıyor. Backend'in
       kendi test kurulumu var ve GERÇEK bir PostgreSQL gerektiriyor; buradan
       çalıştırılırsa veritabanı olmayan bir ortamda dosya seviyesinde
       hata verir. İki paket, iki `npm test` — ikisini de CI koşuyor
       (.github/workflows/ci.yml). */
    include: ['tests/**/*.test.js'],
    exclude: ['backend/**', 'node_modules/**', 'arsiv/**'],
  },
});
