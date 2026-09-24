import { Router } from 'express';

import {
  getMiDashboard,
  getCursoDocente,
  getInformacionAlumnoDocente,
  getAsistenciaCurso,
  guardarAsistenciaCurso
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

router.get(
  '/me/alumnos/:alumnoId/informacion',
  verificarToken,
  esDocente,
  getInformacionAlumnoDocente
);

router.get(
  '/me/cursos/:cursoId/asistencia',
  verificarToken,
  esDocente,
  getAsistenciaCurso
);

router.post(
  '/me/cursos/:cursoId/asistencia',
  verificarToken,
  esDocente,
  guardarAsistenciaCurso
);


export default router;