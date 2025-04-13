import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import "./styles/auth.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Можно добавить редирект с корневого маршрута */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
