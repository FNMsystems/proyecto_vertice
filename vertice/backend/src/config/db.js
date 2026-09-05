import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
pool.on('connect', () => {
    console.log('Conectado exitosamente a PostgreSQL en Supabase');
});

pool.on('error', (err) => {
    console.error('Error imprevisto en el Pool de PostgreSQL:', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;