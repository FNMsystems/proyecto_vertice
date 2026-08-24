import React from 'react';
import { Link } from "react-router";
import "./Boton_acceso.css";

function Boton_acceso({ text, to }) {
  return (
    <Link className="access-button" to={to}>
      {text}
    </Link>
  );
}

export default Boton_acceso;
