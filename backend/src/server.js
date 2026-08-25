import express from 'express';
import cors from 'cors';
import { usuarios, cursos, asignacionesClases } from './models/mockData.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const usuario = usuarios.find((u) => u.email === email && u.password === password);

  if (!usuario) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  return res.json(usuario);
});

app.get('/api/asistencia/vista/:usuarioId', (req, res) => {
  const userIdNum = Number(req.params.usuarioId);
  const usuario = usuarios.find((u) => Number(u.id) === userIdNum);

  if (!usuario) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const misCursosJefe = cursos.filter((c) => Number(c.profesorJefeId) === userIdNum);
  const misAsignaturas = asignacionesClases
    .filter((a) => Number(a.profesorId) === userIdNum)
    .map((a) => {
      const cursoInfo = cursos.find((c) => Number(c.id) === Number(a.cursoId));
      return {
        ...a,
        nombreCurso: cursoInfo ? cursoInfo.nombre : `Curso #${a.cursoId}`
      };
    });

  return res.json({ usuario, misCursosJefe, misAsignaturas });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});