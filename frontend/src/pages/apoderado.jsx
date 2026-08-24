import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoColegio from '../img/logo_institucional.png';
import fondoColegio from '../img/home_fondo.jpeg';
import './login.css';

function Apoderado() {
  const [showPassword, setShowPassword] = useState(false);

  const backgroundStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url(${fondoColegio})`,
  };

  return (
    <main className="login-page" style={backgroundStyle}>
      <section className="login-card">
        <img className="login-card__logo" src={logoColegio} alt="Colegio Orden de San Jorge" />
        
        <h1 className="login-card__title">Acceso Apoderados</h1>
        <p className="login-card__subtitle">Ingrese sus datos para continuar</p>

        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="rut">RUT del Apoderado</label>
            <input
              type="text"
              id="rut"
              className="form-input"
              placeholder="12.345.678-9"
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

export default Apoderado;
