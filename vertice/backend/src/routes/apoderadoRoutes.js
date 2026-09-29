import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import {
  verificarToken,
  esApoderado
} from '../middleware/authMiddleware.js';

import {
  getApoderadoByRut,
  getAlumnosByApoderado,
  getMisAlumnos,
  getDetalleAlumno,
  getPersonasAutorizadasRetiro,
  subirJustificativo
} from '../controllers/apoderadoController.js';

const router = Router();

router.get(
  '/me/alumnos',
  verificarToken,
  esApoderado,
  getMisAlumnos
);

router.get(
  '/rut/:rut',
  verificarToken,
  esApoderado,
  getApoderadoByRut
);

router.get(
  '/:id/alumnos',
  verificarToken,
  esApoderado,
  getAlumnosByApoderado
);

router.get(
  '/alumno/:id/detalle',
  verificarToken,
  esApoderado,
  getDetalleAlumno
);

const directorioJustificativos =
  path.resolve(
    'uploads',
    'justificativos'
  );

fs.mkdirSync(
  directorioJustificativos,
  {
    recursive: true
  }
);

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        directorioJustificativos
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      const nombre =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}${extension}`;

      cb(
        null,
        nombre
      );
    }
  });

const upload =
  multer({
    storage,
    limits: {
      fileSize:
        10 * 1024 * 1024
    },
    fileFilter: (
      req,
      file,
      cb
    ) => {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      if (
        extension !== '.pdf' ||
        file.mimetype !==
          'application/pdf'
      ) {
        return cb(
          new Error(
            'Solo se permiten archivos PDF.'
          )
        );
      }

      cb(
        null,
        true
      );
    }
  });

  router.get(
  '/alumno/:id/personas-retiro',
  verificarToken,
  esApoderado,
  getPersonasAutorizadasRetiro
);

router.post(
  '/alumno/:id/justificativo',
  verificarToken,
  esApoderado,
  upload.single('archivo'),
  subirJustificativo
);

export default router;