import { Router } from "express";
import {
  getCursos,
  getAlumnosPorCurso,
  registrarAtraso,
  getRetiroPorId,
  getTodosLosRetiros,
  getEstudiantesSecretaria,
  getJustificativos,
  cambiarEstadoJustificativo,
  registrarMatricula
} from "../controllers/secretariaController.js";


const router = Router();



router.get("/cursos", getCursos);
router.get("/cursos/:cursoId/alumnos", getAlumnosPorCurso);
router.post("/atrasos", registrarAtraso);



router.get("/validar-qr/:id", getRetiroPorId);
router.get("/retiros-recientes", getTodosLosRetiros);



router.get("/estudiantes", getEstudiantesSecretaria);
router.get("/justificativos", getJustificativos);
router.patch("/justificativos/:id/estado", cambiarEstadoJustificativo);
router.post("/matriculas", registrarMatricula);


export default router;
