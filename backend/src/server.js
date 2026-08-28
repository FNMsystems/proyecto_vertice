import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import personalRoutes from './routes/personalRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/personal', personalRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log(`Conexión exitosa a PostgreSQL (Base de datos: ${process.env.DB_NAME})`);
    console.log(`Servidor backend seguro corriendo en http://localhost:${PORT}`);
  } catch (error) {
    console.error('Error al conectar con PostgreSQL:', error.message);
  }
});