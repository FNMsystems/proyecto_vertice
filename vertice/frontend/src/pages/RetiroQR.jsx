import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  generarSolicitudRetiroQR
} from '../services/inspectoriaService.js';

export default function RetiroQR() {
  const [alumnoId, setAlumnoId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacion, setObservacion] = useState('');
  const [solicitud, setSolicitud] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!solicitud?.fechaExpiracion) {
      return;
    }

    const actualizarTiempo = () => {
      const ahora = new Date();
      const expiracion =
        new Date(solicitud.fechaExpiracion);

      const diferencia = Math.max(
        0,
        Math.floor(
          (expiracion - ahora) / 1000
        )
      );

      setSegundos(diferencia);
    };

    actualizarTiempo();

    const intervalo =
      setInterval(actualizarTiempo, 1000);

    return () => clearInterval(intervalo);
  }, [solicitud]);

  const generarQR = async (event) => {
    event.preventDefault();

    setError('');
    setSolicitud(null);

    if (!alumnoId) {
      setError('Debe seleccionar un alumno.');
      return;
    }

    if (!motivo.trim()) {
      setError('Debe ingresar el motivo del retiro.');
      return;
    }

    try {
      setCargando(true);

      const data =
        await generarSolicitudRetiroQR(
          alumnoId,
          motivo,
          observacion
        );

      setSolicitud(data.solicitud);
      setSegundos(900);

    } catch (err) {
      setError(
        err.message ||
        'No se pudo generar el código QR.'
      );
    } finally {
      setCargando(false);
    }
  };

  const minutos =
    Math.floor(segundos / 60);

  const segundosRestantes =
    segundos % 60;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f5f5',
        padding: '30px'
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '12px',
          padding: '30px',
          boxShadow:
            '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <h1
          style={{
            color: '#6b0014',
            marginBottom: '25px'
          }}
        >
          Solicitud de Retiro
        </h1>

        <form onSubmit={generarQR}>
          <div
            style={{
              marginBottom: '20px'
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px'
              }}
            >
              ID del alumno
            </label>

            <input
              type="text"
              value={alumnoId}
              onChange={(e) =>
                setAlumnoId(e.target.value)
              }
              placeholder="UUID del alumno"
              style={{
                width: '100%',
                padding: '12px',
                border:
                  '1px solid #ccc',
                borderRadius: '6px'
              }}
            />
          </div>

          <div
            style={{
              marginBottom: '20px'
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px'
              }}
            >
              Motivo del retiro
            </label>

            <input
              type="text"
              value={motivo}
              onChange={(e) =>
                setMotivo(e.target.value)
              }
              placeholder="Ej: Retiro por control médico"
              style={{
                width: '100%',
                padding: '12px',
                border:
                  '1px solid #ccc',
                borderRadius: '6px'
              }}
            />
          </div>

          <div
            style={{
              marginBottom: '20px'
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px'
              }}
            >
              Observación
            </label>

            <textarea
              value={observacion}
              onChange={(e) =>
                setObservacion(e.target.value)
              }
              placeholder="Observación opcional"
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border:
                  '1px solid #ccc',
                borderRadius: '6px',
                resize: 'vertical'
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: '#f8d7da',
                color: '#721c24',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: '13px',
              background: '#6b0014',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: cargando
                ? 'not-allowed'
                : 'pointer'
            }}
          >
            {cargando
              ? 'Generando...'
              : 'Generar código QR'}
          </button>
        </form>

        {solicitud && (
          <div
            style={{
              marginTop: '35px',
              paddingTop: '30px',
              borderTop:
                '1px solid #ddd',
              textAlign: 'center'
            }}
          >
            <h2
              style={{
                color: '#6b0014',
                marginBottom: '20px'
              }}
            >
              Código QR de Retiro
            </h2>

            <div
              style={{
                display: 'inline-flex',
                padding: '20px',
                background: '#ffffff',
                border:
                  '1px solid #ddd',
                borderRadius: '10px'
              }}
            >
              <QRCodeSVG
                value={solicitud.codigo_qr}
                size={260}
                level="H"
              />
            </div>

            <p
              style={{
                marginTop: '20px',
                fontWeight: '600'
              }}
            >
              Este código debe ser presentado
              en Inspectoría.
            </p>

            <p>
              Vigencia:
              {' '}
              <strong>
                {minutos}:
                {String(
                  segundosRestantes
                ).padStart(2, '0')}
              </strong>
            </p>

            {segundos === 0 && (
              <p
                style={{
                  color: '#b00020',
                  fontWeight: 'bold'
                }}
              >
                El código QR ha expirado.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}