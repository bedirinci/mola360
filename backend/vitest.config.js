import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /* Testler GERÇEK PostgreSQL'e karşı koşuyor, sahte bir katmana değil.
       Sahte veritabanıyla test etmek, tam da bu şemanın en kritik
       güvencelerini (CHECK kısıtları, GENERATED sütunlar, durum makinesi
       tetikleyicisi) test DIŞINDA bırakırdı. */
    environment: 'node',
    /* Aynı veritabanını paylaşan dosyalar birbirinin verisini silmesin. */
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 20000,
    hookTimeout: 40000,
    setupFiles: ['./tests/setup.js'],
  },
});
