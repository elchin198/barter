import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./leaflet.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
// Import i18n config
import "./i18n";

// Create link element for custom styles
const customCssLink = document.createElement('link');
customCssLink.rel = 'stylesheet';
customCssLink.href = '/custom.css';
document.head.appendChild(customCssLink);

// Get system theme preference on first load
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme");

// Apply theme to document before any rendering
if (savedTheme === "dark" || (savedTheme === "system" && systemPrefersDark) || (!savedTheme && systemPrefersDark)) {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
      <Toaster />
    </AuthProvider>
  </QueryClientProvider>
);
