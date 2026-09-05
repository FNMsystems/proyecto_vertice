import React from 'react';
import { Link } from "react-router-dom";
import "./boton_acceso.css"; 

function BotonAcceso({ text, to }) {
  return (
    <Link className="boton_acceso" to={to}>
      {text}
    </Link>
  );
}

export default BotonAcceso;