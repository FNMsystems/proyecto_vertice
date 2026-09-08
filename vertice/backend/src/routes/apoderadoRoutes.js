import { Router } from 'express';
import { getAlumnosByApoderado, getDetalleAlumno } from '../controllers/apoderadoController.js';

const router = Router();

router.get('/:id/alumnos', getAlumnosByApoderado);
router.get('/alumno/:id/detalle', getDetalleAlumno);

export default router;