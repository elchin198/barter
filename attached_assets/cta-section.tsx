import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-[#367BF5] to-[#2563eb] p-10 sm:p-14 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-white/10 blur-xl"></div>
      </div>
      
      <div className="relative z-10 text-center">
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
          Arzu etdiyiniz əşyaları barter edin!
        </h2>
        <p className="text-white/90 max-w-2xl mx-auto mb-10 text-lg">
          Artıq istifadə etmədiyiniz əşyalarınızı paylaşın, sizə lazım olan yeni əşyalar əldə edin. 
          BarterTap.az vasitəsilə tez və asant şəkildə dəyişdirin!
        </p>
        <div className="flex items-center justify-center gap-5 flex-col sm:flex-row">
          <Link href="/auth">
            <Button className="bg-white hover:bg-white/90 text-[#367BF5] font-semibold w-full sm:w-auto px-8" size="lg">
              İndi başla
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/search">
            <Button variant="outline" className="border-white text-white hover:bg-white/10 border-2 w-full sm:w-auto font-semibold px-8" size="lg">
              Bütün elanları gör
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}