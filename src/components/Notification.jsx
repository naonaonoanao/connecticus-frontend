import React, { useState, useEffect, useCallback } from "react";
import { FaBell } from "react-icons/fa";
import axios from "axios";
import "../styles/notification.css";

const BASE = "https://api.connecticus.deadfairy.space/api/v1/common";

const NotificationIcon = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const { data } = await axios.get(`${BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(data.slice().reverse());
      const unread = data.filter((n) => !n.is_shown).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Ошибка при загрузке уведомлений:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        window.location.href = "/login";
      }
    }
  }, []);

  const getUnreadIds = () =>
    notifications.filter((n) => !n.is_shown).map((n) => n.id);

  const markAllAsRead = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const unreadIds = getUnreadIds();
    if (unreadIds.length === 0) return;

    try {
      await axios.post(
        `${BASE}/notifications/read`,
        { notification_ids: unreadIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_shown: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Ошибка при пометке прочитанных:", err);
    }
  }, [notifications]);

  const toggleDropdown = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      await fetchNotifications();
      await markAllAsRead();
    }
  };

  const closeDropdown = useCallback(
    (e) => {
      if (!e.target.closest(".notification-wrapper")) {
        setOpen(false);
      }
    },
    [setOpen]
  );

  useEffect(() => {
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, [closeDropdown]);

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 5000);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  return (
    <div className="notification-wrapper">
      <div className="notification" onClick={toggleDropdown}>
        {/* Вот здесь используем FaBell */}
        <FaBell size={26} className="notification-icon" />
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        {open && (
          <div className="notification-dropdown">
            {notifications.length === 0 && <p>Нет уведомлений</p>}
            {notifications.map((n) => (
              <p key={n.id} className={n.is_shown ? "read" : "unread"}>
                {n.content}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationIcon;
