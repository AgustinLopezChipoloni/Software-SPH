// frontend/src/components/AltaCamion.jsx
import { useEffect, useState } from "react";
import { api } from "../services/api";

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

  return (
    <div className="emp-layout">{/* Reutilizamos layout de empleados */}
      <div className="emp-card">
        <h2>Alta de Camión</h2>
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

          <button className="btn" disabled={loading}>
            {loading ? "Guardando..." : "Guardar camión"}
          </button>
        </form>
      </div>

      <div className="emp-card">
        <h2>Camiones</h2>
        <div className="emp-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Patente</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Cap. (m³)</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.patente}</td>
                  <td>{c.marca || "—"}</td>
                  <td>{c.modelo || "—"}</td>
                  <td>{c.anio || "—"}</td>
                  <td>{c.capacidad_m3 ?? "—"}</td>
                  <td>{c.activo ? "Sí" : "No"}</td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Sin camiones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
