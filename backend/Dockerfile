# Çok aşamalı değil: bu bir Node servisi, derlenecek bir şey yok.
# Yine de bağımlılıklar ayrı katmanda kuruluyor ki kaynak değiştiğinde
# npm ci yeniden çalışmasın.
FROM node:22-alpine

# dumb-init: PID 1 olarak çalışan Node, SIGTERM'i düzgün almıyor ve
# kapanış sırasında devam eden istekler kesiliyor.
RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts

# Kök olmayan kullanıcı: kapta kök çalıştırmak, bir açık bulunduğunda
# kapın tamamını saldırgana verir.
USER node

ENV NODE_ENV=production
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=4s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/admin/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
