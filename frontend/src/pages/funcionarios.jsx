import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoColegio from '../img/logo_institucional.png';
import fondoColegio from '../img/home_fondo.jpeg';
import './login.css';

function Funcionarios() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const emailLimpio = email.trim().toLowerCase();

    if (!emailLimpio.endsWith('@ordendesanjorge.cl')) {
      alert('Por favor, ingrese un correo institucional válido (@ordendesanjorge.cl)');
      return;
    }

    let usuarioRespuesta = null;

    if (emailLimpio === 'gustavoinostroza@ordendesanjorge.cl' || emailLimpio.startsWith('director')) {
      usuarioRespuesta = { id: 1, nombre: 'Gustavo Inostroza (Director)', email: emailLimpio, rol: 'ADMIN' };
    } else if (emailLimpio === 'carlos@ordendesanjorge.cl' || emailLimpio.startsWith('profesor')) {
      usuarioRespuesta = { id: 2, nombre: 'Carlos (Profesor)', email: emailLimpio, rol: 'PROFESOR' };
    } else if (emailLimpio.startsWith('inspector')) {
      usuarioRespuesta = { id: 3, nombre: 'Marta (Inspectora)', email: emailLimpio, rol: 'INSPECTOR' };
    } else if (emailLimpio.startsWith('utp')) {
      usuarioRespuesta = { id: 4, nombre: 'Gonzalo (Jefe UTP)', email: emailLimpio, rol: 'UTP' };
    } else if (emailLimpio === 'anamaria@ordendesanjorge.cl') {
      usuarioRespuesta = { id: 5, nombre: 'Ana María (Profesora)', email: emailLimpio, rol: 'PROFESOR' };
    } else {
      usuarioRespuesta = { id: 2, nombre: 'Carlos (Profesor)', email: emailLimpio, rol: 'PROFESOR' };
    }

    localStorage.setItem('usuario', JSON.stringify(usuarioRespuesta));

    if (usuarioRespuesta.rol === 'ADMIN') {
      navigate('/director_dashboard');
    } else if (usuarioRespuesta.rol === 'PROFESOR') {
      navigate('/profesores_dashboard');
    } else if (usuarioRespuesta.rol === 'INSPECTOR') {
      navigate('/inspectoria_dashboard');
    } else if (usuarioRespuesta.rol === 'UTP') {
      navigate('/utp_dashboard');
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
                aria-label="Mostrar contraseña"
              >
                👁
              </button>
            </div>
          </div>

          <div className="remember-group">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Recordar mis datos</label>
          </div>

          <button type="submit" className="btn-submit">
            Ingresar
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

export default Funcionarios;