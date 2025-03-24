import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShieldAlert, ChevronLeft, LogIn } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import SEO from '@/components/SEO';

export default function Unauthorized() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <SEO 
        title={t('errors.unauthorizedTitle', 'Giriş qadağandır')} 
        description={t('errors.unauthorizedDescription', 'Bu səhifəyə giriş üçün icazəniz yoxdur.')}
        noIndex={true}
      />
      
      <img src="/barter-logo.png" alt="BarterTap" className="w-16 h-16 mb-6" />
      
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <ShieldAlert className="h-16 w-16 text-amber-500 mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('errors.unauthorizedTitle', 'Giriş qadağandır')}
            </h1>
            <p className="text-muted-foreground mb-2">
              {t('errors.unauthorizedDescription', 'Bu səhifəyə giriş üçün icazəniz yoxdur.')}
            </p>
            {user ? (
              <p className="text-sm text-muted-foreground mt-2">
                {t('errors.unauthorizedAdminRequired', 'Bu səhifəni görmək üçün admin icazələri tələb olunur.')}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-2">
                {t('errors.unauthorizedLoginRequired', 'Bu səhifəni görmək üçün əvvəlcə hesabınıza daxil olmalısınız.')}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-4 justify-center pb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('common.goBack', 'Geri dön')}
          </Button>
          
          {!user ? (
            <Button 
              onClick={() => navigate('/login')}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              {t('common.login', 'Daxil ol')}
            </Button>
          ) : (
            <Button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              {t('common.homePage', 'Ana səhifə')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}