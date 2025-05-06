// EmployeeSearch.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaTimes, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaCode, FaProjectDiagram } from 'react-icons/fa';
import '../styles/EmployeeSearch.css';

const EmployeeSearch = () => {
  // Состояния для поиска и фильтров
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    position: '',
    department: '',
    team: '',
    technologies: '',
    interests: ''
  });
  const [activeFilter, setActiveFilter] = useState(null);

  // Моковые данные сотрудников
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
    }
  ];

  // Функция фильтрации
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (key === 'technologies' || key === 'interests') {
        return employee[key].some(item => item.toLowerCase().includes(value.toLowerCase()));
      }
      return employee[key]?.toLowerCase().includes(value.toLowerCase());
    });
    return matchesSearch && matchesFilters;
  });

  // Обработчики событий
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      city: '',
      position: '',
      department: '',
      team: '',
      technologies: '',
      interests: ''
    });
  };

  const toggleFilterSection = (filterName) => {
    setActiveFilter(activeFilter === filterName ? null : filterName);
  };

  // Рендер карточки сотрудника (встроенный компонент)
  const renderEmployeeCard = (employee) => (
    <div className="employee-card" key={employee.id}>
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
    </div>
  );

  return (
    <div className="employee-search-page">
      {/* Поисковая строка и фильтры */}
      <div className="search-container">
        <motion.div className="search-bar" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
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
            className={`filter-button ${Object.values(filters).some(Boolean) ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Фильтры
          </button>
        </motion.div>

        {/* Модальное окно фильтров */}
        {showFilters && (
          <motion.div className="filters-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="filters-header">
              <h3>Фильтры</h3>
              <button className="close-button" onClick={() => setShowFilters(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="filters-content">
              {['city', 'position', 'department', 'team', 'technologies', 'interests'].map((filter) => (
                <div key={filter} className="filter-section">
                  <div className="filter-section-header" onClick={() => toggleFilterSection(filter)}>
                    <span>
                      {filter === 'city' && 'Город'}
                      {filter === 'position' && 'Должность'}
                      {filter === 'department' && 'Отдел'}
                      {filter === 'team' && 'Команда'}
                      {filter === 'technologies' && 'Технологии'}
                      {filter === 'interests' && 'Интересы'}
                    </span>
                    {activeFilter === filter ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  {activeFilter === filter && (
                    <input
                      type="text"
                      name={filter}
                      placeholder={`Например: ${filter === 'city' ? 'Москва' : filter === 'technologies' ? 'React' : ''}`}
                      value={filters[filter]}
                      onChange={handleFilterChange}
                    />
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

      {/* Результаты поиска */}
      <div className="results-container">
        {filteredEmployees.length > 0 ? (
          <div className="employees-grid">
            {filteredEmployees.map(renderEmployeeCard)}
          </div>
        ) : (
          <div className="no-results">
            <p>Сотрудники не найдены. Попробуйте изменить параметры поиска.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSearch;