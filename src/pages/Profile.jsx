import React, { useState, useEffect, useRef } from "react";
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
  FaBuilding,
  FaChevronDown
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
  const [techLevels, setTechLevels] = useState({});
  const [showTechLevelDropdown, setShowTechLevelDropdown] = useState(null);
  const dropdownRefs = useRef([]);
  const [allInterests, setAllInterests] = useState([]);
  const [allTechnologies, setAllTechnologies] = useState([]);
  const [ranksLoaded, setRanksLoaded] = useState(false);
  const [allRanks, setAllRanks] = useState([]);

  const defaultRanks = [
    { id_rank: "uuid-1", name_rank: "Junior" },
    { id_rank: "uuid-2", name_rank: "Middle" },
    { id_rank: "uuid-3", name_rank: "Senior" }
  ];
  
  useEffect(() => {
    const handleResize = () => {
      setSidebarWidth(window.innerWidth < 768 ? 0 : 70);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTechLevelDropdown !== null) {
        const dropdownRef = dropdownRefs.current[showTechLevelDropdown];
        if (dropdownRef && !dropdownRef.contains(event.target)) {
          setShowTechLevelDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTechLevelDropdown]);

  

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      try {
        const { data } = await axios.get("http://localhost:8080/api/v1/user/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const date = new Date(data.employee.date_of_birth);
        setBirthDate(date);
        const levels = {};
        const uniqueRanks = [];
        data.employee.technologies.forEach((tech, index) => {
          levels[index] = tech.rank.name_rank;
          if (!uniqueRanks.find(r => r.name_rank === tech.rank.name_rank)) {
            uniqueRanks.push({
              id_rank: tech.rank.id_rank,
              name_rank: tech.rank.name_rank
            });
          }
        });
        setTechLevels(levels);
        setAllRanks(uniqueRanks);
        setProfileData({
          id: data.employee.id_employee,
          firstName: data.employee.first_name,
          lastName: data.employee.last_name,
          middleName: data.employee.middle_name || '',
          position: data.employee.position?.position_name || "",
          city: data.employee.city,
          birthDate: formatDate(data.employee.date_of_birth),
          department: data.employee.department?.name_department || "",
          email: data.employee.email,
          phone: data.employee.phone_number,
          telegram: data.employee.telegram_name,
          technologies: data.employee.technologies.map(t => t.name_technology),
          interests: data.employee.interests.map(i => i.name_interest),
          projects: data.employee.projects.map(p => ({
            name: p.name_project,
            role: p.role.name_role
          }))
        });
      } catch (error) {
        if (error.response && [401, 403].includes(error.response.status)) {
          localStorage.removeItem("access_token");
          navigate("/login", { replace: true });
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
    setProfileData(prev => ({ ...prev, birthDate: formattedDate }));
  };

  const handleArrayChange = (field, index, value) => {
    setProfileData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const handleTechLevelChange = (index, level) => {
    setTechLevels(prev => ({ ...prev, [index]: level }));
    setShowTechLevelDropdown(null);
  };

  const addArrayItem = (field) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
    if (field === 'technologies') {
      setTechLevels((prev) => ({
        ...prev,
        [Object.keys(prev).length]: 'Junior'
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    if (profileData[field].length <= 1) return;
    setProfileData((prev) => {
      const newArray = prev[field].filter((_, i) => i !== index);
      if (field === 'technologies') {
        const newTechLevels = {};
        newArray.forEach((_, i) => {
          newTechLevels[i] = techLevels[i >= index ? i + 1 : i] || 'Junior';
        });
        setTechLevels(newTechLevels);
      }
      return { ...prev, [field]: newArray };
    });
  };

  const validateEmail = (email) => email.includes('@') && email.includes('.');
  const validatePhone = (phone) => /^[\d\s+\-()]{10,20}$/.test(phone);

  if (!profileData) return <div className="loader"></div>;

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const updatedProfile = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        middle_name: profileData.middleName,
        email: profileData.email,
        phone_number: profileData.phone,
        telegram_name: profileData.telegram,
        city: profileData.city,
        date_of_birth: birthDate?.toISOString().split("T")[0],
        department_name: profileData.department,
        position_name: profileData.position
      };

      await axios.put(`http://localhost:8080/api/v1/employee/${profileData.id}`, updatedProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const interestsPayload = {
        interests: profileData.interests.map((name) => {
          const existing = allInterests.find(i => i.name_interest === name);
          return existing ? { id: existing.id_interest } : { name_interest: name };
        })
      };

      await axios.put(
        `http://localhost:8080/api/v1/employee/${profileData.id}/interests`,
        interestsPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const technologiesForRequest = profileData.technologies.map((name, index) => {
        const existingTech = allTechnologies.find(t => t.name_technology === name);
        const rankName = techLevels[index];
        const rankId = allRanks.find(r => r.name_rank === rankName)?.id_rank;
        if (existingTech) {
          return {
            id_technology: existingTech.id_technology,
            id_rank: rankId,
          };
        } else {
          return {
            name_technology: name,
            id_rank: rankId
          };
        }
      });

      const technologiesPayload = {
        technologies: technologiesForRequest
      };

      await axios.put(
        `http://localhost:8080/api/v1/employee/${profileData.id}/technologies`,
        technologiesPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsEditing(false);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401 && error.response.data.detail === "Token expired") {
          localStorage.removeItem("access_token");
          navigate("/login", { replace: true });
        }
      }
    }
  };

  const rankNameToId = (name) => {
    const found = allRanks.find(r => r.name_rank === name);
    return found ? found.id_rank : null;
  };

  const fullName = `${profileData.lastName} ${profileData.firstName} ${profileData.middleName}`.trim();
  
  return (
    <div className="profile-page">
      <Sidebar />
      <div className="main-content">
        <Header />
        
        <motion.div
          className="profile-card horizontal"
          style={{
            marginLeft: '90px',
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
              <h2>{fullName}</h2>
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
                    <span key={index} className="tag">
                      {tech} ({techLevels[index] || 'Junior'})
                    </span>
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
              
              <div className="form-columns">
                <div className="form-group">
                  <label>Фамилия</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={profileData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Имя</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={profileData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Отчество</label>
                  <input 
                    type="text" 
                    name="middleName" 
                    value={profileData.middleName}
                    onChange={handleInputChange}
                  />
                </div>
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
                    <div className="tech-input-wrapper">
                      <input
                        type="text"
                        value={tech}
                        onChange={(e) => handleArrayChange('technologies', index, e.target.value)}
                        placeholder="Введите технологию"
                      />
                      <div 
                        className="tech-level-dropdown"
                        ref={el => dropdownRefs.current[index] = el}
                      >
                        <button 
                          className="tech-level-toggle"
                          onClick={() => setShowTechLevelDropdown(showTechLevelDropdown === index ? null : index)}
                        >
                          {techLevels[index] || 'Выберите уровень'} <FaChevronDown />
                        </button>
                        {showTechLevelDropdown === index && (
                          <div className="tech-level-options">
                            {['Junior', 'Middle', 'Senior'].map(level => (
                              <div 
                                key={level}
                                className="tech-level-option"
                                onClick={() => handleTechLevelChange(index, level)}
                              >
                                {level}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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
                  className={!validateEmail(profileData.email) ? 'invalid-input' : ''}
                />
                {!validateEmail(profileData.email) && (
                  <span className="validation-error">Введите корректный email (должен содержать @ и .)</span>
                )}
              </div>
              
              <div className="form-group">
                <label>Телефон</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={profileData.phone}
                  onChange={handleInputChange}
                  className={!validatePhone(profileData.phone) ? 'invalid-input' : ''}
                />
                {!validatePhone(profileData.phone) && (
                  <span className="validation-error">Введите корректный номер телефона (10-20 цифр)</span>
                )}
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
                <button className="save-btn" onClick={handleSaveProfile}>
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