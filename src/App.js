import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import CompanyStructure from "./pages/CompanyStructure"; // Импортируем
import Events from "./pages/Events"; // Если такая страница есть
import Search from "./pages/EmployeeSearch"; // Если такая страница есть
import "./styles/auth.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/structure" element={<CompanyStructure />} />
        <Route path="/events" element={<Events />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<Profile />} /> {/* Можно поставить заглушку */}
      </Routes>
    </Router>
  );
};

export default App;
