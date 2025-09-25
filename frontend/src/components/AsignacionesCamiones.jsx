/*import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import "../styles/AsignacionesCamiones.css"; // opcional

function hoyYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AsignacionesCamiones() {
  const [fecha, setFecha] = useState(hoyYYYYMMDD());
  const [camiones, setCamiones] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [asigs, setAsigs] = useState([]);

  const [form, setForm] = useState({
    camion_id: "",
    chofer_id: "",
    hora_inicio: "",
    hora_fin: "",
    observaciones: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const cargar = async (f = fecha) => {
    const [c, ch, a] = await Promise.all([
      api.get("/api/asignaciones/camiones"),
      api.get("/api/asignaciones/choferes"),
      api.get("/api/asignaciones", { params: { fecha: f } }),
    ]);
    setCamiones(c.data);
    setChoferes(ch.data);
    setAsigs(a.data);
  };

  useEffect(() => {
    cargar();
  }, []);
  useEffect(() => {
    cargar(fecha);
  }, [fecha]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const crear = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await api.post("/api/asignaciones", {
        fecha,
        camion_id: Number(form.camion_id),
        chofer_id: Number(form.chofer_id),
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        observaciones: form.observaciones || null,
      });
      setForm({
        camion_id: "",
        chofer_id: "",
        hora_inicio: "",
        hora_fin: "",
        observaciones: "",
      });
      await cargar(fecha);
      setMsg("Asignación creada.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Error al crear asignación");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar la asignación?")) return;
    setLoading(true);
    setMsg("");
    try {
      await api.delete(`/api/asignaciones/${id}`);
      await cargar(fecha);
      setMsg("Asignación eliminada.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  const camionOcupado = useMemo(
    () => new Set(asigs.map((a) => a.camion_id)),
    [asigs]
  );

  return (
    <div className="asig-layout">
      <div className="asig-head">
        <div>
          <h2>Asignaciones de camiones</h2>
          <p className="asig-subtitle">
            Asigná un chofer a cada camión por día. Un camión no puede repetirse
            en la misma fecha.
          </p>
        </div>
        <div className="asig-date">
          <label>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>

      {msg && <div className="asig-msg">{msg}</div>}

      <div className="asig-card">
        <h3>Nueva asignación</h3>
        <form onSubmit={crear} className="asig-form">
          <div className="row">
            <div className="col">
              <label>Camión *</label>
              <select
                name="camion_id"
                value={form.camion_id}
                onChange={onChange}
                required
              >
                <option value="">-- Seleccionar --</option>
                {camiones.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={camionOcupado.has(c.id)}
                  >
                    {c.patente} ({c.marca || "-"} {c.modelo || ""}){" "}
                    {camionOcupado.has(c.id) ? "— OCUPADO" : ""}
                  </option>
                ))}
              </select>
              {form.camion_id && camionOcupado.has(Number(form.camion_id)) && (
                <div className="hint warn">Ese camión ya está ocupado hoy.</div>
              )}
            </div>
            <div className="col">
              <label>Chofer *</label>
              <select
                name="chofer_id"
                value={form.chofer_id}
                onChange={onChange}
                required
              >
                <option value="">-- Seleccionar --</option>
                {choferes.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.apellido}, {ch.nombre} — {ch.dni}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>Hora inicio</label>
              <input
                name="hora_inicio"
                type="time"
                value={form.hora_inicio}
                onChange={onChange}
              />
            </div>
            <div className="col">
              <label>Hora fin</label>
              <input
                name="hora_fin"
                type="time"
                value={form.hora_fin}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="row">
            <label>Observaciones</label>
            <input
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              placeholder="Ej.: Turno mañana, obra X…"
            />
          </div>

          <div className="actions">
            <button className="btn" disabled={loading}>
              {loading ? "Guardando..." : "Asignar"}
            </button>
            <button
              type="button"
              className="btn btn-light"
              onClick={() =>
                setForm({
                  camion_id: "",
                  chofer_id: "",
                  hora_inicio: "",
                  hora_fin: "",
                  observaciones: "",
                })
              }
              disabled={loading}
              title="Limpiar formulario"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      <div className="asig-card">
        <h3>Asignaciones del día</h3>
        <div className="asig-table scroll-shadow">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Patente</th>
                <th>Camión</th>
                <th>Chofer</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Obs.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {asigs.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{a.patente}</td>
                  <td>
                    {a.marca || "-"} {a.modelo || ""}
                  </td>
                  <td>
                    {a.apellido}, {a.nombre}
                  </td>
                  <td>{a.hora_inicio || "—"}</td>
                  <td>{a.hora_fin || "—"}</td>
                  <td>{a.observaciones || "—"}</td>
                  <td className="td-actions">
                    <button
                      className="btn btn-danger"
                      onClick={() => eliminar(a.id)}
                      title="Eliminar asignación"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {asigs.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Sin asignaciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="hint">
          Recordá: un camión no puede asignarse más de una vez por fecha.
        </p>
      </div>
    </div>
  );
}
*/
// frontend/src/components/AsignacionesCamiones.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import "../styles/AsignacionesCamiones.css"; // usamos el mismo CSS

function hoyYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AsignacionesCamiones() {
  const [fecha, setFecha] = useState(hoyYYYYMMDD());
  const [camiones, setCamiones] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [asigs, setAsigs] = useState([]);

  const [form, setForm] = useState({
    camion_id: "",
    chofer_id: "",
    hora_inicio: "",
    hora_fin: "",
    observaciones: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Carga inicial y por fecha
  const cargar = async (f = fecha) => {
    const [c, ch, a] = await Promise.all([
      api.get("/api/asignaciones/camiones"),
      api.get("/api/asignaciones/choferes"),
      api.get("/api/asignaciones", { params: { fecha: f } }),
    ]);
    setCamiones(c.data);
    setChoferes(ch.data);
    setAsigs(a.data);
  };

  useEffect(() => {
    cargar();
  }, []);
  useEffect(() => {
    cargar(fecha);
  }, [fecha]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const crear = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await api.post("/api/asignaciones", {
        fecha,
        camion_id: Number(form.camion_id),
        chofer_id: Number(form.chofer_id),
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        observaciones: form.observaciones || null,
      });
      setForm({
        camion_id: "",
        chofer_id: "",
        hora_inicio: "",
        hora_fin: "",
        observaciones: "",
      });
      await cargar(fecha);
      setMsg("Asignación creada.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Error al crear asignación");
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar la asignación?")) return;
    setLoading(true);
    setMsg("");
    try {
      await api.delete(`/api/asignaciones/${id}`);
      await cargar(fecha);
      setMsg("Asignación eliminada.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  // Set con los camiones ocupados en la fecha
  const camionOcupado = useMemo(
    () => new Set(asigs.map((a) => a.camion_id)),
    [asigs]
  );

  return (
    <div className="asig-layout">
      <div className="asig-head">
        <div>
          <h2>Asignaciones de camiones</h2>
          <p className="asig-subtitle">
            Asigná un chofer a cada camión por día. Un camión no puede repetirse
            en la misma fecha.
          </p>
        </div>
        <div className="asig-date">
          <label>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>

      {msg && <div className="asig-msg">{msg}</div>}

      <div className="asig-card">
        <h3>Nueva asignación</h3>
        <form onSubmit={crear} className="asig-form">
          <div className="row">
            <div className="col">
              <label>Camión *</label>
              <select
                name="camion_id"
                value={form.camion_id}
                onChange={onChange}
                required
              >
                <option value="">-- Seleccionar --</option>
                {camiones.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={camionOcupado.has(c.id)} // solo bloquea si ya está ocupado
                  >
                    {c.patente} ({c.marca || "-"} {c.modelo || ""}){" "}
                    {camionOcupado.has(c.id) ? "— OCUPADO" : ""}
                  </option>
                ))}
              </select>
              {form.camion_id && camionOcupado.has(Number(form.camion_id)) && (
                <div className="hint warn">Ese camión ya está ocupado hoy.</div>
              )}
            </div>

            <div className="col">
              <label>Chofer *</label>
              <select
                name="chofer_id"
                value={form.chofer_id}
                onChange={onChange}
                required
              >
                <option value="">-- Seleccionar --</option>
                {choferes.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.apellido}, {ch.nombre} — {ch.dni}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>Hora inicio</label>
              <input
                name="hora_inicio"
                type="time"
                value={form.hora_inicio}
                onChange={onChange}
              />
            </div>
            <div className="col">
              <label>Hora fin</label>
              <input
                name="hora_fin"
                type="time"
                value={form.hora_fin}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="row">
            <label>Observaciones</label>
            <input
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              placeholder="Ej.: Turno mañana, obra X…"
            />
          </div>

          <div className="actions">
            <button className="btn" disabled={loading}>
              {loading ? "Guardando..." : "Asignar"}
            </button>
            <button
              type="button"
              className="btn btn-light"
              onClick={() =>
                setForm({
                  camion_id: "",
                  chofer_id: "",
                  hora_inicio: "",
                  hora_fin: "",
                  observaciones: "",
                })
              }
              disabled={loading}
              title="Limpiar formulario"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      <div className="asig-card">
        <h3>Asignaciones del día</h3>
        <div className="asig-table scroll-shadow">
          <table className="table-compact">
            <thead>
              <tr>
                <th>Patente</th>
                <th>Camión</th>
                <th>Chofer</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Obs.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {asigs.map((a) => (
                <tr key={a.id}>
                  <td className="mono">{a.patente}</td>
                  <td>
                    {a.marca || "-"} {a.modelo || ""}
                  </td>
                  <td>
                    {a.apellido}, {a.nombre}
                  </td>
                  <td>{a.hora_inicio || "—"}</td>
                  <td>{a.hora_fin || "—"}</td>
                  <td>{a.observaciones || "—"}</td>
                  <td className="td-actions">
                    <button
                      className="btn btn-danger"
                      onClick={() => eliminar(a.id)}
                      title="Eliminar asignación"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {asigs.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Sin asignaciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="hint">
          Recordá: un camión no puede asignarse más de una vez por fecha.
        </p>
      </div>
    </div>
  );
}
