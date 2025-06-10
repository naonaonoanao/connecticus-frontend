import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaSearch, FaFilter, FaTimes, FaMapMarkerAlt, FaCode, FaProjectDiagram, FaEnvelope, FaPhone, FaChevronDown, FaTelegram, FaUserPlus, FaInfoCircle, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { motion } from 'framer-motion';
import '../styles/EmployeeSearch.css';
import Sidebar from "../components/Sidebar";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BASE = 'https://api.connecticus.deadfairy.space/api/v1';

const HARDCODED_POSITIONS = [
  { id: "98f5f23a-d227-4239-9207-a2f36109208f", name: "Аналитик технологических процессов" },
  { id: "3681f7b9-c9d4-4726-aa25-adafc2377d7d", name: "Специалист по ИБ" },
  { id: "2ccc0c41-0cb5-4be7-b91d-7202cd6f6f82", name: "Менеджер по отделу кадров" },
  { id: "a707d5f8-f775-4b14-8486-e6364ecffe2e", name: "Средний инженер-программист" },
  { id: "68a2d30c-2d0b-4ebd-8d7a-849cf62f126f", name: "Старший инженер-программист" },
  { id: "48f4ef51-7fb4-4428-9808-56e9b79f51fb", name: "Младший инженер-программист" }
];

