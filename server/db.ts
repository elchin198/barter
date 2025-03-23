import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load .env file in production
dotenv.config();

// For PostgreSQL connection (development)
export async function createPgConnection() {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  return pool;
}

// For MySQL connection (production)
export async function createMySqlConnection() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL || 
         `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  });
  
  return connection;
}

// Create database connection based on environment
export async function createDbConnection() {
  // Check if we're using MySQL (Hostinger)
  if (process.env.DB_TYPE === 'mysql' || process.env.NODE_ENV === 'production') {
    const connection = await createMySqlConnection();
    return drizzle(connection);
  } else {
    // Default to PostgreSQL for development
    const pool = await createPgConnection();
    const { drizzle } = await import('drizzle-orm/pg-pool');
    return drizzle(pool);
  }
}