import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  buscarUsuarioPorEmail, 
  crearUsuarioModel, 
  crearPersonalModel 
} from '../models/userModel.js';


export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await buscarUsuarioPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas (Usuario no encontrado).' });
    }

    const coinciden = await bcrypt.compare(password, usuario.password);
    if (!coinciden) {
      return res.status(401).json({ error: 'Credenciales inválidas (Contraseña incorrecta).' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } 
    );

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno en el servidor' });
  }
};

export const registrarPersonal = async (req, res) => {
  const { nombre, email, password, rol, rut, telefono, tituloProfesional, fechaIngreso } = req.body;

  try {

    const existe = await buscarUsuarioPorEmail(email);
    if (existe) {
      return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
    }

    const saltRounds = 10;
    const passwordHasheada = await bcrypt.hash(password, saltRounds);

    const nuevoUsuario = await crearUsuarioModel(nombre, email, passwordHasheada, rol);

    const nuevoPersonal = await crearPersonalModel(
      nuevoUsuario.id, 
      rut, 
      telefono, 
      tituloProfesional, 
      fechaIngreso || new Date()
    );

    res.status(201).json({
      mensaje: 'Funcionario registrado exitosamente con clave encriptada',
      usuario: nuevoUsuario,
      personal: nuevoPersonal
    });

  } catch (error) {
    console.error('Error al registrar personal:', error);
    res.status(500).json({ error: 'Error al registrar el nuevo funcionario' });
  }
};