import { Router } from 'express';

import {
  verificarToken,
  esApoderado
} from '../middleware/authMiddleware.js';

import {
  generarSolicitudRetiroQR,
  validarQR,
  confirmarRetiro
} from '../controllers/inspectoriaController.js';

const router = Router();

router.post(
  '/generar-qr',
  verificarToken,
  esApoderado,
  generarSolicitudRetiroQR
);

router.post(
  '/validar-qr',
  verificarToken,
  validarQR
);

router.post(
  '/confirmar-retiro',
  verificarToken,
  confirmarRetiro
);

export default router;