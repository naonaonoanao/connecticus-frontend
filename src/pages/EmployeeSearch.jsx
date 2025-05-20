import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaTimes, FaMapMarkerAlt, FaCode, FaProjectDiagram } from 'react-icons/fa';
import '../styles/EmployeeSearch.css';
import Sidebar from "../components/Sidebar";

const EmployeeSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: { selected: [], searchQuery: '' },
    position: { selected: [], searchQuery: '' },
    department: { selected: [], searchQuery: '' },
    team: { selected: [], searchQuery: '' },
    technologies: { selected: [], searchQuery: '' },
    interests: { selected: [], searchQuery: '' }
  });

  const employees = [
    {
      id: 1,
      name: 'Иванов Иван Иванович',
      position: 'Frontend разработчик',
      department: 'Разработка',
      city: 'Москва',
      technologies: ['React', 'JavaScript', 'TypeScript'],
      interests: ['Фотография', 'Путешествия'],
      team: 'Web Team'
    },
    {
      id: 2,
      name: 'Петрова Анна Сергеевна',
      position: 'UX/UI дизайнер',
      department: 'Дизайн',
      city: 'Санкт-Петербург',
      technologies: ['Figma', 'Photoshop'],
      interests: ['Рисование', 'Музыка'],
      team: 'Design Team'
    },
    {
      id: 3,
      name: 'Сидоров Алексей Владимирович',
      position: 'Backend разработчик',
      department: 'Разработка',
      city: 'Новосибирск',
      technologies: ['Node.js', 'Python', 'Docker'],
      interests: ['Спорт', 'Кино'],
      team: 'API Team'
    }
  ];

  const getFilterOptions = (filterType) => {
    const allOptions = new Set();
    
    employees.forEach(employee => {
      if (filterType === 'technologies' || filterType === 'interests') {
        employee[filterType].forEach(item => allOptions.add(item));
      } else if (employee[filterType]) {
        allOptions.add(employee[filterType]);
      }
    });
    
    const searchQuery = filters[filterType].searchQuery.toLowerCase();
    return Array.from(allOptions)
      .filter(option => option.toLowerCase().includes(searchQuery))
      .sort();
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilters = Object.entries(filters).every(([key, filter]) => {
      if (!filter.selected.length) return true;
      
      if (key === 'technologies' || key === 'interests') {
        return filter.selected.some(selected => 
          employee[key].includes(selected)
        );
      }
      
      return filter.selected.includes(employee[key]);
    });
    return matchesSearch && matchesFilters;
  });

  const handleFilterSearchChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: {
        ...prev[filterType],
        searchQuery: value
      }
    }));
  };

  const handleFilterOptionChange = (filterType, option) => {
    setFilters(prev => {
      const selected = prev[filterType].selected.includes(option)
        ? prev[filterType].selected.filter(item => item !== option)
        : [...prev[filterType].selected, option];
      
      return {
        ...prev,
        [filterType]: {
          ...prev[filterType],
          selected
        }
      };
    });
  };

  const resetFilters = () => {
    setFilters({
      city: { selected: [], searchQuery: '' },
      position: { selected: [], searchQuery: '' },
      department: { selected: [], searchQuery: '' },
      team: { selected: [], searchQuery: '' },
      technologies: { selected: [], searchQuery: '' },
      interests: { selected: [], searchQuery: '' }
    });
  };

  const renderEmployeeCard = (employee) => (
    <motion.div 
      className="employee-card" 
      key={employee.id}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="employee-header">
        <h3>{employee.name}</h3>
        <p className="position">{employee.position}</p>
      </div>
      
      <div className="employee-info">
        <div className="info-item">
          <FaMapMarkerAlt className="icon" />
          <span>{employee.city}</span>
        </div>
        <div className="info-item">
          <span>Отдел:</span>
          <span>{employee.department}</span>
        </div>
        <div className="info-item">
          <span>Команда:</span>
          <span>{employee.team}</span>
        </div>
      </div>
      
      <div className="employee-skills">
        <h4><FaCode className="icon" /> Технологии</h4>
        <div className="tags">
          {employee.technologies.map((tech, index) => (
            <span key={index} className="tag">{tech}</span>
          ))}
        </div>
      </div>
      
      <div className="employee-interests">
        <h4><FaProjectDiagram className="icon" /> Интересы</h4>
        <div className="tags">
          {employee.interests.map((interest, index) => (
            <span key={index} className="tag">{interest}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="employee-search-page">
      <Sidebar />
      <div className="employee-search-content">
        <div className="search-container">
          <motion.div 
            className="search-bar" 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Поиск по ФИО..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className={`filter-button ${Object.values(filters).some(f => f.selected.length > 0) ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Фильтры
              {Object.values(filters).some(f => f.selected.length > 0) && (
                <span className="filter-count">
                  {Object.values(filters).reduce((acc, f) => acc + f.selected.length, 0)}
                </span>
              )}
            </button>
          </motion.div>
  
          {showFilters && (
            <motion.div 
              className="filters-modal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="filters-header">
                <h3>Фильтры</h3>
                <button className="close-button" onClick={() => setShowFilters(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="filters-content">
                {['city', 'position', 'department', 'team', 'technologies', 'interests'].map((filter) => (
                  <div key={filter} className="filter-section">
                    <div className="filter-section-header">
                      <span>
                        {filter === 'city' && 'Город'}
                        {filter === 'position' && 'Должность'}
                        {filter === 'department' && 'Отдел'}
                        {filter === 'team' && 'Команда'}
                        {filter === 'technologies' && 'Технологии'}
                        {filter === 'interests' && 'Интересы'}
                      </span>
                      <input
                        type="text"
                        className="filter-search"
                        placeholder={`Начните вводить ${filter === 'city' ? 'город' : filter === 'technologies' ? 'технологию' : filter === 'position' ? 'должность' : filter === 'department' ? 'отдел' : filter === 'team' ? 'команду' : filter === 'interests' ? 'интересы' : filter} `}
                        value={filters[filter].searchQuery}
                        onChange={(e) => handleFilterSearchChange(filter, e.target.value)}
                      />
                    </div>
                    {filters[filter].searchQuery && (
                      <div className="filter-options">
                        {getFilterOptions(filter).length > 0 ? (
                          getFilterOptions(filter).map((option) => (
                            <div key={option} className="filter-option">
                              <input
                                type="checkbox"
                                id={`${filter}-${option}`}
                                checked={filters[filter].selected.includes(option)}
                                onChange={() => handleFilterOptionChange(filter, option)}
                              />
                              <label htmlFor={`${filter}-${option}`}>{option}</label>
                            </div>
                          ))
                        ) : (
                          <div className="no-options">Ничего не найдено</div>
                        )}
                      </div>
                    )}
                    {filters[filter].selected.length > 0 && (
                      <div className="selected-tags">
                        {filters[filter].selected.map(selected => (
                          <span key={selected} className="selected-tag">
                            {selected}
                            <button 
                              onClick={() => handleFilterOptionChange(filter, selected)}
                              className="remove-tag"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="filters-actions">
                <button className="reset-button" onClick={resetFilters}>
                  Сбросить все
                </button>
                <button 
                  className="apply-button" 
                  onClick={() => setShowFilters(false)}
                >
                  Применить
                </button>
              </div>
            </motion.div>
          )}
        </div>
  
        <div className="results-container">
          {filteredEmployees.length > 0 ? (
            <motion.div 
              className="employees-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {filteredEmployees.map(renderEmployeeCard)}
            </motion.div>
          ) : (
            <div className="no-results">
              <p>Сотрудники не найдены. Попробуйте изменить параметры поиска.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeSearch;
