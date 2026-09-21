/* Test ortamı. Ayrı bir veritabanı kullanıyor (mola360_test) ki geliştirme
   verisi silinmesin. Ortam değişkenleri config okunmadan ÖNCE kurulmalı. */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  || 'postgres://mola360:mola360@127.0.0.1:5432/mola360_test';
process.env.SESSION_SECRET = 'test-icin-yeterince-uzun-bir-sir-degeri';
process.env.LOG_LEVEL = 'silent';
process.env.COOKIE_SECURE = 'false';
