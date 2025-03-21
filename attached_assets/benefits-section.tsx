import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  ShieldCheck, 
  Clock, 
  PackageCheck, 
  Users, 
  BadgeCheck, 
  Sparkles, 
  WalletCards, 
  PercentCircle, 
  Leaf, 
  Heart, 
  Recycle, 
  Truck, 
  Lock, 
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

// Benefit card data
const benefitCards = [
  {
    title: "Təhlükəsiz əməliyyatlar",
    description: "Platform daxilində bütün əməliyyatlar şifrələnir və təhlükəsiz şəkildə aparılır. İstifadəçilər yoxlanılır və təsdiqlənir.",
    icon: <ShieldCheck className="h-7 w-7 text-primary" />,
    iconBg: "bg-primary/10",
    stats: "99.8% təhlükəsiz əməliyyatlar",
    category: "security"
  },
  {
    title: "Vaxt və pul qənaəti",
    description: "Əşyaları satmaq əvəzinə, lazım olanlarla birbaşa dəyişdirmək həm vaxt, həm də pul qənaəti etdirir. Satış faizlərindən azadsınız.",
    icon: <Clock className="h-7 w-7 text-green-600" />,
    iconBg: "bg-green-100",
    stats: "Ortalama 45% daha çox qənaət",
    category: "economy"
  },
  {
    title: "Ekoloji cəhətdən təmiz",
    description: "İkinci əl əşyaların dəyişdirilməsi ətraf mühitə zərər vermir, əşyaların istifadə müddətini artırır və tullantıları azaldır.",
    icon: <Leaf className="h-7 w-7 text-emerald-600" />,
    iconBg: "bg-emerald-100",
    stats: "20,000+ kg tullantı azaldılmışdır",
    category: "environment"
  },
  {
    title: "Genişlənən istifadəçi icması",
    description: "10,000+ aktiv istifadəçinin qoşulduğu platformada istədiyiniz hər şeyi tapmaq və dəyişdirmək mümkündür.",
    icon: <Users className="h-7 w-7 text-orange-600" />,
    iconBg: "bg-orange-100",
    stats: "Hər gün 100+ yeni istifadəçi",
    category: "community"
  },
  {
    title: "Təsdiqlənmiş istifadəçilər",
    description: "Platforma daxilində bütün istifadəçilər profillərini təsdiqləyirlər, bu da etibarlı əməliyyatlara zəmanət verir.",
    icon: <BadgeCheck className="h-7 w-7 text-blue-600" />,
    iconBg: "bg-blue-100",
    stats: "5,000+ təsdiqlənmiş istifadəçi",
    category: "security"
  },
  {
    title: "Nadir əşyaları tapmaq imkanı",
    description: "Platformada nadir və kolleksiya əşyalarını tapmaq imkanı var. Bazarda olmayan məhsulları kəşf edin.",
    icon: <Sparkles className="h-7 w-7 text-purple-600" />,
    iconBg: "bg-purple-100",
    stats: "1,200+ nadir əşya təklifi",
    category: "variety"
  },
  {
    title: "Heç bir kommisiya və faiz yoxdur",
    description: "BarterTap istifadəçilərə heç bir əlavə xərc olmadan barter əməliyyatları aparmağa imkan verir.",
    icon: <WalletCards className="h-7 w-7 text-amber-600" />,
    iconBg: "bg-amber-100",
    stats: "100% komisyonsuz əməliyyatlar",
    category: "economy"
  },
  {
    title: "Pulsuz çatdırılma təklifləri",
    description: "İstifadəçilər arasında pulsuz və ya ortaq çatdırılma xidmətləri təklif edilir, bu da xərcləri azaldır.",
    icon: <Truck className="h-7 w-7 text-indigo-600" />,
    iconBg: "bg-indigo-100", 
    stats: "500+ pulsuz çatdırılma təklifi",
    category: "services"
  }
];

