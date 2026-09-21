import jwt from 'jsonwebtoken';

export const verificarToken = (
  req,
  res,
  next
) => {

  const authHeader =
    req.headers['authorization'];


  const token =
    authHeader &&
    authHeader.split(' ')[1];


  if (!token) {

    return res.status(401).json({
      error:
        'Acceso denegado. No se proporcionó un token de sesión.'
    });

  }


  try {

    const verificado =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    req.usuario = verificado;


    next();


  } catch (error) {

    return res.status(403).json({
      error:
        'Token inválido o expirado.'
    });

  }

};


export const esDocente = (
  req,
  res,
  next
) => {

  if (req.usuario?.rol !== 'DOCENTE') {

    return res.status(403).json({
      error:
        'Acceso denegado. Solo docentes.'
    });

  }

  next();
};


export const esApoderado = (
  req,
  res,
  next
) => {

  if (req.usuario?.rol !== 'APODERADO') {

    return res.status(403).json({
      error:
        'Acceso denegado. Solo apoderados.'
    });

  }

  next();
};


export const esDirector = (
  req,
  res,
  next
) => {

  if (
    req.usuario?.rol !== 'DIRECTOR' &&
    req.usuario?.rol !== 'ADMIN'
  ) {

    return res.status(403).json({
      error:
        'Acceso denegado. Solo la Dirección puede realizar esta acción.'
    });

  }

  next();
};