import {
  generarSolicitudRetiroQRModel,
  validarRetiroQRModel,
  confirmarRetiroModel
} from '../models/inspectoriaModel.js';

export const generarSolicitudRetiroQR = async (
  req,
  res
) => {
  try {
    const {
      alumnoId,
      personaAutorizadaId,
      motivo,
      observacion
    } = req.body;

    if (
      !alumnoId ||
      !personaAutorizadaId ||
      !motivo
    ) {
      return res.status(400).json({
        error:
          'El alumno, la persona autorizada y el motivo son obligatorios.'
      });
    }

    if (req.usuario?.rol !== 'APODERADO') {
      return res.status(403).json({
        error:
          'Solo los apoderados pueden generar solicitudes de retiro.'
      });
    }

    if (!req.usuario?.rut) {
      return res.status(403).json({
        error:
          'La sesión no contiene un RUT válido.'
      });
    }

    const resultado =
      await generarSolicitudRetiroQRModel(
        alumnoId,
        req.usuario.rut,
        personaAutorizadaId,
        motivo,
        observacion
      );

    return res.status(201).json({
      mensaje:
        'Solicitud de retiro creada correctamente.',
      solicitud: resultado.solicitud,
      alumno: resultado.alumno,
      curso: resultado.curso,
      personaAutorizada: {
        id:
          resultado.personaAutorizada.id,
        nombre:
          resultado.personaAutorizada.nombre_completo,
        rut:
          resultado.personaAutorizada.rut,
        parentesco:
          resultado.personaAutorizada.parentesco,
        telefono:
          resultado.personaAutorizada.telefono,
        numeroAutorizacion:
          resultado.personaAutorizada.numero_autorizacion
      }
    });
  } catch (error) {
    console.error(
      'Error generando solicitud de retiro QR:',
      error
    );

    return res.status(409).json({
      error:
        error.message ||
        'No se pudo generar la solicitud de retiro.'
    });
  }
};

export const validarQR = async (
  req,
  res
) => {
  try {
    const {
      codigoQR
    } = req.body;

    if (!codigoQR) {
      return res.status(400).json({
        error:
          'Debe proporcionar el código QR.'
      });
    }

    const datosRetiro =
      await validarRetiroQRModel(
        codigoQR
      );

    if (!datosRetiro) {
      return res.status(404).json({
        error:
          'Código QR inválido.'
      });
    }

    if (
      datosRetiro.estado !==
      'PENDIENTE'
    ) {
      return res.status(409).json({
        error:
          'Este código QR ya fue procesado.',
        estado:
          datosRetiro.estado
      });
    }

    if (
      datosRetiro.fecha_expiracion &&
      new Date(
        datosRetiro.fecha_expiracion
      ) <= new Date()
    ) {
      return res.status(409).json({
        error:
          'Este código QR está expirado.'
      });
    }

    return res.json({
      retiro: {
        id:
          datosRetiro.id,

        codigoQR:
          datosRetiro.codigo_qr,

        estado:
          datosRetiro.estado,

        motivo:
          datosRetiro.motivo,

        observacion:
          datosRetiro.observacion,

        fechaGeneracion:
          datosRetiro.fecha_generacion,

        fechaExpiracion:
          datosRetiro.fecha_expiracion
      },

      alumno: {
        id:
          datosRetiro.alumno_id,

        nombre:
          datosRetiro.alumno_nombre,

        rut:
          datosRetiro.alumno_rut,

        cursoId:
          datosRetiro.curso_id,

        curso:
          datosRetiro.curso_nombre
      },

      personaAutorizada: {
        id:
          datosRetiro.persona_autorizada_id,

        nombre:
          datosRetiro.persona_nombre,

        rut:
          datosRetiro.persona_rut,

        parentesco:
          datosRetiro.persona_parentesco,

        telefono:
          datosRetiro.persona_telefono,

        numeroAutorizacion:
          datosRetiro.numero_autorizacion
      }
    });
  } catch (error) {
    console.error(
      'Error validando QR:',
      error
    );

    return res.status(500).json({
      error:
        'No se pudo validar el código QR.'
    });
  }
};

export const confirmarRetiro = async (
  req,
  res
) => {
  try {
    const {
      solicitudId,
      alumnoId,
      cursoId,
      motivo,
      observacion
    } = req.body;

    if (
      !solicitudId ||
      !alumnoId ||
      !cursoId
    ) {
      return res.status(400).json({
        error:
          'Faltan datos obligatorios para confirmar el retiro.'
      });
    }

    const retiro =
      await confirmarRetiroModel(
        solicitudId,
        alumnoId,
        cursoId,
        motivo,
        observacion
      );

    return res.json({
      mensaje:
        'Retiro autorizado y registrado correctamente.',
      retiro
    });
  } catch (error) {
    console.error(
      'Error confirmando retiro:',
      error
    );

    return res.status(409).json({
      error:
        error.message
    });
  }
};