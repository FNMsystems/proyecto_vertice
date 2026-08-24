import React from 'react';
import { Link } from "react-router";

function Apoderados() {
  return (
    <main className="temporary-page">
      <section className="temporary-page__card">
        <h1>Acceso de apoderados</h1>

        <p>
          En esta sección se encontrará el inicio de sesión de los
          apoderados.
        </p>

        <Link to="/" className="temporary-page__link">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}

export default Apoderados;
