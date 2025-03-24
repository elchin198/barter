import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon, LogInIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";

export default function UnauthorizedPage() {
  const [_, navigate] = useLocation();
  const { t } = useTranslation();
  
  return (
    <>
      <SEO 
        title={t("errors.unauthorized.title")}
        description={t("errors.unauthorized.description")}
      />
      <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <LockIcon className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <CardTitle className="text-2xl">{t("errors.unauthorized.title")}</CardTitle>
            <CardDescription>
              {t("errors.unauthorized.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              {t("errors.unauthorized.message")}
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
            >
              {t("common.home")}
            </Button>
            <Button 
              onClick={() => navigate("/auth")} 
              className="gap-2"
            >
              <LogInIcon className="h-4 w-4" />
              {t("auth.loginToAccount")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}