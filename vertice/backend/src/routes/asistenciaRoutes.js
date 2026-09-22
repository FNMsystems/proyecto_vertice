import { Router } from "express";

import {
  obtenerAsistencia,
  guardarAsistencia
} from "../controllers/asistenciaController.js";

import {
  verificarToken,
  esDocente
} from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/curso/:cursoId",
  verificarToken,
  esDocente,
  obtenerAsistencia
);

router.post(
  "/",
  verificarToken,
  esDocente,
  guardarAsistencia
);

export default router;