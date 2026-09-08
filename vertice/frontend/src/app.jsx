import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Importaciones con los nombres exactos de la carpeta src/pages/
import Home from "./pages/home.jsx";
import Funcionarios from "./pages/funcionarios.jsx";
import Apoderados from "./pages/apoderado_dashboard.jsx";
import DirectorDashboard from "./pages/director_dashboard.jsx";
import ProfesoresDashboard from "./pages/profesores_dashboard.jsx";
import InspectoriaDashboard from "./pages/inspectoria_dashboard.jsx";
import UtpDashboard from "./pages/utp_dashboard.jsx";
import SecretariaDashboard from "./pages/secretaria_dashboard.jsx";

function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/funcionarios" element={<Funcionarios />} />

      {/* Apoderados */}
      <Route path="/apoderado" element={<Apoderados />} />
      <Route path="/apoderados" element={<Apoderados />} />

      {/* Dashboards de Funcionarios */}
      <Route path="/director" element={<DirectorDashboard />} />
      <Route path="/director_dashboard" element={<DirectorDashboard />} />
      <Route path="/profesores_dashboard" element={<ProfesoresDashboard />} />
      <Route path="/inspectoria_dashboard" element={<InspectoriaDashboard />} />
      <Route path="/utp_dashboard" element={<UtpDashboard />} />
      <Route path="/secretaria_dashboard" element={<SecretariaDashboard />} />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;