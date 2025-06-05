import React, { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Header from "../components/Notification";
import "../styles/companyStructure.css";
import * as d3 from "d3";

import {
  FaMapMarkerAlt, FaCode, FaProjectDiagram,
  FaEnvelope, FaPhone, FaTelegram, FaTimes
} from "react-icons/fa";

const categories = [
  { key: "departments", label: "По отделам", color: "#00f5ff" },
  { key: "roles", label: "По ролям", color: "#ff00ff" },
  { key: "cities", label: "По городам", color: "#00ff7f" },
  { key: "teams", label: "По командам", color: "#ffae00" },
  { key: "stacks", label: "По технологиям", color: "#ff004c" },
  { key: "interests", label: "По интересам", color: "#007bff" },
];

const CompanyStructure = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [activeFilter, setActiveFilter] = useState("departments");
  const [search, setSearch] = useState("");
  const graphRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 900 });

  // Новые состояния для карточки сотрудника
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);

  const fetchGraph = async (category) => {
  try {
    const res = await fetch(`http://localhost:8080/api/v1/graph/${category}`);
    const data = await res.json();

    const uniqueNodes = Array.from(
      new Map(data.nodes.map(node => [node.id, node])).values()
    );

    // Инициализируем координаты
    const nodesWithCoords = uniqueNodes.map(node => ({
      ...node,
      x: node.x || 0,
      y: node.y || 0
    }));

    setGraphData({
      nodes: nodesWithCoords,
      links: data.links || [],
    });
  } catch (e) {
    console.error("Ошибка загрузки графа:", e);
  }
};

