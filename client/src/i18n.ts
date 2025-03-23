import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

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
    fallbackLng: 'az',
    debug: true,
    supportedLngs: ['az', 'ru', 'en'],
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    // Configure backend
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // React does not need escaping
    interpolation: {
      escapeValue: false,
    },

    // Initialize with empty resources to avoid warnings on first load
    resources: {
      az: {
        translation: {
          common: {
            home: 'Ana Səhifə',
            allItems: 'Bütün Əşyalar',
            categories: 'Kateqoriyalar',
            howItWorks: 'Necə İşləyir',
            addItem: 'Əşya Əlavə Et',
            login: 'Daxil ol',
            register: 'Qeydiyyat'
          }
        }
      }
    }
  });

export default i18n;