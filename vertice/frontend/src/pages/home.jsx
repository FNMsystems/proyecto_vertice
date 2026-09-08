import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BotonAcceso from "../components/boton_acceso";
import { loginService } from '../services/authService.js';
import logoColegio from "../img/logo_institucional.png";
import fondoColegio from "../img/home_fondo.jpeg";
import "./home.css";

function Home() {
  const navigate = useNavigate();
  // Estado para controlar la vista: 'MENU', 'FUNCIONARIOS', 'APODERADOS'
  const [tipoAcceso, setTipoAcceso] = useState('MENU');

  // Estados del formulario de login
  const [identificador, setIdentificador] = useState(''); // Email o RUT
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const backgroundStyle = {
    backgroundImage: `
      linear-gradient(
        rgba(0, 0, 0, 0.52),
        rgba(0, 0, 0, 0.52)
      ),
      url(${fondoColegio})
    `,
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await loginService(identificador, password);
      const user = res.usuario;

      // Redirección al Dashboard correspondiente
      if (tipoAcceso === 'APODERADOS' || user?.rol === 'apoderado') {
        navigate('/apoderado');
      } else if (user?.rol === 'director') {
        navigate('/director_dashboard');
      } else if (user?.rol === 'profesor') {
        navigate('/profesores_dashboard');
      } else if (user?.rol === 'inspectoria') {
        navigate('/inspectoria_dashboard');
      } else if (user?.rol === 'utp') {
        navigate('/utp_dashboard');
      } else if (user?.rol === 'secretaria') {
        navigate('/secretaria_dashboard');
      } else {
        navigate('/apoderado');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  const volverAlMenu = () => {
    setTipoAcceso('MENU');
    setIdentificador('');
    setPassword('');
    setError('');
  };

  return (
    <main className="home-page" style={backgroundStyle}>
      <section className="home-card" aria-labelledby="school-name">
        <img
          className="home-card__logo"
          src={logoColegio}
          alt="Colegio Orden de San Jorge"
        />

        {tipoAcceso === 'MENU' ? (
          /* VISTA PRINCIPAL CON TUS BOTONES ORIGINALES */
          <>
            <h1 id="school-name" className="home-card__title">
              Colegio Orden de San Jorge
            </h1>

            <div className="home-card__divider" />

            <p className="home-card__description">
              Seleccione el tipo de usuario para ingresar
            </p>

            <nav className="home-card__buttons" aria-label="Tipos de usuario">
              <BotonAcceso
                text="Funcionarios"
                onClick={() => setTipoAcceso('FUNCIONARIOS')}
              />

              <BotonAcceso
                text="Apoderados"
                onClick={() => setTipoAcceso('APODERADOS')}
              />
            </nav>
          </>
        ) : (
          /* FORMULARIO DE ACCESO (FUNCIONARIOS O APODERADOS) */
          <>
            <h2 className="home-card__title" style={{ fontSize: '1.5rem', marginTop: '10px' }}>
              Acceso {tipoAcceso === 'FUNCIONARIOS' ? 'Funcionarios' : 'Apoderados'}
            </h2>
            <p className="home-card__description" style={{ marginBottom: '20px' }}>
              Ingrese sus datos para continuar
            </p>

            {error && (
              <p style={{ color: 'red', fontSize: '0.85rem', marginBottom: '10px' }}>
                {error}
              </p>
            )}

            <form onSubmit={handleLogin} style={{ width: '100%', textAlign: 'left' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  {tipoAcceso === 'FUNCIONARIOS' ? 'Correo institucional' : 'RUT del Apoderado'}
                </label>
                <input
                  type={tipoAcceso === 'FUNCIONARIOS' ? 'email' : 'text'}
                  placeholder={
                    tipoAcceso === 'FUNCIONARIOS'
                      ? 'nombre@ordendesanjorge.cl'
                      : '12.345.678-9'
                  }
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#800000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Ingresar
              </button>
            </form>

            <button
              type="button"
              onClick={volverAlMenu}
              style={{
                background: 'none',
                border: 'none',
                color: '#800000',
                marginTop: '15px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              ← Volver al inicio
            </button>
          </>
        )}
      </section>
    </main>
  );
}

export default Home;