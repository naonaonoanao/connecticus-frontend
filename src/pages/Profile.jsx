// /pages/Profile.jsx
import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Notification";
import { motion } from "framer-motion";
import "../styles/profile.css";

const Profile = () => {
  return (
    <div className="profile-page">
      <Sidebar />
      <div className="main-content">
        <Header />
        <motion.div
          className="profile-card"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="profile-info">
            <h2>Имя Фамилия</h2>
            <p>Должность: Специалист по ИБ-----</p>
            <p>Отдел: Информационная безопасность</p>
            <p>Email: user@example.com</p>
            <p>Телефон: +7 997 777 77 78</p>
          </div>
          <div className="profile-actions">
            <button>Редактировать</button>
            <button>Выйти</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
