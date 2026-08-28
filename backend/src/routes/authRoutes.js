import { Router } from 'express';
import { login, registrarPersonal } from './controllers/authController.js';
import { verificarToken, esDirector } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);

router.post('/registro-personal', verificarToken, esDirector, registrarPersonal);

export default router;