import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";
import { configureSession } from "./session";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in production
dotenv.config();

// Ensure uploads directories exist
const uploadsDir = path.join(process.cwd(), 'public/uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const itemsDir = path.join(uploadsDir, 'items');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });
if (!fs.existsSync(itemsDir)) fs.mkdirSync(itemsDir, { recursive: true });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS with dynamic origin based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://bartertap.az', 'https://www.bartertap.az'] 
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['X-Session-ID'] // Expose custom headers for debugging
};
app.use(cors(corsOptions));

// Configure cookie parser (express.js built-in)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure session based on environment
const sessionMiddleware = configureSession();
app.use(sessionMiddleware);

// Log all cookies in requests for debugging
app.use((req, res, next) => {
  console.log('REQUEST COOKIES:', req.headers.cookie);
  next();
});

// Debug session middleware
app.use((req, res, next) => {
  if (req.session) {
    console.log(`Session: ID=${req.session.id}, UserID=${req.session.userId || 'none'}, Username=${req.session.username || 'none'}`);
    
    // Clear out old cookies to prevent conflicts
    if (req.headers.cookie && (
      req.headers.cookie.includes('bartertap.sid') || 
      req.headers.cookie.includes('bartertap_sid') ||
      req.headers.cookie.includes('connect.sid')
    )) {
      // Only set these headers if the current cookie doesn't match our expected name
      if (!req.headers.cookie.includes('bartersession')) {
        res.clearCookie('bartertap.sid');
        res.clearCookie('bartertap_sid');
        res.clearCookie('connect.sid');
        console.log('Cleared old session cookies');
      }
    }
  } else {
    console.log('No session found!');
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Serve locales folder for translations
const localesPath = path.join(process.cwd(), 'public/locales');
app.use('/locales', express.static(localesPath));

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use dynamic port configuration for Hostinger
  // PORT environment variable will be set on the server
  const port = process.env.PORT || 5000;
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
