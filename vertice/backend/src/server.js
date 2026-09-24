import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import personalRoutes from './routes/personalRoutes.js';
import alumnoRoutes from './routes/alumnoRoutes.js';
import docenteRoutes from './routes/docenteRoutes.js';
import notaRoutes from "./routes/notaRoutes.js";
import anotacionRoutes from "./routes/anotacionRoutes.js";
import asistenciaRoutes from "./routes/asistenciaRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/alumnos', alumnoRoutes);
app.use('/api/docentes', docenteRoutes);
app.use("/api/notas", notaRoutes);
app.use("/api/anotaciones", anotacionRoutes);
app.use("/api/asistencia", asistenciaRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {

  try {

    await pool.query('SELECT NOW()');

    console.log(
      `Conexión exitosa a PostgreSQL`
    );

    console.log(
      `Servidor backend corriendo en http://localhost:${PORT}`
    );

  } catch (error) {

    console.error(
      'Error al conectar con PostgreSQL:',
      error.message
    );

  }

});