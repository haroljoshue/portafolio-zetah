import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not defined in the environment variables!');
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  ssl: false // Disable SSL for local database connection
});

pool.on('connect', (client) => {
  client.query("SET client_encoding TO 'UTF8'")
    .catch(err => console.error('Error setting client encoding to UTF8', err));
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});
