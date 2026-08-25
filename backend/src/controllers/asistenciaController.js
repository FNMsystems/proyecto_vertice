import { usuarios, cursos, asignacionesClases } from '../models/mockData.js';

export const getVistaPrincipal = (req, res) => {
  const { usuarioId } = req.params;
  const userIdNum = Number(usuarioId);

  // 1. Buscar usuario
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
        id: a.id,
        cursoId: a.cursoId,
        nombreCurso: cursoInfo ? cursoInfo.nombre : `Curso #${a.cursoId}`,
        asignatura: a.asignatura,
        dias: a.dias,
        horario: a.horario
      };
    });

  return res.json({
    usuario,
    misCursosJefe,
    misAsignaturas
  });
};