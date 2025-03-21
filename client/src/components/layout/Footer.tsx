import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="inline-block mb-4 flex items-center">
              <Link href="/">
                <img 
                  src="/assets/images/bartertap-logo.png" 
                  alt="BarterTap.az" 
                  className="h-8 mr-2 cursor-pointer"
                  style={{ maxWidth: "160px" }}
                />
              </Link>
            </div>
            <p className="text-gray-600 mb-4">
              Ehtiyacınız olmayan əşyaları istədiyiniz şeylərə dəyişdirin. Pul yoxdur - yalnız birbaşa mübadilə.
            </p>
          </div>
          
          <div className="md:col-span-1">
            <h3 className="font-medium text-lg mb-4">Sürətli Keçidlər</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-red-600 transition-colors">
                  Ana Səhifə
                </Link>
              </li>
              <li>
                <Link href="/items/new" className="text-gray-600 hover:text-red-600 transition-colors">
                  Əşya Əlavə Et
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-600 hover:text-red-600 transition-colors">
                  Mənim Profilim
                </Link>
              </li>
              <li>
                <Link href="/messages">
                  <span className="text-gray-600 hover:text-red-600 transition-colors cursor-pointer">Mesajlar</span>
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
            <h3 className="font-medium text-lg mb-4">Əlaqə</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-gray-600">+994 55 255 48 00</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-600">Əhməd Rəcəbli, Bakı şəh., 40°24'50.1"N 49°51'36.8"E</span>
              </li>
              <li className="mt-4">
                <a 
                  href="https://www.google.com/maps/place/40%C2%B024'50.1%22N+49%C2%B051'36.8%22E/@40.4139137,49.8576431,17z/data=!3m1!4b1!4m4!3m3!8m2!3d40.4139137!4d49.860218?hl=az&entry=ttu&g_ep=EgoyMDI1MDMxOC4wIKXMDSoASAFQAw%3D%3D" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block w-full"
                >
                  <img 
                    src="https://maps.googleapis.com/maps/api/staticmap?center=40.4139137,49.860218&zoom=15&size=300x150&maptype=roadmap&markers=color:red%7C40.4139137,49.860218&key=AIzaSyBhOdIF3Y9382fqJYt5I_sswSrEw5eihAA" 
                    alt="BarterTap.az location" 
                    className="w-full rounded-md border border-gray-300 mt-2"
                  />
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8">
          <p className="text-center text-gray-600">
            &copy; {new Date().getFullYear()} BarterTap.az - Əhməd Rəcəbli. Bütün hüquqlar qorunur.
          </p>
        </div>
      </div>
    </footer>
  );
}