const HARDCODED_DEPARTMENTS = [
  { id: "fe43b605-9df0-4fae-a551-312a5a217e7b", name: "Разработка" },
  { id: "d021ddce-d215-4169-b69b-068f205958f4", name: "Аналитика" },
  { id: "3855eb25-e26d-4456-9198-cb964c66e71e", name: "Инфобез" }
];

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


  const [roleId, setRoleId] = useState(null)
  useEffect(() => {
  const roleIdFromStorage = localStorage.getItem("role_id");
  if (roleIdFromStorage) {
    setRoleId(roleIdFromStorage);
  }
}, []);

  const HR_ROLE_ID = "20eb025d-da7f-480e-8de0-d6e35dca6641";
  const isHR = roleId === HR_ROLE_ID;

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
    position: HARDCODED_POSITIONS[0]?.id || '', // безопасный доступ
    department: HARDCODED_DEPARTMENTS[0]?.id || '',
    city: '',
    birthDate: null,
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

        setNewEmployeeData({
          firstName: '',
          lastName: '',
          middleName: '',
          position: positions.data[0]?.id || '', // безопасный доступ
          department: departments.data[0]?.id || '',
          city: '',
          birthDate: null,
          email: '',
          phone: '',
          telegram: '',
          technologies: [''],
          interests: [''],
          projects: [{ name: '', role: '' }]
        });

      } catch (error) {
        console.error('Error loading options:', error);
        setNewEmployeeData({
        firstName: '',
        lastName: '',
        middleName: '',
        position: HARDCODED_POSITIONS[0]?.id || '',
        department: HARDCODED_DEPARTMENTS[0]?.id || '',
        city: '',
        birthDate: null,
        email: '',
        phone: '',
        telegram: '',
        technologies: [''],
        interests: [''],
        projects: [{ name: '', role: '' }]
      });
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
      middleName: employee.middle_name || null,
      position: employee.id_position || HARDCODED_POSITIONS[0].id,
      department: employee.id_department || HARDCODED_DEPARTMENTS[0].id,
      city: employee.city || '',
      birthDate: employee.date_of_birth ? new Date(employee.date_of_birth) : null,
      email: employee.email || '',
      phone: employee.phone_number || '',
      telegram: employee.telegram_name || '',
    });
    
    setIsEditEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async () => {
  const isConfirmed = window.confirm("Вы уверены, что хотите сохранить изменения?");
  if (!isConfirmed) return;

  try {
    const token = localStorage.getItem("access_token");
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // Валидация
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(currentEmployeeData.phone)) {
      alert("Некорректный формат телефона");
      return;
    }

    const telegramRegex = /^[a-zA-Z0-9_]{3,32}$/;
    if (!telegramRegex.test(currentEmployeeData.telegram)) {
      alert("Telegram должен быть 3–32 символов, только буквы, цифры и _");
      return;
    }

    if (!currentEmployeeData.firstName || !currentEmployeeData.lastName) {
      alert("Имя и фамилия обязательны");
      return;
    }

    const updateData = {
      first_name: currentEmployeeData.firstName,
      last_name: currentEmployeeData.lastName,
      middle_name: currentEmployeeData.middleName || '',
      telegram_name: currentEmployeeData.telegram,
      email: currentEmployeeData.email,
      phone_number: currentEmployeeData.phone,
      city: currentEmployeeData.city,
      date_of_birth: currentEmployeeData.birthDate?.toISOString().split('T')[0] || '',
      id_position: currentEmployeeData.position,
      id_department: currentEmployeeData.department
    };

    await axios.put(`${BASE}/employee/hr/${currentEmployeeData.id_employee}`, updateData, config);
    setIsEditEmployeeModalOpen(false);
    const params = buildParams();
    const { data } = await axios.get(`${BASE}/employee/employees`, {
      params,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setEmployees(data.data || []);
  } catch (error) {
    console.error('Ошибка при обновлении сотрудника:', error);
    alert(error.response?.data?.detail || 'Ошибка при обновлении данных сотрудника');
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
      {isHR && (
        <button 
          className="info-button"
          onClick={() => handleEditEmployee(emp)}
        >
          <FaInfoCircle />
        </button>
      )}
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
            {isHR && (
              <button
                className="add-employee-button"
                onClick={() => {
                  if (!newEmployeeData) {
                    alert("Данные должностей и отделов ещё не загружены. Подождите...");
                    return;
                  }
                  setIsAddEmployeeModalOpen(true);
                }}
              >
                <FaUserPlus /> Добавить сотрудника
              </button>
            )}
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
      {isAddEmployeeModalOpen && newEmployeeData !== null && (
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
              <select
                value={newEmployeeData?.position || ''}
                onChange={(e) => setCurrentEmployeeData({
                  ...currentEmployeeData,
                  position: e.target.value
                })}
              >
                {HARDCODED_POSITIONS.map(pos => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
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

            
            <div className="form-group">
              <label>Отдел</label>
              <select
                value={newEmployeeData?.department || ''}
                onChange={(e) => setCurrentEmployeeData({
                  ...currentEmployeeData,
                  department: e.target.value
                })}
              >
                {HARDCODED_DEPARTMENTS.map(dep => (
                  <option key={dep.id} value={dep.id}>
                    {dep.name}
                  </option>
                ))}
              </select>
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
                  const isConfirmed = window.confirm("Вы уверены, что хотите создать нового сотрудника?");
                  if (!isConfirmed) return;

                  try {
                    const token = localStorage.getItem("access_token");
                    const config = {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    };

                    const employeeData = {
                      first_name: newEmployeeData.firstName,
                      last_name: newEmployeeData.lastName,
                      middle_name: newEmployeeData.middleName || '',
                      date_of_birth: newEmployeeData.birthDate?.toISOString().split('T')[0],
                      email: newEmployeeData.email,
                      phone_number: newEmployeeData.phone,
                      telegram_name: newEmployeeData.telegram,
                      city: newEmployeeData.city,
                      id_position: newEmployeeData.position || HARDCODED_POSITIONS[0].id,
                      id_department: newEmployeeData.department || HARDCODED_DEPARTMENTS[0].id
                    };

                    const { data: employee } = await axios.post(`${BASE}/employee/hr`, employeeData, config);

                    setIsAddEmployeeModalOpen(false);
                    setNewEmployeeData({
                      firstName: '',
                      lastName: '',
                      middleName: '',
                      position: HARDCODED_POSITIONS[0].id,
                      department: HARDCODED_DEPARTMENTS[0].id,
                      city: '',
                      birthDate: null,
                      email: '',
                      phone: '',
                      telegram: '',
                      technologies: [''],
                      interests: [''],
                      projects: [{ name: '', role: '' }]
                    });
                    setTechLevels({ 0: 'Junior' });

                    const params = buildParams();
                    const { data } = await axios.get(`${BASE}/employee/employees`, {
                      params,
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    setEmployees(data.data || []);

                  } catch (error) {
                    console.error('Ошибка при создании сотрудника:', error);
                    alert("Не удалось создать сотрудника: " + (error.response?.data?.detail || "Неизвестная ошибка"));
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
                <select
                  value={currentEmployeeData.position}
                  onChange={(e) => setCurrentEmployeeData({
                    ...currentEmployeeData,
                    position: e.target.value
                  })}
                >
                  {HARDCODED_POSITIONS.map(pos => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
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
                <label>Отдел</label>
                <select
                  value={currentEmployeeData.department}
                  onChange={(e) => setCurrentEmployeeData({
                    ...currentEmployeeData,
                    department: e.target.value
                  })}
                >
                  {HARDCODED_DEPARTMENTS.map(dep => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>
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
                  className="delete-btn"
                  onClick={async () => {
                    if (window.confirm("Вы уверены, что хотите удалить этого сотрудника?")) {
                      try {
                        const token = localStorage.getItem("access_token");
                        await axios.delete(`${BASE}/employee/hr/${currentEmployeeData.id_employee}`, {
                          headers: {
                            Authorization: `Bearer ${token}`
                          }
                        });
                        setIsEditEmployeeModalOpen(false);
                        // Обновляем список сотрудников после удаления
                        const params = buildParams();
                        const { data } = await axios.get(`${BASE}/employee/employees`, { 
                          params,
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        setEmployees(data.data || []);
                      } catch (error) {
                        console.error('Ошибка при удалении сотрудника:', error);
                        alert('Не удалось удалить сотрудника');
                      }
                    }
                  }}
                >
                  <FaTrash /> Удалить
                </button>
                
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