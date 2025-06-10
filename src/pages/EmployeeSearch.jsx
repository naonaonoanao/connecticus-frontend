import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaSearch, FaFilter, FaTimes, FaMapMarkerAlt, FaCode, FaProjectDiagram, FaEnvelope, FaPhone, FaChevronDown, FaTelegram, FaUserPlus, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import '../styles/EmployeeSearch.css';
import Sidebar from "../components/Sidebar";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BASE = 'https://api.connecticus.deadfairy.space/api/v1';

const EmployeeSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city:        { selected: [], searchQuery: '' },
    position:    { selected: [], searchQuery: '' },
    department:  { selected: [], searchQuery: '' },
    team:        { selected: [], searchQuery: '' },
    technologies:{ selected: [], searchQuery: '' },
    interests:   { selected: [], searchQuery: '' }
  });
  const [showTechLevelDropdown, setShowTechLevelDropdown] = useState(null);
  const dropdownRefs = useRef([]);

  const [options, setOptions] = useState({
    cities: [], positions: [], departments: [],
    projects: [], technologies: [], interests: []
  });
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [currentEmployeeData, setCurrentEmployeeData] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState({ 
    total_count: 1, 
    total_pages: 1, 
    skip: 0, 
    limit: 6 
  });

  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    position: '',
    city: '',
    birthDate: null,
    joinDate: new Date(),
    department: '',
    email: '',
    phone: '',
    telegram: '',
    technologies: [''],
    interests: [''],
    projects: [{ name: '', role: '' }]
  });
  const [techLevels, setTechLevels] = useState({ 0: 'Junior' });

  // Маппинг ключей фильтров → ключи options и поля для id/label
  const OPTION_KEY = {
    city:        'cities',
    position:    'positions',
    department:  'departments',
    team:        'projects',
    technologies:'technologies',
    interests:   'interests'
  };
  const LABEL_FIELD = {
    city:        null,              // для городов — сама строка
    position:    'position_name',
    department:  'name_department',
    team:        'name_project',
    technologies:'name_technology',
    interests:   'name_interest'
  };
  const ID_FIELD = {
    city:        null,
    position:    'id_position',
    department:  'id_department',
    team:        'id_project',
    technologies:'id_technology',
    interests:   'id_interest'
  };

  // Загрузка опций фильтров
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const responses = await Promise.all([
          axios.get(`${BASE}/common/cities`),
          axios.get(`${BASE}/common/positions`),
          axios.get(`${BASE}/common/departments`),
          axios.get(`${BASE}/common/projects`),
          axios.get(`${BASE}/common/technologies`),
          axios.get(`${BASE}/common/interests`),
        ]);

        
        const [
          cities, positions, departments, 
          projects, technologies, interests
        ] = responses.map(res => res.data);

        setOptions({ 
          cities: cities || [],
          positions: positions || [],
          departments: departments || [],
          projects: projects || [],
          technologies: technologies || [],
          interests: interests || []
        });

      } catch (error) {
        console.error('Error loading options:', error);
      }
    };
    
    loadOptions();
  }, []);
  

  // Построение параметров запроса
  // Исправленные параметры запроса
  const buildParams = useCallback(() => {
    const params = {
      skip: meta.skip,
      limit: meta.limit,
    };
  
    if (searchTerm) {
      params.str_to_find = searchTerm;
    }
  
    if (filters.city.selected.length) {
      params.city = filters.city.selected;  // массив
    }
    if (filters.position.selected.length) {
      params.id_position = filters.position.selected;  // массив
    }
    if (filters.department.selected.length) {
      params.id_department = filters.department.selected;  // массив
    }
    if (filters.team.selected.length) {
      params.id_project = filters.team.selected;  // массив
    }
    if (filters.technologies.selected.length) {
      params.id_technology = filters.technologies.selected;  // массив
    }
    if (filters.interests.selected.length) {
      params.id_interest = filters.interests.selected;  // массив
    }
  
    return params;
  }, [
    meta.skip,
    meta.limit,
    searchTerm,
    filters.city.selected,
    filters.position.selected,
    filters.department.selected,
    filters.team.selected,
    filters.technologies.selected,
    filters.interests.selected
  ]);
  
  // Загрузка сотрудников
  useEffect(() => {
    const controller = new AbortController();
  
    const loadEmployees = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${BASE}/employee/employees`, {
          params: buildParams(),
          paramsSerializer: params => {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(key, v));
              } else {
                searchParams.append(key, value);
              }
            });
            return searchParams.toString();
          },
          signal: controller.signal
        });
  
        setEmployees(data.data || []);
        setMeta(data.meta || meta);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Ошибка:', error);
          setEmployees([]);
        }
      } finally {
        setLoading(false);
        setHasLoadedOnce(true); // Только после полной загрузки
      }
    };
  
    loadEmployees();
    return () => controller.abort();
  }, [buildParams]);
  
  

  // Красивый индикатор загрузки
  const renderLoader = () => (
    <motion.div 
      className="loading-indicator"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="spinner"></div>
      <p>Загрузка данных...</p>
    </motion.div>
  );


  const handleFilterSearchChange = useCallback((ft, value) => {
    setFilters(prev => ({
      ...prev,
      [ft]: { ...prev[ft], searchQuery: value }
    }));
  }, []);
    
  const handleFilterToggle = useCallback((ft, idOrName) => {
    setFilters(prev => {
      const selected = prev[ft].selected.includes(idOrName)
        ? prev[ft].selected.filter(x => x !== idOrName)
        : [...prev[ft].selected, idOrName];
      
      return { 
        ...prev, 
        [ft]: { ...prev[ft], selected } 
      };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      city: { selected: [], searchQuery: '' },
      position: { selected: [], searchQuery: '' },
      department: { selected: [], searchQuery: '' },
      team: { selected: [], searchQuery: '' },
      technologies: { selected: [], searchQuery: '' },
      interests: { selected: [], searchQuery: '' }
    });
  }, []);

  const changePage = useCallback(newSkip => {
    setMeta(prev => prev.skip === newSkip ? prev : { 
      ...prev, 
      skip: newSkip 
    });
  }, []);
  const handleEditEmployee = (employee) => {
    setCurrentEmployeeData({
      id_employee: employee.id_employee,
      firstName: employee.first_name,
      lastName: employee.last_name,
      middleName: employee.middle_name || '',
      position: employee.position?.position_name || '',
      city: employee.city || '',
      birthDate: employee.date_of_birth ? new Date(employee.date_of_birth) : null,
      joinDate: employee.join_date ? new Date(employee.join_date) : new Date(),
      department: employee.department?.name_department || '',
      email: employee.email || '',
      phone: employee.phone_number || '',
      telegram: employee.telegram_name || '',
      technologies: employee.technologies?.map(t => t.name_technology) || [''],
      interests: employee.interests?.map(i => i.name_interest) || [''],
      projects: employee.projects?.map(p => ({ name: p.name_project, role: p.role })) || [{ name: '', role: '' }]
    });
    
    // Устанавливаем уровни технологий
    const levels = {};
    employee.technologies?.forEach((tech, index) => {
      levels[index] = tech.id_rank === '51d35915-bf8d-4159-8153-2427692fe66f' ? 'Middle' : 
                     tech.id_rank === '3cb8c1a9-7d1e-4989-9393-71a15d3b3075' ? 'Senior' : 'Junior';
    });
    setTechLevels(levels);
    
    setIsEditEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async () => {
    try {
      // Получаем токен из localStorage (предполагается, что он там сохранен после входа)
      const token = localStorage.getItem("access_token");
  
      // Подготовка данных для обновления
      const updateData = {
        full_name: `${currentEmployeeData.lastName} ${currentEmployeeData.firstName} ${currentEmployeeData.middleName}`.trim(),
        telegram_name: currentEmployeeData.telegram,
        email: currentEmployeeData.email,
        phone_number: currentEmployeeData.phone,
        city: currentEmployeeData.city,
        date_of_birth: currentEmployeeData.birthDate?.toISOString().split('T')[0],
        department_name: currentEmployeeData.department,
        position_name: currentEmployeeData.position
      };
  
      // Конфигурация axios с заголовком авторизации
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
  
      // Отправка обновленных данных
      await axios.put(
        `${BASE}/employee/${currentEmployeeData.id_employee}`, 
        updateData, 
        config
      );
  
      // Обновление интересов
      if (currentEmployeeData.interests.some(i => i.trim() !== '')) {
        const interestsPayload = {
          interests: currentEmployeeData.interests
            .filter(i => i.trim() !== '')
            .map(name => ({
              name_interest: name.trim()
            }))
        };
        await axios.put(
          `${BASE}/employee/${currentEmployeeData.id_employee}/interests`, 
          interestsPayload, 
          config
        );
      }
  
      // Обновление технологий
      if (currentEmployeeData.technologies.some(t => t.trim() !== '')) {
        const technologiesPayload = {
          technologies: currentEmployeeData.technologies
            .filter((t, i) => t.trim() !== '' && techLevels[i])
            .map((name, index) => ({
              name_technology: name.trim(),
              id_rank: techLevels[index] === 'Middle' ? '51d35915-bf8d-4159-8153-2427692fe66f' : 
                      techLevels[index] === 'Senior' ? '3cb8c1a9-7d1e-4989-9393-71a15d3b3075' : 
                      '9b51cafd-209e-4c8d-9a68-44e8837e55dc'
            }))
        };
        await axios.put(
          `${BASE}/employee/${currentEmployeeData.id_employee}/technologies`, 
          technologiesPayload, 
          config
        );
      }
  
      // Закрытие модального окна и обновление списка сотрудников
      setIsEditEmployeeModalOpen(false);
      const params = buildParams();
      const { data } = await axios.get(`${BASE}/employee/employees`, { 
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEmployees(data.data || []);
      
    } catch (error) {
      console.error('Ошибка при обновлении сотрудника:', error);
      if (error.response?.status === 401) {
        // Если токен недействителен, перенаправляем на страницу входа
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      } else {
        alert(error.response?.data?.detail || 'Произошла ошибка при обновлении данных сотрудника');
      }
    }
  };


  // Filter options helper
  const getFilterOptions = useCallback((ft) => {
    const key = OPTION_KEY[ft];
    const arr = options[key] || [];
    const q = filters[ft].searchQuery.toLowerCase();
    
    return arr.filter(opt => {
      const label = ft === 'city' ? opt : opt[LABEL_FIELD[ft]];
      return label?.toLowerCase().includes(q);
    });
  }, [options, filters]);

  // Render one card
  const renderEmployeeCard = emp => (
    <motion.div key={emp.id_employee} className="employee-card" whileHover={{ scale: 1.02 }}>
      <div className="employee-header">
        <h3>{`${emp.last_name} ${emp.first_name} ${emp.middle_name || ''}`}</h3>
        <p className="position">{emp.position?.position_name}</p>
      </div>
      <div className="employee-info">
        <div className="info-item"><FaMapMarkerAlt /> {emp.city}</div>
        <div className="info-item"><span>Отдел:</span> {emp.department?.name_department}</div>
        <div className="info-item"><span>Команда:</span> {emp.projects[0]?.name_project}</div>
      </div>
      <div className="employee-contacts">
        <h4>Контакты</h4>
        <div className="contact-item"><FaEnvelope /><a href={`mailto:${emp.email}`}>{emp.email}</a></div>
        <div className="contact-item"><FaPhone /><a href={`tel:${emp.phone_number.replace(/\D/g,'')}`}>{emp.phone_number}</a></div>
        <div className="contact-item"><FaTelegram /><a href={`https://t.me/${emp.telegram_name.replace('@','')}`} target="_blank" rel="noopener noreferrer">{emp.telegram_name}</a></div>
      </div>
      <div className="employee-skills">
        <h4><FaCode /> Технологии</h4>
        <div className="tags">{emp.technologies.map(t => <span key={t.id_technology} className="tag">{t.name_technology}</span>)}</div>
      </div>
      <div className="employee-interests">
        <h4><FaProjectDiagram /> Интересы</h4>
        <div className="tags">{emp.interests.map(i => <span key={i.id_interest} className="tag">{i.name_interest}</span>)}</div>
      </div>
      <button 
        className="info-button"
        onClick={() => handleEditEmployee(emp)}
      >
        <FaInfoCircle />
      </button>
    </motion.div>
  );

  

  return (
    <div className="employee-search-page">
      <Sidebar />
      <div className="employee-search-content">
        {/* Search & Filter Toggle */}
        <div className="search-container">
          <motion.div className="search-bar" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Поиск по ФИО..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              className={`filter-button ${Object.values(filters).some(f => f.selected.length) ? 'active' : ''}`}
              onClick={() => setShowFilters(s => !s)}
            >
              <FaFilter /> Фильтры
              {Object.values(filters).some(f => f.selected.length) && (
                <span className="filter-count">
                  {Object.values(filters).reduce((acc, f) => acc + f.selected.length, 0)}
                </span>
              )}
            </button>
            <button
              className="add-employee-button"
              onClick={() => setIsAddEmployeeModalOpen(true)}
            >
              <FaUserPlus /> Добавить сотрудника
            </button>
          </motion.div>
          {/* Filters Modal */}
          {showFilters && (
            <motion.div className="filters-modal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <div className="filters-header">
                <h3>Фильтры</h3>
                <button className="close-modal-button" onClick={() => setShowFilters(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="filters-content">
                {['city','position','department','team','technologies','interests'].map(ft => (
                  <div key={ft} className="filter-section">
                    <div className="filter-section-header">
                      <span>{{
                        city:'Город', position:'Должность',
                        department:'Отдел', team:'Команда',
                        technologies:'Технологии', interests:'Интересы'
                      }[ft]}</span>
                      <input
                        type="text"
                        className="filter-search"
                        placeholder={`Поиск...`}
                        value={filters[ft].searchQuery}
                        onChange={e => handleFilterSearchChange(ft, e.target.value)}
                      />
                    </div>
                    {filters[ft].searchQuery && (
                      <div className="filter-options">
                        {getFilterOptions(ft).map(opt => {
                          const idOrName = ft === 'city'
                            ? opt
                            : opt[ID_FIELD[ft]];
                          const label = ft === 'city'
                            ? opt
                            : opt[LABEL_FIELD[ft]];
                          return (
                            <div key={idOrName} className="filter-option">
                              <input
                                type="checkbox"
                                checked={filters[ft].selected.includes(idOrName)}
                                onChange={() => handleFilterToggle(ft, idOrName)}
                              />
                              <label>{label}</label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {filters[ft].selected.length > 0 && (
                      <div className="selected-tags">
                        {filters[ft].selected.map(val => {
                          const label = ft === 'city'
                            ? val
                            : (
                              options[OPTION_KEY[ft]] || []
                            ).find(x => x[ID_FIELD[ft]] === val)?.[LABEL_FIELD[ft]];
                          return (
                            <span key={val} className="selected-tag">
                              {label}
                              <button className="remove-tag" onClick={() => handleFilterToggle(ft, val)}>×</button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="filters-actions">
                <button className="reset-button" onClick={resetFilters}>Сбросить все</button>
                <button className="apply-button" onClick={() => setShowFilters(false)}>Применить</button>
              </div>
            </motion.div>
          )}
        </div>
        {/* Results */}
        <div className="results-container">
        {loading && !hasLoadedOnce ? (
          renderLoader()
        ) : !loading && hasLoadedOnce && !employees.length && meta.total_count == 0 ? (
          <p>Сотрудники не найдены.</p>
        ) : (
          <motion.div
            className="employees-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {employees.map(renderEmployeeCard)}
          </motion.div>
        )}
      </div>
      {isAddEmployeeModalOpen && (
        <div className="modal-overlay">
          <motion.div 
            className="edit-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3>Добавление нового сотрудника</h3>

            <div className="form-columns">
              <div className="form-group">
                <label>Фамилия</label>
                <input 
                  type="text" 
                  name="lastName" 
                  value={newEmployeeData.lastName}
                  onChange={(e) => setNewEmployeeData({...newEmployeeData, lastName: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Имя</label>
                <input 
                  type="text" 
                  name="firstName" 
                  value={newEmployeeData.firstName}
                  onChange={(e) => setNewEmployeeData({...newEmployeeData, firstName: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Отчество</label>
                <input 
                  type="text" 
                  name="middleName" 
                  value={newEmployeeData.middleName}
                  onChange={(e) => setNewEmployeeData({...newEmployeeData, middleName: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Должность</label>
              <input 
                type="text" 
                name="position" 
                value={newEmployeeData.position}
                onChange={(e) => setNewEmployeeData({...newEmployeeData, position: e.target.value})}
              />
            </div>
            
            <div className="form-columns">
              <div className="form-group">
                <label>Город</label>
                <input 
                  type="text" 
                  name="city" 
                  value={newEmployeeData.city}
                  onChange={(e) => setNewEmployeeData({...newEmployeeData, city: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Дата рождения</label>
                <DatePicker
                  selected={newEmployeeData.birthDate}
                  onChange={(date) => setNewEmployeeData({...newEmployeeData, birthDate: date})}
                  dateFormat="dd-MM-yyyy"
                  className="date-picker-input"
                  placeholderText="Выберите дату"
                  showYearDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                />
              </div>
            </div>

              {/* Добавляем поле для даты приема на работу */}
            <div className="form-group">
              <label>Дата приема на работу</label>
              <DatePicker
                selected={newEmployeeData.joinDate}
                onChange={(date) => setNewEmployeeData({...newEmployeeData, joinDate: date})}
                dateFormat="dd-MM-yyyy"
                className="date-picker-input"
                placeholderText="Выберите дату"
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
              />
            </div>
            
            <div className="form-group">
              <label>Отдел</label>
              <input 
                type="text" 
                name="department" 
                value={newEmployeeData.department}
                onChange={(e) => setNewEmployeeData({...newEmployeeData, department: e.target.value})}
              />
            </div>
            
            <div className="form-section">
              <div className="section-header">
                <h4>Технологии</h4>
                <button 
                  type="button" 
                  className="add-btn"
                  onClick={() => {
                    setNewEmployeeData({
                      ...newEmployeeData,
                      technologies: [...newEmployeeData.technologies, '']
                    });
                    setTechLevels({
                      ...techLevels,
                      [newEmployeeData.technologies.length]: 'Junior'
                    });
                  }}
                >
                  +
                </button>
              </div>
              {newEmployeeData.technologies.map((tech, index) => (
                <div key={index} className="array-item">
                  <div className="tech-input-wrapper">
                    <input
                      type="text"
                      value={tech}
                      onChange={(e) => {
                        const newTechs = [...newEmployeeData.technologies];
                        newTechs[index] = e.target.value;
                        setNewEmployeeData({...newEmployeeData, technologies: newTechs});
                      }}
                      placeholder="Введите технологию"
                    />
                    <div className="tech-level-dropdown">
                      <button 
                        className="tech-level-toggle"
                        onClick={() => setShowTechLevelDropdown(showTechLevelDropdown === index ? null : index)}
                      >
                        {techLevels[index] || 'Junior'} <FaChevronDown />
                      </button>
                      {showTechLevelDropdown === index && (
                        <div className="tech-level-options">
                          {['Junior', 'Middle', 'Senior'].map(level => (
                            <div 
                              key={level}
                              className="tech-level-option"
                              onClick={() => {
                                setTechLevels({...techLevels, [index]: level});
                                setShowTechLevelDropdown(null);
                              }}
                            >
                              {level}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {newEmployeeData.technologies.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => {
                        const newTechs = newEmployeeData.technologies.filter((_, i) => i !== index);
                        setNewEmployeeData({...newEmployeeData, technologies: newTechs});
                        
                        const newLevels = {...techLevels};
                        delete newLevels[index];
                        // Перенумеруем оставшиеся уровни
                        const updatedLevels = {};
                        newTechs.forEach((_, i) => {
                          updatedLevels[i] = newLevels[i >= index ? i + 1 : i] || 'Junior';
                        });
                        setTechLevels(updatedLevels);
                      }}
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
                  onClick={() => setNewEmployeeData({
                    ...newEmployeeData,
                    interests: [...newEmployeeData.interests, '']
                  })}
                >
                  +
                </button>
              </div>
              {newEmployeeData.interests.map((interest, index) => (
                <div key={index} className="array-item">
                  <input
                    type="text"
                    value={interest}
                    onChange={(e) => {
                      const newInterests = [...newEmployeeData.interests];
                      newInterests[index] = e.target.value;
                      setNewEmployeeData({...newEmployeeData, interests: newInterests});
                    }}
                    placeholder="Введите интерес"
                  />
                  {newEmployeeData.interests.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => {
                        const newInterests = newEmployeeData.interests.filter((_, i) => i !== index);
                        setNewEmployeeData({...newEmployeeData, interests: newInterests});
                      }}
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
                value={newEmployeeData.email}
                onChange={(e) => setNewEmployeeData({...newEmployeeData, email: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Телефон</label>
              <input 
                type="tel" 
                name="phone" 
                value={newEmployeeData.phone}
                onChange={(e) => setNewEmployeeData({...newEmployeeData, phone: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Telegram</label>
              <input 
                type="text" 
                name="telegram" 
                value={newEmployeeData.telegram}
                onChange={(e) => setNewEmployeeData({...newEmployeeData, telegram: e.target.value})}
              />
            </div>
            
            <div className="modal-actions">
              <button 
                className="save-btn" 
                onClick={async () => {
                  try {
                    // Создаем базовые данные сотрудника
                    const employeeData = {
                      telegram_name: newEmployeeData.telegram,
                      join_date: newEmployeeData.joinDate?.toISOString().split('T')[0],
                      full_name: `${newEmployeeData.lastName} ${newEmployeeData.firstName} ${newEmployeeData.middleName}`
                    };

                    // Отправляем запрос на создание сотрудника
                    const { data: employee } = await axios.post(`${BASE}/employee`, employeeData);

                    await axios.put(`${BASE}/employee/${employee.id_employee}`, {
                      email: newEmployeeData.email,
                      phone_number: newEmployeeData.phone,
                      city: newEmployeeData.city,
                      date_of_birth: newEmployeeData.birthDate?.toISOString().split('T')[0],
                      department_name: newEmployeeData.department,
                      position_name: newEmployeeData.position
                    });
                    
                    // Отправляем интересы
                    if (newEmployeeData.interests.length > 0 && newEmployeeData.interests[0] !== '') {
                      await axios.put(`${BASE}/employee/${employee.id_employee}/interests`, {
                        interests: newEmployeeData.interests.map(name => ({ name_interest: name }))
                      });
                    }

                    // Отправляем технологии
                    if (newEmployeeData.technologies.length > 0 && newEmployeeData.technologies[0] !== '') {
                      await axios.put(`${BASE}/employee/${employee.id_employee}/technologies`, {
                        technologies: newEmployeeData.technologies.map((name, index) => ({
                          name_technology: name,
                          id_rank: techLevels[index] === 'Middle' ? '51d35915-bf8d-4159-8153-2427692fe66f' : 
                                  techLevels[index] === 'Senior' ? '3cb8c1a9-7d1e-4989-9393-71a15d3b3075' : 
                                  '9b51cafd-209e-4c8d-9a68-44e8837e55dc'
                        }))
                      });
                    }

                    // Закрываем модальное окно и обновляем список сотрудников
                    setIsAddEmployeeModalOpen(false);
                    setEmployees([employee, ...employees]);
                    setNewEmployeeData({
                      firstName: '',
                      lastName: '',
                      middleName: '',
                      position: '',
                      city: '',
                      birthDate: null,
                      joinDate: new Date(), // Сбрасываем с текущей датой
                      department: '',
                      email: '',
                      phone: '',
                      telegram: '',
                      technologies: [''],
                      interests: [''],
                      projects: [{ name: '', role: '' }]
                    });
                    setTechLevels({ 0: 'Junior' });

                  } catch (error) {
                    console.error('Ошибка при создании сотрудника:', error);
                    alert('Произошла ошибка при создании сотрудника');
                  }
                }}
              >
                Сохранить
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => setIsAddEmployeeModalOpen(false)}
              >
                Отмена
              </button>
            </div>
          </motion.div>
        </div>
      )}
        {/* Pagination */}
        <div className="pagination">
          <button 
            disabled={meta.skip === 0 || loading} 
            onClick={() => changePage(meta.skip - meta.limit)}
          >
            ← Назад
          </button>

          <span>Страница {meta.skip / meta.limit + 1}</span>

          <button 
            disabled={employees.length < meta.limit || loading} 
            onClick={() => changePage(meta.skip + meta.limit)}
          >
            Вперед →
          </button>
        </div>

        {isEditEmployeeModalOpen && currentEmployeeData && (
          <div className="modal-overlay">
            <motion.div 
              className="edit-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <h3>Редактирование сотрудника</h3>

              <div className="form-columns">
                <div className="form-group">
                  <label>Фамилия</label>
                  <input 
                    type="text" 
                    value={currentEmployeeData.lastName}
                    onChange={(e) => setCurrentEmployeeData({...currentEmployeeData, lastName: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Имя</label>
                  <input 
                    type="text" 
                    value={currentEmployeeData.firstName}
                    onChange={(e) => setCurrentEmployeeData({...currentEmployeeData, firstName: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Отчество</label>
                  <input 
                    type="text" 
                    value={currentEmployeeData.middleName}
                    onChange={(e) => setCurrentEmployeeData({...currentEmployeeData, middleName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Должность</label>
                <input 
                  type="text" 
                  value={currentEmployeeData.position}
                  onChange={(e) => setCurrentEmployeeData({...currentEmployeeData, position: e.target.value})}
                />
              </div>
              
              <div className="form-columns">
                <div className="form-group">
                  <label>Город</label>
                  <input 
                    type="text" 
                    value={currentEmployeeData.city}
                    onChange={(e) => setCurrentEmployeeData({...currentEmployeeData, city: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Дата рождения</label>
                  <DatePicker
                    selected={currentEmployeeData.birthDate}
                    onChange={(date) => setCurrentEmployeeData({...currentEmployeeData, birthDate: date})}
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
                <label>Дата приема на работу</label>
                <DatePicker
                  selected={currentEmployeeData.joinDate}
                  onChange={(date) => setCurrentEmployeeData({...currentEmployeeData, joinDate: date})}
                  dateFormat="dd-MM-yyyy"
                  className="date-picker-input"
                  placeholderText="Выберите дату"
                  showYearDropdown
                  dropdownMode="select"
                  maxDate={new Date()}
                  disabled
                />
              </div>
              
              <div className="form-group">
                <label>Отдел</label>
                <input 
                  type="text" 
                  value={currentEmployeeData.department}
                  onChange={(e) => setCurrentEmployeeData({...currentEmployeeData, department: e.target.value})}
                />
              </div>
              
              <div className="form-section">
                <div className="section-header">
                  <h4>Технологии</h4>
                  <button 
                    type="button" 
                    className="add-btn"
                    onClick={() => {
                      setCurrentEmployeeData({
                        ...currentEmployeeData,
                        technologies: [...currentEmployeeData.technologies, '']
                      });
                      setTechLevels({
                        ...techLevels,
                        [currentEmployeeData.technologies.length]: 'Junior'
                      });
                    }}
                  >
                    +
                  </button>
                </div>
                {currentEmployeeData.technologies.map((tech, index) => (
                  <div key={index} className="array-item">
                    <div className="tech-input-wrapper">
                      <input
                        type="text"
                        value={tech}
                        onChange={(e) => {
                          const newTechs = [...currentEmployeeData.technologies];
                          newTechs[index] = e.target.value;
                          setCurrentEmployeeData({...currentEmployeeData, technologies: newTechs});
                        }}
                        placeholder="Введите технологию"
                      />
                      <div className="tech-level-dropdown">
                        <button 
                          className="tech-level-toggle"
                          onClick={() => setShowTechLevelDropdown(showTechLevelDropdown === index ? null : index)}
                        >
                          {techLevels[index] || 'Junior'} <FaChevronDown />
                        </button>
                        {showTechLevelDropdown === index && (
                          <div className="tech-level-options">
                            {['Junior', 'Middle', 'Senior'].map(level => (
                              <div 
                                key={level}
                                className="tech-level-option"
                                onClick={() => {
                                  setTechLevels({...techLevels, [index]: level});
                                  setShowTechLevelDropdown(null);
                                }}
                              >
                                {level}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {currentEmployeeData.technologies.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => {
                          const newTechs = currentEmployeeData.technologies.filter((_, i) => i !== index);
                          setCurrentEmployeeData({...currentEmployeeData, technologies: newTechs});
                          
                          const newLevels = {...techLevels};
                          delete newLevels[index];
                          const updatedLevels = {};
                          newTechs.forEach((_, i) => {
                            updatedLevels[i] = newLevels[i >= index ? i + 1 : i] || 'Junior';
                          });
                          setTechLevels(updatedLevels);
                        }}
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
                    onClick={() => setCurrentEmployeeData({
                      ...currentEmployeeData,
                      interests: [...currentEmployeeData.interests, '']
                    })}
                  >
                    +
                  </button>
                </div>
                {currentEmployeeData.interests.map((interest, index) => (
                  <div key={index} className="array-item">
                    <input
                      type="text"
                      value={interest}
                      onChange={(e) => {
                        const newInterests = [...currentEmployeeData.interests];
                        newInterests[index] = e.target.value;
                        setCurrentEmployeeData({...currentEmployeeData, interests: newInterests});
                      }}
                      placeholder="Введите интерес"
                    />
                    {currentEmployeeData.interests.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => {
                          const newInterests = currentEmployeeData.interests.filter((_, i) => i !== index);
                          setCurrentEmployeeData({...currentEmployeeData, interests: newInterests});
                        }}
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
                  value={currentEmployeeData.email}
                  onChange={(e) => setCurrentEmployeeData({...currentEmployeeData, email: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Телефон</label>
                <input 
                  type="tel" 
                  value={currentEmployeeData.phone}
                  onChange={(e) => setCurrentEmployeeData({...currentEmployeeData, phone: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Telegram</label>
                <input 
                  type="text" 
                  value={currentEmployeeData.telegram}
                  onChange={(e) => setCurrentEmployeeData({...currentEmployeeData, telegram: e.target.value})}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  className="save-btn" 
                  onClick={handleSaveEmployee}
                >
                  Сохранить
                </button>
                <button 
                  className="cancel-btn" 
                  onClick={() => setIsEditEmployeeModalOpen(false)}
                >
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

export default EmployeeSearch;