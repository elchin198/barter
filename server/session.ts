import session from 'express-session';
import memoryStore from 'memorystore';
import dotenv from 'dotenv';

// Load .env file in production
dotenv.config();

const MemoryStore = memoryStore(session);

// Configure session for development (in-memory) or production (MySQL)
export function configureSession() {
  // Default in-memory session store for development
  const sessionOptions: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'bartertap-secret-key',
    resave: false,
    saveUninitialized: true, // Changed to true for development
    cookie: { 
      secure: false, // Set to false in development to work with HTTP
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax'
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