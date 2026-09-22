import { Router } from 'express';

import {
  getMiDashboard,
  getCursoDocente
} from '../controllers/docenteController.js';

import {
  verificarToken,
  esDocente
} from '../middleware/authMiddleware.js';

const router = Router();

router.get(
  '/me/dashboard',
  verificarToken,
  esDocente,
  getMiDashboard
);

router.get(
  '/me/cursos/:cursoId',
  verificarToken,
  esDocente,
  getCursoDocente
);

export default router;