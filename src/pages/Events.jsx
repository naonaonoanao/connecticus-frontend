import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaUser, 
  FaUsers, 
  FaSearch, 
  FaPlus, 
  FaUserCircle, 
  FaClock,
  FaChevronDown,
  FaCheck
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import Header from "../components/Notification";
import "../styles/events.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";


const eventCategories = [
    { key: "all", label: "Все мероприятия" },
    { key: "training", label: "Тренинги" },
    { key: "meeting", label: "Совещания" },
    { key: "party", label: "Корпоративы" }
];

const eventTypes = [
  { value: "training", label: "Тренинг" },
  { value: "meeting", label: "Совещание" },
  { value: "party", label: "Корпоратив" }
];

const Events = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMyEvents, setShowMyEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [showParticipantsDropdown, setShowParticipantsDropdown] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const dropdownRef = useRef(null);
  const eventTypeButtonRef = useRef(null);
  const participantsDropdownRef = useRef(null);
  const participantInputRef = useRef(null);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editEventId, setEditEventId] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userTypedSearch, setUserTypedSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationData, setConfirmationData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({
    title: false,
    date: false,
    location: false
  });
  
  useEffect(() => {
    const categoryToType = {
      training: "Тренинг",
      meeting: "Совещание",
      party: "Корпоратив"
    };
  
    // Если поле поиска пустое, не добавляем его в запрос
    if (userTypedSearch.trim() === '') {
      setSearchQuery(activeCategory !== "all" ? categoryToType[activeCategory] : "");
      return;
    }
  
    const categoryPart = activeCategory !== "all" ? categoryToType[activeCategory] : "";
    const searchParts = [];
  
    if (categoryPart) searchParts.push(categoryPart);
    if (userTypedSearch.trim()) searchParts.push(userTypedSearch.trim());
  
    setSearchQuery(searchParts.join(" "));
  }, [activeCategory, userTypedSearch]);
  
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    setSearchTimeout(setTimeout(() => {
      setMeta(prev => ({ ...prev, skip: 0 })); // Сбрасываем пагинацию при изменении поиска
    }, 500));
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [userTypedSearch, activeCategory]);
  
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          navigate("/login");
          return;
        }
    
        const { data } = await axios.get("https://api.connecticus.deadfairy.space/api/v1/user/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
    
        if (!data?.employee) {
          throw new Error("Данные пользователя не получены");
        }
    
        const userProfile = {
          id: data.employee.id_employee,
          firstName: data.employee.first_name,
          lastName: data.employee.last_name,
          middleName: data.employee.middle_name || '',
          fullName: `${data.employee.first_name} ${data.employee.last_name} ${data.employee.middle_name || ''}`.trim()
        };
    
        setProfileData(userProfile);
        setCurrentUser(userProfile.id); // Используем полное имя как идентификатор
      } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    };

    fetchCurrentUserProfile();
  }, []);

  useEffect(() => {
    console.log("👤 currentUser ID:", currentUser);
    console.log("📋 profileData:", profileData);
  }, [currentUser, profileData]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (datePickerOpen && !event.target.closest('.react-datepicker') && 
            !event.target.closest('.date-picker-container')) {
          setDatePickerOpen(false);
        }
        
        // Для event type dropdown
        if (showEventTypeDropdown && 
            !event.target.closest('.event-type-dropdown') && 
            !event.target.closest('.event-type-toggle')) {
          setShowEventTypeDropdown(false);
        }
        
        // Для participants dropdown
        if (showParticipantsDropdown && 
            !event.target.closest('.participants-dropdown') && 
            !event.target.closest('.participant-search-input')) {
          setShowParticipantsDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [datePickerOpen, showEventTypeDropdown, showParticipantsDropdown]);

    useEffect(() => {
      const fetchAllParticipants = async () => {
        try {
          const token = localStorage.getItem("access_token");
          if (!token) return;
    
          const response = await axios.get("https://api.connecticus.deadfairy.space/api/v1/employee/employees?limit=200", {
            headers: { Authorization: `Bearer ${token}` }
          });
    
          setAllParticipants(response.data.data.map(p => ({
            id: p.id_employee,
            name: `${p.first_name} ${p.last_name}`
          })));
        } catch (error) {
          console.error("Ошибка загрузки участников:", error);
        }
      };
    
      fetchAllParticipants();
    }, []);
    
    

    const [meta, setMeta] = useState({ 
      total_count: 1, 
      total_pages: 1, 
      skip: 0, 
      limit: 6 
    });
    
    const [events, setEvents] = useState([]);

    useEffect(() => {
      const fetchEvents = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
          const token = localStorage.getItem("access_token");
          if (!token) {
            setEvents([]);
            return;
          }
      
          const baseUrl = showMyEvents 
            ? `https://api.connecticus.deadfairy.space/api/v1/events/my`
            : `https://api.connecticus.deadfairy.space/api/v1/events`;
      
          const params = new URLSearchParams();
          params.append("skip", meta.skip);
          params.append("limit", meta.limit);
          if (searchQuery.trim() !== "") {
            params.append("search", searchQuery.trim());
          }
      
          console.log("Fetching events with params:", params.toString()); // Логируем параметры запроса
      
          const response = await fetch(`${baseUrl}?${params.toString()}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
      
          if (!response.ok) {
            throw new Error("Ошибка при загрузке мероприятий");
          }
      
          const data = await response.json();
          console.log("Received data:", data); // Логируем полученные данные
      
          const mappedEvents = data.events.map(event => ({
            id: event.id_event,
            title: event.name_event,
            category: mapEventTypeToCategory(event.event_type.name_type),
            date: event.date,
            location: event.place,
            organizer: `${event.owner.first_name} ${event.owner.last_name}`,
            organizerId: event.owner.id_employee,
            description: event.description || "Нет описания",
            attendees: event.attendees || [], 
            isOwner: event.owner.id_employee === profileData?.id,
            isJoined: event.attendees?.some(attendee => attendee.id_employee === profileData?.id) || false
          }));
          
          setEvents(mappedEvents);
          
          setMeta(prev => ({
            ...prev,
            ...data.meta 
          }));
          
        } catch (error) {
          console.error("Ошибка загрузки мероприятий:", error);
          setEvents([]);
        } finally {
          setIsLoading(false);
        }
      };
    
      fetchEvents();
    }, [meta.skip, meta.limit, searchQuery, showMyEvents]);

    const handleJoinEvent = async (eventId) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Пожалуйста, войдите в систему");
        return;
      }
      try {
        const response = await fetch(`https://api.connecticus.deadfairy.space/api/v1/events/${eventId}/join`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          alert("Ошибка при регистрации: " + (errorData.detail || response.statusText));
          return;
        }
  
        const data = await response.json();
        alert(data.message);
  
        // Обновим список мероприятий, чтобы отобразить изменения (например, добавить текущего пользователя в participants)
        refreshEvents(profileData);
      } catch (error) {
        alert("Ошибка при отправке запроса: " + error.message);
      }
    };
  
    const handleLeaveEvent = async (eventId) => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Пожалуйста, войдите в систему");
        return;
      }
      try {
        const response = await fetch(`https://api.connecticus.deadfairy.space/api/v1/events/${eventId}/leave`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          alert("Ошибка при отказе от участия: " + (errorData.detail || response.statusText));
          return;
        }
  
        const data = await response.json();
        alert(data.message);
  
        // Обновим список мероприятий, чтобы убрать пользователя из участников
        refreshEvents(profileData);
      } catch (error) {
        alert("Ошибка при отправке запроса: " + error.message);
      }
    };
  
    // Вынесем в функцию для обновления списка событий
    const refreshEvents = async (userProfile) => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setEvents([]);
          return;
        }
    
        const baseUrl = showMyEvents 
          ? `https://api.connecticus.deadfairy.space/api/v1/events/my`
          : `https://api.connecticus.deadfairy.space/api/v1/events`;
    
        const params = new URLSearchParams();
        params.append("skip", meta.skip);
        params.append("limit", meta.limit);
        if (searchQuery.trim() !== "") {
          params.append("search", searchQuery.trim());
        }
    
        const response = await fetch(`${baseUrl}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
    
        if (!response.ok) {
          throw new Error("Ошибка при загрузке мероприятий");
        }
    
        const data = await response.json();
    
        const mappedEvents = data.events.map(event => ({
          id: event.id_event,
          title: event.name_event,
          category: mapEventTypeToCategory(event.event_type.name_type),
          date: event.date,
          location: event.place,
          organizer: `${event.owner.first_name} ${event.owner.last_name}`,
          organizerId: event.owner.id_employee,
          description: event.description || "Нет описания",
          attendees: event.attendees || [],
          isOwner: event.owner.id_employee === profileData?.id,
          isJoined: event.attendees?.some(attendee => attendee.id_employee === profileData?.id) || false
        }));
    
        setEvents(mappedEvents);
        if (selectedEvent) {
          const updatedEvent = mappedEvents.find(e => e.id === selectedEvent.id);
          if (updatedEvent) setSelectedEvent(updatedEvent);
        }
        setMeta(data.meta || meta);
      } catch (error) {
        console.error("Ошибка загрузки мероприятий:", error);
        setEvents([]);
      }finally {
        setIsLoading(false);
      }
    };  

    const refreshSelectedEvent = () => {
      if (!selectedEvent) return;
    
      const updatedEvent = events.find(e => e.id === selectedEvent.id);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
      }
    };
    
  
    // Подгружаем события изначально и при изменениях зависимостей
    useEffect(() => {
      refreshEvents(profileData);
    }, [meta.skip, meta.limit, searchQuery, showMyEvents]);
    

    const mapEventTypeToCategory = (type) => {
      switch (type) {
        case "Тренинг":
          return "training";
        case "Совещание":
        case "Внутреннее совещание":
          return "meeting";
        case "Корпоратив":
          return "party";
        default:
          return "all";
      }
    };
    
    

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

    const filteredParticipants = allParticipants.filter(participantObj =>
      participantObj.name.toLowerCase().includes(participantSearch.toLowerCase()) &&
      !newEvent.participants.some(p => p.id === participantObj.id)
    ); 



    const handleDateChange = (date) => {
        const formattedDate = date.toISOString().split('T')[0];
        setNewEvent(prev => ({
            ...prev,
            date: formattedDate
        }));
        setDatePickerOpen(false);
    };

    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    };

  const handleEventTypeSelect = (type) => {
      setNewEvent(prev => ({
          ...prev,
          category: type
      }));
      setShowEventTypeDropdown(false);
  };

  const handleDetailsClick = (event) => {
    if (!profileData) return;
    
    const isOwner = event.organizerId === profileData.id;
    const isJoined = event.attendees?.some(attendee => attendee.id_employee === profileData.id);
  
    setSelectedEvent({
      ...event,
      isOwner,
      isJoined
    });
  };
  

  const closeModal = () => {
    setSelectedEvent(null);
    setShowCreateModal(false);
    setIsEditMode(false);
    setEditEventId(null);
    setNewEvent({
      title: "",
      category: "training",
      date: "",
      time: "",
      location: "",
      description: "",
      participants: []
    });
  };
  

    const mapEventTypeToId = {
      training: "e2aa6731-14fd-4530-a985-9d72de829e8a",
      meeting: "5ae06ca5-eff6-4341-a870-749e48da9cd4",
      party:   "b3a02072-6df9-402e-a9c1-0cc03c7c2f17"
    };
    

    const handleCreateEvent = async () => {
  setIsLoading(true);
  
  const eventTypeId = mapEventTypeToId[newEvent.category];
  
  if (!eventTypeId) {
    alert("Выберите корректный тип события");
    setIsLoading(false);
    return;
  }

  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("Пожалуйста, войдите в систему");
    setIsLoading(false);
    return;
  }
    
      try {
        // Сначала создаем/редактируем мероприятие
        let response;
        const payload = {
          name_event: newEvent.title,
          date: newEvent.date,
          place: newEvent.location,
          id_event_type: eventTypeId
        };
    
        if (isEditMode && editEventId) {
          // Редактирование существующего мероприятия
          response = await fetch(`https://api.connecticus.deadfairy.space/api/v1/events/${editEventId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        } else {
          // Создание нового мероприятия
          response = await fetch("https://api.connecticus.deadfairy.space/api/v1/events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        }
    
        if (!response.ok) {
          const errorData = await response.json();
          alert((isEditMode ? "Ошибка при редактировании мероприятия: " : "Ошибка при создании мероприятия: ") + 
            (errorData.detail || response.statusText));
          return;
        }
    
        const eventData = await response.json();
        const eventId = eventData.id_event || editEventId;
    
        // Добавляем участников к мероприятию
        if (newEvent.participants.length > 0) {
          for (const participant of newEvent.participants) {
            try {
              const attendeeResponse = await fetch(
                `https://api.connecticus.deadfairy.space/api/v1/events/${eventId}/attendees?employee_id=${participant.id}`, 
                {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${token}`
                  }
                }
              );
    
              if (!attendeeResponse.ok) {
                const errorData = await attendeeResponse.json();
                console.error(`Ошибка при добавлении участника ${participant.name}:`, errorData);
              }
            } catch (error) {
              console.error(`Ошибка при добавлении участника ${participant.name}:`, error);
            }
          }
        }
    
        // Обновляем список мероприятий
        refreshEvents(profileData);
        
        // Закрываем модалку и сбрасываем форму
        setShowCreateModal(false);
        resetForm();
        setIsEditMode(false);
        setEditEventId(null);
        
        refreshEvents(profileData);
      } catch (error) {
        alert("Ошибка при отправке запроса: " + error.message);
      }finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
      // Добавляем проверку на допустимость skip
      if (meta.skip >= 0 && meta.skip < meta.total_count) {
        refreshEvents(profileData);
      }
    }, [meta.skip, meta.limit, searchQuery, showMyEvents]);
    
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
      setIsEditMode(false);
      setEditEventId(null);
      setValidationErrors({
        title: false,
        date: false,
        time: false,
        location: false
      });
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

    const handleParticipantSelect = (participant) => {
      if (!newEvent.participants.some(p => p.id === participant.id)) {
        setNewEvent(prev => ({
          ...prev,
          participants: [...prev.participants, participant]
        }));
      }
      setParticipantSearch("");
      setShowParticipantsDropdown(false);
      participantInputRef.current?.focus();
    };

    const handleParticipantSearchChange = (e) => {
      setParticipantSearch(e.target.value);
      if (e.target.value.length > 0) {
        setShowParticipantsDropdown(true);
      } else {
        setShowParticipantsDropdown(false);
      }
    };

    const handleRemoveParticipant = (participantId) => {
      setNewEvent(prev => ({
        ...prev,
        participants: prev.participants.filter(p => p.id !== participantId)
      }));
    };

    const changePage = useCallback((direction) => {
      setMeta(prev => {
        const newSkip = direction === 'next' 
          ? prev.skip + prev.limit 
          : Math.max(0, prev.skip - prev.limit);
        
        // Всегда возвращаем новое состояние, даже если skip не изменился
        return { ...prev, skip: newSkip };
      });
    }, []); // Убрали зависимости, так как используем функциональное обновление
    

    const isUserOrganizer = selectedEvent && currentUser && 
      selectedEvent.organizerId === currentUser;

  const isUserParticipant = (event) => {
    if (!currentUser || !event?.attendees) return false;
    return (event.attendees || []).some(attendee => attendee.id_employee === currentUser);
  };
      

    const isCurrentUserOrganizer = selectedEvent?.organizerId === currentUser;
    const isCurrentUserParticipant = (selectedEvent?.attendees || []).some(attendee => attendee.id_employee === currentUser);
    
    const isUserAttending = (event) => {
      return (event.attendees || []).some(attendee => attendee.id_employee === currentUser);
    };

    const fillEditForm = (event) => {
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toISOString().split('T')[0];
      const formattedTime = eventDate.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(':', '');
    
      setNewEvent({
        title: event.title,
        category: event.category,
        date: formattedDate,
        time: formattedTime,
        location: event.location,
        description: event.description || "",
        participants: event.attendees.map(attendee => ({
          id: attendee.id_employee,
          name: `${attendee.first_name} ${attendee.last_name}`
        })) || []
      });
      
      setEditEventId(event.id);
      setIsEditMode(true);
      setShowCreateModal(true);
    };

    const handleDeleteEvent = async (eventId) => {
      setIsLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Пожалуйста, войдите в систему");
        return;
      }
    
      try {
        const response = await fetch(`https://api.connecticus.deadfairy.space/api/v1/events/${eventId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
    
        if (!response.ok) {
          const errorData = await response.json();
          alert("Ошибка при удалении мероприятия: " + (errorData.detail || response.statusText));
          return;
        }
    
        const data = await response.json();
    
        // Закрываем все модальные окна
        setSelectedEvent(null); // Закрываем модальное окно просмотра
        setShowCreateModal(false); // Закрываем модальное окно создания/редактирования
        setIsEditMode(false);
        resetForm();
    
        refreshEvents(profileData);
      } catch (error) {
        alert("Ошибка при отправке запроса: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const handleEditEvent = (event) => {
      setIsEditMode(true);
      setEditEventId(event.id);
      setShowCreateModal(true);
      
      // Устанавливаем значения из существующего события
      setNewEvent({
        title: event.title || "",
        category: event.category || "training",
        date: event.date?.split("T")[0] || "", // Обрезаем время, если есть
        time: "", // если будешь поддерживать время, можно парсить отдельно
        location: event.location || "",
        description: event.description || "",
        participants: event.attendees?.map(att => ({
          id: att.id_employee,
          name: `${att.first_name} ${att.last_name}`
        })) || []
      });
    };

    const currentPage = Math.floor(meta.skip / meta.limit) + 1;
    const totalPages = meta.total_pages;

    const hasNextPage = useMemo(() => {
      if (isLoading || events.length === 0) return false;
      
      // Для "моих мероприятий" используем total_count из meta
      if (showMyEvents) {
        return meta.skip + meta.limit < meta.total_count;
      }
      
      // Для всех мероприятий - если получили полную страницу событий
      return events.length === meta.limit;
    }, [events.length, meta, showMyEvents, isLoading]);

    const handleActionConfirmation = (action, data) => {
      // Валидация полей
      const errors = {
        title: !newEvent.title,
        date: !newEvent.date,
        location: !newEvent.location
      };
    
      setValidationErrors(errors);
    
      // Проверяем, есть ли ошибки
      const hasErrors = Object.values(errors).some(error => error);
      if (hasErrors) {
        return;
      }
    
      // Если ошибок нет, показываем модальное окно подтверждения
      setConfirmationAction(action);
      setConfirmationData(data);
      setShowConfirmationModal(true);
    };

  const executeConfirmedAction = async () => {
    setShowConfirmationModal(false);
    
    if (confirmationAction === 'create') {
      await handleCreateEvent();
    } else if (confirmationAction === 'edit') {
      await handleCreateEvent(); // Используем ту же функцию, так как редактирование уже обрабатывается внутри
    } else if (confirmationAction === 'delete') {
      await handleDeleteEvent(confirmationData);
    }
  };


    return (
        <div className="events-page">
          <Sidebar />
          <div className="events-content">
            <Header />
            
            <div className="events-header">
              <h1 className="events-title">Мероприятия</h1>
              <div className="header-buttons">
                {/* Кнопка переключения "Мои мероприятия" */}
                <button
                  type="button"
                  className={`my-events-btn ${showMyEvents ? "active" : ""}`}
                  onClick={() => {
                    setShowMyEvents(prev => !prev);
                    setMeta(prev => ({ ...prev, skip: 0 }));  // сброс пагинации
                  }}
                  aria-pressed={showMyEvents}  // для доступности — показывает состояние кнопки
                  title={showMyEvents ? "Показать все мероприятия" : "Показать только мои мероприятия"}
                >
                  <FaUserCircle style={{ marginRight: 6 }} />
                  Мои мероприятия
                </button>

                {/* Кнопка создания мероприятия */}
                <button
                  type="button"
                  className="create-event-btn"
                  onClick={() => setShowCreateModal(true)}
                  title="Создать новое мероприятие"
                >
                  <FaPlus style={{ marginRight: 6 }} />
                  Создать мероприятие
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
                  data-category={category.key}
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
                  value={userTypedSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUserTypedSearch(value);
                    if (value.trim() === '') {
                      setSearchQuery('');
                      setMeta(prev => ({ ...prev, skip: 0 }));
                    }
                  }}
                  placeholder="Поиск по названию или месту"
                />
                {userTypedSearch && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => {
                      setUserTypedSearch('');
                      setSearchQuery('');
                      setMeta(prev => ({ ...prev, skip: 0 }));
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            </div>
            
            <div className="events-grid">
              {events.length > 0 ? (
                events.map(event => {
                  const isOrganizer = currentUser === event.organizer;
                  const isParticipant = (event.attendees || []).some(participant => participant.id === currentUser);

                  return (
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
                          {isOrganizer && (
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
                          {(event.attendees || []).map((attendee, index) => (
                            <span 
                              key={index} 
                              className={`participant ${attendee.id_employee === currentUser ? "current-user" : ""}`}
                            >
                              {`${attendee.first_name} ${attendee.last_name}`}
                              {attendee.id_employee === currentUser && " (Вы)"}
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
                  );
                })
              ) : (
                <div className="no-events">
                  <h3>Мероприятия не найдены</h3>
                  <p>Попробуйте изменить параметры поиска</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="pagination flex justify-center items-center gap-4 mt-6">
              <button 
                disabled={meta.skip === 0 || isLoading} 
                onClick={() => changePage('prev')} 
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                ← Назад
              </button>

              <span className="text-sm text-gray-700">
                Страница {currentPage}
              </span>

              <button 
                disabled={isLoading || !hasNextPage}
                onClick={() => {
                  console.log('Next button clicked, current meta:', meta);
                  changePage('next');
                }}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Вперед →
              </button>
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
                    <h3>Участники ({selectedEvent.attendees .length})</h3>
                    <div className="modal-participants">
                        {(selectedEvent.attendees || []).map((attendee, index) => (
                          <div 
                            key={index} 
                            className={`participant ${attendee.id_employee === currentUser ? "current-user" : ""}`}
                          >
                            {`${attendee.first_name} ${attendee.last_name}`}
                            {attendee.id_employee === currentUser && " (Вы)"}
                          </div>
                        ))}
                      </div>
                    </div>
                </div>
                
                <div className="modal-actions">
                  <div className="primary-action">
                    {selectedEvent?.isOwner ? (
                      <button 
                        className="action-btn primary"
                        onClick={() => handleEditEvent(selectedEvent)}

                      >
                        Редактировать
                      </button>
                    ) : selectedEvent?.isJoined ? (
                      <button 
                        className="cancel-btn"
                        onClick={() => handleLeaveEvent(selectedEvent.id)}
                      >
                        Отписаться
                      </button>
                    ) : (
                      <button 
                        className="action-btn primary"
                        onClick={() => handleJoinEvent(selectedEvent.id)}
                      >
                        Записаться
                      </button>
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
                        <h2>{isEditMode ? "Редактировать мероприятие" : "Создать мероприятие"}</h2>
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
                                className={validationErrors.title ? "error" : ""}
                              />
                              {validationErrors.title && <span className="error-message">Это поле обязательно</span>}
                            </div>
                                
                                <div className="form-group">
                                    <label>Тип мероприятия</label>
                                    <div className="event-type-dropdown-container">
                                        <button 
                                            ref={eventTypeButtonRef}
                                            className="event-type-toggle"
                                            onClick={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
                                        >
                                            {eventTypes.find(t => t.value === newEvent.category)?.label}
                                            <FaChevronDown />
                                        </button>
                                        {showEventTypeDropdown && (
                                            <div 
                                                ref={dropdownRef}
                                                className="event-type-dropdown"
                                            >
                                                {eventTypes.map(type => (
                                                    <div 
                                                        key={type.value}
                                                        className="event-type-option"
                                                        onClick={() => handleEventTypeSelect(type.value)}
                                                    >
                                                        {type.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="modal-section">
                                <h3>Дата и время</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Дата</label>
                                        <div className={`date-picker-container ${validationErrors.date ? "error" : ""}`}>
                                            <input
                                                type="text"
                                                className="date-picker-input"
                                                value={newEvent.date}
                                                onClick={() => setDatePickerOpen(!datePickerOpen)}
                                                readOnly
                                                placeholder="Выберите дату"
                                            />
                                            <FaCalendarAlt 
                                                className="date-picker-icon" 
                                                onClick={() => setDatePickerOpen(!datePickerOpen)}
                                            />
                                            {datePickerOpen && (
                                                <DatePicker
                                                    selected={newEvent.date ? new Date(newEvent.date) : null}
                                                    onChange={handleDateChange}
                                                    inline
                                                    calendarClassName="custom-calendar"
                                                    minDate={new Date()}
                                                    shouldCloseOnSelect={true}
                                                    onCalendarClose={() => setDatePickerOpen(false)}
                                                />
                                            )}
                                        </div>
                                        {validationErrors.date && <span className="error-message">Это поле обязательно</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Время</label>
                                        <div className={`time-picker-container ${validationErrors.time ? "error" : ""}`}>
                                            <input
                                                type="time"
                                                name="time"
                                                value={newEvent.time}
                                                onChange={handleNewEventChange}
                                                required
                                                className="time-picker-input"
                                            />
                                            <FaClock className="time-picker-icon" />
                                        </div>
                                        {validationErrors.time && <span className="error-message">Это поле обязательно</span>}
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
                        className={validationErrors.location ? "error" : ""}
                      />
                      {validationErrors.location && <span className="error-message">Это поле обязательно</span>}
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
                        <div className="participant-search-container">
                          <input
                            ref={participantInputRef}
                            type="text"
                            className="participant-search-input"
                            placeholder="Добавить участника..."
                            value={participantSearch}
                            onChange={handleParticipantSearchChange}
                            onFocus={() => {
                              if (participantSearch.length > 0) {
                                setShowParticipantsDropdown(true);
                              }
                            }}
                          />
                          {showParticipantsDropdown && (
                            <div 
                              ref={participantsDropdownRef}
                              className="participants-dropdown"
                            >
                              {filteredParticipants.length > 0 ? (
                                filteredParticipants.map(participant => (
                                  <div 
                                    key={participant.id}  // Используем id как ключ
                                    className="participant-option"
                                    onClick={() => handleParticipantSelect(participant)}
                                  >
                                    <div className="participant-checkbox">
                                      <FaCheck className="check-icon" />
                                    </div>
                                    <span>{participant.name}</span>  {/* Отображаем имя участника */}
                                  </div>
                                ))
                              ) : (
                                <div className="no-participants">
                                  {participantSearch.length > 0 ? "Сотрудники не найдены" : "Начните вводить имя"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="selected-participants">
                          {newEvent.participants.map(participant => (
                            <div key={participant.id} className="selected-participant-tag">
                              {participant.name}  {/* Отображаем имя участника */}
                              <button 
                                type="button"
                                className="remove-participant"
                                onClick={() => handleRemoveParticipant(participant.id)}
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
              {isEditMode && (
                <button 
                  type="button" 
                  className="delete-btn"
                  onClick={() => handleActionConfirmation('delete', editEventId)}
                  disabled={isLoading}
                >
                  Удалить
                </button>
              )}
                <button 
                  type="button" 
                  className="action-btn primary"
                  onClick={() => handleActionConfirmation(
                    isEditMode ? 'edit' : 'create', 
                    null
                  )}
                  disabled={isLoading}
                >
                  {isEditMode ? "Сохранить изменения" : "Создать"}
                </button>
              </div>
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={isLoading}
              >
                Отмена
              </button>
            </div>

          </div>
          {/* Модальное окно подтверждения */}
          {showConfirmationModal && (
            <div className="confirmation-modal-overlay">
              <div className="confirmation-modal">
                <h3>Подтверждение</h3>
                <p>
                  {confirmationAction === 'delete' && "Вы уверены, что хотите удалить это мероприятие?"}
                  {confirmationAction === 'create' && "Вы уверены, что хотите создать новое мероприятие?"}
                  {confirmationAction === 'edit' && "Вы уверены, что хотите сохранить изменения?"}
                </p>
                <div className="confirmation-actions">
                  <button 
                    className="confirm-btn"
                    onClick={executeConfirmedAction}
                  >
                    Да
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setShowConfirmationModal(false)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

export default Events;