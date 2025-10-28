import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/AltaCamion.css";

/** Alta y listado de camiones */
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
  const [filtro, setFiltro] = useState("");

  // === NUEVO: modal de edición (activar/desactivar o eliminar) ===
  const [editOpen, setEditOpen] = useState(false);
  const [camEdit, setCamEdit] = useState(null);
  const [activoEdit, setActivoEdit] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Filtro simple
  const listaFiltrada = lista.filter((c) => {
    const q = filtro.trim().toLowerCase();
    if (!q) return true;
    const blob = `${c.patente} ${c.marca || ""} ${
      c.modelo || ""
    }`.toLowerCase();
    return blob.includes(q);
  });

  // === NUEVO: abre modal de edición con el estado actual ===
  const abrirEditar = (camion) => {
    setCamEdit(camion);
    setActivoEdit(!!camion.activo);
    setEditOpen(true);
  };

  // === NUEVO: guarda sólo 'activo' (PATCH /api/camiones/:id) ===
  const guardarEstado = async () => {
    if (!camEdit) return;
    try {
      setSaving(true);
      await api.patch(`/api/camiones/${camEdit.id}`, {
        activo: activoEdit ? 1 : 0,
      });
      await cargar();
      setEditOpen(false);
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo actualizar el camión");
    } finally {
      setSaving(false);
    }
  };

  // === NUEVO: elimina camión (DELETE /api/camiones/:id) ===
  const eliminarCamion = async () => {
    if (!camEdit) return;
    const ok = window.confirm(
      `¿Eliminar definitivamente el camión ${camEdit.patente}?`
    );
    if (!ok) return;
    try {
      setSaving(true);
      await api.delete(`/api/camiones/${camEdit.id}`);
      await cargar();
      setEditOpen(false);
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo eliminar el camión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="emp-layout">
      {/* --------- Formulario --------- */}
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
            {/*
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
*/}
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

      {/* --------- Tabla --------- */}
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
                <th>Patente</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Cap. (m³)</th>
                <th>Estado</th>
                <th style={{ width: 1 }}>Editar</th>
                {/* NUEVO */}
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((c) => (
                <tr key={c.id}>
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
                  <td>
                    <button
                      className="btn btn-light"
                      onClick={() => abrirEditar(c)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Sin camiones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="hint">
          Consejo: filtrá por patente/marca/modelo con el buscador de la
          derecha.
        </p>
      </div>

      {/* --------- Modal edición --------- */}
      {editOpen && (
        <div className="modal-backdrop" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Editar camión</h3>
            <p className="modal-id">
              <strong>{camEdit?.patente}</strong> {camEdit?.marca || ""}{" "}
              {camEdit?.modelo || ""} — Año {camEdit?.anio || "—"}
            </p>

            <label className="chk">
              <input
                type="checkbox"
                checked={activoEdit}
                onChange={(e) => setActivoEdit(e.target.checked)}
              />
              <span>{activoEdit ? "Activo" : "Inactivo"}</span>
            </label>

            <div
              className="modal-actions"
              style={{ justifyContent: "space-between" }}
            >
              <button
                className="btn btn-danger"
                onClick={eliminarCamion}
                disabled={saving}
              >
                Eliminar
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-light"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  className="btn"
                  onClick={guardarEstado}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
