import React, { useState } from "react";
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaUsers, FaSearch, FaPlus, FaUserCircle } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import Header from "../components/Notification";
import "../styles/events.css";

const eventCategories = [
    { key: "all", label: "Все мероприятия" },
    { key: "training", label: "Тренинги" },
    { key: "meeting", label: "Совещания" },
    { key: "party", label: "Корпоративы" }
];

// Текущий пользователь (в реальном приложении нужно получать из контекста/авторизации)
const currentUser = "Иван Петров";

const mockEvents = [
    {
        id: 1,
        title: "React Advanced Training",
        category: "training",
        date: "2023-06-15T10:00:00",
        location: "Конференц-зал 3",
        organizer: "Иван Петров",
        description: "Продвинутый курс по React с hooks и context API",
        participants: ["Алексей Смирнов", "Мария Иванова", "Дмитрий Кузнецов"]
    },
    {
        id: 2,
        title: "Квартальное совещание",
        category: "meeting",
        date: "2023-06-20T14:00:00",
        location: "Зал заседаний",
        organizer: "Ольга Сидорова",
        description: "Обсуждение результатов квартала и планов на следующий период",
        participants: ["Все сотрудники отдела", "Иван Петров"]
    },
    {
        id: 3,
        title: "Летний корпоратив",
        category: "party",
        date: "2023-07-10T18:00:00",
        location: "Ресторан 'У моря'",
        organizer: "HR отдел",
        description: "Ежегодное летнее мероприятие для всех сотрудников",
        participants: ["Все сотрудники компании", "Иван Петров"]
    }
];

const Events = () => {
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMyEvents, setShowMyEvents] = useState(false);

    const filteredEvents = mockEvents.filter(event => {
        // Фильтрация по категории
        const matchesCategory = activeCategory === "all" || event.category === activeCategory;
        
        // Фильтрация по поисковому запросу
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            event.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Фильтрация по "Мои мероприятия"
        const matchesMyEvents = !showMyEvents || 
                              event.organizer === currentUser || 
                              event.participants.includes(currentUser);
        
        return matchesCategory && matchesSearch && matchesMyEvents;
    });

    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
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
                        <button className="create-event-btn">
                            <FaPlus /> Создать мероприятие
                        </button>
                    </div>
                </div>
                
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
                                
                                <p>{event.description}</p>
                                
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
                                    <button className="action-btn">Подробнее</button>
                                    {!event.participants.includes(currentUser) ? (
                                        <button className="action-btn primary">Записаться</button>
                                    ) : (
                                        <button className="action-btn danger">Отменить запись</button>
                                    )}
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
        </div>
    );
};

export default Events;