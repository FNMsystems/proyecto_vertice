import { Router } from 'express';
import { getPersonal, desvincularPersonal } from '../controllers/personalController.js';
import { verificarToken, esDirector } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', verificarToken, getPersonal);

router.put('/:id/desvincular', verificarToken, esDirector, desvincularPersonal);

export default router;