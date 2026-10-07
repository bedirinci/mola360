/* Şehirler ve şehir sayfaları (SEO mimarisi, docs/seo.md).

   Mola360 önce İzmir'de açılır; öteki şehirler sırası gelince aynı yapıyla
   eklenir (Bedir 2026-10-07). Bir şehir aktif olunca scripts/seo.mjs onun
   sayfa ağacını üretir:
     /izmir/                         şehir: "İzmir'de yapılacaklar"
     /izmir/mekanlar/                şehir + tür
     /izmir/mekanlar/kahvalti/       şehir + tür + özellik
     /izmir/sevgiliyle-yapilacaklar/ şehir + niyet (kiminle)
     /izmir/alsancak/                şehir + bölge
     /izmir/mekanlar/<deneyim>/      deneyimin kendi sayfası
   Kural: sayfa en az ESIK deneyimle yayımlanır; deneyimleri öteki bir
   sayfayla birebir aynı olan sayfa yayımlanmaz (kapı sayfası olmaz). Her
   sayfanın adı ve giriş metni kendine özgüdür (test denetler). */

/* yayımlanacak sayfadaki en az deneyim sayısı */
export const ESIK=3;

/* Türlerin şehir sayfası adresindeki adı */
export const TUR_YOL={tur:'turlar',otel:'oteller',etkinlik:'etkinlikler',aktivite:'aktiviteler',mekan:'mekanlar'};

/* Özelliklerin görünen adı (data.js OZ); aramada ve ürün sayfasında */
export const OZ_AD={kahvalti:'Kahvaltı',balik:'Balık',romantik:'Romantik','deniz-manzarali':'Deniz manzaralı','canli-muzik':'Canlı müzik',
  butik:'Butik',havuzlu:'Havuzlu',konser:'Konser',festival:'Festival',tiyatro:'Tiyatro','tekne-turu':'Tekne turu','su-sporlari':'Su sporları',
  tadim:'Tadım',atolye:'Atölye',gunubirlik:'Günübirlik','yurt-disi':'Yurt dışı',kultur:'Kültür',doga:'Doğa'};

/* Şehirler: ad ve ekli halleri (İzmir'de, İzmir'den), şehir sayfasındaki
   uzun tanıtım. aktif: sayfaları üretilir. */
export const SEHIRLER=[
 {id:'izmir',ad:'İzmir',de:'İzmir\'de',den:'İzmir\'den',aktif:true,bg:'linear-gradient(160deg,#BFDDEB,#4C8DB5 50%,#E9C79A)',
  hakkinda:'İzmir\'de günler denizin etrafında döner. Merkezde Kordon boyunca yürüyüş, Kemeraltı\'nın hanları ve Alsancak\'ın sokakları; yarımadada Urla\'nın bağları, Alaçatı\'nın rüzgârı ve Çeşme\'nin koyları; kuzeyde Foça, güneyde Sığacık ve Şirince. Mola360\'ta bu deneyimleri tarihleri, fiyatları ve yaşayanların paylaşımlarıyla bir arada bulur, doğrudan rezervasyon yaparsın.'}];

/* Şehir sayfaları: [adres (şehrin altında), sayfa adı, süzgeç, giriş, şehir sayfasındaki soru].
   Süzgeç anahtarları liste ile aynı: tur, oz, kimle, yer. Şehir her sayfada
   kendiliğinden eklenir; "yer:'izmir'" yalnızca şehrin içindekiler demek
   (İzmir çıkışlı turlar hariç). */
