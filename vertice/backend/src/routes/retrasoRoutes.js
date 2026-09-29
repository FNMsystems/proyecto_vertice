import { Router } from 'express';

import {
  verificarToken,
  esInspector
} from '../middleware/authMiddleware.js';

import {
  obtenerCursosInspector,
  obtenerAlumnosCurso,
  registrarRetraso
} from '../controllers/retrasoController.js';

const router = Router();

router.get(
  '/cursos',
  verificarToken,
  esInspector,
  obtenerCursosInspector
);

router.get(
  '/cursos/:cursoId/alumnos',
  verificarToken,
  esInspector,
  obtenerAlumnosCurso
);

router.post(
  '/',
  verificarToken,
  esInspector,
  registrarRetraso
);

export default router;