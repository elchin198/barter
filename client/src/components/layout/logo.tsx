
import { Link } from "wouter";

type LogoProps = {
  variant?: "dark" | "light";
};

export function Logo({ variant = "dark" }: LogoProps) {
  return (
    <Link href="/" className="flex items-center">
      <img 
        src="/logo.svg" 
        alt="BarterTap.az" 
        className="h-8" 
        onError={(e) => {
          // Logo yüklənməzsə, fallback olaraq barter-logo.png istifadə et
          e.currentTarget.src = "/barter-logo.png";
          e.currentTarget.onerror = null;
        }}
      />
    </Link>
  );
}

export default Logo;
