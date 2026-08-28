import { Router } from 'express';
import { getAlumnos, getAlumnoPorId, expulsarAlumno } from '../controllers/alumnoController.js';
import { verificarToken, esDirector } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', verificarToken, getAlumnos);
router.get('/:id', verificarToken, getAlumnoPorId);
router.put('/:id/expulsar', verificarToken, esDirector, expulsarAlumno);

export default router;