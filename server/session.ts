import session from 'express-session';
import memoryStore from 'memorystore';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load .env file in production
dotenv.config();

// Create a fixed secret for testing that won't change on restart
// In production, this should be an environment variable
const SESSION_SECRET = 'bartertap-fixed-development-secret-2025';

const MemoryStore = memoryStore(session);

// Configure session for development (in-memory) or production (MySQL)
export function configureSession() {
  // Use the fixed secret for consistency between server restarts
  const sessionSecret = process.env.SESSION_SECRET || SESSION_SECRET;
  
  // Default in-memory session store for development
  const sessionOptions: session.SessionOptions = {
    name: 'bartersession', // IMPORTANT: Single consistent name
    secret: sessionSecret,
    resave: true, // Save session on every request
    saveUninitialized: true, // Create session for all visitors
    cookie: { 
      secure: false, // Must be false in development for HTTP
      httpOnly: true,
      sameSite: 'lax', // Use 'lax' mode for better browser compatibility
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days for longer sessions
      path: '/' // Ensure cookie is available for the entire site
    },
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  };

  // In production with MySQL, use MySQL session store
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    try {
      const MySQLStore = require('express-mysql-session')(session);
      
      // Parse database URL or use separate environment variables
      let dbConfig: any = {};
      
      if (process.env.DATABASE_URL) {
        // Parse the connection string
        const dbUrl = new URL(process.env.DATABASE_URL);
        dbConfig = {
          host: dbUrl.hostname,
          port: parseInt(dbUrl.port || '3306'),
          user: dbUrl.username,
          password: dbUrl.password,
          database: dbUrl.pathname.substring(1), // remove leading slash
        };
      } else {
        // Fallback to individual variables
        dbConfig = {
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '3306'),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        };
      }

      // Create MySQL session store
      const sessionStore = new MySQLStore(dbConfig);

      // Use MySQL session store
      sessionOptions.store = sessionStore;
      console.log('Using MySQL session store');
    } catch (error) {
      console.error('Failed to initialize MySQL session store, fallback to Memory store:', error);
    }
  } else {
    console.log('Using Memory session store');
  }

  return session(sessionOptions);
}