<?php
// Necə işləyir səhifəsi
require_once 'includes/config.php';

// Səhifə başlığı və açıqlaması
$page_title = "Necə işləyir?";
$page_description = "BarterTap.az platformasının işləmə prinsipi, barter prosesi və təhlükəsizlik məsləhətləri";

require_once 'includes/header.php';
?>

<main class="flex-1">
  <div class="container mx-auto py-8 px-4 md:py-12 max-w-5xl">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold mb-4 text-gray-900">BarterTap.az necə işləyir?</h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        BarterTap.az vasitəsilə əşyalarınızı asanlıqla və təhlükəsiz şəkildə dəyişdirə bilərsiniz. İşləmə prinsipimiz 5 sadə addımdan ibarətdir.
      </p>
    </div>

    <div class="space-y-12 mb-12">
      <!-- Addım 1 -->
      <div class="p-6 rounded-2xl bg-blue-50 border border-gray-100 shadow-sm relative">
        <div class="absolute top-6 right-6 bg-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-gray-800 border border-gray-200">
          1
        </div>
        
        <div class="flex flex-col md:flex-row gap-6 items-start">
          <div class="p-4 rounded-full bg-white shadow-sm border border-gray-100">
            <i class="fas fa-box text-primary text-xl"></i>
          </div>
          
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2 text-gray-900">Elan yaradın</h3>
            <p class="text-gray-700 mb-4">Dəyişmək istədiyiniz əşya haqqında detallı məlumat verin. Əşyanın adı, kateqoriyası və vəziyyəti çox önəmlidir.</p>
            
            <div class="bg-white p-4 rounded-xl border border-gray-100">
              <h4 class="font-medium text-gray-800 mb-2">Faydalı məsləhətlər:</h4>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Əşyanın adını tam və düzgün yazın</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Əşyanın vəziyyətini dəqiq təsvir edin</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Əşyanın özəlliklərini qeyd edin</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Addım 2 -->
      <div class="p-6 rounded-2xl bg-green-50 border border-gray-100 shadow-sm relative">
        <div class="absolute top-6 right-6 bg-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-gray-800 border border-gray-200">
          2
        </div>
        
        <div class="flex flex-col md:flex-row gap-6 items-start">
          <div class="p-4 rounded-full bg-white shadow-sm border border-gray-100">
            <i class="fas fa-camera text-green-500 text-xl"></i>
          </div>
          
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2 text-gray-900">Keyfiyyətli şəkillər əlavə edin</h3>
            <p class="text-gray-700 mb-4">Əşyanın keyfiyyətli şəkillərini əlavə edin. Şəkillər müxtəlif bucaqlardan və yaxşı işıqlandırılmış olmalıdır.</p>
            
            <div class="bg-white p-4 rounded-xl border border-gray-100">
              <h4 class="font-medium text-gray-800 mb-2">Faydalı məsləhətlər:</h4>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Ən azı 3-4 şəkil əlavə edin</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Müxtəlif bucaqlardan şəkillər çəkin</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Yaxşı işıqlandırılmış şəkillər daha cəlbedicidir</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Addım 3 -->
      <div class="p-6 rounded-2xl bg-purple-50 border border-gray-100 shadow-sm relative">
        <div class="absolute top-6 right-6 bg-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-gray-800 border border-gray-200">
          3
        </div>
        
        <div class="flex flex-col md:flex-row gap-6 items-start">
          <div class="p-4 rounded-full bg-white shadow-sm border border-gray-100">
            <i class="fas fa-tag text-purple-500 text-xl"></i>
          </div>
          
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2 text-gray-900">Nə ilə dəyişmək istədiyinizi yazın</h3>
            <p class="text-gray-700 mb-4">Hansı əşya ilə dəyişmək istədiyinizi dəqiq qeyd edin. Bu, uyğun təkliflər almanıza kömək edəcək.</p>
            
            <div class="bg-white p-4 rounded-xl border border-gray-100">
              <h4 class="font-medium text-gray-800 mb-2">Faydalı məsləhətlər:</h4>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Konkret əşya və ya kateqoriya qeyd edin</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Qiymət aralığını dəqiqləşdirin</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Bir neçə alternativ variant yazın</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Addım 4 -->
      <div class="p-6 rounded-2xl bg-blue-50 border border-gray-100 shadow-sm relative">
        <div class="absolute top-6 right-6 bg-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-gray-800 border border-gray-200">
          4
        </div>
        
        <div class="flex flex-col md:flex-row gap-6 items-start">
          <div class="p-4 rounded-full bg-white shadow-sm border border-gray-100">
            <i class="fas fa-comment-dots text-blue-500 text-xl"></i>
          </div>
          
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2 text-gray-900">Mesajları cavablandırın</h3>
            <p class="text-gray-700 mb-4">Təkliflərə vaxtında cavab verin. Sürətli və peşəkar cavablar daha çox uğur qazandırır.</p>
            
            <div class="bg-white p-4 rounded-xl border border-gray-100">
              <h4 class="font-medium text-gray-800 mb-2">Faydalı məsləhətlər:</h4>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Mesajlara 24 saat ərzində cavab verin</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Qarşı tərəflə hörmətlə danışın</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Əlavə sualları səbirlə cavablandırın</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Addım 5 -->
      <div class="p-6 rounded-2xl bg-amber-50 border border-gray-100 shadow-sm relative">
        <div class="absolute top-6 right-6 bg-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-gray-800 border border-gray-200">
          5
        </div>
        
        <div class="flex flex-col md:flex-row gap-6 items-start">
          <div class="p-4 rounded-full bg-white shadow-sm border border-gray-100">
            <i class="fas fa-thumbs-up text-amber-500 text-xl"></i>
          </div>
          
          <div class="flex-1">
            <h3 class="text-xl font-bold mb-2 text-gray-900">Barter prosesini tamamlayın</h3>
            <p class="text-gray-700 mb-4">Dəyişdirmə prosesini platformada tamamlamağı unutmayın. Bu, digər istifadəçilərə rəy yazmanıza imkan verəcək.</p>
            
            <div class="bg-white p-4 rounded-xl border border-gray-100">
              <h4 class="font-medium text-gray-800 mb-2">Faydalı məsləhətlər:</h4>
              <ul class="space-y-2">
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Əşyaları təhvil verdikdən sonra platformada prosesi tamamlayın</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>Qarşı tərəfə müsbət rəy yazın</span>
                </li>
                <li class="flex items-start gap-2">
                  <i class="fas fa-chevron-right text-primary mt-1"></i>
                  <span>İstifadəçilərin reytinqi yüksək olduqca daha çox etibar qazanırlar</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 text-center">
      <h2 class="text-2xl font-bold mb-4">Hazırsınız?</h2>
      <p class="text-gray-700 mb-6 max-w-2xl mx-auto">
        İndi siz də BarterTap.az-a qoşulun və əşyalarınızı dəyişdirməyə başlayın. Platformada minlərlə istifadəçi artıq aktiv şəkildə barter edir!
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="create-item.php" class="px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors">
          İndi əşya əlavə et <i class="fas fa-arrow-right ml-2"></i>
        </a>
        <a href="category.php?category=all" class="px-6 py-3 rounded-full bg-white text-gray-700 border border-gray-200 font-medium hover:bg-gray-50 transition-colors">
          Barter əşyalarına bax
        </a>
      </div>
    </div>
  </div>
</main>

<?php
require_once 'includes/footer.php';
?>