import { Link } from "react-router";

function Funcionarios() {
  return (
    <main className="temporary-page">
      <section className="temporary-page__card">
        <h1>Acceso de funcionarios</h1>

        <p>
          En esta sección se encontrará el inicio de sesión de los
          funcionarios del colegio.
        </p>

        <Link to="/" className="temporary-page__link">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
