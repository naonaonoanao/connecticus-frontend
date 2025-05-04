// /components/Sidebar.jsx
import React from "react";
import { FaUserCircle, FaSitemap, FaCalendarAlt, FaSearch } from "react-icons/fa";
import "../styles/sidebar.css";
import { useNavigate } from "react-router-dom"; // Импортируем useNavigate


const Sidebar = () => {
  const navigate = useNavigate(); // Инициализируем useNavigate

  return (
    <div className="sidebar">
      <ul className="menu">
        <li onClick={() => navigate("/profile")}>
          <FaUserCircle className="menu-icon" />
          <span className="menu-item-text">Личный кабинет</span>
        </li>
        <li onClick={() => navigate("/structure")}>
          <FaSitemap className="menu-icon" />
          <span className="menu-item-text">Структура компании</span>
        </li>
        <li onClick={() => navigate("/events")}>
          <FaCalendarAlt className="menu-icon" />
          <span className="menu-item-text">Мероприятия</span>
        </li>
        <li onClick={() => navigate("/search")}>
          <FaSearch className="menu-icon" />
          <span className="menu-item-text">Поиск сотрудников</span>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
