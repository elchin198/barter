import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, ChevronLeft, Home } from "lucide-react";
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';

interface NotFoundProps {
  title?: string;
  message?: string;
  showGoBack?: boolean;
  showHome?: boolean;
}

export default function NotFound({
  title,
  message,
  showGoBack = true,
  showHome = true
}: NotFoundProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <SEO 
        title={title || t('errors.notFoundTitle', 'Səhifə tapılmadı')} 
        description={message || t('errors.notFoundDescription', 'Axtardığınız məlumat mövcud deyil və ya silinmişdir.')}
        noIndex={true}
      />
      
      <img src="/barter-logo.png" alt="BarterTap" className="w-16 h-16 mb-6" />
      
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {title || t('errors.notFoundTitle', 'Səhifə tapılmadı')}
            </h1>
            <p className="text-muted-foreground">
              {message || t('errors.notFoundDescription', 'Axtardığınız məlumat mövcud deyil və ya silinmişdir.')}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-4 justify-center pb-6">
          {showGoBack && (
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('common.goBack', 'Geri dön')}
            </Button>
          )}
          
          {showHome && (
            <Button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              {t('common.homePage', 'Ana səhifə')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
