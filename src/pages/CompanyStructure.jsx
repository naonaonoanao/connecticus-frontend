import React, { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Header from "../components/Notification";
import "../styles/companyStructure.css";
import * as d3 from "d3";
import { PiAlignCenterHorizontalSimpleLight } from "react-icons/pi";

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

  const fetchGraph = async (category) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/graph/${category}`);
      const data = await res.json();
  
      // Удаляем дубликаты узлов по id
      const uniqueNodes = Array.from(
        new Map(data.nodes.map((node) => [node.id, node])).values()
      );
  
      setGraphData({
        nodes: uniqueNodes,
        links: data.links || [],
      });
    } catch (e) {
      console.error("Ошибка загрузки графа:", e);
    }
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

        fg.d3Force("group-attraction", () => {
          return (alpha) => {
            graphData.nodes.forEach(node => {
              if (!node.isCategory && node.groupId) {
                const target = graphData.nodes.find(n => n.id === node.groupId);
                if (target) {
                  node.vx += (target.x - node.x) * 0.01 * alpha;
                  node.vy += (target.y - node.y) * 0.01 * alpha;
                }
              }
            });
          };
        });

        fg.d3ReheatSimulation();
      }
    }
  }, [graphData]);

  useEffect(() => {
    const categories = graphData.nodes.filter(n => n.isCategory);
    const angleStep = (2 * Math.PI) / categories.length;
    const radius = 300;

    categories.forEach((node, i) => {
      node.fx = radius * Math.cos(i * angleStep);
      node.fy = radius * Math.sin(i * angleStep);
    });

    setGraphData((prev) => ({ ...prev, nodes: [...prev.nodes] }));
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

          <input
            type="text"
            className="search-input"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
            onNodeClick={(node) =>
              alert(`Сотрудник: ${node.name}\nРоль: ${node.role || node.group}`)
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
                const gradient = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius + 6);

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
