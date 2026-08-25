import { usuarios, cursos, asignacionesClases } from '../models/mockData.js';

export const loginFuncionario = (req, res) => {
  const { email, password } = req.body;

  if (!email.endsWith('@ordendesanjorge.cl')) {
    return res.status(400).json({ 
      message: 'El correo debe pertenecer al dominio @ordendesanjorge.cl' 
    });
  }

  const usuario = usuarios.find(
    (u) => u.email === email && u.password === password
  );

  if (!usuario) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  let misCursosJefe = [];
  let misAsignaturas = [];

  if (usuario.rol === 'PROFESOR') {
    const userIdNum = Number(usuario.id);

    // Mantiene la búsqueda en mockData sin modificar roles de los demás
    misCursosJefe = cursos.filter(c => Number(c.profesorJefeId) === userIdNum);
    
    misAsignaturas = asignacionesClases
      .filter(a => Number(a.profesorId) === userIdNum)
      .map(a => {
        const cursoInfo = cursos.find(c => Number(c.id) === Number(a.cursoId));
        return {
          ...a,
          nombreCurso: cursoInfo ? cursoInfo.nombre : `Curso #${a.cursoId}`
        };
      });
  }

  return res.json({
    message: 'Login exitoso',
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      misCursosJefe,
      misAsignaturas
    }
  });
};