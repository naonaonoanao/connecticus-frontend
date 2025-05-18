import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Notification";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FaEnvelope,
  FaPhone,
  FaTelegram,
  FaBirthdayCake,
  FaMapMarkerAlt,
  FaCode,
  FaProjectDiagram,
  FaUserEdit,
  FaUserTie,
  FaBuilding
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [hoveredProject, setHoveredProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(70);
  const [birthDate, setBirthDate] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarWidth(0);
      } else {
        setSidebarWidth(70);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const { data } = await axios.get("http://localhost:8080/api/v1/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const date = new Date(data.employee.date_of_birth);
        setBirthDate(date);
        
        setProfileData({
          name: `${data.employee.first_name} ${data.employee.middle_name || ''} ${data.employee.last_name}`.trim(),
          position: data.employee.position?.position_name || "",
          city: data.employee.city,
          birthDate: formatDate(data.employee.date_of_birth),
          department: data.employee.department?.name_department || "",
          email: data.employee.email,
          phone: data.employee.phone_number,
          telegram: data.employee.telegram_name,
          technologies: data.employee.technologies.map(
            (t) => `${t.name_technology} (${t.rank.name_rank})`
          ),
          interests: data.employee.interests.map((i) => i.name_interest),
          projects: data.employee.projects.map((p) => ({
            name: p.name_project,
            role: p.role.name_role,
          })),
        });
      } catch (error) {
        if (error.response && [401, 403].includes(error.response.status)) {
          localStorage.removeItem("access_token");
          navigate("/login", { replace: true });
        } else {
          console.error("Error fetching profile:", error);
        }
      }
    };
    fetchProfile();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    setBirthDate(date);
    const formattedDate = date ? formatDate(date.toISOString().split('T')[0]) : "";
    setProfileData(prev => ({
      ...prev,
      birthDate: formattedDate
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setProfileData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const removeArrayItem = (field, index) => {
    if (profileData[field].length <= 1) return;
    setProfileData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (!profileData) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="main-content">
        <Header />
        
        <motion.div
          className="profile-card horizontal"
          style={{
            marginLeft: '190px',
            marginTop: '70px'
          }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Левая часть - аватар, интересы и контакты */}
          <div className="profile-left">
            <div className="avatar-placeholder">
              <FaUserTie className="avatar-icon" />
            </div>
            
            <div className="interests-section">
              <h3><FaCode className="icon"/> Интересы</h3>
              <div className="tags">
                {profileData.interests.map((interest, index) => (
                  <span key={index} className="tag">{interest}</span>
                ))}
              </div>
            </div>
            
            <div className="contact-section">
              <h3><FaEnvelope className="icon"/> Контакты</h3>
              <div className="contact-item">
                <FaEnvelope className="icon"/>
                <span>{profileData.email}</span>
              </div>
              <div className="contact-item">
                <FaPhone className="icon"/>
                <span>{profileData.phone}</span>
              </div>
              <div className="contact-item">
                <FaTelegram className="icon"/>
                <span>{profileData.telegram}</span>
              </div>
            </div>
          </div>
          
          {/* Правая часть - основная информация */}
          <div className="profile-right">
            <div className="profile-header">
              <h2>{profileData.name}</h2>
              <p className="position">{profileData.position}</p>
            </div>
            
            <div className="info-grid compact">
              <div className="info-section">
                <h3><FaMapMarkerAlt className="icon"/> Основная информация</h3>
                <div className="info-item compact">
                  <span><FaMapMarkerAlt className="icon"/> Город:</span>
                  <p>{profileData.city}</p>
                </div>
                <div className="info-item compact">
                  <span><FaBirthdayCake className="icon"/> Дата рождения:</span>
                  <p>{profileData.birthDate}</p>
                </div>
                <div className="info-item compact">
                  <span><FaBuilding className="icon"/> Отдел:</span>
                  <p>{profileData.department}</p>
                </div>
              </div>
              
              <div className="info-section compact">
                <h3><FaCode className="icon"/> Технологии</h3>
                <div className="tags compact">
                  {profileData.technologies.map((tech, index) => (
                    <span key={index} className="tag">{tech}</span>
                  ))}
                </div>
              </div>
              
              <div className="info-section projects-section compact">
                <h3><FaProjectDiagram className="icon"/> Участие в проектах</h3>
                <ul className="projects-list compact">
                  {profileData.projects.map((project, index) => (
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
              <button onClick={() => setIsEditing(true)}>
                <FaUserEdit className="button-icon"/> Редактировать профиль
              </button>
            </div>
          </div>
        </motion.div>

        {/* Модальное окно редактирования */}
        {isEditing && (
          <div className="modal-overlay">
            <motion.div 
              className="edit-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <h3>Редактирование профиля</h3>
              
              <div className="form-group">
                <label>ФИО</label>
                <input 
                  type="text" 
                  name="name" 
                  value={profileData.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Должность</label>
                <input 
                  type="text" 
                  name="position" 
                  value={profileData.position}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-columns">
                <div className="form-group">
                  <label>Город</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={profileData.city}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Дата рождения</label>
                  <DatePicker
                    selected={birthDate}
                    onChange={handleDateChange}
                    dateFormat="dd-MM-yyyy"
                    className="date-picker-input"
                    placeholderText="Выберите дату"
                    showYearDropdown
                    dropdownMode="select"
                    maxDate={new Date()}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Отдел</label>
                <input 
                  type="text" 
                  name="department" 
                  value={profileData.department}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-section">
                <div className="section-header">
                  <h4>Технологии</h4>
                  <button 
                    type="button" 
                    className="add-btn"
                    onClick={() => addArrayItem('technologies')}
                  >
                    +
                  </button>
                </div>
                {profileData.technologies.map((tech, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={tech}
                      onChange={(e) => handleArrayChange('technologies', index, e.target.value)}
                      placeholder="Введите технологию"
                    />
                    {profileData.technologies.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeArrayItem('technologies', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="form-section">
                <div className="section-header">
                  <h4>Интересы</h4>
                  <button 
                    type="button" 
                    className="add-btn"
                    onClick={() => addArrayItem('interests')}
                  >
                    +
                  </button>
                </div>
                {profileData.interests.map((interest, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={interest}
                      onChange={(e) => handleArrayChange('interests', index, e.target.value)}
                      placeholder="Введите интерес"
                    />
                    {profileData.interests.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => removeArrayItem('interests', index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={profileData.email}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Телефон</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={profileData.phone}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label>Telegram</label>
                <input 
                  type="text" 
                  name="telegram" 
                  value={profileData.telegram}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="modal-actions">
                <button className="save-btn" onClick={() => setIsEditing(false)}>
                  Сохранить
                </button>
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                  Отмена
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;