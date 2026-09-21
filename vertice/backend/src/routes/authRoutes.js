import { Router } from 'express';

import {
  login,
  cambiarPassword
} from '../controllers/authController.js';

import {
  verificarToken
} from '../middleware/authMiddleware.js';


const router = Router();


router.post(
  '/login',
  login
);

router.put(
  '/cambiar-password',
  verificarToken,
  cambiarPassword
);


export default router;