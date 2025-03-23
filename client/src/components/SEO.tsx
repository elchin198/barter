import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  pathName?: string;
  noIndex?: boolean;
  children?: React.ReactNode;
}

export default function SEO({
  title,
  description,
  keywords,
  ogImage = "/logo.png",
  pathName = "",
  noIndex = false,
  children
}: SEOProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  
  // Default title and description from translations
  const defaultTitle = t('seo.defaultTitle', 'BarterTap.az - Pulsuz Əşya Mübadiləsi Platforması');
  const defaultDescription = t(
    'seo.defaultDescription', 
    'BarterTap.az ilə lazımsız əşyalarınızı pulsuz dəyişdirin. Pulunuzu xərcləmədən yeni əşyalar əldə edin.'
  );
  const defaultKeywords = t(
    'seo.defaultKeywords',
    'əşya mübadiləsi, barter, pulsuz mübadilə, second hand, istifadə olunmuş əşyalar, dəyişmək, azərbaycan'
  );

  // Use provided values or defaults
  const seoTitle = title ? `${title} | BarterTap.az` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || defaultKeywords;

  // Create canonical URL with correct language query parameter
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://bartertap.az';
  const fullUrl = `${siteUrl}${pathName}${pathName.includes('?') ? '&' : '?'}lng=${currentLang}`;
  
  return (
    <Helmet>
      {/* Basic meta tags */}
      <html lang={currentLang} />
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      
      {/* Canonical link with language parameter */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Alternative language versions for SEO */}
      <link rel="alternate" href={`${siteUrl}${pathName}${pathName.includes('?') ? '&' : '?'}lng=az`} hrefLang="az" />
      <link rel="alternate" href={`${siteUrl}${pathName}${pathName.includes('?') ? '&' : '?'}lng=ru`} hrefLang="ru" />
      <link rel="alternate" href={`${siteUrl}${pathName}${pathName.includes('?') ? '&' : '?'}lng=en`} hrefLang="en" />
      <link rel="alternate" href={`${siteUrl}${pathName}`} hrefLang="x-default" />
      
      {/* Open Graph tags for social sharing */}
      <meta property="og:site_name" content="BarterTap.az" />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={currentLang} />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* No index if specified */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {children}
    </Helmet>
  );
}