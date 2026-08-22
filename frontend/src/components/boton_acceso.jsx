import { Link } from "react-router";
import "./boton_acceso.css";

function boton_acceso({ text, to }) {
  return (
    <Link className="access-button" to={to}>
      {text}
    </Link>
  );
}

export default boton_acceso;
