import React from 'react';
import BotonAcceso from "../components/boton_acceso";
import logoColegio from "../img/logo_institucional.png";
import fondoColegio from "../img/home_fondo.jpeg";
import "./home.css";

function Home() {
  const backgroundStyle = {
    backgroundImage: `
      linear-gradient(
        rgba(0, 0, 0, 0.52),
        rgba(0, 0, 0, 0.52)
      ),
      url(${fondoColegio})
    `,
  };

  return (
    <main className="home-page" style={backgroundStyle}>
      <section className="home-card" aria-labelledby="school-name">
        <img
          className="home-card__logo"
          src={logoColegio}
          alt="Colegio Orden de San Jorge"
        />

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
            to="/funcionarios"
          />

          <BotonAcceso
            text="Apoderados"
            to="/apoderado"
          />
        </nav>
      </section>
    </main>
  );
}

export default Home;