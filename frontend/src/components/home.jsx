// frontend/src/pages/Home.jsx
import { memo, useState, useRef, useEffect } from "react";
import "../styles/home.css";
import {
  BiUser,
  BiGroup,
  BiCartAlt,
  BiPackage,
  BiBus as BiTruck,
  BiLogOut,
  BiBarChart,
  BiChevronLeft,
  BiMenu,
} from "react-icons/bi";
import { api } from "../services/api"; // ⬅️ NUEVO: para pedir camiones
import AltaEmple from "../components/AltaEmple";
import AltaCamion from "../components/AltaCamion";
import AsistenciasQR from "../components/AsistenciasQR";
import StockMateriales from "../components/StockMateriales";
import Clientes from "../components/clientes";
import AsignacionesCamiones from "../components/AsignacionesCamiones";

/** Botón del sidebar (reutilizable) */
function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      className={`side-item ${active ? "active" : ""}`}
      type="button"
      onClick={onClick}
    >
      <Icon className="side-icon" />
      <span>{label}</span>
    </button>
  );
}

/** Card del dashboard (ahora soporta onClick) */
function StatCard({ icon: Icon, title, value, hint, onClick }) {
  const clickable = typeof onClick === "function";
  return (
    <div
      className={`stat-card ${clickable ? "is-clickable" : ""}`} // ⬅️ cursor pointer
      onClick={onClick} // ⬅️ navega si hay handler
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <div className="stat-icon-wrap">
        <Icon className="stat-icon" />
      </div>
      <div className="stat-body">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-hint">{hint}</div>
      </div>
    </div>
  );
}

