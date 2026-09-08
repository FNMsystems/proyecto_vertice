import React from 'react';
import { Link } from "react-router-dom";
import "./boton_acceso.css"; 

function BotonAcceso({ text, to, onClick }) {
  if (onClick) {
    return (
      <button type="button" className="boton_acceso" onClick={onClick}>
        {text}
      </button>
    );
  }

  return (
    <Link className="boton_acceso" to={to || "#"}>
      {text}
    </Link>
  );
}

export default BotonAcceso;