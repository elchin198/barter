import { Link } from "wouter";
import { Smartphone, Shirt, Sofa, Car } from "lucide-react";

export default function FeaturedCategoriesSection() {
  const categories = [
    {
      title: "Texnologiya",
      icon: <Smartphone className="h-6 w-6 text-[#367BF5]" />,
      color: "bg-[#367BF5]/5 border-[#367BF5]/20",
      textColor: "text-[#367BF5]",
      description: "Smartfonlar, noutbuklar, qulaqlıqlar və digər elektron cihazlar",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400&q=80",
      category: "electronics",
      tags: [
        { name: "Smartfonlar", query: "Smartfon" },
        { name: "Noutbuklar", query: "Noutbuk" },
        { name: "Qulaqlıqlar", query: "Qulaqlıq" },
        { name: "Planşetlər", query: "Planşet" }
      ]
    },
    {
      title: "Geyim",
      icon: <Shirt className="h-6 w-6 text-purple-600" />,
      color: "bg-purple-50 border-purple-100",
      textColor: "text-purple-600",
      description: "Kişi və qadın geyimləri, ayaqqabılar, aksesuarlar",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400&q=80",
      category: "clothing",
      tags: [
        { name: "Kişi geyimləri", query: "Kişi" },
        { name: "Qadın geyimləri", query: "Qadın" },
        { name: "Ayaqqabılar", query: "Ayaqqabı" },
        { name: "Aksesuarlar", query: "Aksesuar" }
      ]
    },
    {
      title: "Mebel",
      icon: <Sofa className="h-6 w-6 text-orange-600" />,
      color: "bg-orange-50 border-orange-100",
      textColor: "text-orange-600",
      description: "Divanlar, masalar, stullar və digər ev əşyaları",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400&q=80",
      category: "furniture",
      tags: [
        { name: "Divanlar", query: "Divan" },
        { name: "Masalar", query: "Masa" },
        { name: "Stullar", query: "Stul" },
        { name: "Dolablar", query: "Dolab" }
      ]
    },
    {
      title: "Avtomobil",
      icon: <Car className="h-6 w-6 text-green-600" />,
      color: "bg-green-50 border-green-100",
      textColor: "text-green-600",
      description: "Minik avtomobilləri, hissələr və aksesuarlar",
      image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400&q=80",
      category: "auto",
      tags: [
        { name: "Minik", query: "Minik" },
        { name: "Hissələr", query: "Hissə" },
        { name: "Aksesuarlar", query: "Avtomobil aksesuarı" },
        { name: "Təkərlər", query: "Təkər" }
      ]
    }
  ];

  return (
    <>
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          Populyar barter kateqoriyaları
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Aşağıdakı kateqoriyalardan barter etmək istədiyiniz əşyanı seçin
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row"
          >
            <div className="w-full md:w-2/5 h-48 md:h-auto relative">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: `url('${category.image}')` }}
              >
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent md:bg-gradient-to-r md:from-black/30 md:to-transparent">
                <div className="absolute bottom-4 left-4 md:hidden">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${category.color} ${category.textColor} gap-1`}>
                    {category.icon}
                    {category.title}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-3/5 p-6">
              <div className="hidden md:flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${category.color}`}>
                  {category.icon}
                </div>
                <h3 className={`text-xl font-semibold ${category.textColor}`}>{category.title}</h3>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">{category.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {category.tags.map((tag, tagIndex) => (
                  <Link 
                    key={tagIndex}
                    href={`/search?q=${tag.query}&category=${category.category}`}
                    className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full py-1.5 px-3 transition duration-300 text-gray-700"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
