import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/">
              <a className="inline-block mb-4 flex items-center">
                <img 
                  src="/assets/images/bartertap-logo.png" 
                  alt="BarterTap.az" 
                  className="h-8 mr-2"
                />
                <span className="text-2xl font-bold gradient-text">
                  BarterTap.az
                </span>
              </a>
            </Link>
            <p className="text-gray-600 mb-4">
              Ehtiyacınız olmayan əşyaları istədiyiniz şeylərə dəyişdirin. Pul yoxdur - yalnız birbaşa mübadilə.
            </p>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4">Sürətli Keçidlər</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <a className="text-gray-600 hover:text-red-600 transition-colors">Ana Səhifə</a>
                </Link>
              </li>
              <li>
                <Link href="/items/new">
                  <a className="text-gray-600 hover:text-red-600 transition-colors">Əşya Əlavə Et</a>
                </Link>
              </li>
              <li>
                <Link href="/profile">
                  <a className="text-gray-600 hover:text-red-600 transition-colors">Mənim Profilim</a>
                </Link>
              </li>
              <li>
                <Link href="/messages">
                  <a className="text-gray-600 hover:text-red-600 transition-colors">Mesajlar</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4">Kömək və Dəstək</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  Tez-tez verilən suallar
                </a>
              </li>
              <li>
                <a href="mailto:info@bartertap.az" className="text-gray-600 hover:text-red-600 transition-colors">
                  Bizimlə əlaqə
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  İstifadə şərtləri
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-red-600 transition-colors">
                  Gizlilik siyasəti
                </a>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4">Subscribe</h3>
            <p className="text-gray-600 mb-4">
              Stay updated with the latest items and features.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8">
          <p className="text-center text-gray-600">
            &copy; {new Date().getFullYear()} BarterX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
