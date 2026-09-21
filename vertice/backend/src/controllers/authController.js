import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import {
  buscarPersonaPorCorreo,
  buscarPersonaPorId,
  actualizarPassword
} from '../models/authModel.js';


export const login = async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    if (!email || !password) {

      return res.status(400).json({
        error:
          'El correo y la contraseña son obligatorios.'
      });

    }

    const persona =
      await buscarPersonaPorCorreo(email);


    if (!persona) {

      return res.status(401).json({
        error:
          'Correo o contraseña incorrectos.'
      });

    }


    if (!persona.password_hash) {

      return res.status(401).json({
        error:
          'Esta cuenta todavía no tiene una contraseña configurada.'
      });

    }


    const passwordCorrecta =
      await bcrypt.compare(
        password,
        persona.password_hash
      );


    if (!passwordCorrecta) {

      return res.status(401).json({
        error:
          'Correo o contraseña incorrectos.'
      });

    }


    let nombre;


    if (persona.rol === 'DOCENTE') {

      nombre = [
        persona.nombres,
        persona.apellido_paterno,
        persona.apellido_materno
      ]
        .filter(Boolean)
        .join(' ');

    } else {

      nombre =
        persona.nombre_completo;

    }


    const payload = {

      id: persona.id,

      rut: persona.rut,

      nombre,

      email: persona.correo,

      rol: persona.rol,

      debe_cambiar_password:
        persona.debe_cambiar_password

    };


    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );


    return res.json({

      token,

      usuario: {

        id: persona.id,

        rut: persona.rut,

        nombre,

        email: persona.correo,

        rol: persona.rol,

        debe_cambiar_password:
          persona.debe_cambiar_password

      }

    });


  } catch (error) {

    console.error(
      'Error en login:',
      error
    );

    return res.status(500).json({
      error:
        'Error interno del servidor.'
    });

  }

};


export const cambiarPassword = async (
  req,
  res
) => {

  try {

    const {
      passwordActual,
      passwordNueva
    } = req.body;


    if (
      !passwordActual ||
      !passwordNueva
    ) {

      return res.status(400).json({
        error:
          'Debe ingresar la contraseña actual y la nueva contraseña.'
      });

    }


    if (passwordNueva.length < 8) {

      return res.status(400).json({
        error:
          'La nueva contraseña debe tener al menos 8 caracteres.'
      });

    }

    const persona =
      await buscarPersonaPorId(
        req.usuario.id,
        req.usuario.rol
      );


    if (!persona) {

      return res.status(404).json({
        error:
          'No se encontró la cuenta.'
      });

    }


    const passwordCorrecta =
      await bcrypt.compare(
        passwordActual,
        persona.password_hash
      );


    if (!passwordCorrecta) {

      return res.status(401).json({
        error:
          'La contraseña actual es incorrecta.'
      });

    }

    const nuevoHash =
      await bcrypt.hash(
        passwordNueva,
        10
      );



    const actualizado =
      await actualizarPassword(
        req.usuario.id,
        req.usuario.rol,
        nuevoHash
      );


    if (!actualizado) {

      return res.status(500).json({
        error:
          'No se pudo actualizar la contraseña.'
      });

    }

    return res.json({
      mensaje:
        'Contraseña actualizada correctamente.'
    });


  } catch (error) {

    console.error(
      'Error cambiando contraseña:',
      error
    );

    return res.status(500).json({
      error:
        'No se pudo cambiar la contraseña.'
    });

  }

};