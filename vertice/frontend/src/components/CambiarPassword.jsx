import React, { useState } from 'react';
import { cambiarPasswordService } from '../services/authService.js';
import logo from '../img/logo_Institucional.png';
import './CambiarPassword.css';

function CampoPassword({
  label,
  valor,
  cambiar,
  mostrar,
  alternar,
  placeholder,
  autoComplete
}) {
  return (
    <div className="cp-campo">
      <label>{label}</label>

      <div className="cp-input-contenedor">
        <span className="cp-icono-candado">●</span>

        <input
          type={mostrar ? 'text' : 'password'}
          value={valor}
          onChange={(e) => cambiar(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
        />

        <button
          type="button"
          className="cp-ver-password"
          onClick={alternar}
          aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {mostrar ? 'Ocultar' : 'Ver'}
        </button>
      </div>
    </div>
  );
}

export default function CambiarPassword() {
  const [abierto, setAbierto] = useState(false);

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  const limpiarFormulario = () => {
    setPasswordActual('');
    setPasswordNueva('');
    setConfirmarPassword('');

    setMensaje('');
    setTipoMensaje('');

    setMostrarActual(false);
    setMostrarNueva(false);
    setMostrarConfirmar(false);
  };

  const cerrarPanel = () => {
    if (cargando) return;

    setAbierto(false);
    limpiarFormulario();
  };

  const guardarPassword = async (e) => {
    e.preventDefault();

    setMensaje('');
    setTipoMensaje('');

    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      setMensaje('Completa todos los campos.');
      setTipoMensaje('error');
      return;
    }

    if (passwordNueva.length < 8) {
      setMensaje('La nueva contraseña debe tener al menos 8 caracteres.');
      setTipoMensaje('error');
      return;
    }

    if (passwordActual === passwordNueva) {
      setMensaje('La nueva contraseña debe ser diferente de la actual.');
      setTipoMensaje('error');
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      setMensaje('Las contraseñas nuevas no coinciden.');
      setTipoMensaje('error');
      return;
    }

    try {
      setCargando(true);

      const respuesta = await cambiarPasswordService(
        passwordActual,
        passwordNueva
      );

      setMensaje(
        respuesta.mensaje || 'Tu contraseña se actualizó correctamente.'
      );
      setTipoMensaje('exito');

      setPasswordActual('');
      setPasswordNueva('');
      setConfirmarPassword('');

      setMostrarActual(false);
      setMostrarNueva(false);
      setMostrarConfirmar(false);

    } catch (error) {
      setMensaje(error.message || 'No se pudo actualizar la contraseña.');
      setTipoMensaje('error');

    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="cp-boton-perfil"
        onClick={() => setAbierto(true)}
      >
        <span className="cp-avatar">👤</span>
        <span>Mi cuenta</span>
        <span className="cp-flecha">↓</span>
      </button>

      {abierto && (
        <div
          className="cp-overlay"
          onMouseDown={cerrarPanel}
        >
          <section
            className="cp-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="cp-cerrar"
              onClick={cerrarPanel}
              disabled={cargando}
              aria-label="Cerrar"
            >
              ×
            </button>

            <div className="cp-cabecera">
              <div className="cp-logo-contenedor">
                <img
                  src={logo}
                  alt="Colegio Orden de San Jorge"
                />
              </div>

              <span className="cp-etiqueta">
                VERTICE · SEGURIDAD
              </span>

              <h2>Mi cuenta</h2>

              <p>
                Mantén protegida tu cuenta actualizando tu contraseña
                de acceso.
              </p>
            </div>

            <div className="cp-separador">
              <span />
              <div className="cp-escudo">◆</div>
              <span />
            </div>

            <form
              className="cp-formulario"
              onSubmit={guardarPassword}
            >
              <div className="cp-titulo-formulario">
                <h3>Cambiar contraseña</h3>
                <p>Ingresa tus datos para realizar el cambio.</p>
              </div>

              <CampoPassword
                label="Contraseña actual"
                valor={passwordActual}
                cambiar={setPasswordActual}
                mostrar={mostrarActual}
                alternar={() => setMostrarActual(v => !v)}
                placeholder="Tu contraseña actual"
                autoComplete="current-password"
              />

              <CampoPassword
                label="Nueva contraseña"
                valor={passwordNueva}
                cambiar={setPasswordNueva}
                mostrar={mostrarNueva}
                alternar={() => setMostrarNueva(v => !v)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />

              <CampoPassword
                label="Confirmar nueva contraseña"
                valor={confirmarPassword}
                cambiar={setConfirmarPassword}
                mostrar={mostrarConfirmar}
                alternar={() => setMostrarConfirmar(v => !v)}
                placeholder="Repite tu nueva contraseña"
                autoComplete="new-password"
              />

              <div className="cp-recomendacion">
                <span>✦</span>
                Utiliza una contraseña personal que no compartas con otras personas.
              </div>

              {mensaje && (
                <div className={`cp-mensaje ${tipoMensaje}`}>
                  <span>
                    {tipoMensaje === 'exito' ? '✓' : '!'}
                  </span>
                  {mensaje}
                </div>
              )}

              <div className="cp-acciones">
                <button
                  type="button"
                  className="cp-btn-cancelar"
                  onClick={cerrarPanel}
                  disabled={cargando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="cp-btn-guardar"
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </div>
            </form>

            <div className="cp-pie">
              COLEGIO ORDEN DE SAN JORGE
              <span>Plataforma de gestión Vertice</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
