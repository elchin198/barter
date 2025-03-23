import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Package, Search, MessageSquare, HandshakeIcon, ThumbsUp, Star, Shield, Clock, Award } from "lucide-react";

export default function HowItWorks() {
  const [currentTab, setCurrentTab] = useState("process");
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">Necə İşləyir?</h1>
        <p className="text-gray-600 text-lg">
          BarterTap.az - pulsuz barter platforması ilə ehtiyacınız olmayan əşyaları istədiyiniz şeylərə dəyişmək asan və əlverişlidir.
        </p>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-12">
        <TabsList className="grid w-full md:w-3/4 lg:w-1/2 mx-auto grid-cols-3">
          <TabsTrigger value="process">Proses</TabsTrigger>
          <TabsTrigger value="safety">Təhlükəsizlik</TabsTrigger>
          <TabsTrigger value="tips">Məsləhətlər</TabsTrigger>
        </TabsList>
        
        <TabsContent value="process" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="border-blue-100 shadow-md">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-center mb-2">1. Əşya əlavə edin</h2>
                <p className="text-gray-600 text-center">
                  İstifadə etmədiyiniz əşyanın şəkillərini çəkin, ətraflı təsvir yazın və onu platformaya yerləşdirin.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-center mb-2">2. Əşyaları kəşf edin</h2>
                <p className="text-gray-600 text-center">
                  Platformada mövcud olan əşyalara baxın və istədiyiniz əşyanı tapın.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-center mb-2">3. Mesajlaşmağa başlayın</h2>
                <p className="text-gray-600 text-center">
                  Əşya sahibi ilə əlaqə qurun və öz əşyanızla onun əşyasını dəyişmək təklifi irəli sürün.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-blue-100 shadow-md">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-center mb-2">4. Görüşü təyin edin</h2>
                <p className="text-gray-600 text-center">
                  Təklif qəbul edildikdən sonra ictimai bir yerdə görüşmək üçün vaxt və yer razılaşdırın.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ThumbsUp className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-center mb-2">5. Mübadilə tamamlayın</h2>
                <p className="text-gray-600 text-center">
                  Əşyaları dəyişdirin və bir-birinizə rəy yazın. Uğurlu mübadilə tamamlandı!
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="safety" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Şəxsi məlumatlarınızı qoruyun</h3>
                    <p className="text-gray-600">
                      Platformada telefon nömrəniz, tam ünvanınız və ya bank məlumatlarınız kimi şəxsi məlumatları heç vaxt paylaşmayın. Yalnız sistemin təqdim etdiyi mesajlaşma funksiyasından istifadə edin.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">İctimai yerlərdə görüşün</h3>
                    <p className="text-gray-600">
                      Əşya mübadiləsi üçün həmişə ictimai və qələbəlik yerlərdə görüşməyə üstünlük verin. Mümkünsə, alış-veriş mərkəzləri və ya kafe kimi yerləri seçin. Tanımadığınız şəxslərin evinə getməyin.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <AlertCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Şübhəli təkliflərdən ehtiyatlı olun</h3>
                    <p className="text-gray-600">
                      Əgər təklif həddindən artıq yaxşı görünürsə, ehtiyatlı olun. Heç vaxt barter zamanı pul ödəməyin və ya depozit qoymayın. Platformamız ancaq birbaşa əşya mübadiləsi üçün nəzərdə tutulub.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <Star className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">İstifadəçi reytinqlərinə baxın</h3>
                    <p className="text-gray-600">
                      Əşya sahibi ilə əlaqə qurmadan əvvəl onun profilini və reytinqini yoxlayın. Yüksək reytinqli və müsbət rəylərə malik istifadəçilərə üstünlük verin.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <AlertCircle className="h-6 w-6 text-blue-600 mr-2" />
              Əlavə məlumat
            </h3>
            <p className="text-gray-700 mb-4">
              Platformada baş verən hər hansı şübhəli fəaliyyəti "Şikayət et" funksiyası vasitəsilə bizə bildirin. Mübahisəli vəziyyətlərin həlli üçün dəstək komandamız sizə köməklik göstərəcək.
            </p>
            <p className="text-gray-700">
              BarterTap.az, istifadəçilərimizin təhlükəsizliyini qorumaq üçün əlindən gələni edir, lakin həmişə ehtiyatlı olmaq sizin məsuliyyətinizdir.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="tips" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <Award className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Keyfiyyətli şəkillər çəkin</h3>
                    <p className="text-gray-600">
                      Əşyanızın yaxşı işıqlandırılmış, aydın və müxtəlif bucaqlardan şəkillərini çəkin. Potensial dəyişmələr üçün nöqsanları da daxil olmaqla, əşyanın vəziyyətini dəqiq əks etdirən şəkillər əlavə edin.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ətraflı təsvir yazın</h3>
                    <p className="text-gray-600">
                      Əşyanın əsas xüsusiyyətlərini, ölçüsünü, vəziyyətini və aldığınız tarixi daxil edin. Əşyanın markasını və modelini (əgər tətbiq olunursa) qeyd etməyi də unutmayın.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Əşyanın dəyərini həqiqi qeyd edin</h3>
                    <p className="text-gray-600">
                      Əşyanızın təxmini bazar qiymətini və ya əldə etdiyiniz qiyməti təsvirdə göstərin. Bu, daha ədalətli mübadilələr üçün istifadəçilərə kömək edəcək.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Açıq fikirli olun</h3>
                    <p className="text-gray-600">
                      İstədiyiniz əşyalar haqqında açıq fikirli olun. Hətta ilk baxışda maraqlı görünməyən təkliflərə də baxın. Bəzən gözlənilməz mübadilələr ən yaxşı nəticələr verir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Vaxtında cavab verin</h3>
                    <p className="text-gray-600">
                      Mesajlara mümkün qədər tez cavab verin. Sürətli və effektiv ünsiyyət uğurlu barter mübadilələri üçün açardır.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-blue-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Elan və təkliflərinizi aktiv saxlayın</h3>
                    <p className="text-gray-600">
                      Daha çox görünürlük üçün elanlarınızı vaxtaşırı yeniləyin. Əşyanın artıq mövcud olmadığı halda isə təklifləri dərhal deaktiv edin.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-12 text-center">
        <h2 className="text-3xl font-bold mb-6">Barterlərə başlamağa hazırsınız?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/item/new">
            <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-700">
              Əşya Əlavə Et
            </Button>
          </Link>
          <Link href="/items">
            <Button variant="outline" size="lg" className="px-8 border-blue-600 text-blue-600 hover:bg-blue-50">
              Əşyaları Gəz
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mt-16 p-8 bg-blue-50 rounded-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Tez-tez verilən suallar</h2>
          <p className="text-gray-600">Barter haqqında ən çox soruşulan suallara cavablar</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">BarterTap.az-da əşya mübadiləsi tamamilə pulsuzdur?</h3>
            <p className="text-gray-600">
              Bəli, BarterTap.az-da əşyaların mübadiləsi tamamilə pulsuzdur. Platform istifadəsi, elan yerləşdirmə və mesajlaşma üçün heç bir ödəniş tələb olunmur.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Bir əşyanı birdən çox əşya ilə dəyişə bilərəm?</h3>
            <p className="text-gray-600">
              Bəli, birdən çox əşya təklif edə və ya bir əşya üçün birdən çox əşya istəyə bilərsiniz. Mübadilənin şərtləri tamamilə iki tərəf arasında razılaşdırılır.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Platformada hansı növ əşyalar dəyişdirə bilərəm?</h3>
            <p className="text-gray-600">
              Platformada əsasən geyim, elektronika, kitab, əşyalar, oyuncaqlar, idman ləvazimatları və ev əşyaları kimi məhsulları dəyişə bilərsiniz. Qeyri-qanuni, saxta, təhlükəli və ya qadağan olunmuş məhsulların yerləşdirilməsi qadağandır.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Mənə təklif olunan əşyanı bəyənməsəm nə etməliyəm?</h3>
            <p className="text-gray-600">
              Əgər təklif olunan əşya sizi qane etmirsə, təklifi nəzakətlə rədd edə və ya qarşı tərəfə başqa alternativlər təklif edə bilərsiniz. Hər bir təklifi qəbul etmək məcburi deyil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}