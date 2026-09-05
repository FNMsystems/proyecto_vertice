import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginService } from '../services/authService.js';
import logoColegio from '../img/logo_institucional.png';
import fondoColegio from '../img/home_fondo.jpeg';
import './login.css';

export default function Funcionarios() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const emailLimpio = email.trim().toLowerCase();

    if (!emailLimpio.endsWith('@ordendesanjorge.cl')) {
      alert('Por favor, ingrese un correo institucional válido (@ordendesanjorge.cl)');
      return;
    }

    try {
      setCargando(true);
      const data = await loginService(emailLimpio, password);
      const rol = data.usuario.rol;


      switch (rol) {
        case 'DIRECTOR':
        case 'ADMIN':
          navigate('/director_dashboard');
          break;
        case 'DOCENTE':
        case 'PROFESOR':
          navigate('/profesores_dashboard');
          break;
        case 'INSPECTOR_GENERAL':
        case 'INSPECTOR':
          navigate('/inspectoria_dashboard');
          break;
        case 'UTP':
          navigate('/utp_dashboard');
          break;
        default:
          navigate('/director_dashboard');
      }
    } catch (err) {
      alert(`Error al iniciar sesión: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url(${fondoColegio})`,
  };

  return (
    <main className="login-page" style={backgroundStyle}>
      <section className="login-card">
        <img className="login-card__logo" src={logoColegio} alt="Colegio Orden de San Jorge" />
        
        <h1 className="login-card__title">Acceso Funcionarios</h1>
        <p className="login-card__subtitle">Ingrese sus datos para continuar</p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Correo institucional</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="nombre@ordendesanjorge.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar u ocultar contraseña"
              >
                👁
              </button>
            </div>
          </div>

          <div className="remember-group">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Recordar mis datos</label>
          </div>

          <button type="submit" className="btn-submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <a href="#forgot" className="forgot-link">¿Olvidó su contraseña?</a>

        <Link to="/" className="back-link">
          ← Volver al inicio
        </Link>
      </section>
    </main>
  );
}