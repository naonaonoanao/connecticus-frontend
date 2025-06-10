import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Импортируем useNavigate
import "../styles/auth.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Инициализируем useNavigate

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch("https://api.connecticus.deadfairy.space/api/v1/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Ошибка входа");
      }
      
      const data = await response.json();
      // Сохраняем token для дальнейших запросов
      if (data?.token?.access_token) {
        localStorage.setItem("access_token", data.token.access_token);
        localStorage.setItem("role_id", data.role_id);
        navigate("/profile");
        } else {
          throw new Error("Неверный формат ответа от сервера");
        }

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="box">
      <span className="borderline"></span>
      <form onSubmit={handleSubmit}>
        <h2>Вход</h2>
        <div className="inputBox">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <span>Логин</span>
          <i></i>
        </div>
        <div className="inputBox">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span>Пароль</span>
          <i></i>
        </div>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
        <button type="submit" id="submit_button_my">Войти</button>
      </form>
    </div>
  );
};

export default Login;