export const SAYFA={izmir:[
 ['','İzmir\'de yapılacaklar',{},
  'Kordon\'da gün batımından Urla\'nın bağlarına, Kemeraltı\'nın hanlarından Alaçatı\'nın rüzgârına. İzmir\'de bugün, bu hafta sonu ya da tatilde ne yapacağını burada bul.'],

 ['etkinlikler','İzmir etkinlikleri',{tur:'etkinlik'},
  'Kültürpark\'ta açıkhava konserleri, Kordon\'da caz, Saygun Sanat Merkezi\'nde senfoni ve Urla\'da bağbozumu. İzmir\'de bu hafta hangi sahnede ne var, tarihleri ve bilet fiyatlarıyla.',
  'İzmir\'de bu hafta hangi etkinlikler var?'],
 ['mekanlar','İzmir mekânları',{tur:'mekan'},
  'Kemeraltı\'nda han kahvesi, Bostanlı\'da deniz kenarında kahvaltı, Urla\'da balık, Alsancak\'ta canlı müzik. İzmir\'de kahvaltı, yemek ve akşam için seçilmiş mekânlar.'],
 ['oteller','İzmir otelleri',{tur:'otel'},
  'Alsancak\'ta butik bir Rum evinden Alaçatı\'nın taş otellerine, Urla\'da bağ evinden Çeşme\'de denize sıfır bir resorta. İzmir\'de kalacak yer arayanlar için.',
  'İzmir\'de nerede kalınır?'],
 ['aktiviteler','İzmir aktiviteleri',{tur:'aktivite'},
  'Alaçatı\'da sörf dersi, Foça\'da tekne turu, Urla\'da şarap tadımı ve Kemeraltı\'nda lezzet yürüyüşü. İzmir\'de bir günü ya da birkaç saati dolu geçirmek isteyenler için.'],
 ['turlar','İzmir çıkışlı turlar',{tur:'tur'},
  'Efes, Bergama ve Pamukkale\'ye günübirlik; Kapadokya, Karadeniz ve Doğu Ekspresi\'ne yurt içi; Sakız\'dan İtalya\'ya yurt dışı turları. Hepsi İzmir\'den kalkıyor.'],

 ['mekanlar/kahvalti','İzmir kahvaltı mekânları',{tur:'mekan',oz:'kahvalti'},
  'Kemeraltı\'nda han avlusunda, Alaçatı\'da taş avluda, Bostanlı\'da deniz kenarında ve Bornova\'da köşk bahçesinde kahvaltı. Hafta sonu sabahını uzun bir sofrada geçirmek isteyenler için.',
  'İzmir\'de nerede kahvaltı yapılır?'],
 ['mekanlar/balik','İzmir balık restoranları',{tur:'mekan',oz:'balik'},
  'Urla İskele\'de gün batımında, Sığacık\'ta liman kenarında ve Çeşme\'de limana karşı balık ve meze. Ege\'nin balığını denizin kıyısında yemek isteyenler için.',
  'İzmir\'de nerede balık yenir?'],
 ['mekanlar/romantik','İzmir\'de romantik mekânlar',{tur:'mekan',oz:'romantik'},
  'Körfeze bakan bir teras, Urla\'da bağların içinde akşam yemeği, gün batımında balık ve baş başa bir masaj. İkinize özel bir akşam için seçilmiş mekânlar.'],
 ['mekanlar/deniz-manzarali','İzmir deniz manzaralı mekânlar',{tur:'mekan',oz:'deniz-manzarali'},
  'Kordon\'dan körfeze, Bostanlı sahilinden Alaçatı\'nın koyuna; denizi gören masalar. Kahvaltıdan akşam yemeğine, manzarası olan bir yer arayanlar için.'],
 ['mekanlar/canli-muzik','İzmir canlı müzik mekânları',{tur:'mekan',oz:'canli-muzik'},
  'Alsancak\'ta akustik sahne, Kıbrıs Şehitleri\'nde caz ve Kordon\'da fasıl. Akşamı müziği yakından dinleyerek geçirmek isteyenler için.'],
 ['oteller/butik','İzmir butik otelleri',{tur:'otel',oz:'butik'},
  'Alsancak\'ta eski bir Rum evi, Alaçatı\'da taş otel, Şirince\'de köy evi ve Sığacık\'ta kale içinde konaklama. Az odalı, karakteri olan oteller arayanlar için.'],
 ['oteller/havuzlu','İzmir havuzlu oteller',{tur:'otel',oz:'havuzlu'},
  'Çeşme\'de denize sıfır bir resort, Urla\'da bağların içinde havuzlu bir bağ evi ve Balçova\'da termal havuzlu bir otel. Havuz başında dinlenmek isteyenler için.'],
 ['oteller/deniz-manzarali','İzmir deniz manzaralı oteller',{tur:'otel',oz:'deniz-manzarali'},
  'Eski Foça\'da denize elli metrelik bir pansiyon, Bostanlı\'da körfeze bakan odalar ve Ilıca\'da denize sıfır bir resort. Sabaha denize bakarak uyanmak isteyenler için.'],
 ['etkinlikler/konser','İzmir konserleri',{tur:'etkinlik',oz:'konser'},
  'Kültürpark\'ta açıkhava konserleri, Kordon\'da caz akşamları ve Saygun Sanat Merkezi\'nde senfoni. İzmir\'de bu hafta hangi konser var, bilet fiyatlarıyla.'],
 ['etkinlikler/festival','İzmir festivalleri',{tur:'etkinlik',oz:'festival'},
  'Alaçatı sahilinde yaz festivali, Urla\'da bağbozumu şenliği ve Kültürpark\'ta kahve festivali. Gün boyu müzik, tadım ve kalabalık sevenler için.'],
 ['etkinlikler/tiyatro','İzmir tiyatro oyunları',{tur:'etkinlik',oz:'tiyatro'},
  'Konak Sahnesi\'nde akşam oyunları ve Karşıyaka\'da çocuk tiyatrosu. Bir akşamı ya da pazar sabahını sahnenin önünde geçirmek isteyenler için.'],
 ['aktiviteler/tekne-turu','İzmir tekne turları',{tur:'aktivite',oz:'tekne-turu'},
  'Foça\'nın koylarında, Çeşme\'de üç koyda ve körfezde gün batımında tekne turları. Günü güvertede, serin sularda geçirmek isteyenler için.'],
 ['aktiviteler/su-sporlari','İzmir su sporları',{tur:'aktivite',oz:'su-sporlari'},
  'Alaçatı\'da rüzgâr sörfü ve kitesurf dersleri, Sığacık\'ta SUP turu. Ege\'nin rüzgârını ve sakin koylarını sporla yaşamak isteyenler için.'],
 ['aktiviteler/tadim','İzmir\'de tadım ve lezzet turları',{tur:'aktivite',oz:'tadim'},
  'Urla\'nın bağlarında şarap tadımı, Kemeraltı\'nda boyozdan kumruya lezzet yürüyüşü ve Bornova\'da Ege mutfağı atölyesi. İzmir\'i tadıyla tanımak isteyenler için.'],
 ['aktiviteler/atolye','İzmir atölyeleri',{tur:'aktivite',oz:'atolye'},
  'Urla\'da seramik, Kemeraltı\'nda ebru ve Bornova\'da Ege mutfağı atölyesi. Birkaç saatte elinle bir şey yapıp evine götürmek isteyenler için.'],
 ['turlar/gunubirlik','İzmir çıkışlı günübirlik turlar',{tur:'tur',oz:'gunubirlik'},
  'Efes ve Şirince, Bergama ve Asklepion, Pamukkale ve Kemeraltı\'yla Kadifekale. Sabah İzmir\'den çıkıp akşam dönülen rehberli turlar.',
  'İzmir\'den günübirlik nereye gidilir?'],
 ['turlar/yurt-disi','İzmir çıkışlı yurt dışı turları',{tur:'tur',oz:'yurt-disi'},
  'Çeşme\'den Sakız\'a, Dikili\'den Midilli\'ye feribotla; İzmir\'den uçakla Balkanlar\'a, İtalya, İspanya, Fransa ve Dubai\'ye. Vizesi, kalkışı ve programı belli turlar.'],
 ['turlar/kultur','İzmir çıkışlı kültür turları',{tur:'tur',oz:'kultur'},
  'Efes, Bergama ve Hierapolis\'in antik kentleri, Kapadokya\'nın vadileri ve Avrupa\'nın tarihi şehirleri. Gezdiğin yerin hikâyesini rehberden dinlemek isteyenler için.'],
 ['turlar/doga','İzmir çıkışlı doğa turları',{tur:'tur',oz:'doga'},
  'Pamukkale travertenleri, Kapadokya\'nın vadileri, Karadeniz yaylaları ve Doğu Ekspresi\'nin karlı manzarası. Şehirden çıkıp doğada mola vermek isteyenler için.'],

 ['sevgiliyle-yapilacaklar','İzmir\'de sevgiliyle yapılacaklar',{kimle:'sevgili',yer:'izmir'},
  'Körfezde gün batımı tekne turu, Urla\'da bağ sofrası, Kordon\'da caz ve baş başa bir masaj. İzmir\'de ikiniz için sakin ve özenli planlar.',
  'İzmir\'de sevgiliyle ne yapılır?'],
 ['cocuklarla-yapilacaklar','İzmir\'de çocuklarla yapılacaklar',{kimle:'cocuk',yer:'izmir'},
  'Karşıyaka\'da çocuk tiyatrosu, Urla\'da seramik atölyesi, Foça\'da tekne turu ve havuzlu bir otel. Çocuklarla birlikte keyif alınacak, yaşına uygun planlar.',
  'İzmir\'de çocuklarla nereye gidilir?'],
 ['arkadaslarla-yapilacaklar','İzmir\'de arkadaşlarla yapılacaklar',{kimle:'arkadas',yer:'izmir'},
  'Alsancak\'ta canlı müzik, Çeşme\'de tekne turu, Alaçatı\'da sörf ve Kemeraltı\'nda lezzet yürüyüşü. Kalabalık bir grupla eğlenceli bir gün ya da gece için.'],
 ['tek-basina-yapilacaklar','İzmir\'de tek başına yapılacaklar',{kimle:'yalniz',yer:'izmir'},
  'Kemeraltı\'nda rehberli bir yürüyüş, Urla\'da seramik atölyesi, senfoni gecesi ya da Alaçatı\'da sörf dersi. Kendine ayırdığın bir gün için İzmir\'de yapılacaklar.'],

 ['alsancak','Alsancak\'ta yapılacaklar',{yer:'alsancak'},
  'Kordon\'da caz ve gün batımı tekne turu, Kıbrıs Şehitleri\'nde canlı müzik, masaj ve butik bir otel. İzmir\'in en canlı semtinde gece gündüz yapılacaklar.'],
 ['kemeralti','Kemeraltı\'nda yapılacaklar',{yer:'kemeralti'},
  'Tarihi hanlarda kahve, boyozdan kumruya lezzet yürüyüşü, ebru atölyesi ve Kadifekale\'ye uzanan şehir turu. İzmir\'in en eski çarşısında bir gün.'],
 ['konak','Konak\'ta yapılacaklar',{yer:'konak'},
  'Alsancak ve Kemeraltı\'nın yanında Kültürpark\'ta konserler, Saygun Sanat Merkezi\'nde senfoni ve Karataş\'ta körfeze bakan bir teras. İzmir\'in merkezinde yapılacaklar.'],
 ['karsiyaka','Karşıyaka\'da yapılacaklar',{yer:'karsiyaka'},
  'Bostanlı sahilinde kahvaltı, körfez manzaralı bir otel ve çocuk tiyatrosu. Karşı yakada sakin bir gün geçirmek isteyenler için.'],
 ['bornova','Bornova\'da yapılacaklar',{yer:'bornova'},
  'Tarihi bir köşk bahçesinde kahvaltı, stand up gecesi ve Ege mutfağı atölyesi. Bornova\'da gündüz ve akşam için planlar.'],
 ['urla','Urla\'da yapılacaklar',{yer:'urla'},
  'Bağ yolunda şarap tadımı ve bağbozumu şenliği, iskelede balık, seramik atölyesi ve bağların içinde bir otel. İzmir\'in bağ ve sanat ilçesinde yapılacaklar.',
  'Urla\'da ne yapılır?'],
 ['cesme','Çeşme\'de yapılacaklar',{yer:'cesme'},
  'Alaçatı\'da sörf ve beach club, Çeşme limanında meyhane, koylarda tekne turu ve Ilıca\'da denize sıfır bir resort. Yarımadada deniz, rüzgâr ve gece hayatı.'],
 ['alacati','Alaçatı\'da yapılacaklar',{yer:'alacati'},
  'Rüzgâr sörfü ve kitesurf dersleri, taş avluda kahvaltı, beach club, yaz festivali ve taş bir otel. Alaçatı\'nın rüzgârında ve dar sokaklarında bir hafta sonu.',
  'Alaçatı\'da ne yapılır?'],
 ['seferihisar','Seferihisar\'da yapılacaklar',{yer:'seferihisar'},
  'Sığacık\'ta liman kenarında balık, kale içinde konaklama ve sakin koyda SUP turu. Seferihisar\'da yavaş ve sakin bir gün.'],
 ['foca','Foça\'da yapılacaklar',{yer:'foca'},
  'Eski Foça\'da tekne turu ve denize elli metrelik bir pansiyon. Siren Kayalıkları\'nın kasabasında sakin bir hafta sonu.'],
 ['selcuk','Selçuk ve Şirince\'de yapılacaklar',{yer:'selcuk'},
  'Efes Antik Kenti\'nde rehberli tur ve Şirince\'de taş bir köy evinde konaklama. Antik kentle köyü aynı hafta sonuna sığdırmak isteyenler için.'],
 ['balcova','Balçova\'da yapılacaklar',{yer:'balcova'},
  'Termal havuzlu bir otel ve hamamda kese. Balçova\'nın sıcak sularında yorgunluk atmak isteyenler için.']
]};
