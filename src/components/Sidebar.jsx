// /components/Sidebar.jsx
import React from "react";
import { FaUserCircle, FaSitemap, FaCalendarAlt, FaSearch } from "react-icons/fa";
import "../styles/sidebar.css";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <ul className="menu">
        <li>
          <FaUserCircle className="menu-icon" />
          <span className="menu-item-text">Личный кабинет</span>
        </li>
        <li>
          <FaSitemap className="menu-icon" />
          <span className="menu-item-text">Структура компании</span>
        </li>
        <li>
          <FaCalendarAlt className="menu-icon" />
          <span className="menu-item-text">Мероприятия</span>
        </li>
        <li>
          <FaSearch className="menu-icon" />
          <span className="menu-item-text">Поиск сотрудников</span>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
