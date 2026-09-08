import { Router } from 'express';
import { login, registrarPersonal } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);

router.post('/registro', registrarPersonal);

export default router;