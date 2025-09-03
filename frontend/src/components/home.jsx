import { memo, useState } from "react";
import "../styles/home.css";
import {
  BiUser, BiGroup, BiCartAlt, BiPackage,
  BiBus as BiTruck, // 👈 Alias: usamos BiBus pero lo llamamos BiTruck para no tocar el resto
  BiLogOut, BiCog, BiBarChart
} from "react-icons/bi";
import AltaEmple from "../components/AltaEmple";
import AltaCamion from "../components/AltaCamion";


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

/** Tarjeta de métrica (para el dashboard) */
function StatCard({ icon: Icon, title, value, hint }) {
  return (
    <div className="stat-card">
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

/**
 * HOME
 * - Agregamos estado `section` para saber qué vista mostrar.
 * - Al clickear en el sidebar, actualizamos `section`.
 * - Si `section === "empleados"`, renderizamos <AltaEmple />.
 * - Caso contrario, mostramos el dashboard por defecto.
 */
export default memo(function Home({ user, onLogout }) {
  // 👇 sección actual. Arrancamos en "dashboard".
  const [section, setSection] = useState("dashboard");

  // Cambia de vista al tocar el sidebar
  const handleNav = (next) => setSection(next);

  // Título dinámico
  const titleMap = {
    dashboard: "Dashboard",
    empleados: "Empleados",
    clientes: "Clientes",
    pedidos: "Pedidos",
    stock: "Stock",
    logistica: "Logística",
    config: "Configuración",
  };
  const currentTitle = titleMap[section] || "Panel";

  return (
    <div className="home-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">SIGPH</div>
          <div className="brand-name">Panel</div>
        </div>

        <nav className="side-nav">
          {/* Activo = coincide con la sección actual */}
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
            icon={BiTruck} // 👈 ahora apunta al alias de BiBus
            label="Logística"
            active={section === "logistica"}
            
            onClick={() => handleNav("logistica")}
          />
          <SidebarItem
            icon={BiCog}
            label="Configuración"
            active={section === "config"}
            onClick={() => handleNav("config")}
          />
        </nav>

        <button className="btn-logout" type="button" onClick={onLogout}>
          <BiLogOut className="logout-icon" /> Salir
        </button>
      </aside>

      {/* Contenido */}
      <main className="content">
        {/* Topbar */}
        <header className="topbar">
          <div className="top-title">
            {/* Título dinámico por sección */}
            <h1>{currentTitle}</h1>
            <p className="top-subtitle">
              {section === "dashboard"
                ? "Resumen rápido del negocio"
                : "Gestión de " + currentTitle.toLowerCase()}
            </p>
          </div>
          <div className="user-chip" title={`${user?.username} (${user?.rol})`}>
            <div className="user-avatar">{(user?.username || "U")[0].toUpperCase()}</div>
            <div className="user-meta">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.rol}</div>
            </div>
          </div>
        </header>
        {/* 👇 Vista condicional según sección */}
        {section === "empleados" ? (
          // Módulo Empleados
          <AltaEmple />
        ) : section === "dashboard" ? (
          <>
            {/* Dashboard por defecto */}
            <section className="stats-grid">
              <StatCard icon={BiCartAlt} title="Pedidos de hoy" value="—" hint="Sin datos aún" />
              <StatCard icon={BiPackage} title="m³ producidos" value="—" hint="Conectar a producción" />
              <StatCard icon={BiTruck}   title="Camiones activos" value="—" hint="Conectar a logística" />
              <StatCard icon={BiGroup}   title="Clientes activos" value="—" hint="Conectar a clientes" />
            </section>

            <section className="welcome-card">
              <h2>Bienvenido/a, {user?.username}</h2>
              <p>
                Este es tu panel principal. Desde la barra lateral podés navegar a{" "}
                <strong>Empleados</strong>, <strong>Clientes</strong>, <strong>Pedidos</strong> y más.
                Vamos a ir habilitando cada módulo a medida que lo implementemos.
              </p>
            </section>
          </>
        ) : section === "logistica" ? (
          // 👇 Acá mostramos el alta/listado de camiones
          <AltaCamion />
        ) : (
          // Placeholder para secciones no implementadas
          <section className="welcome-card">
            <h2>{currentTitle}</h2>
            <p>Sección en construcción.</p>
          </section>
        )}

      </main>
    </div>
  );
});
