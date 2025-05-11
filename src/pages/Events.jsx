import React, { useState } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaUsers, FaSearch, FaPlus, FaUserCircle, FaTimes } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Notification";
import "../styles/events.css";

const eventCategories = [
    { key: "all", label: "Все мероприятия" },
    { key: "training", label: "Тренинги" },
    { key: "meeting", label: "Совещания" },
    { key: "party", label: "Корпоративы" }
];

const currentUser = "Иван Петров";

const Events = () => {
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMyEvents, setShowMyEvents] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [events, setEvents] = useState([
        {
            id: 1,
            title: "React Advanced Training",
            category: "training",
            date: "2023-06-15T10:00:00",
            location: "Конференц-зал 3",
            organizer: "Иван Петров",
            description: "Продвинутый курс по React с hooks и context API. На тренинге будут рассмотрены продвинутые техники работы с React, включая оптимизацию производительности, работу с контекстом и создание кастомных хуков.",
            participants: ["Алексей Смирнов", "Мария Иванова", "Дмитрий Кузнецов"]
        },
        {
            id: 2,
            title: "Квартальное совещание",
            category: "meeting",
            date: "2023-06-20T14:00:00",
            location: "Зал заседаний",
            organizer: "Ольга Сидорова",
            description: "Обсуждение результатов квартала и планов на следующий период. Будут представлены отчеты по ключевым показателям эффективности, обсуждены текущие проекты и поставлены задачи на следующий квартал.",
            participants: ["Петр Иванов", "Иван Петров"]
        },
        {
            id: 3,
            title: "Летний корпоратив",
            category: "party",
            date: "2023-07-10T18:00:00",
            location: "Ресторан 'У моря'",
            organizer: "Анна Петрова",
            description: "Ежегодное летнее мероприятие для всех сотрудников компании. В программе: ужин, развлекательная программа, награждение лучших сотрудников и танцы до утра!",
            participants: ["Петр Иванов", "Иван Петров"]
        },
        {
            id: 4,
            title: "Введение в TypeScript",
            category: "training",
            date: "2023-07-05T11:00:00",
            location: "Онлайн",
            organizer: "Петр Васильев",
            description: "Базовый курс по TypeScript для начинающих. Познакомимся с основными концепциями типизации и научимся применять их в реальных проектах.",
            participants: ["Сергей Иванов", "Анна Петрова"]
        }
    ]);
    const [newEvent, setNewEvent] = useState({
        title: "",
        category: "training",
        date: "",
        time: "",
        location: "",
        description: "",
        participants: []
    });
    const [newParticipant, setNewParticipant] = useState("");

    const filteredEvents = events.filter(event => {
        const matchesCategory = activeCategory === "all" || event.category === activeCategory;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            event.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMyEvents = !showMyEvents || 
                              event.organizer === currentUser || 
                              event.participants.includes(currentUser);
        return matchesCategory && matchesSearch && matchesMyEvents;
    });

    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    };

    const handleDetailsClick = (event) => {
        setSelectedEvent(event);
    };

    const closeModal = () => {
        setSelectedEvent(null);
    };

    const handleCreateEvent = () => {
        const fullDate = `${newEvent.date}T${newEvent.time}:00`;
        const eventId = Math.max(...events.map(e => e.id)) + 1;
        
        setEvents([...events, {
            ...newEvent,
            id: eventId,
            date: fullDate,
            organizer: currentUser
        }]);
        
        setShowCreateModal(false);
        resetForm();
    };

    const resetForm = () => {
        setNewEvent({
            title: "",
            category: "training",
            date: "",
            time: "",
            location: "",
            description: "",
            participants: []
        });
        setNewParticipant("");
    };

    const handleNewEventChange = (e) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddParticipant = () => {
        if (newParticipant.trim() && !newEvent.participants.includes(newParticipant.trim())) {
            setNewEvent(prev => ({
                ...prev,
                participants: [...prev.participants, newParticipant.trim()]
            }));
            setNewParticipant("");
        }
    };

    const handleRemoveParticipant = (participant) => {
        setNewEvent(prev => ({
            ...prev,
            participants: prev.participants.filter(p => p !== participant)
        }));
    };

    return (
        <div className="events-page">
          <Sidebar />
          <div className="events-content">
            <Header />
            
            <div className="events-header">
              <h1 className="events-title">Мероприятия</h1>
              <div className="header-buttons">
                <button 
                  className={`my-events-btn ${showMyEvents ? "active" : ""}`}
                  onClick={() => setShowMyEvents(!showMyEvents)}
                >
                  <FaUserCircle /> Мои мероприятия
                </button>
                <button 
                  className="create-event-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  <FaPlus /> Создать мероприятие
                </button>
              </div>
            </div>
            
            {/* Обернули фильтры и поиск в общий контейнер */}
            <div className="filters-search-container">
              <div className="filter-panel">
                {eventCategories.map(category => (
                  <button
                    key={category.key}
                    className={`filter-btn ${activeCategory === category.key ? "active" : ""}`}
                    onClick={() => setActiveCategory(category.key)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              
              <div className="search-bar">
                <div className="search-input-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Поиск мероприятий..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="events-grid">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <h3 className="event-title">{event.title}</h3>
                      <span className={`event-category ${event.category}`}>
                        {eventCategories.find(c => c.key === event.category)?.label}
                      </span>
                    </div>
                    
                    <div className="event-details">
                      <div className="event-detail">
                        <FaCalendarAlt className="event-icon" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="event-detail">
                        <FaMapMarkerAlt className="event-icon" />
                        <span>{event.location}</span>
                      </div>
                      <div className="event-detail">
                        <FaUser className="event-icon" />
                        <span>{event.organizer}</span>
                        {event.organizer === currentUser && (
                          <span className="organizer-badge">(Вы)</span>
                        )}
                      </div>
                    </div>
                    
                    <p className="event-description">{event.description}</p>
                    
                    <div className="event-participants">
                      <div className="participants-title">
                        <FaUsers /> Участники:
                      </div>
                      <div className="participants-list">
                        {event.participants.map((participant, index) => (
                          <span 
                            key={index} 
                            className={`participant ${participant === currentUser ? "current-user" : ""}`}
                          >
                            {participant}
                            {participant === currentUser && " (Вы)"}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="event-actions">
                      <button 
                        className="action-btn" 
                        onClick={() => handleDetailsClick(event)}
                      >
                        Подробнее
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-events">
                  <h3>Мероприятия не найдены</h3>
                  <p>Попробуйте изменить параметры поиска</p>
                </div>
              )}
            </div>
          </div>
      
          {/* Модальное окно просмотра мероприятия */}
          {selectedEvent && (
            <div className="event-modal-overlay">
                <div className="event-modal">
                <div className="modal-header">
                    <h2>{selectedEvent.title}</h2>
                    <span className={`event-category ${selectedEvent.category}`}>
                    {eventCategories.find(c => c.key === selectedEvent.category)?.label}
                    </span>
                </div>
                
                <div className="modal-content">
                    <div className="modal-section">
                    <div className="modal-details">
                        <div className="modal-detail">
                        <FaCalendarAlt className="modal-icon" />
                        <span><strong>Дата и время:</strong> {formatDate(selectedEvent.date)}</span>
                        </div>
                        <div className="modal-detail">
                        <FaMapMarkerAlt className="modal-icon" />
                        <span><strong>Место:</strong> {selectedEvent.location}</span>
                        </div>
                        <div className="modal-detail">
                        <FaUser className="modal-icon" />
                        <span><strong>Организатор:</strong> {selectedEvent.organizer}</span>
                        {selectedEvent.organizer === currentUser && (
                            <span className="organizer-badge">(Вы)</span>
                        )}
                        </div>
                    </div>
                    </div>
                    
                    <div className="modal-section">
                    <h3>Описание</h3>
                    <p className="modal-description">{selectedEvent.description}</p>
                    </div>
                    
                    <div className="modal-section">
                    <h3>Участники ({selectedEvent.participants.length})</h3>
                    <div className="modal-participants">
                        {selectedEvent.participants.map((participant, index) => (
                        <div 
                            key={index} 
                            className={`participant ${participant === currentUser ? "current-user" : ""}`}
                        >
                            {participant}
                            {participant === currentUser && " (Вы)"}
                        </div>
                        ))}
                    </div>
                    </div>
                </div>
                
                <div className="modal-actions">
                    <div className="primary-action">
                    {!selectedEvent.participants.includes(currentUser) ? (
                        <button className="action-btn primary">Записаться</button>
                    ) : (
                        <button className="cancel-btn">Отменить запись</button>
                    )}
                    </div>
                    <button className="cancel-btn" onClick={closeModal}>
                    Вернуться
                    </button>
                </div>
                </div>
            </div>
            )}

            {/* Модальное окно создания мероприятия */}
            {showCreateModal && (
            <div className="event-modal-overlay">
                <div className="event-modal">
                <div className="modal-header">
                    <h2>Создать мероприятие</h2>
                </div>
                
                <div className="modal-content">
                    <div className="modal-section">
                    <div className="form-group">
                        <label>Название мероприятия</label>
                        <input
                        type="text"
                        name="title"
                        value={newEvent.title}
                        onChange={handleNewEventChange}
                        required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Тип мероприятия</label>
                        <select
                        name="category"
                        value={newEvent.category}
                        onChange={handleNewEventChange}
                        required
                        >
                        <option value="training">Тренинг</option>
                        <option value="meeting">Совещание</option>
                        <option value="party">Корпоратив</option>
                        </select>
                    </div>
                    </div>
                    
                    <div className="modal-section">
                    <h3>Дата и время</h3>
                    <div className="form-row">
                        <div className="form-group">
                        <label>Дата</label>
                        <input
                            type="date"
                            name="date"
                            value={newEvent.date}
                            onChange={handleNewEventChange}
                            required
                        />
                        </div>
                        <div className="form-group">
                        <label>Время</label>
                        <input
                            type="time"
                            name="time"
                            value={newEvent.time}
                            onChange={handleNewEventChange}
                            required
                        />
                        </div>
                    </div>
                    </div>
                    
                    <div className="modal-section">
                    <div className="form-group">
                        <label>Место проведения</label>
                        <input
                        type="text"
                        name="location"
                        value={newEvent.location}
                        onChange={handleNewEventChange}
                        required
                        />
                    </div>
                    </div>
                    
                    <div className="modal-section">
                    <h3>Описание</h3>
                    <div className="form-group">
                        <textarea
                        name="description"
                        value={newEvent.description}
                        onChange={handleNewEventChange}
                        rows="4"
                        />
                    </div>
                    </div>
                    
                    <div className="modal-section">
                    <h3>Участники</h3>
                    <div className="form-group">
                        <div className="participant-input">
                        <input
                            type="text"
                            placeholder="Добавить участника"
                            value={newParticipant}
                            onChange={(e) => setNewParticipant(e.target.value)}
                        />
                        <button 
                            type="button" 
                            className="action-btn primary"
                            onClick={handleAddParticipant}
                        >
                            Добавить
                        </button>
                        </div>
                        
                        <div className="participants-list">
                        {newEvent.participants.map((participant, index) => (
                            <div key={index} className="participant-tag">
                            {participant}
                            <button 
                                type="button"
                                className="remove-participant"
                                onClick={() => handleRemoveParticipant(participant)}
                            >
                                ×
                            </button>
                            </div>
                        ))}
                        </div>
                    </div>
                    </div>
                </div>
                
                <div className="modal-actions">
                    <div className="primary-action">
                    <button 
                        type="button" 
                        className="action-btn primary"
                        onClick={handleCreateEvent}
                        disabled={!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.location}
                    >
                        Создать
                    </button>
                    </div>
                    <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={() => {
                            setShowCreateModal(false);
                            resetForm();
                        }}
                      >
                        Отмена
                        </button>
                </div>
                </div>
            </div>
            )}
        </div>
      );
};

export default Events;