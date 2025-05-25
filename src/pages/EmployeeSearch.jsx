import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  FaSearch, FaFilter, FaTimes,
  FaMapMarkerAlt, FaCode, FaProjectDiagram,
  FaEnvelope, FaPhone, FaTelegram
} from 'react-icons/fa';
import '../styles/EmployeeSearch.css';
import Sidebar from "../components/Sidebar";

const BASE = 'http://localhost:8080/api/v1';

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

  const [options, setOptions] = useState({
    cities: [], positions: [], departments: [],
    projects: [], technologies: [], interests: []
  });

  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState({ 
    total_count: 0, 
    total_pages: 1, 
    skip: 0, 
    limit: 6 
  });

  const [loading, setLoading] = useState(false);

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

        // Исправлен доступ к данным согласно структуре ответа
      setEmployees(data.data || []);
      setMeta(prev => ({
        ...prev,
        total_count: data.meta?.total_count || 0,
        total_pages: data.meta?.total_pages || 1
      }));

      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Ошибка:', error);
          setEmployees([]);
        }
      } finally {
        setLoading(false);
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
          {loading
            ? <p>Загрузка…</p>
            : employees.length > 0
              ? <motion.div className="employees-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }}>
                  {employees.map(renderEmployeeCard)}
                </motion.div>
              : <p>Сотрудники не найдены.</p>
          }
        </div>
        {/* Pagination */}
        <div className="pagination">
          <button disabled={meta.skip === 0} onClick={() => changePage(meta.skip - meta.limit)}>← Prev</button>
          <span>Стр. {meta.skip / meta.limit + 1} из {meta.total_pages}</span>
          <button disabled={meta.skip + meta.limit >= meta.total_count} onClick={() => changePage(meta.skip + meta.limit)}>Next →</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSearch;