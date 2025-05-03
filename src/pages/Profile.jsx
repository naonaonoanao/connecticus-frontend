// /pages/Profile.jsx
import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Notification";
import { motion } from "framer-motion";
import { FaEnvelope, FaPhone, FaTelegram, FaBirthdayCake, FaMapMarkerAlt, FaCode, FaProjectDiagram } from "react-icons/fa";
import "../styles/profile.css";

const Profile = () => {
  const [hoveredProject, setHoveredProject] = useState(null);
  
  const projects = [
    { name: "Внедрение SIEM системы", role: "Архитектор решений" },
    { name: "Разработка политик ИБ", role: "Технический писатель" },
    { name: "Проведение аудитов", role: "Старший аудитор" }
  ];

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="main-content">
        <Header />
        <motion.div
          className="profile-card horizontal"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Левая часть - аватар и контакты */}
          <div className="profile-left">
            <div className="avatar-placeholder"></div>
            
            <div className="contact-section">
              <h3><FaEnvelope className="icon"/> Контакты</h3>
              <div className="contact-item">
                <FaEnvelope className="icon"/>
                <span>user@company.com</span>
              </div>
              <div className="contact-item">
                <FaPhone className="icon"/>
                <span>+7 (999) 123-45-67</span>
              </div>
              <div className="contact-item">
                <FaTelegram className="icon"/>
                <span>@username</span>
              </div>
            </div>
          </div>
          
          {/* Правая часть - основная информация */}
          <div className="profile-right">
            <div className="profile-header">
              <h2>Иванов Иван Иванович</h2>
              <p className="position">Специалист по информационной безопасности</p>
            </div>
            
            <div className="info-grid compact">
              <div className="info-section">
                <h3><FaMapMarkerAlt className="icon"/> Основная информация</h3>
                <div className="info-item compact">
                  <span>Город:</span>
                  <p>Москва</p>
                </div>
                <div className="info-item compact">
                  <span><FaBirthdayCake className="icon"/> Дата рождения:</span>
                  <p>15.05.1990</p>
                </div>
                <div className="info-item compact">
                  <span>Отдел:</span>
                  <p>Информационная безопасность</p>
                </div>
              </div>
              
              <div className="info-section compact">
                <h3><FaCode className="icon"/> Технологии и интересы</h3>
                <div className="tags compact">
                  <span className="tag">Кибербезопасность</span>
                  <span className="tag">React</span>
                  <span className="tag">Node.js</span>
                  <span className="tag">Docker</span>
                  <span className="tag">Kubernetes</span>
                  <span className="tag">AWS</span>
                </div>
              </div>
              
              <div className="info-section projects-section compact">
                <h3><FaProjectDiagram className="icon"/> Участие в проектах</h3>
                <ul className="projects-list compact">
                  {projects.map((project, index) => (
                    <li 
                      key={index}
                      onMouseEnter={() => setHoveredProject(index)}
                      onMouseLeave={() => setHoveredProject(null)}
                    >
                      {project.name}
                      {hoveredProject === index && (
                        <div className="project-role-tooltip">
                          Роль: {project.role}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="profile-actions compact">
              <button>Редактировать профиль</button>
              <button className="secondary">Поделиться профилем</button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;