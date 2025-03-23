import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: "az", name: "Azərbaycan", flag: "🇦🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "en", name: "English", flag: "🇬🇧" }
];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(
    languages.find(lang => lang.code === i18n.language) || languages[0]
  );

  useEffect(() => {
    const foundLang = languages.find(lang => lang.code === i18n.language);
    if (foundLang) {
      setCurrentLanguage(foundLang);
    }
  }, [i18n.language]);

  const changeLanguage = (lng: LanguageOption) => {
    i18n.changeLanguage(lng.code);
    setCurrentLanguage(lng);
    document.documentElement.lang = lng.code;
    localStorage.setItem('i18nextLng', lng.code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 border-none shadow-none bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="mr-1 text-base">{currentLanguage.flag}</span>
          <span className="hidden md:inline-block mx-1">{currentLanguage.code.toUpperCase()}</span>
          <Globe className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{t('common.language', 'Dil')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
            {currentLanguage.code === lang.code && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}