import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Theme = "light" | "dark" | "system";

export function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // When mounted on client, now we can show the UI
  useEffect(() => {
    setMounted(true);
    // Get the current theme from local storage
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check if user prefers dark mode
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Handle theme change
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // Render an empty div if not mounted (to prevent hydration issues)
  if (!mounted) {
    return null;
  }

  // Get current theme icon
  const getThemeIcon = () => {
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    if (theme === "light") return <Sun className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  // Mobile version (simplified)
  if (mobile) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleThemeChange("light")}
          className={`p-2 rounded-md transition-colors ${
            theme === "light" ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Sun className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleThemeChange("dark")}
          className={`p-2 rounded-md transition-colors ${
            theme === "dark" ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Moon className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleThemeChange("system")}
          className={`p-2 rounded-md transition-colors ${
            theme === "system" ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          <Monitor className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Desktop version (dropdown)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleThemeChange("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>İşıqlı</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Qaranlıq</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>Sistem</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>Mövzu dəyişdir</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}