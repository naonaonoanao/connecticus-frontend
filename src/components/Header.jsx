// /components/Header.jsx
import React from "react";
import { FaBell } from "react-icons/fa";
import "../styles/header.css";

const Header = () => {
  return (
    <div className="header">
      <h1>С возвращением, User!</h1>
      <div className="notification">
        <FaBell size={24} />
      </div>
    </div>
  );
};

export default Header;
