import { Shield, Zap, Users, CheckCircle } from "lucide-react";

export default function FeatureSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Niyə BarterTap.az?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Barter platformamız sizə lazım olmayan əşyalarınızı ehtiyacınız olan əşyalara dəyişməyə kömək edir.
            Əşyaları dəyişmək üçün ən etibarlı və istifadəsi rahat platformadır.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Zap className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Sürətli və Asan</h3>
            <p className="text-gray-600">
              Cəmi bir neçə addımda əşyalarınızı əlavə edin və dərhal mübadilələr üçün hazır olun. İstifadəçi dostu interfeys ilə vaxtınıza qənaət edin.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Təhlükəsiz Mübadilə</h3>
            <p className="text-gray-600">
              Platforma daxilində qorunan mesajlaşma və istifadəçi reytinq sistemi ilə etibarlı mübadiləni təmin edirik.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Böyük İcma</h3>
            <p className="text-gray-600">
              Minlərlə aktiv istifadəçi ilə istədiyiniz əşyanı tapmaq şansınızı artırın. Hər gün yeni əşyalar əlavə olunur.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">100% Pulsuz</h3>
            <p className="text-gray-600">
              Qeydiyyat, elan yerləşdirmə və mesajlaşma - bütün xidmətlərimiz tamamilə ödənişsizdir. Heç bir gizli ödəniş yoxdur.
            </p>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg 
                    key={star}
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6 text-yellow-400 fill-current" 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">İstifadəçilər bizi sevirlər</h3>
            <p className="text-gray-600 italic">
              "BarterTap.az platforması ilə artıq lazım olmayan əşyalarımı yeni şeylərə dəyişdim və bu proses çox asan oldu. Pulsuz və etibarlı xidmət üçün təşəkkürlər!"
            </p>
            <div className="mt-4">
              <div className="inline-block">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-bold text-blue-600">MK</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Murad Kərimov</p>
                    <p className="text-sm text-gray-500">Bakı</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}