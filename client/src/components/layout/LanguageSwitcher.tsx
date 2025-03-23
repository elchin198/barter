import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

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
  const { i18n } = useTranslation();
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
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <span className="mr-1">{currentLanguage.flag}</span>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang)}
            className={`flex items-center gap-2 ${
              currentLanguage.code === lang.code ? "font-bold" : ""
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}