/* Tek hata biçimi.

   API'nin döndüğü her hata aynı gövdeye sahip:
     { success: false, error: { code, message, fieldErrors } }

   Neden: istemci tarafında her uç nokta için ayrı hata ayrıştırma yazmak,
   er ya da geç bir yerde ham bir hata metninin kullanıcıya gösterilmesiyle
   bitiyor. Tek biçim, tek işleme yolu.

   BEKLENEN hata (AppError) ile BEKLENMEYEN hatayı (bir TypeError, bir SQL
   hatası) ayırıyoruz: beklenen hatanın mesajı kullanıcıya gösterilir,
   beklenmeyen hatanın mesajı GÖSTERİLMEZ — veritabanı şeması, dosya yolu
   veya sorgu metni sızdırabilir. */

export class AppError extends Error {
  constructor(code, message, { status = 400, fieldErrors = null, cause = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
    if (cause) this.cause = cause;
  }
}

export const hata = {
  gecersizIstek: (mesaj = 'İstek geçersiz.', fieldErrors = null) =>
    new AppError('VALIDATION_ERROR', mesaj, { status: 422, fieldErrors }),
  kimlikYok: (mesaj = 'Oturum açmanız gerekiyor.') =>
    new AppError('UNAUTHENTICATED', mesaj, { status: 401 }),
  yetkiYok: (mesaj = 'Bu işlem için yetkiniz yok.') =>
    new AppError('FORBIDDEN', mesaj, { status: 403 }),
  bulunamadi: (mesaj = 'Kayıt bulunamadı.') =>
    new AppError('NOT_FOUND', mesaj, { status: 404 }),
  cakisma: (mesaj = 'Kayıt başka bir kayıtla çakışıyor.') =>
    new AppError('CONFLICT', mesaj, { status: 409 }),
  cokFazlaIstek: (mesaj = 'Çok fazla deneme yapıldı. Biraz bekleyin.') =>
    new AppError('RATE_LIMITED', mesaj, { status: 429 }),
  kilitli: (mesaj = 'Hesap geçici olarak kilitlendi.') =>
    new AppError('ACCOUNT_LOCKED', mesaj, { status: 423 }),
  sunucu: (mesaj = 'Beklenmeyen bir hata oluştu.', cause = null) =>
    new AppError('INTERNAL_ERROR', mesaj, { status: 500, cause }),
};

/* PostgreSQL hata kodlarını anlaşılır API hatasına çeviriyor. Ham SQL
   hatasını kullanıcıya göstermek hem anlaşılmaz hem de şema sızdırır. */
export function pgHatasiniCevir(e) {
  if (!e || !e.code) return null;
  switch (e.code) {
    case '23505':   // unique_violation
      return hata.cakisma('Bu kayıt zaten var.');
    case '23503':   // foreign_key_violation
      return hata.gecersizIstek('Bağlı bir kayıt bulunamadı veya hâlâ kullanımda.');
    case '23514':   // check_violation — envanter ve durum makinesi buradan geçer
      return hata.gecersizIstek(
        e.message && e.message.includes('Gecersiz rezervasyon durum gecisi')
          ? 'Bu rezervasyon durumuna buradan geçilemez.'
          : 'Değer iş kuralına uymuyor.');
    case '23502':   // not_null_violation
      return hata.gecersizIstek('Zorunlu bir alan boş bırakılmış.');
    case '40001':   // serialization_failure
    case '40P01':   // deadlock_detected
      return hata.cakisma('Aynı kayıt üzerinde eşzamanlı işlem var, tekrar deneyin.');
    default:
      return null;
  }
}
