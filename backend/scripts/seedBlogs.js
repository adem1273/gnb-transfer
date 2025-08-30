const mongoose = require('mongoose');
require('dotenv').config();

const Blog = require('../models/blogModel');
const connectDB = require('../config/database');

const blogPosts = [
  {
    title: 'İstanbul’da Mutlaka Görülmesi Gereken 10 Yer',
    content: `İstanbul, tarihi ve kültürel zenginlikleriyle her gezginin rüyasıdır. Bizimle birlikte İstanbul'un en özel yerlerini keşfedin. Turumuz, sizi büyüleyici Ayasofya'dan, görkemli Topkapı Sarayı'na ve eşsiz Kapalıçarşı'ya götürecektir. GNB Transfer güvencesiyle bu turlar, şehrin karmaşasından uzak, konforlu bir deneyim sunar.`,
  },
  {
    title: 'Bursa ve Uludağ’da Kışın Tadını Çıkarın',
    content: `Kış sporları tutkunları için Bursa ve Uludağ mükemmel bir destinasyondur. GNB Transfer'in özel Uludağ turu ile zirveye konforlu bir şekilde ulaşın. Turumuz, sadece kayak ve snowboard imkanı sunmakla kalmaz, aynı zamanda şehrin tarihi yerlerini ve İskender kebabını keşfetme fırsatı verir.`,
  },
  {
    title: 'Türkiye’nin En İyi Balayı Rotaları: Aşk ve Macera',
    content: `Yeni evliler için unutulmaz bir balayı deneyimi planlıyorsanız, Türkiye'nin sunduğu romantik ve macera dolu rotalara göz atın. Kapadokya'nın balon turları, Fethiye'nin turkuaz koyları veya Antalya'nın lüks otelleri. GNB Transfer, hayalinizdeki balayı turu için kişiye özel planlama ve konforlu ulaşım hizmetleri sunar.`,
  },
  {
    title: 'Kapadokya: Peribacalarının Büyülü Dünyası',
    content: `Doğal güzellikleriyle dünya mirası olan Kapadokya, benzersiz kaya oluşumları ve yeraltı şehirleriyle masalsı bir deneyim sunar. GNB Transfer ile gerçekleştireceğiniz Kapadokya turunda, balonla gökyüzünde süzülecek, kayadan oyma kiliseleri ziyaret edecek ve bölgenin tarihi dokusunu hissedeceksiniz.`,
  },
  {
    title: 'Pamukkale ve Efes Antik Kenti Turu: Tarih ve Doğa İç İçe',
    content: `Antik dünyanın en önemli merkezlerinden Efes ve doğa harikası Pamukkale travertenleri tek bir turda. GNB Transfer'in özel olarak hazırladığı bu tur, tarihe bir yolculuk yapmanızı sağlarken, Pamukkale'nin şifalı sularında dinlenme fırsatı sunar.`,
  },
  {
    title: 'Karadeniz’in Yeşil Cenneti: Trabzon ve Uzungöl',
    content: `Yemyeşil doğası, yaylaları ve eşsiz kültürüyle Karadeniz, doğaseverler için eşsiz bir rotadır. Trabzon ve Uzungöl turlarımız, GNB Transfer'in konforlu araçlarıyla Uzungöl'ün huzurlu atmosferini ve Ayder Yaylası'nın muhteşem manzaralarını keşfetmenizi sağlar.`,
  },
  {
    title: 'Türkiye’de Yaz Turizmi: En İyi Plajlar ve Aktiviteler',
    content: `Türkiye, Ege ve Akdeniz kıyılarında yer alan dünyaca ünlü plajlarıyla yaz tatili için ideal bir ülkedir. Bodrum, Fethiye ve Marmaris gibi popüler destinasyonlara GNB Transfer'in özel transfer hizmetleriyle hızlıca ulaşın. Turlarımız, su sporları, tekne gezileri ve daha fazlasını içeren zengin programlar sunar.`,
  },
  {
    title: 'Ege’nin İncisi: İzmir ve Çeşme Turları',
    content: `Tarihi dokusu, canlı sosyal yaşamı ve muhteşem koylarıyla İzmir, Ege'nin parlayan yıldızıdır. GNB Transfer'in Çeşme ve Alaçatı turları ile bu bölgenin eşsiz güzelliklerini ve rüzgar sörfü gibi aktivitelerini keşfedin.`,
  },
  {
    title: 'Konya’nın Gizemi: Mevlana ve Hoşgörü',
    content: `Manevi bir yolculuğa çıkmak isteyenler için Konya, Mevlana'nın öğretileri ve huzurlu atmosferiyle eşsiz bir destinasyondur. GNB Transfer'in özel turları, sizi Mevlana Müzesi'ne götürür ve şehrin derin tarihi hakkında rehberlik sunar.`,
  },
  {
    title: 'Doğal Güzelliklerin Kalbi: Göreme ve Ihlara Vadisi',
    content: `Kapadokya'nın kalbinde yer alan Göreme ve Ihlara Vadisi, yürüyüş ve fotoğraf tutkunları için idealdir. GNB Transfer'in uzman rehberli turlarıyla bu doğal güzellikleri en iyi şekilde deneyimleyin ve unutulmaz anılar biriktirin.`,
  },
  {
    title: 'Türkiye’nin Kültür Başkenti: Ankara ve Çevresi',
    content: `Başkent Ankara, tarihi ve modern yapısıyla zengin bir kültürel deneyim sunar. GNB Transfer, Anıtkabir ve diğer önemli anıtları kapsayan turlarımızla, şehrin tarihi ve politik önemini keşfetmenizi sağlar.`,
  },
  {
    title: 'Kışın Efsane Rotası: Kars ve Doğu Ekspresi',
    content: `Macera arayanlar için Kars ve Doğu Ekspresi, Türkiye'nin kış turizmindeki en popüler rotasıdır. GNB Transfer, tura başlamadan önce havaalanından otelinize konforlu bir transfer hizmeti sunar. Turumuzla tarihi Kars Kalesi'ni ve doğal güzellikleri keşfedin.`,
  },
  {
    title: 'Gizemli Yeraltı Şehri: Derinkuyu ve Kaymaklı',
    content: `Kapadokya'nın en etkileyici yerlerinden olan yeraltı şehirleri, binlerce yıl önce insanlar tarafından korunmak için yapılmıştır. GNB Transfer, bu gizemli yapıları keşfetmenize yardımcı olacak rehberli turlar sunar.`,
  },
  {
    title: 'Antalya: Güneşin ve Denizin Başkenti',
    content: `Muhteşem plajları, tarihi limanı ve antik kentleriyle Antalya, yaz turizminin vazgeçilmezidir. GNB Transfer, havaalanından otelinize en konforlu transferi sağlar ve bölgedeki en iyi turları organize eder.`,
  },
  {
    title: 'Adana: Eşsiz Lezzetlerin Şehri',
    content: `Türkiye'nin gurme şehirlerinden Adana, yöresel yemekleri ve kültürüyle ziyaretçilerini büyüler. GNB Transfer, Adana turunuz için tüm ulaşım ihtiyaçlarınızı karşılar ve şehrin en iyi mekanlarını keşfetmenizi sağlar.`,
  },
  {
    title: 'Doğa ve Macera: Fethiye’nin Gizli Koyları',
    content: `Fethiye, yamaç paraşütü ve tekne turları için ideal bir destinasyondur. GNB Transfer, bu adrenalin dolu maceralar için ulaşımınızı düzenler ve en güvenli deneyimi sunar.`,
  },
  {
    title: 'Konforlu Seyahat: Havaalanı Transferinin Önemi',
    content: `Uzun bir uçuştan sonra otelinize ulaşmak stresli olabilir. GNB Transfer, havalimanı transfer hizmetiyle bu stresi ortadan kaldırır. Konforlu ve güvenilir araçlarımızla direkt olarak gitmek istediğiniz yere ulaşın.`,
  },
  {
    title: 'İzmir Havaalanı Transfer Hizmeti: Hızlı ve Güvenilir',
    content: `İzmir'e vardığınızda, GNB Transfer'in profesyonel havalimanı transfer hizmeti ile beklemeksizin otelinize ulaşın.`,
  },
  {
    title: 'Bursa Gezilecek Yerler Turu: En Çok Tercih Edilen Rotalar',
    content: `Bursa'nın tarihi dokusunu ve doğal güzelliklerini keşfetmek için en popüler rotaları bir araya getirdik. GNB Transfer'in konforlu tur araçlarıyla tüm önemli yerleri rahatça ziyaret edin.`,
  },
  {
    title: 'Seyahat Öncesi Kontrol Listesi: Unutulmaması Gerekenler',
    content: `Seyahatinizden önce, GNB Transfer olarak sizin için küçük bir kontrol listesi hazırladık. Pasaport, bilet ve konaklama bilgileriniz kadar, havalimanı transferinizi önceden organize etmeyi de unutmayın.`,
  },
];

const seedBlogs = async () => {
  await connectDB();
  try {
    await Blog.deleteMany({});
    console.log('Mevcut blog yazıları temizlendi.');

    await Blog.insertMany(blogPosts);
    console.log('Yeni blog yazıları eklendi.');
  } catch (error) {
    console.error('Blog verisi eklenirken hata oluştu:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedBlogs();