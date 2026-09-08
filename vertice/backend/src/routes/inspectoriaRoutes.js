import { Router } from 'express';
import { 
  getAlumnosCurso, 
  registrarAtraso, 
  validarQR, 
  confirmarRetiro 
} from '../controllers/inspectoriaController.js';

const router = Router();

router.get('/alumnos', getAlumnosCurso);
router.post('/atrasos', registrarAtraso);
router.post('/validar-qr', validarQR);
router.post('/confirmar-retiro', confirmarRetiro);

export default router;