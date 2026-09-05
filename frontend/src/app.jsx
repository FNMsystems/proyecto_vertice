import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home.jsx";
import Funcionarios from "./pages/funcionarios.jsx";
import Apoderados from "./pages/apoderado.jsx";
import DirectorDashboard from "./pages/director_dashboard.jsx";
import ProfesoresDashboard from "./pages/profesores_dashboard.jsx";
import InspectoriaDashboard from "./pages/inspectoria_dashboard.jsx";
import UtpDashboard from "./pages/utp_dashboard.jsx";

function App() {
  const getUsuario = () => JSON.parse(localStorage.getItem("usuario")) || null;

  const esDirectorOAdmin = () => {
    const rol = getUsuario()?.rol;
    return rol === "DIRECTOR" || rol === "ADMIN";
  };

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/funcionarios" element={<Funcionarios />} />
      <Route path="/apoderados" element={<Apoderados />} />

      {/* Ambas rutas apuntan al panel del director */}
      <Route
        path="/director"
        element={esDirectorOAdmin() ? <DirectorDashboard /> : <Navigate to="/funcionarios" />}
      />
      <Route
        path="/director_dashboard"
        element={esDirectorOAdmin() ? <DirectorDashboard /> : <Navigate to="/funcionarios" />}
      />

      <Route
        path="/profesores_dashboard"
        element={
          ["DOCENTE", "PROFESOR"].includes(getUsuario()?.rol) ? (
            <ProfesoresDashboard />
          ) : (
            <Navigate to="/funcionarios" />
          )
        }
      />
      <Route
        path="/inspectoria_dashboard"
        element={
          ["INSPECTOR_GENERAL", "INSPECTOR"].includes(getUsuario()?.rol) ? (
            <InspectoriaDashboard />
          ) : (
            <Navigate to="/funcionarios" />
          )
        }
      />
      <Route
        path="/utp_dashboard"
        element={
          getUsuario()?.rol === "UTP" ? <UtpDashboard /> : <Navigate to="/funcionarios" />
        }
      />
    </Routes>
  );
}

export default App;