// Feature list data
const featureList = [
  { text: "Təhlükəsiz profil yoxlaması", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { text: "Şəkil əsaslı axtarış sistemi", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { text: "Canlı çat və bildiriş sistemi", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { text: "Məlumatların şifrələnməsi", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { text: "Qiymətləndirmə və şərhlər", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { text: "Mobil cihazlara uyğunluq", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { text: "24/7 istifadəçi dəstəyi", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { text: "Tez və sadə barter prosesi", icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
];

// Success statistics
const statistics = [
  { value: "15,000+", label: "İstifadəçi", icon: <Users className="h-5 w-5 text-primary" /> },
  { value: "25,000+", label: "Uğurlu barter", icon: <Recycle className="h-5 w-5 text-green-600" /> },
  { value: "98%", label: "Məmnuniyyət səviyyəsi", icon: <Heart className="h-5 w-5 text-red-500" /> },
  { value: "0%", label: "Kommisiya xərci", icon: <PercentCircle className="h-5 w-5 text-amber-500" /> },
];

export default function BenefitsSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 -z-10 opacity-20 blur-3xl">
        <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#367BF5" d="M39.9,-67.1C50.4,-59.5,57,-46.6,63.5,-33.7C70,-20.8,76.5,-7.8,74.9,4.1C73.3,16,63.6,26.9,54.6,38.2C45.6,49.5,37.3,61.2,25.9,68.2C14.6,75.1,0.3,77.4,-13.2,74.1C-26.7,70.7,-39.4,61.7,-48.1,50.5C-56.8,39.2,-61.5,25.6,-66.1,11.1C-70.7,-3.4,-75.1,-18.8,-70.9,-30.9C-66.7,-43,-53.8,-51.7,-40.6,-58.2C-27.3,-64.8,-13.7,-69.2,0.4,-69.8C14.4,-70.5,29.4,-74.7,39.9,-67.1Z" transform="translate(100 100)" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 -z-10 opacity-10 blur-3xl">
        <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#367BF5" d="M45.8,-77.2C59.8,-69.7,72,-57.4,79.8,-42.6C87.6,-27.8,91.1,-10.4,87.8,5.1C84.6,20.7,74.7,34.4,64.1,47.7C53.5,61,42.3,73.8,28.7,78.9C15.1,84.1,-0.9,81.5,-17.4,77.5C-33.9,73.4,-51,67.9,-63.2,57C-75.4,46,-82.8,29.5,-85,12.1C-87.2,-5.3,-84.2,-23.6,-75.9,-38.9C-67.5,-54.3,-53.8,-66.7,-38.7,-73.5C-23.6,-80.4,-7.1,-81.6,8.9,-80.4C24.9,-79.1,31.8,-84.7,45.8,-77.2Z" transform="translate(100 100)" />
        </svg>
      </div>
      
      <div className="container px-4 md:px-6">
        {/* Section header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Badge className="mb-4 px-3 py-1 bg-primary/10 text-primary border-primary/30 rounded-full">
            Niyə BarterTap?
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 relative">
            Barter etməyin <span className="text-primary">üstünlükləri</span>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-primary rounded-full opacity-70"></div>
          </h2>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-4">
            BarterTap.az platforması istifadəçilərə etibarlı, rahat və sürətli barter imkanları təklif edərək istifadə olunmayan əşyaları dəyərli resurslara çevirir.
          </p>
          <p className="text-gray-500">
            <Lock className="inline-block h-4 w-4 mr-1 text-primary" />{" "}
            Platformamızda bütün əməliyyatlar təhlükəsiz və şəffafdır
          </p>
        </motion.div>
        
        {/* Main benefits grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {benefitCards.slice(0, 8).map((benefit, index) => (
            <motion.div 
              key={index}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 group relative overflow-hidden"
              variants={itemVariants}
            >
              {/* Background accent */}
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-white opacity-80 z-0"></div>
              
              {/* Subtle animated pattern */}
              <div 
                className="absolute -right-12 -bottom-12 w-40 h-40 rounded-full bg-gray-50 opacity-30 z-0 group-hover:scale-125 transition-transform duration-700"
                style={{ 
                  backgroundImage: 'radial-gradient(circle at center, rgba(54, 123, 245, 0.1) 0%, transparent 70%)' 
                }}
              ></div>
              
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full ${benefit.iconBg} flex items-center justify-center mb-4 relative z-10 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {benefit.icon}
              </div>
              
              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600 mb-4">
                  {benefit.description}
                </p>
                
                {/* Stats badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-medium group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-300">
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  {benefit.stats}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Statistics bar */}
        <motion.div 
          className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 mb-16 shadow-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {statistics.map((stat, index) => (
              <div 
                key={index} 
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                  {stat.icon}
                </div>
                <h4 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</h4>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
        
        {/* Feature list + CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 relative overflow-hidden"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Platforma özəlliklərimiz
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featureList.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5">{feature.icon}</div>
                    <p className="text-gray-700">{feature.text}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/auth?tab=register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Qeydiyyatdan keç
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Necə işləyir?
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-8 text-white relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full border border-white/20"></div>
              <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full border border-white/20"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/10"></div>
            </div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-6">
                Platforma nəticələrimiz
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <PackageCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">25,000+ Uğurlu Barter</h4>
                    <p className="text-white/80 text-sm">İstifadəçilərimiz arasında tamamlanmış əməliyyatlar</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Leaf className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">7,500+ kg CO₂ Azaldılıb</h4>
                    <p className="text-white/80 text-sm">İkinci əl əşyaların yenidən istifadəsi sayəsində</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <WalletCards className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">4.5M+ AZN Qənaət</h4>
                    <p className="text-white/80 text-sm">İstifadəçilərimizin ümumi qənaət etdiyi məbləğ</p>
                  </div>
                </div>
              </div>
              
              <a 
                href="https://blog.bartertap.az/statistics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-white font-medium hover:text-white/90 transition-colors"
              >
                Daha ətraflı statistika
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}