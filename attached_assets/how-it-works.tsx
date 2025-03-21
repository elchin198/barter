import { useEffect } from 'react';
import { ChevronRight, ArrowRight, Package, Search, MessageCircle, Handshake, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HowItWorks() {
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    {
      id: 1,
      title: "Əşyanızı əlavə edin",
      description: "Dəyişmək istədiyiniz əşyanı platformaya əlavə edin. Nə qədər detallı məlumat versəniz, o qədər yaxşı təkliflər ala bilərsiniz.",
      icon: <Package className="w-8 h-8 text-primary" />,
      color: "bg-blue-50",
      tips: [
        "Keyfiyyətli şəkillər çəkin",
        "Əşyanın vəziyyətini dəqiq təsvir edin",
        "Hansı kateqoriyaya aid olduğunu düzgün seçin"
      ]
    },
    {
      id: 2,
      title: "Barter təklifləri axtarın",
      description: "Barter etmək istədiyiniz əşyaları platformada axtarış edin. Kateqoriyalar və filtrlər ilə axtarışınızı asanlaşdırın.",
      icon: <Search className="w-8 h-8 text-primary" />,
      color: "bg-green-50",
      tips: [
        "Kateqoriyalar üzrə göz gəzdirin",
        "Lokasiya əsasında axtarış edin",
        "Müxtəlif filtrlər tətbiq edin"
      ]
    },
    {
      id: 3,
      title: "Mesajlaşmağa başlayın",
      description: "Maraqlandığınız əşyanın sahibi ilə əlaqə saxlayın və barter şərtlərini müzakirə edin.",
      icon: <MessageCircle className="w-8 h-8 text-primary" />,
      color: "bg-purple-50",
      tips: [
        "Nəzakətli və açıq ünsiyyət qurun",
        "Barter şərtlərini dəqiqləşdirin",
        "Görüş yerini və vaxtını razılaşdırın"
      ]
    },
    {
      id: 4,
      title: "Barteri tamamlayın",
      description: "Razılaşma əldə etdikdən sonra görüşün və əşyaları dəyişin. Əmin olun ki, hər şey razılaşdığınız kimi gedir.",
      icon: <Handshake className="w-8 h-8 text-primary" />,
      color: "bg-amber-50",
      tips: [
        "Əşyanı diqqətlə yoxlayın",
        "Təhlükəsiz yerdə görüşün",
        "Prosesin tamamlanmasını platformada təsdiqləyin"
      ]
    },
    {
      id: 5,
      title: "Rəy və qiymətləndirmə yazın",
      description: "Barter tamamlandıqdan sonra qarşı tərəfə rəy və qiymətləndirmə yazın. Bu, digər istifadəçilərə kömək edəcək.",
      icon: <Star className="w-8 h-8 text-primary" />,
      color: "bg-orange-50",
      tips: [
        "Dürüst və obyektiv olun",
        "Müsbət təcrübələri vurğulayın",
        "Təkliflərinizi də bildirin"
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4 md:py-12 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">BarterTap.az necə işləyir?</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          BarterTap.az vasitəsilə əşyalarınızı asanlıqla və təhlükəsiz şəkildə dəyişdirə bilərsiniz. İşləmə prinsipimiz 5 sadə addımdan ibarətdir.
        </p>
      </div>

      <div className="space-y-12 mb-12">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-2xl ${step.color} border border-gray-100 shadow-sm relative`}
          >
            <div className="absolute top-6 right-6 bg-white h-10 w-10 rounded-full flex items-center justify-center font-bold text-gray-800 border border-gray-200">
              {step.id}
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-4 rounded-full bg-white shadow-sm border border-gray-100">
                {step.icon}
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-gray-700 mb-4">{step.description}</p>
                
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">Faydalı məsləhətlər:</h4>
                  <ul className="space-y-2">
                    {step.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Hazırsınız?</h2>
        <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
          İndi siz də BarterTap.az-a qoşulun və əşyalarınızı dəyişdirməyə başlayın. Platformada minlərlə istifadəçi artıq aktiv şəkildə barter edir!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/create-item">
              İndi əşya əlavə et <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/category/all">
              Barter əşyalarına bax
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}