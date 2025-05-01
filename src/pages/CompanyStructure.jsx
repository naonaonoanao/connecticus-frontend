import React, { useEffect, useState, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import "../styles/companyStructure.css";

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
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const fetchGraph = async (category) => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/graph/${category}`);
      const data = await res.json();
      setGraphData({
        nodes: data.nodes || [],
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
          <input
            type="text"
            className="search-input"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </motion.div>

        <motion.div
          className="filter-panel"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
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
        </motion.div>

        <div className="graph-container" ref={graphRef}>
        <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel={(node) => `${node.name} (${node.role || node.group || ""})`}
            nodeAutoColorBy="group"
            linkDirectionalParticles={3}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={(node) =>
                alert(`Сотрудник: ${node.name}\nРоль: ${node.role || node.group}`)
            }
            nodeCanvasObject={(node, ctx, globalScale) => {
                const label = `${node.name}`;
                const fontSize = 15 / globalScale;
                const radius = 10;

                // Draw node
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                ctx.fillStyle = node.color || "#00f";
                ctx.fill();
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 1;
                ctx.stroke();

                // Draw text
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(label, node.x, node.y + radius + 2);
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
                const radius = 10;
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
