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

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/funcionarios" element={<Funcionarios />} />
      <Route path="/apoderados" element={<Apoderados />} />

      <Route
        path="/director_dashboard"
        element={
          getUsuario()?.rol === "ADMIN" ? <DirectorDashboard /> : <Navigate to="/funcionarios" />
        }
      />
      <Route
        path="/profesores_dashboard"
        element={
          getUsuario()?.rol === "PROFESOR" ? <ProfesoresDashboard /> : <Navigate to="/funcionarios" />
        }
      />
      <Route
        path="/inspectoria_dashboard"
        element={
          getUsuario()?.rol === "INSPECTOR" ? <InspectoriaDashboard /> : <Navigate to="/funcionarios" />
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