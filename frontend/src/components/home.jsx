import { memo } from "react";
import "../styles/home.css";
import {
  BiUser, BiGroup, BiCartAlt, BiPackage, BiCar,
  BiLogOut, BiCog, BiBarChart
} from "react-icons/bi";
import AltaEmple from "../components/AltaEmple";

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

export default memo(function Home({ user, onLogout }) {
  const handleNav = (section) => {
    console.log("Ir a:", section);
  };

  return (
    <div className="home-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">SIGPH</div>
          <div className="brand-name">Panel</div>
        </div>

        <nav className="side-nav">
          <SidebarItem icon={BiBarChart} label="Dashboard" active onClick={() => handleNav("dashboard")} />
          <SidebarItem icon={BiUser}      label="Empleados" onClick={() => handleNav("empleados")} />
          <SidebarItem icon={BiGroup}     label="Clientes"  onClick={() => handleNav("clientes")} />
          <SidebarItem icon={BiCartAlt}   label="Pedidos"   onClick={() => handleNav("pedidos")} />
          <SidebarItem icon={BiPackage}   label="Stock"     onClick={() => handleNav("stock")} />
          <SidebarItem icon={BiCar}       label="Logística" onClick={() => handleNav("logistica")} />
          <SidebarItem icon={BiCog}       label="Configuración" onClick={() => handleNav("config")} />
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
            <h1>Dashboard</h1>
            <p className="top-subtitle">Resumen rápido del negocio</p>
          </div>
          <div className="user-chip" title={`${user?.username} (${user?.rol})`}>
            <div className="user-avatar">{(user?.username || "U")[0].toUpperCase()}</div>
            <div className="user-meta">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.rol}</div>
            </div>
          </div>
        </header>

        {/* Tarjetas de estado (placeholders) */}
        <section className="stats-grid">
          <StatCard icon={BiCartAlt} title="Pedidos de hoy" value="—" hint="Sin datos aún" />
          <StatCard icon={BiPackage} title="m³ producidos" value="—" hint="Conectar a producción" />
          <StatCard icon={BiCar}     title="Camiones activos" value="—" hint="Conectar a logística" />
          <StatCard icon={BiGroup}   title="Clientes activos" value="—" hint="Conectar a clientes" />
        </section>

        {/* Sección de bienvenida */}
        <section className="welcome-card">
          <h2>Bienvenido/a, {user?.username}</h2>
          <p>
            Este es tu panel principal. Desde la barra lateral podés navegar a <strong>Empleados</strong>,
            <strong> Clientes</strong>, <strong>Pedidos</strong> y más. Vamos a ir habilitando cada módulo a medida que lo implementemos.
          </p>
        </section>
        <section className="welcome-card"> ... </section>
<AltaEmple />
      </main>
    </div>
  );
});
