import { Link } from "wouter";
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon, MapPinIcon, PhoneIcon, MailIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="inline-block mb-4 flex items-center">
              <Link href="/">
                <img 
                  src="/logo.png" 
                  alt="BarterTap.az" 
                  className="h-8 md:h-10 transition-transform hover:scale-105 duration-300"
                />
              </Link>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              {t('footer.description', 'BarterTap.az, Azərbaycanda ən böyük pulsuz əşya mübadiləsi platformasıdır. Ehtiyacınız olmayan əşyaları istədiyiniz şeylərə dəyişmək və pul xərcləmədən yeni əşyalar əldə etmək imkanı yaradır.')}
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition">
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition">
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition">
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition">
                <YoutubeIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4 text-blue-600">{t('footer.quickLinks', 'Sürətli Keçidlər')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('common.home', 'Ana Səhifə')}
                </Link>
              </li>
              <li>
                <Link href="/items" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('common.allItems', 'Bütün Əşyalar')}
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('common.categories', 'Kateqoriyalar')}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('common.howItWorks', 'Necə İşləyir')}
                </Link>
              </li>
              <li>
                <Link href="/items/new" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('common.addItem', 'Əşya Əlavə Et')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4 text-blue-600">{t('footer.account', 'Hesab')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('common.login', 'Daxil ol')}
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('common.register', 'Qeydiyyat')}
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('common.myProfile', 'Mənim Profilim')}
                </Link>
              </li>
              <li>
                <Link href="/messages">
                  <span className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">
                    {t('common.messages', 'Mesajlar')}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/my-items">
                  <span className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer">
                    {t('common.myItems', 'Mənim Əşyalarım')}
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4 text-blue-600">{t('footer.helpSupport', 'Kömək və Dəstək')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('footer.faq', 'Tez-tez verilən suallar')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('footer.contact', 'Bizimlə əlaqə')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('footer.terms', 'İstifadə şərtləri')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('footer.privacy', 'Gizlilik siyasəti')}
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-gray-600 hover:text-blue-600 transition-colors">
                  {t('footer.helpCenter', 'Kömək mərkəzi')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0">
              <div className="flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-blue-600" />
                <span className="text-gray-600">Əhməd Rəcəbli, Bakı</span>
              </div>
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2 text-blue-600" />
                <span className="text-gray-600">+994 55 255 48 00</span>
              </div>
              <div className="flex items-center">
                <MailIcon className="h-5 w-5 mr-2 text-blue-600" />
                <span className="text-gray-600">info@bartertap.az</span>
              </div>
            </div>
            <p className="text-center text-gray-600">
              &copy; {new Date().getFullYear()} BarterTap.az. {t('footer.copyright', 'Bütün hüquqlar qorunur.')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
