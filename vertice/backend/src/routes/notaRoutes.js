import { Router } from "express";

import {
  obtenerNotasCurso,
  crearNota,
  eliminarNota
} from "../controllers/notaController.js";

import {
  verificarToken,
  esDocente
} from "../middleware/authMiddleware.js";

const router = Router();

router.get(
  "/curso/:cursoId",
  verificarToken,
  esDocente,
  obtenerNotasCurso
);

router.post(
  "/",
  verificarToken,
  esDocente,
  crearNota
);

router.delete(
  "/:notaId",
  verificarToken,
  esDocente,
  eliminarNota
);

export default router;