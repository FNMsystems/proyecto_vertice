import { Router } from "express";

import {
  obtenerAnotacionesCurso,
  crearAnotacion,
  eliminarAnotacion
} from "../controllers/anotacionController.js";

import {
  verificarToken,
  esDocente
} from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/curso/:cursoId",
  verificarToken,
  esDocente,
  obtenerAnotacionesCurso
);

router.post(
  "/",
  verificarToken,
  esDocente,
  crearAnotacion
);

router.delete(
  "/:anotacionId",
  verificarToken,
  esDocente,
  eliminarAnotacion
);

export default router;