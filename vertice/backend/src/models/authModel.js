import { query } from "../config/db.js";

export const buscarPersonaPorCorreo = async (identificador) => {
  const docenteQuery = `
    SELECT
      id,
      rut,
      nombres,
      apellido_paterno,
      apellido_materno,
      correo,
      telefono,
      especialidad,
      rol,
      activo,
      password_hash,
      debe_cambiar_password,
      'DOCENTE' AS tipo_persona
    FROM docentes
    WHERE LOWER(correo) = LOWER($1)
      AND activo = TRUE
    LIMIT 1;
  `;

  const docenteResult = await query(docenteQuery, [identificador]);

  if (docenteResult.rows.length > 0) {
    return docenteResult.rows[0];
  }

  const apoderadoQuery = `
    SELECT
      id,
      rut,
      nombre_completo,
      telefono,
      correo,
      direccion,
      comuna,
      nacionalidad,
      password_hash,
      debe_cambiar_password,
      'APODERADO' AS rol,
      'APODERADO' AS tipo_persona
    FROM apoderados
    WHERE LOWER(correo) = LOWER($1)
       OR REPLACE(REPLACE(UPPER(rut), '.', ''), '-', '') =
          REPLACE(REPLACE(UPPER($1), '.', ''), '-', '')
    LIMIT 1;
  `;

  const apoderadoResult = await query(apoderadoQuery, [identificador]);

  if (apoderadoResult.rows.length > 0) {
    return apoderadoResult.rows[0];
  }

  return null;
};

export const buscarPersonaPorId = async (id, rol) => {
  if (
    rol === "DOCENTE" ||
    rol === "INSPECTORA" ||
    rol === "INSPECTORIA" ||
    rol === "INSPECTOR" ||
    rol === "INSPECTOR_GENERAL"
  ) {
    const { rows } = await query(
      `
        SELECT
          id,
          password_hash,
          debe_cambiar_password
        FROM docentes
        WHERE id = $1
          AND activo = TRUE
        LIMIT 1;
      `,
      [id],
    );

    return rows[0] || null;
  }

  if (rol === "APODERADO") {
    const { rows } = await query(
      `
        SELECT
          id,
          password_hash,
          debe_cambiar_password
        FROM apoderados
        WHERE id = $1
        LIMIT 1;
      `,
      [id],
    );

    return rows[0] || null;
  }

  return null;
};

export const actualizarPassword = async (id, rol, passwordHash) => {
  if (rol === "DOCENTE" || rol === "INSPECTOR_GENERAL" || rol === "INSPECTOR") {
    const { rows } = await query(
      `
        UPDATE docentes
        SET
          password_hash = $1,
          debe_cambiar_password = FALSE,
          actualizado_en = NOW()
        WHERE id = $2
        RETURNING id;
      `,
      [passwordHash, id],
    );

    return rows[0] || null;
  }

  if (rol === "APODERADO") {
    const { rows } = await query(
      `
        UPDATE apoderados
        SET
          password_hash = $1,
          debe_cambiar_password = FALSE,
          actualizado_en = NOW()
        WHERE id = $2
        RETURNING id;
      `,
      [passwordHash, id],
    );

    return rows[0] || null;
  }

  return null;
};
