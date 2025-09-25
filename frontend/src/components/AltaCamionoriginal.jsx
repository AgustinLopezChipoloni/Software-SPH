// frontend/src/components/AltaCamion.jsx
import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/AltaCamion.css"; // 👈 agregado: estilos específicos de logística

/**
 * Alta y listado de camiones
 * - Reutiliza las clases CSS de AltaEmple (emp-layout, emp-card, emp-form, etc.)
 *   para mantener el mismo look & feel sin agregar un CSS nuevo.
 */

const initial = {
  patente: "",
  marca: "",
  modelo: "",
  anio: "",
  capacidad_m3: "",
  activo: true,
};

export default function AltaCamion() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [filtro, setFiltro] = useState(""); // 👈 pequeño filtro de búsqueda por patente/marca/modelo

  const cargar = async () => {
    const { data } = await api.get("/api/camiones");
    setLista(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await api.post("/api/camiones", form);
      setForm(initial);
      await cargar();
      setMsg("Camión creado correctamente.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Error al crear camión");
    } finally {
      setLoading(false);
    }
  };

  // 👇 filtro simple en memoria (patente/marca/modelo)
  const listaFiltrada = lista.filter((c) => {
    const q = filtro.trim().toLowerCase();
    if (!q) return true;
    const blob = `${c.patente} ${c.marca || ""} ${
      c.modelo || ""
    }`.toLowerCase();
    return blob.includes(q);
  });

  return (
    <div className="emp-layout">
      {/* Reutilizamos layout de empleados */}
      <div className="emp-card camion-form-card">
        <div className="card-head">
          <div>
            <h2>Alta de Camión</h2>
            <p className="card-subtitle">
              Registrá nuevos camiones y su capacidad
            </p>
          </div>
        </div>

        <form className="emp-form" onSubmit={onSubmit}>
          <div className="row">
            <div className="col">
              <label>Patente *</label>
              <input
                name="patente"
                value={form.patente}
                onChange={onChange}
                placeholder="AA123BB"
                required
              />
            </div>
            <div className="col">
              <label>Marca</label>
              <input
                name="marca"
                value={form.marca}
                onChange={onChange}
                placeholder="Iveco"
              />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>Modelo</label>
              <input
                name="modelo"
                value={form.modelo}
                onChange={onChange}
                placeholder="Mixer"
              />
            </div>
            <div className="col">
              <label>Año</label>
              <input
                name="anio"
                type="number"
                min="1980"
                max="2099"
                value={form.anio}
                onChange={onChange}
                placeholder="2020"
              />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>Capacidad (m³)</label>
              <input
                name="capacidad_m3"
                type="number"
                step="0.01"
                min="0"
                value={form.capacidad_m3}
                onChange={onChange}
                placeholder="7.50"
              />
            </div>
            <div className="col">
              <label className="chk" style={{ marginTop: 28 }}>
                <input
                  type="checkbox"
                  name="activo"
                  checked={form.activo}
                  onChange={onChange}
                />
                <span>Activo</span>
              </label>
            </div>
          </div>

          {msg && <div className="emp-msg">{msg}</div>}

          <div className="actions">
            <button className="btn" disabled={loading}>
              {loading ? "Guardando..." : "Guardar camión"}
            </button>
            <button
              type="button"
              className="btn btn-light"
              onClick={() => setForm(initial)}
              disabled={loading}
              title="Limpiar formulario"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      <div className="emp-card camion-table-card">
        <div className="card-head">
          <h2>Camiones</h2>
          <div className="right-tools">
            <input
              className="search-input"
              placeholder="Buscar por patente, marca, modelo…"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>
        </div>

        <div className="emp-table scroll-shadow">
          <table className="table-compact">
            <thead>
              <tr>
                {/* <th>ID</th>  👈 No mostramos ID en la vista */}
                <th>Patente</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Cap. (m³)</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((c) => (
                <tr key={c.id}>
                  {/* <td>{c.id}</td> */}
                  <td className="mono">{c.patente}</td>
                  <td>{c.marca || "—"}</td>
                  <td>{c.modelo || "—"}</td>
                  <td>{c.anio || "—"}</td>
                  <td>{c.capacidad_m3 ?? "—"}</td>
                  <td>
                    <span className={`badge ${c.activo ? "ok" : "off"}`}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    Sin camiones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="hint">
          Consejo: podés editar el estado de un camión desde el módulo de
          edición (lo agregamos en breve) o dando de baja temporal (inactivo).
        </p>
      </div>
    </div>
  );
}
*/