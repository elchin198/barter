import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Helper function to set HTML lang attribute
const setHtmlLang = (lng: string): void => {
  document.documentElement.lang = lng;
};

// i18n initialization
i18n
  // Load translations using HTTP
  .use(HttpBackend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    initAsync: true,
    fallbackLng: 'az',
    debug: process.env.NODE_ENV === 'development',
    supportedLngs: ['az', 'ru', 'en'],
    
    // Language detection options
    detection: {
      order: ['localStorage', 'querystring', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
      cookieMinutes: 525600, // 1 year
    },

    // Configure backend for loading translations from public/locales folder
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'default',
      }
    },

    // React does not need escaping
    interpolation: {
      escapeValue: false,
    }
  });

// Set the HTML lang attribute whenever language changes
i18n.on('languageChanged', (lng) => {
  setHtmlLang(lng);
  
  // Store the language preference
  localStorage.setItem('i18nextLng', lng);
});

// Set initial HTML lang attribute
setHtmlLang(i18n.language);

export default i18n;