const fetchEmployee = async (id) => {
    setLoadingEmployee(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/employee/${id}`);
      if (!res.ok) throw new Error("Сотрудник не найден");
      const data = await res.json();
      setSelectedEmployee(data);
      setShowEmployeeModal(true);
    } catch (error) {
      console.error("Ошибка загрузки сотрудника:", error);
      alert("Не удалось загрузить данные сотрудника");
    } finally {
      setLoadingEmployee(false);
    }
  };

const EmployeeCard = ({ employee, onClose }) => {
    if (!employee) return null;
    
    return (
      <div className="employee-modal">
        <div className="modal-content">
          <div className="employee-card">
            <button className="close-button" onClick={onClose}>
              <FaTimes />
            </button>
            
            <div className="employee-header">
              <h3>{`${employee.last_name} ${employee.first_name} ${employee.middle_name || ''}`}</h3>
              <p className="position">{employee.position?.position_name}</p>
            </div>
            
            <div className="employee-info">
              <div className="info-item">
                <FaMapMarkerAlt className="icon" />
                <span>{employee.city}</span>
              </div>
              <div className="info-item">
                <span>Отдел:</span> {employee.department?.name_department}
              </div>
              <div className="info-item">
                <span>Команда:</span> {employee.projects[0]?.name_project}
              </div>
            </div>
            
            <div className="employee-contacts">
              <h4><FaEnvelope /> Контакты</h4>
              <div className="contact-item">
                <FaEnvelope className="icon" />
                <a href={`mailto:${employee.email}`}>{employee.email}</a>
              </div>
              <div className="contact-item">
                <FaPhone className="icon" />
                <a href={`tel:${employee.phone_number.replace(/\D/g, '')}`}>
                  {employee.phone_number}
                </a>
              </div>
              <div className="contact-item">
                <FaTelegram className="icon" />
                <a 
                  href={`https://t.me/${employee.telegram_name.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {employee.telegram_name}
                </a>
              </div>
            </div>
            
            <div className="employee-skills">
              <h4><FaCode /> Технологии</h4>
              <div className="tags">
                {employee.technologies.map(t => (
                  <span key={t.id_technology} className="tag">
                    {t.name_technology}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="employee-interests">
              <h4><FaProjectDiagram /> Интересы</h4>
              <div className="tags">
                {employee.interests.map(i => (
                  <span key={i.id_interest} className="tag">
                    {i.name_interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  useEffect(() => {
    fetchGraph(activeFilter);
  }, [activeFilter]);

  useEffect(() => {
    const updateSize = () => {
      if (graphRef.current) {
        const { offsetWidth, offsetHeight } = graphRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      const fg = graphRef.current;
      if (fg.d3Force) {
        fg.d3Force("link").distance(500);
        fg.d3Force("charge").strength(-50);
        fg.d3Force("collide", d3.forceCollide(50)); 
      }
    }
  }, [graphData]);

  useEffect(() => {
  if (graphData.nodes.length === 0) return;
  
  // Создаем копию узлов для иммутабельности
  const updatedNodes = [...graphData.nodes];
  
  const categories = updatedNodes.filter(n => n.isCategory);
  const spacing = 850;

  categories.forEach((category, i) => {
    const angle = (i / categories.length) * 2 * Math.PI;
    category.x = Math.cos(angle) * spacing * 2;
    category.y = Math.sin(angle) * spacing * 2;
  });

  // Группируем сотрудников по категориям
  const employeesByCategory = {};
  updatedNodes.forEach(node => {
    if (!node.isCategory) {
      if (!employeesByCategory[node.groupId]) {
        employeesByCategory[node.groupId] = [];
      }
      employeesByCategory[node.groupId].push(node);
    }
  });

  // Позиционируем сотрудников
  Object.entries(employeesByCategory).forEach(([groupId, employees]) => {
    const category = updatedNodes.find(n => n.id === groupId && n.isCategory);
    if (category) {
      const numEmployees = employees.length;
      const radius = 200;
      const angleIncrement = numEmployees > 0 ? (2 * Math.PI) / numEmployees : 0;

      employees.forEach((employee, j) => {
        const angle = angleIncrement * j;
        employee.x = category.x + Math.cos(angle) * radius;
        employee.y = category.y + Math.sin(angle) * radius;
      });
    }
  });

  setGraphData(prev => ({ ...prev, nodes: updatedNodes }));
}, [graphData.nodes.length]);

  const groupColorMap = useRef({});

  const getGroupColor = (groupId) => {
    if (!groupColorMap.current[groupId]) {
      const hash = [...String(groupId)].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      groupColorMap.current[groupId] = `hsla(${hash % 360}, 70%, 60%, 1)`;
    }
    return groupColorMap.current[groupId];
  };

  return (
    <div className="structure-page">
      <Sidebar />
      <div className="main-content">
        <Header />

        {/* Модальное окно с карточкой сотрудника */}
        {showEmployeeModal && (
          <EmployeeCard 
            employee={selectedEmployee} 
            onClose={() => setShowEmployeeModal(false)} 
          />
        )}
        
        <motion.div
          className="graph-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h2>Структура компании</h2>
        </motion.div>

        <motion.div
          className="filter-bar"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="filter-panel">
            {categories.map((cat) => (
              <button
                key={cat.key}
                className={`filter-btn ${activeFilter === cat.key ? "active" : ""}`}
                style={{ borderColor: cat.color }}
                onClick={() => setActiveFilter(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

        </motion.div>
        
        <div className="graph-container">
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel={(node) => `${node.name} (${node.role || node.group || ""})`}
            linkDirectionalParticles={3}
            linkDirectionalParticleSpeed={0.005}
            linkColor={(link) => {
              const sourceNode = typeof link.source === "object" ? link.source : graphData.nodes.find(n => n.id === link.source);
              return getGroupColor(sourceNode.groupId || sourceNode.id);
            }}
            onNodeClick={(node) => {
              if (!node.isCategory) {
                fetchEmployee(node.id);
              }
            }
            }
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = `${node.name}`;
              const fontSize = 15 / globalScale;
              const isEmployee = !node.isCategory;
              const radius = 20;
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.globalAlpha = 1.0;
              ctx.fillStyle = isEmployee
                ? "rgba(89, 99, 120, 0.9)" // ЕДИНЫЙ цвет сотрудников
                : getGroupColor(node.groupId || node.id); // Категории — индивидуальный
              ctx.fill();
              // Определим входящие связи
              const incomingLinks = graphData.links.filter(
                link => typeof link.target === "object" ? link.target.id === node.id : link.target === node.id
              );
              // Если узел категории — обводка по цвету
              if (node.isCategory || incomingLinks.length === 0) {
                const groupColor = getGroupColor(node.groupId || node.id);
                const radius = 35;
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.strokeStyle = groupColor;
                ctx.fillStyle = groupColor;
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();
              } else if (incomingLinks.length === 1) {
                // Один входящий линк — простая обводка по цвету
                const sourceNode = typeof incomingLinks[0].source === "object"
                  ? incomingLinks[0].source
                  : graphData.nodes.find(n => n.id === incomingLinks[0].source);

                ctx.strokeStyle = getGroupColor(sourceNode.groupId || sourceNode.id);
                ctx.lineWidth = 4;
                ctx.stroke();
              } else {
              // Многоцветная обводка — градиент
              // Добавляем проверку на валидность координат
              if (isFinite(node.x) && isFinite(node.y)) {
                const gradient = ctx.createRadialGradient(
                  node.x, node.y, radius, 
                  node.x, node.y, radius + 6
                );

                incomingLinks.forEach((link, index) => {
                  const sourceNode = typeof link.source === "object"
                    ? link.source
                    : graphData.nodes.find(n => n.id === link.source);
                  const color = getGroupColor(sourceNode.groupId || sourceNode.id);
                  const stop = index / (incomingLinks.length - 1 || 1);
                  gradient.addColorStop(stop, color);
                });

                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 4;
                ctx.stroke();
              } else {
                console.warn(`Invalid coordinates for node ${node.id}: x=${node.x}, y=${node.y}`);
              }
            }
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillStyle = "white";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(label, node.x, node.y + radius + 2);
            }}

            nodePointerAreaPaint={(node, color, ctx) => {
              const radius = 20;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fill();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyStructure;
