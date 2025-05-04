import React, { useState } from "react";
import { FaBell } from "react-icons/fa";
import "../styles/notification.css";

const NotificationIcon = () => {
  const [open, setOpen] = useState(false);

  const toggleDropdown = () => setOpen((prev) => !prev);

  const closeDropdown = (e) => {
    if (!e.target.closest('.notification')) {
      setOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, []);

  return (
    <div className="notification-wrapper">
      <div className="notification" onClick={toggleDropdown}>
        <FaBell size={26} />
        {open && (
          <div className="notification-dropdown">
            <p>Уведомление 1</p>
            <p>Уведомление 2</p>
            <p>Уведомление 3</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationIcon;
