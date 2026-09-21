import { Router } from 'express';

import {
  obtenerMiDashboard
} from '../controllers/docenteController.js';

import {
  verificarToken
} from '../middleware/authMiddleware.js';


const router = Router();


router.get(
  '/me/dashboard',
  verificarToken,
  obtenerMiDashboard
);


export default router;