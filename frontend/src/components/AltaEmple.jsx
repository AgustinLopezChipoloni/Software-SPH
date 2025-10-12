// frontend/src/components/AltaEmple.jsx
import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/AltaEmple.css";
import QRCode from "react-qr-code"; // ⬅️ para renderizar el código QR

// NUEVO: agregamos cargo_nombre para enviar al backend
const initial = {
  nombre: "",
  apellido: "",
  dni: "",
  email: "",
  telefono: "",
  fecha_ingreso: "",
  activo: true,
  cargo_nombre: "", // "CHOFER" / "OPERARIO" / "ADMIN" / "JEFE_PLANTA" (opcional)
};

export default function Employees() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ⬇️ Estado para el modal de QR
  const [showQR, setShowQR] = useState(false);
  const [empQR, setEmpQR] = useState(null); // { id, nombre, apellido, dni, email, qr_uid }

  const cargar = async () => {
    const { data } = await api.get("/api/empleados");
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
      await api.post("/api/empleados", form); // envía cargo_nombre si hay
      setForm(initial);
      await cargar();
      setMsg("Empleado creado correctamente.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Error al crear empleado");
    } finally {
      setLoading(false);
    }
  };

  // ⬇️ Abre el modal con el QR SIN regenerar.
  //    Si el empleado no tiene qr_uid, lo genera por primera vez (sin force).
  const abrirQR = async (emp) => {
    try {
      // pido el QR actual (si existe). Si no hay, el backend lo genera por 1ª vez.
      const { data } = await api.post(`/api/empleados/${emp.id}/qr`);
      setEmpQR(data?.empleado || null);
      setShowQR(true);
      await cargar(); // refresco la tabla por si se generó por 1ª vez
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo obtener el QR");
    }
  };

  // ⬇️ Regenera el QR (cambia el uid) sólo si confirmás
  const regenerarQR = async () => {
    if (!empQR) return;
    const ok = window.confirm(
      "¿Regenerar QR? El QR anterior dejará de funcionar."
    );
    if (!ok) return;
    try {
      const { data } = await api.post(`/api/empleados/${empQR.id}/qr?force=1`);
      setEmpQR(data?.empleado || null);
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo regenerar el QR");
    }
  };

  return (
    <div className="emp-layout">
      <div className="emp-card">
        <h2>Alta de Empleado</h2>
        <form className="emp-form" onSubmit={onSubmit}>
          <div className="row">
            <div className="col">
              <label>Nombre *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                required
              />
            </div>
            <div className="col">
              <label>Apellido *</label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>DNI *</label>
              <input name="dni" value={form.dni} onChange={onChange} required />
            </div>
            <div className="col">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={onChange}
              />
            </div>
            <div className="col">
              <label>Fecha de ingreso *</label>
              <input
                type="date"
                name="fecha_ingreso"
                value={form.fecha_ingreso}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>Cargo</label>
              <select
                name="cargo_nombre"
                value={form.cargo_nombre}
                onChange={onChange}
              >
                <option value="">(sin especificar)</option>
                <option value="CHOFER">Chofer</option>
                <option value="OPERARIO">Operario</option>
                <option value="JEFE_PLANTA">Jefe de Planta</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div className="row">
            <label className="chk">
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={onChange}
              />
              <span>Activo</span>
            </label>
          </div>

          {msg && <div className="emp-msg">{msg}</div>}

          <button className="btn" disabled={loading}>
            {loading ? "Guardando..." : "Guardar empleado"}
          </button>
        </form>
      </div>

      <div className="emp-card">
        <h2>Empleados</h2>
        <div className="emp-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Ingreso</th>
                <th>Activo</th>
                <th>Cargo</th>
                <th>QR</th>
                <th>Edicion</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td>
                    {emp.nombre} {emp.apellido}
                  </td>
                  <td>{emp.dni}</td>
                  <td>{emp.email}</td>
                  <td>{emp.telefono || "—"}</td>
                  <td>{String(emp.fecha_ingreso).slice(0, 10)}</td>
                  <td>{emp.activo ? "Sí" : "No"}</td>
                  <td>{emp.cargo || "—"}</td>
                  <td>
                    <button
                      className="btn btn-light"
                      title={emp.qr_uid ? "Ver QR" : "Generar QR"}
                      onClick={() => abrirQR(emp)}
                    >
                      QR
                    </button>
                  </td>
                  <td>
                    <button 
                      className="btn btn-edit"
                      >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
                    Sin empleados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showQR && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
          onClick={() => setShowQR(false)}
        >
          <div
            className="modal"
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 12,
              minWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Credencial QR</h3>
            {empQR ? (
              <>
                <p>
                  <strong>
                    {empQR.apellido}, {empQR.nombre}
                  </strong>
                </p>
                <p>DNI: {empQR.dni}</p>
                {!empQR.qr_uid ? (
                  <p style={{ color: "#b91c1c" }}>
                    Este empleado todavía no tiene QR.
                  </p>
                ) : (
                  <div
                    style={{
                      background: "#fff",
                      padding: 16,
                      display: "inline-block",
                    }}
                  >
                    <QRCode value={empQR.qr_uid} size={180} />
                  </div>
                )}
              </>
            ) : (
              <p>No se pudo cargar el QR.</p>
            )}
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn btn-light"
                onClick={() => setShowQR(false)}
              >
                Cerrar
              </button>
              {empQR?.qr_uid && (
                <button className="btn btn-light" onClick={regenerarQR}>
                  Regenerar
                </button>
              )}
              <button className="btn" onClick={() => window.print()}>
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
