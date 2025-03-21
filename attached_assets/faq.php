<?php
// Tez-tez soruşulan suallar səhifəsi
require_once 'includes/config.php';

// Səhifə başlığı və açıqlaması
$page_title = "Tez-tez soruşulan suallar";
$page_description = "BarterTap.az haqqında tez-tez soruşulan suallar və onların cavabları";

require_once 'includes/header.php';

// FAQ kateqoriyaları və sualları
$faqCategories = [
    'general' => [
        'icon' => 'fas fa-question-circle',
        'name' => 'Ümumi',
        'items' => [
            [
                'id' => 'what-is-bartertap',
                'question' => 'BarterTap.az nədir?',
                'answer' => 'BarterTap.az Azərbaycanda ilk onlayn barter platformasıdır. İstifadəçilər öz əşyalarını pulsuz olaraq platformaya yerləşdirib digər maraqlı əşyalarla dəyişdirə bilərlər. Pul ödəməklə deyil, sadəcə əşya dəyişməklə ehtiyacınız olan şeylərə sahib ola bilərsiniz.'
            ],
            [
                'id' => 'is-bartertap-free',
                'question' => 'BarterTap.az-dan istifadə pulsuzdur?',
                'answer' => 'Bəli, BarterTap.az-dan əsas istifadə tamamilə pulsuzdur. Elanların yerləşdirilməsi, axtarış, mesajlaşma və barter əməliyyatları üçün heç bir ödəniş tələb olunmur. Yalnız premium funksiyalar (VIP elanlar, xüsusi nişanlar və s.) ödənişlidir.'
            ],
            [
                'id' => 'bartertap-vs-sales',
                'question' => 'Barter etmək satmaqdan nə ilə fərqlənir?',
                'answer' => 'Barter etmək əşyanızı pul qarşılığında satmaq əvəzinə, digər sizə lazım olan əşya ilə dəyişmək deməkdir. Bu, əlavə pul xərcləmədən lazım olan əşyalara sahib olmağın əla yoludur. Həmçinin istifadə etmədiyiniz əşyaları faydalı bir şeyə çevirmək imkanı yaradır.'
            ]
        ]
    ],
    'account' => [
        'icon' => 'fas fa-user',
        'name' => 'Hesab',
        'items' => [
            [
                'id' => 'create-account',
                'question' => 'Hesab necə yaradılır?',
                'answer' => 'Hesab yaratmaq üçün saytın yuxarı sağ küncündəki "Qeydiyyat" düyməsinə klikləyin. E-poçt ünvanınızı, istifadəçi adınızı və şifrənizi daxil edin. Hesabınızı təsdiqləmək üçün e-poçtunuza göndərilən linkə keçid edin və qeydiyyatı tamamlayın.'
            ],
            [
                'id' => 'change-profile-info',
                'question' => 'Profil məlumatlarımı necə dəyişə bilərəm?',
                'answer' => 'Profil məlumatlarınızı dəyişmək üçün hesabınıza daxil olun, sağ yuxarı küncündə adınıza klikləyin və "Profil" seçin. Açılan səhifədə "Profili redaktə et" düyməsinə klikləyib məlumatlarınızı yeniləyə bilərsiniz.'
            ],
            [
                'id' => 'delete-account',
                'question' => 'Hesabımı necə silə bilərəm?',
                'answer' => 'Hesabınızı silmək üçün profil səhifəsində "Parametrlər" bölməsinə keçin. Səhifənin aşağısında "Hesabı sil" seçimini tapıb klikləyin. Silinmə səbəbini qeyd edib, şifrənizi daxil edərək təsdiqləyin. Nəzərə alın ki, hesabınız silindikdən sonra bütün məlumatlarınız silinəcək və bu əməliyyat geri qaytarıla bilməz.'
            ]
        ]
    ],
    'barter' => [
        'icon' => 'fas fa-exchange-alt',
        'name' => 'Barter',
        'items' => [
            [
                'id' => 'how-to-add-item',
                'question' => 'Əşya elanı necə yerləşdirilir?',
                'answer' => 'Əşya elanı yerləşdirmək üçün hesabınıza daxil olun və "Elan yerləşdir" düyməsinə klikləyin. Əşyanızın şəkillərini, adını, təsvirini, kateqoriyasını, vəziyyətini və nə ilə dəyişmək istədiyinizi qeyd edin. Bütün məlumatları doldurduqdan sonra "Yerləşdir" düyməsinə basın.'
            ],
            [
                'id' => 'how-to-make-offer',
                'question' => 'Barter təklifi necə edilir?',
                'answer' => 'Maraqlandığınız əşyanın səhifəsinə keçid edib "Təklif et" düyməsinə klikləyin. Açılan pəncərədə təklif etmək istədiyiniz öz əşyanızı seçin və əlavə qeydlərinizi yazın. Daha sonra "Təklif göndər" düyməsinə basın. Əşya sahibi təklifinizi qəbul edərsə, sizinlə əlaqə saxlayacaq.'
            ],
            [
                'id' => 'accepted-offer',
                'question' => 'Təklifim qəbul edildikdən sonra nə baş verir?',
                'answer' => 'Təklifiniz qəbul edildikdən sonra sistem avtomatik olaraq sizi və əşya sahibini bir mesajlaşma qrupuna daxil edir. Bu qrupda görüş yeri və vaxtı, əlavə şərtlər və sair məsələləri müzakirə edə bilərsiniz. Barter tamamlandıqdan sonra hər iki tərəf prosesi platformada təsdiqləməlidir.'
            ],
            [
                'id' => 'cancel-offer',
                'question' => 'Təklifimi necə geri götürə bilərəm?',
                'answer' => 'Hələ qəbul edilməmiş təklifinizi geri götürmək üçün profil səhifənizdəki "Təkliflərim" bölməsinə keçin. Geri götürmək istədiyiniz təklifin sağındakı "Ləğv et" düyməsinə klikləyin və əməliyyatı təsdiqləyin. Qəbul edilmiş təklifləri ləğv etmək üçün isə qarşı tərəflə razılığa gəlməlisiniz.'
            ]
        ]
    ],
    'safety' => [
        'icon' => 'fas fa-shield-alt',
        'name' => 'Təhlükəsizlik',
        'items' => [
            [
                'id' => 'safe-barter',
                'question' => 'Barter prosesini təhlükəsiz etmək üçün nə etməliyəm?',
                'answer' => 'Təhlükəsiz barter üçün: 1) İctimai yerlərdə görüşün; 2) Əşyanı diqqətlə yoxlayın; 3) Şübhəli təkliflərdən çəkinin; 4) Əşya haqqında bütün məlumatları əvvəlcədən soruşun; 5) Platformada müsbət rəy almış istifadəçilərə üstünlük verin; 6) Barter prosesini platformada rəsmiləşdirin ki, problem yaranarsa müdaxilə edə bilək.'
            ],
            [
                'id' => 'report-user',
                'question' => 'Şübhəli istifadəçini necə şikayət edə bilərəm?',
                'answer' => 'Şübhəli istifadəçini şikayət etmək üçün onların profil səhifəsində və ya elanında "Şikayət et" düyməsinə klikləyin. Açılan formada şikayət səbəbini seçin və ətraflı izah yazın. Mümkünsə, şikayətinizi təsdiqləyən sübutlar (şəkil, mesaj və s.) da əlavə edin. Şikayətiniz 24 saat ərzində moderatorlar tərəfindən araşdırılacaq.'
            ],
            [
                'id' => 'verify-account',
                'question' => 'Hesabımı necə təsdiq edə bilərəm?',
                'answer' => 'Hesabınızı təsdiq etmək üçün profil səhifənizdə "Hesabı təsdiqlə" düyməsinə klikləyin. Telefon nömrənizi daxil edin və sizə göndərilən SMS kodu ilə təsdiqləyin. Daha yüksək səviyyəli təsdiq üçün şəxsiyyət vəsiqənizin şəklini sistemə yükləməlisiniz. Təsdiqlənmiş hesablar daha çox etibarlı sayılır və daha çox təklif alır.'
            ]
        ]
    ],
    'support' => [
        'icon' => 'fas fa-life-ring',
        'name' => 'Dəstək',
        'items' => [
            [
                'id' => 'contact-support',
                'question' => 'Dəstək xidməti ilə necə əlaqə saxlaya bilərəm?',
                'answer' => 'Dəstək xidməti ilə əlaqə saxlamaq üçün saytın aşağı hissəsində "Dəstək" linkini klikləyin və ya support@bartertap.az e-poçt ünvanına yazın. Həmçinin canlı dəstək funksiyasından da istifadə edə bilərsiniz. İş saatlarımız həftə içi 09:00-18:00 arasındadır. Sorğunuza ən geci 24 saat ərzində cavab veriləcək.'
            ],
            [
                'id' => 'fee-refund',
                'question' => 'Ödənişli xidmətlərdən pulumu geri ala bilərəmmi?',
                'answer' => 'Ödənişli xidmətlərdən istifadə etdikdən sonra, xidmət göstərildiyinə görə, adətən geri ödəniş edilmir. Lakin, əgər texniki problemlər səbəbindən xidmət düzgün işləməyibsə və ya istifadə edə bilməmisinizsə, dəstək xidmətinə müraciət edərək geri ödəniş tələb edə bilərsiniz. Hər bir hal ayrıca araşdırılır.'
            ],
            [
                'id' => 'prohibited-items',
                'question' => 'Hansı əşyaları platformada yerləşdirmək qadağandır?',
                'answer' => 'Platformada qanunsuz mallar, silahlar, təhlükəli maddələr, dərman preparatları, alkohol və tütün məhsulları, heyvanlar, seksual məzmunlu məhsullar, saxta mallar, hüququ qorunan məzmunlar və lisenziyasız proqram təminatlarının yerləşdirilməsi qadağandır. Tam siyahı üçün istifadəçi razılaşmasını oxuyun.'
            ]
        ]
    ]
];