export default memo(function Home({ user, onLogout }) {
  const [section, setSection] = useState("dashboard");
  const [logisticaTab, setLogisticaTab] = useState("asignaciones");

  // Sidebar abierto/cerrado
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  // Menú de usuario
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  // ⬅️ NUEVO: cantidad de camiones activos
  const [camionesActivos, setCamionesActivos] = useState(null);

  // Cierra el menú del usuario si hace click afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNav = (next) => setSection(next);

  const titleMap = {
    dashboard: "Dashboard",
    empleados: "Empleados",
    clientes: "Clientes",
    pedidos: "Pedidos",
    stock: "Stock",
    logistica: "Logística",
    config: "Configuración",
    asistencias: "Asistencias",
  };
  const currentTitle = titleMap[section] || "Panel";

  // ====== NUEVO: cargo cantidad de camiones activos ======
  useEffect(() => {
    async function cargarActivos() {
      try {
        const { data } = await api.get("/api/camiones");
        const activos = data.filter((c) => Number(c.activo) === 1).length;
        setCamionesActivos(activos);
      } catch (e) {
        setCamionesActivos("—"); // fallback
      }
    }
    cargarActivos();
  }, []); // con montar alcanza para el dashboard

  // Handler para ir directo a Logística → Camiones
  const irALogisticaCamiones = () => {
    setSection("logistica");
    setLogisticaTab("camiones");
  };

  return (
    <div className={`home-layout ${sidebarAbierto ? "" : "sidebar-collapsed"}`}>
      {/* ===== Sidebar ===== */}
      <aside className={`sidebar ${sidebarAbierto ? "" : "is-collapsed"}`}>
        <div className="brand">
          <div className="brand-left">
            <div className="brand-logo">SIGPH</div>
            <div className="brand-name">Panel</div>
          </div>
          <button
            className="side-toggle"
            type="button"
            title="Cerrar menú"
            onClick={() => setSidebarAbierto(false)}
          >
            <BiChevronLeft />
          </button>
        </div>

        <nav className="side-nav">
          <SidebarItem
            icon={BiBarChart}
            label="Dashboard"
            active={section === "dashboard"}
            onClick={() => handleNav("dashboard")}
          />
          <SidebarItem
            icon={BiUser}
            label="Empleados"
            active={section === "empleados"}
            onClick={() => handleNav("empleados")}
          />
          <SidebarItem
            icon={BiGroup}
            label="Clientes"
            active={section === "clientes"}
            onClick={() => handleNav("clientes")}
          />
          <SidebarItem
            icon={BiCartAlt}
            label="Pedidos"
            active={section === "pedidos"}
            onClick={() => handleNav("pedidos")}
          />
          <SidebarItem
            icon={BiPackage}
            label="Stock"
            active={section === "stock"}
            onClick={() => handleNav("stock")}
          />
          <SidebarItem
            icon={BiTruck}
            label="Logística"
            active={section === "logistica"}
            onClick={() => {
              setSection("logistica");
              setLogisticaTab("asignaciones");
            }}
          />
          <SidebarItem
            icon={BiUser}
            label="Asistencias"
            active={section === "asistencias"}
            onClick={() => handleNav("asistencias")}
          />
        </nav>
      </aside>

      {/* ===== Contenido ===== */}
      <main className="content">
        {/* Topbar */}
        <header className="topbar">
          <div className="top-title">
            {!sidebarAbierto && (
              <button
                className="menu-trigger"
                type="button"
                title="Abrir menú"
                onClick={() => setSidebarAbierto(true)}
              >
                <BiMenu />
              </button>
            )}

            <h1>{currentTitle}</h1>
            <p className="top-subtitle">
              {section === "dashboard"
                ? "Resumen rápido del negocio"
                : "Gestión de " + currentTitle.toLowerCase()}
            </p>
          </div>

          {/* Usuario */}
          <div className="user-wrap" ref={userRef}>
            <button
              type="button"
              className="user-chip"
              title={`${user?.username} (${user?.rol})`}
              onClick={() => setUserOpen((v) => !v)}
            >
              <div className="user-avatar">
                {(user?.username || "U")[0].toUpperCase()}
              </div>
              <div className="user-meta">
                <div className="user-name">{user?.username}</div>
                <div className="user-role">{user?.rol}</div>
              </div>
            </button>

            {userOpen && (
              <div className="user-menu">
                <button
                  type="button"
                  className="user-menu-item danger"
                  onClick={onLogout}
                >
                  <BiLogOut style={{ marginRight: 8 }} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Contenido por sección */}
        {section === "empleados" ? (
          <AltaEmple />
        ) : section === "logistica" ? (
          <section
            className="welcome-card"
            style={{ padding: 0, background: "transparent" }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "10px 12px",
                borderBottom: "1px solid var(--border, #e5e7eb)",
                marginBottom: 16,
              }}
            >
              <button
                className={`btn ${
                  logisticaTab === "camiones" ? "btn-primary" : ""
                }`}
                onClick={() => setLogisticaTab("camiones")}
                type="button"
                title="Ver/crear camiones"
              >
                Camiones
              </button>
              <button
                className={`btn ${
                  logisticaTab === "asignaciones" ? "btn-primary" : ""
                }`}
                onClick={() => setLogisticaTab("asignaciones")}
                type="button"
                title="Asignar camiones a choferes"
              >
                Asignaciones
              </button>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
              {logisticaTab === "camiones" ? (
                <AltaCamion />
              ) : (
                <AsignacionesCamiones />
              )}
            </div>
          </section>
        ) : section === "asistencias" ? (
          <AsistenciasQR />
        ) : section === "stock" ? (
          <StockMateriales />
        ) : section === "clientes" ? (
          <Clientes />
        ) : section === "dashboard" ? (
          <>
            <section className="stats-grid">
              <StatCard
                icon={BiCartAlt}
                title="Pedidos de hoy"
                value="—"
                hint="Sin datos aún"
              />
              <StatCard
                icon={BiPackage}
                title="m³ producidos"
                value="—"
                hint="Conectar a producción"
              />
              <StatCard
                icon={BiTruck}
                title="Camiones activos"
                value={camionesActivos ?? "—"} // ⬅️ muestra cantidad
                hint="Ir a logística"
                onClick={irALogisticaCamiones} // ⬅️ navega al módulo
              />
            </section>

            <section className="welcome-card">
              <h2>Bienvenido/a, {user?.username}</h2>
              <p>
                Este es tu panel principal. Desde la barra lateral podés navegar
                a <strong>Empleados</strong>, <strong>Clientes</strong>,{" "}
                <strong>Pedidos</strong> y más. Vamos a ir habilitando cada
                módulo a medida que lo implementemos.
              </p>
            </section>
          </>
        ) : (
          <section className="welcome-card">
            <h2>{currentTitle}</h2>
            <p>Sección en construcción.</p>
          </section>
        )}
      </main>
    </div>
  );
});
