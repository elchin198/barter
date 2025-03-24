import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes-simplified"; // *** Changed to use new simplified routes
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import cors from "cors";
import { configureSession } from "./session";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cookieParser from "cookie-parser";

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

// Initialize Express application
const app = express();

// Configure Express middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies

// Configure CORS with dynamic origin based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://bartertap.az', 'https://www.bartertap.az'] 
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Session-ID'] // Expose custom headers for debugging
};
app.use(cors(corsOptions));

// Configure session middleware
const sessionMiddleware = configureSession();
app.use(sessionMiddleware);

// Log all cookies in requests for debugging
app.use((req, res, next) => {
  console.log('REQUEST COOKIES:', req.headers.cookie);
  
  // Clear any old session cookies to prevent conflicts
  if (req.headers.cookie && (
    req.headers.cookie.includes('bartertap.sid') || 
    req.headers.cookie.includes('bartertap_sid') ||
    req.headers.cookie.includes('connect.sid') ||
    req.headers.cookie.includes('bartersession')
  )) {
    // Just clear all old cookies except our new one
    if (!req.headers.cookie.includes('bartertap=')) {
      res.clearCookie('bartertap.sid', { path: '/' });
      res.clearCookie('bartertap_sid', { path: '/' });
      res.clearCookie('connect.sid', { path: '/' });
      res.clearCookie('bartersession', { path: '/' });
      console.log('Cleared old session cookies');
    }
  }
  
  next();
});

// Log API requests with timing and response data
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON response for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log API requests on completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Add response data to log if available
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate log lines that are too long
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

// Serve uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Initialize application
(async () => {
  try {
    // Register API routes and get HTTP server
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Application error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Set up frontend serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = process.env.PORT || 5000;
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
