import { useEffect, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, Tags, Clock, Shield, PenSquare, User, DollarSign, Truck, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'account' | 'barter' | 'safety' | 'support';
}

export default function FAQ() {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const faqItems: FAQItem[] = [
    // Ümumi suallar
    {
      id: 'what-is-bartertap',
      question: 'BarterTap.az nədir?',
      answer: 'BarterTap.az Azərbaycanda ilk onlayn barter platformasıdır. İstifadəçilər öz əşyalarını pulsuz olaraq platformaya yerləşdirib digər maraqlı əşyalarla dəyişdirə bilərlər. Pul ödəməklə deyil, sadəcə əşya dəyişməklə ehtiyacınız olan şeylərə sahib ola bilərsiniz.',
      category: 'general'
    },
    {
      id: 'is-bartertap-free',
      question: 'BarterTap.az-dan istifadə pulsuzdur?',
      answer: 'Bəli, BarterTap.az-dan əsas istifadə tamamilə pulsuzdur. Elanların yerləşdirilməsi, axtarış, mesajlaşma və barter əməliyyatları üçün heç bir ödəniş tələb olunmur. Yalnız premium funksiyalar (VIP elanlar, xüsusi nişanlar və s.) ödənişlidir.',
      category: 'general'
    },
    {
      id: 'bartertap-vs-sales',
      question: 'Barter etmək satmaqdan nə ilə fərqlənir?',
      answer: 'Barter etmək əşyanızı pul qarşılığında satmaq əvəzinə, digər sizə lazım olan əşya ilə dəyişmək deməkdir. Bu, əlavə pul xərcləmədən lazım olan əşyalara sahib olmağın əla yoludur. Həmçinin istifadə etmədiyiniz əşyaları faydalı bir şeyə çevirmək imkanı yaradır.',
      category: 'general'
    },

    // Hesab ilə bağlı suallar
    {
      id: 'create-account',
      question: 'Hesab necə yaradılır?',
      answer: 'Hesab yaratmaq üçün saytın yuxarı sağ küncündəki "Qeydiyyat" düyməsinə klikləyin. E-poçt ünvanınızı, istifadəçi adınızı və şifrənizi daxil edin. Hesabınızı təsdiqləmək üçün e-poçtunuza göndərilən linkə keçid edin və qeydiyyatı tamamlayın.',
      category: 'account'
    },
    {
      id: 'change-profile-info',
      question: 'Profil məlumatlarımı necə dəyişə bilərəm?',
      answer: 'Profil məlumatlarınızı dəyişmək üçün hesabınıza daxil olun, sağ yuxarı küncündə adınıza klikləyin və "Profil" seçin. Açılan səhifədə "Profili redaktə et" düyməsinə klikləyib məlumatlarınızı yeniləyə bilərsiniz.',
      category: 'account'
    },
    {
      id: 'delete-account',
      question: 'Hesabımı necə silə bilərəm?',
      answer: 'Hesabınızı silmək üçün profil səhifəsində "Parametrlər" bölməsinə keçin. Səhifənin aşağısında "Hesabı sil" seçimini tapıb klikləyin. Silinmə səbəbini qeyd edib, şifrənizi daxil edərək təsdiqləyin. Nəzərə alın ki, hesabınız silindikdən sonra bütün məlumatlarınız silinəcək və bu əməliyyat geri qaytarıla bilməz.',
      category: 'account'
    },

    // Barter prosesi haqqında suallar
    {
      id: 'how-to-add-item',
      question: 'Əşya elanı necə yerləşdirilir?',
      answer: 'Əşya elanı yerləşdirmək üçün hesabınıza daxil olun və "Elan yerləşdir" düyməsinə klikləyin. Əşyanızın şəkillərini, adını, təsvirini, kateqoriyasını, vəziyyətini və nə ilə dəyişmək istədiyinizi qeyd edin. Bütün məlumatları doldurduqdan sonra "Yerləşdir" düyməsinə basın.',
      category: 'barter'
    },
    {
      id: 'how-to-make-offer',
      question: 'Barter təklifi necə edilir?',
      answer: 'Maraqlandığınız əşyanın səhifəsinə keçid edib "Təklif et" düyməsinə klikləyin. Açılan pəncərədə təklif etmək istədiyiniz öz əşyanızı seçin və əlavə qeydlərinizi yazın. Daha sonra "Təklif göndər" düyməsinə basın. Əşya sahibi təklifinizi qəbul edərsə, sizinlə əlaqə saxlayacaq.',
      category: 'barter'
    },
    {
      id: 'accepted-offer',
      question: 'Təklifim qəbul edildikdən sonra nə baş verir?',
      answer: 'Təklifiniz qəbul edildikdən sonra sistem avtomatik olaraq sizi və əşya sahibini bir mesajlaşma qrupuna daxil edir. Bu qrupda görüş yeri və vaxtı, əlavə şərtlər və sair məsələləri müzakirə edə bilərsiniz. Barter tamamlandıqdan sonra hər iki tərəf prosesi platformada təsdiqləməlidir.',
      category: 'barter'
    },
    {
      id: 'cancel-offer',
      question: 'Təklifimi necə geri götürə bilərəm?',
      answer: 'Hələ qəbul edilməmiş təklifinizi geri götürmək üçün profil səhifənizdəki "Təkliflərim" bölməsinə keçin. Geri götürmək istədiyiniz təklifin sağındakı "Ləğv et" düyməsinə klikləyin və əməliyyatı təsdiqləyin. Qəbul edilmiş təklifləri ləğv etmək üçün isə qarşı tərəflə razılığa gəlməlisiniz.',
      category: 'barter'
    },

    // Təhlükəsizlik sualları
    {
      id: 'safe-barter',
      question: 'Barter prosesini təhlükəsiz etmək üçün nə etməliyəm?',
      answer: 'Təhlükəsiz barter üçün: 1) İctimai yerlərdə görüşün; 2) Əşyanı diqqətlə yoxlayın; 3) Şübhəli təkliflərdən çəkinin; 4) Əşya haqqında bütün məlumatları əvvəlcədən soruşun; 5) Platformada müsbət rəy almış istifadəçilərə üstünlük verin; 6) Barter prosesini platformada rəsmiləşdirin ki, problem yaranarsa müdaxilə edə bilək.',
      category: 'safety'
    },
    {
      id: 'report-user',
      question: 'Şübhəli istifadəçini necə şikayət edə bilərəm?',
      answer: 'Şübhəli istifadəçini şikayət etmək üçün onların profil səhifəsində və ya elanında "Şikayət et" düyməsinə klikləyin. Açılan formada şikayət səbəbini seçin və ətraflı izah yazın. Mümkünsə, şikayətinizi təsdiqləyən sübutlar (şəkil, mesaj və s.) da əlavə edin. Şikayətiniz 24 saat ərzində moderatorlar tərəfindən araşdırılacaq.',
      category: 'safety'
    },
    {
      id: 'verify-account',
      question: 'Hesabımı necə təsdiq edə bilərəm?',
      answer: 'Hesabınızı təsdiq etmək üçün profil səhifənizdə "Hesabı təsdiqlə" düyməsinə klikləyin. Telefon nömrənizi daxil edin və sizə göndərilən SMS kodu ilə təsdiqləyin. Daha yüksək səviyyəli təsdiq üçün şəxsiyyət vəsiqənizin şəklini sistemə yükləməlisiniz. Təsdiqlənmiş hesablar daha çox etibarlı sayılır və daha çox təklif alır.',
      category: 'safety'
    },

    // Dəstək sualları
    {
      id: 'contact-support',
      question: 'Dəstək xidməti ilə necə əlaqə saxlaya bilərəm?',
      answer: 'Dəstək xidməti ilə əlaqə saxlamaq üçün saytın aşağı hissəsində "Dəstək" linkini klikləyin və ya support@bartertap.az e-poçt ünvanına yazın. Həmçinin canlı dəstək funksiyasından da istifadə edə bilərsiniz. İş saatlarımız həftə içi 09:00-18:00 arasındadır. Sorğunuza ən geci 24 saat ərzində cavab veriləcək.',
      category: 'support'
    },
    {
      id: 'fee-refund',
      question: 'Ödənişli xidmətlərdən pulumu geri ala bilərəmmi?',
      answer: 'Ödənişli xidmətlərdən istifadə etdikdən sonra, xidmət göstərildiyinə görə, adətən geri ödəniş edilmir. Lakin, əgər texniki problemlər səbəbindən xidmət düzgün işləməyibsə və ya istifadə edə bilməmisinizsə, dəstək xidmətinə müraciət edərək geri ödəniş tələb edə bilərsiniz. Hər bir hal ayrıca araşdırılır.',
      category: 'support'
    },
    {
      id: 'prohibited-items',
      question: 'Hansı əşyaları platformada yerləşdirmək qadağandır?',
      answer: 'Platformada qanunsuz mallar, silahlar, təhlükəli maddələr, dərman preparatları, alkohol və tütün məhsulları, heyvanlar, seksual məzmunlu məhsullar, saxta mallar, hüququ qorunan məzmunlar və lisenziyasız proqram təminatlarının yerləşdirilməsi qadağandır. Tam siyahı üçün istifadəçi razılaşmasını oxuyun.',
      category: 'support'
    },
  ];

  // Filter FAQ items based on search query and category
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === null || item.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group FAQ items by category for counting
  const categoryCounts = {
    'general': faqItems.filter(item => item.category === 'general').length,
    'account': faqItems.filter(item => item.category === 'account').length,
    'barter': faqItems.filter(item => item.category === 'barter').length,
    'safety': faqItems.filter(item => item.category === 'safety').length,
    'support': faqItems.filter(item => item.category === 'support').length,
  };

  const categories = [
    { id: 'general', name: 'Ümumi', icon: <HelpCircle className="h-5 w-5" /> },
    { id: 'account', name: 'Hesab', icon: <User className="h-5 w-5" /> },
    { id: 'barter', name: 'Barter', icon: <Tags className="h-5 w-5" /> },
    { id: 'safety', name: 'Təhlükəsizlik', icon: <Shield className="h-5 w-5" /> },
    { id: 'support', name: 'Dəstək', icon: <HelpCircle className="h-5 w-5" /> },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Tez-tez soruşulan suallar</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          BarterTap.az platforması haqqında ən çox soruşulan suallar və cavablar
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Sual axtar..."
          className="pl-10 pr-4 py-2 border-gray-200 focus:border-primary focus:ring-primary"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
            activeCategory === null 
              ? 'bg-primary text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setActiveCategory(null)}
        >
          <Clock className="h-4 w-4" />
          <span>Bütün ({faqItems.length})</span>
        </button>
        
        {categories.map(category => (
          <button
            key={category.id}
            className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
              activeCategory === category.id 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveCategory(category.id as any)}
          >
            {category.icon}
            <span>{category.name} ({categoryCounts[category.id as keyof typeof categoryCounts]})</span>
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
      >
        {filteredFAQs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {filteredFAQs.map((faq) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AccordionItem value={faq.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  <AccordionTrigger className="px-4 py-4 hover:bg-gray-50 hover:no-underline font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-4 bg-gray-50 text-gray-700">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-10">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Heç bir sual tapılmadı</h3>
            <p className="text-gray-500">
              Axtarış sorğunuza uyğun sual tapılmadı. Başqa açar sözlər sınayın və ya bütün kateqoriyaları göstərmək üçün filtri sıfırlayın.
            </p>
          </div>
        )}
      </motion.div>

      {/* Still have questions */}
      <div className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Sualınız hələ də cavablanmayıb?</h2>
        <p className="text-gray-700 mb-4">
          Dəstək komandamızla əlaqə saxlayın - sizə kömək etməkdən məmnun olarıq!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
          <a href="mailto:support@bartertap.az" className="flex items-center justify-center gap-2 bg-white text-primary border border-primary/20 rounded-full px-6 py-2 hover:bg-primary/5 transition-colors">
            <PenSquare className="h-5 w-5" />
            <span>E-poçt yaz</span>
          </a>
          <a href="tel:+994501234567" className="flex items-center justify-center gap-2 bg-primary text-white rounded-full px-6 py-2 hover:bg-primary/90 transition-colors">
            <HelpCircle className="h-5 w-5" />
            <span>Zəng et</span>
          </a>
        </div>
      </div>
    </div>
  );
}