// Əgər kategoriya seçilibsə
$activeCategory = isset($_GET['category']) && array_key_exists($_GET['category'], $faqCategories) ? $_GET['category'] : null;

// Axtarış funksiyası
$searchQuery = isset($_GET['search']) ? sanitizeInput($_GET['search']) : '';
?>

<main class="flex-1">
  <div class="container mx-auto py-8 px-4 max-w-4xl">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold mb-4 text-gray-900">Tez-tez soruşulan suallar</h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        BarterTap.az platforması haqqında ən çox soruşulan suallar və cavablar
      </p>
    </div>

    <!-- Axtarış paneli -->
    <form method="GET" action="faq.php" class="relative mb-8">
      <input type="text" 
             name="search" 
             placeholder="Sual axtar..." 
             value="<?php echo htmlspecialchars($searchQuery); ?>"
             class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-primary">
      <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
      <button type="submit" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-700">
        Axtar
      </button>
    </form>

    <!-- Kateqoriyalar -->
    <div class="flex flex-wrap gap-2 mb-8">
      <a href="faq.php" class="px-4 py-2 rounded-full flex items-center gap-2 transition-colors <?php echo $activeCategory === null ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?>">
        <i class="fas fa-clock"></i>
        <span>Bütün</span>
      </a>
      
      <?php foreach($faqCategories as $categoryId => $category): ?>
        <a href="faq.php?category=<?php echo $categoryId; ?>" class="px-4 py-2 rounded-full flex items-center gap-2 transition-colors <?php echo $activeCategory === $categoryId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'; ?>">
          <i class="<?php echo $category['icon']; ?>"></i>
          <span><?php echo $category['name']; ?></span>
        </a>
      <?php endforeach; ?>
    </div>

    <!-- FAQ Accordion -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <?php
      // Sualları filtrlə
      $filteredFaqs = [];
      
      foreach($faqCategories as $categoryId => $category) {
          if($activeCategory === null || $activeCategory === $categoryId) {
              foreach($category['items'] as $item) {
                  if(empty($searchQuery) || 
                     stripos($item['question'], $searchQuery) !== false || 
                     stripos($item['answer'], $searchQuery) !== false) {
                      $filteredFaqs[] = $item;
                  }
              }
          }
      }
      
      if(count($filteredFaqs) > 0): 
      ?>
        <div class="space-y-4">
          <?php foreach($filteredFaqs as $faq): ?>
            <div class="border border-gray-100 rounded-lg overflow-hidden">
              <div class="collapsible-header px-4 py-4 bg-white hover:bg-gray-50 cursor-pointer font-medium flex justify-between items-center" data-target="<?php echo $faq['id']; ?>">
                <?php echo $faq['question']; ?>
                <i class="fas fa-chevron-down text-gray-400 transform transition-transform"></i>
              </div>
              <div id="<?php echo $faq['id']; ?>" class="collapsible-content px-4 py-4 bg-gray-50 text-gray-700 hidden">
                <?php echo $faq['answer']; ?>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php else: ?>
        <div class="text-center py-10">
          <i class="fas fa-question-circle mx-auto h-12 w-12 text-gray-300 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-700 mb-2">Heç bir sual tapılmadı</h3>
          <p class="text-gray-500">
            Axtarış sorğunuza uyğun sual tapılmadı. Başqa açar sözlər sınayın və ya bütün kateqoriyaları göstərmək üçün filtri sıfırlayın.
          </p>
        </div>
      <?php endif; ?>
    </div>

    <!-- Digər məlumatlar bölməsi -->
    <div class="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-center">
      <h2 class="text-xl font-semibold mb-2">Sualınız hələ də cavablanmayıb?</h2>
      <p class="text-gray-700 mb-4">
        Dəstək komandamızla əlaqə saxlayın - sizə kömək etməkdən məmnun olarıq!
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center mt-4">
        <a href="mailto:<?php echo $site['email']; ?>" class="flex items-center justify-center gap-2 bg-white text-primary border border-primary/20 rounded-full px-6 py-2 hover:bg-primary/5 transition-colors">
          <i class="fas fa-envelope"></i>
          <span>E-poçt yaz</span>
        </a>
        <a href="tel:<?php echo $site['phone']; ?>" class="flex items-center justify-center gap-2 bg-primary text-white rounded-full px-6 py-2 hover:bg-primary/90 transition-colors">
          <i class="fas fa-phone"></i>
          <span>Zəng et</span>
        </a>
      </div>
    </div>
  </div>
</main>

<!-- FAQ JavaScript -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Accordion funksiyası
  const headers = document.querySelectorAll('.collapsible-header');
  
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const content = document.getElementById(targetId);
      const icon = this.querySelector('i');
      
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
      } else {
        content.classList.add('hidden');
        icon.classList.remove('rotate-180');
      }
    });
  });
  
  // URL parametrlərini yoxla
  const urlParams = new URLSearchParams(window.location.search);
  const openFaq = urlParams.get('open');
  
  if(openFaq) {
    const element = document.getElementById(openFaq);
    if(element) {
      const header = document.querySelector(`[data-target="${openFaq}"]`);
      if(header) {
        element.classList.remove('hidden');
        header.querySelector('i').classList.add('rotate-180');
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
});
</script>

<?php
require_once 'includes/footer.php';
?>