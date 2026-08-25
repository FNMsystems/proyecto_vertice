import express from 'express';
import { loginFuncionario } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', loginFuncionario);

export default router;