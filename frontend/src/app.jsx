import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/home.jsx";
import Funcionarios from "./pages/funcionarios.jsx";
import Apoderados from "./pages/apoderado.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/funcionarios" element={<Funcionarios />} />
      <Route path="/apoderados" element={<Apoderados />} />
    </Routes>
  );
}

export default App;
