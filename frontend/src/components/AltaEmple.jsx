import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import "../styles/AltaEmple.css";
import QRCode from "react-qr-code";

// ================= Formulario (Alta) =================
const initial = {
  nombre: "",
  apellido: "",
  dni: "",
  email: "",
  telefono: "",
  fecha_ingreso: "",
  activo: true,
  cargo_nombre: "",
};

export default function Employees() {
  // --- Estado general ---
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // --- Modal QR ---
  const [showQR, setShowQR] = useState(false);
  const [empQR, setEmpQR] = useState(null);

  // --- Pestañas ---
  const [vista, setVista] = useState("form");

  // --- Buscador lista ---
  const [buscar, setBuscar] = useState("");
  const listaFiltrada = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((e) =>
      `${e.nombre} ${e.apellido} ${e.dni}`.toLowerCase().includes(q)
    );
  }, [lista, buscar]);

  // ================= Carga inicial =================
  const cargar = async () => {
    const { data } = await api.get("/api/empleados");
    setLista(data);
  };
  useEffect(() => {
    cargar();
  }, []);

  // ================= Handlers formulario (Alta) =================
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      await api.post("/api/empleados", form);
      setForm(initial);
      await cargar();
      setMsg("Empleado creado correctamente.");
      setVista("lista");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Error al crear empleado");
    } finally {
      setLoading(false);
    }
  };

  // ================= QR =================
  const abrirQR = async (emp) => {
    try {
      const { data } = await api.post(`/api/empleados/${emp.id}/qr`);
      setEmpQR(data?.empleado || null);
      setShowQR(true);
      await cargar();
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo obtener el QR");
    }
  };

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

  // ================== EDITAR (TELÉFONO + CARGO) ==================
  const [editOpen, setEditOpen] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [editTel, setEditTel] = useState("");
  const [editCargo, setEditCargo] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Abre modal con datos actuales
  const abrirEditar = (emp) => {
    setEditEmp(emp);
    setEditTel(emp.telefono || "");
    setEditCargo(emp.cargo || "");
    setEditOpen(true);
  };

  // Guarda ambos campos (PATCH)
  const guardarEdicion = async () => {
    if (!editEmp) return;
    try {
      setSavingEdit(true);
      await api.patch(`/api/empleados/${editEmp.id}`, {
        telefono: editTel || null,
        cargo_nombre: editCargo || null,
      });
      await cargar();
      setEditOpen(false);
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo actualizar");
    } finally {
      setSavingEdit(false);
    }
  };

  // Quita solo el teléfono (PATCH con null)
  const quitarTelefono = async () => {
    if (!editEmp) return;
    try {
      setSavingEdit(true);
      await api.patch(`/api/empleados/${editEmp.id}`, { telefono: null });
      await cargar();
      setEditTel("");
      setEditOpen(false);
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo quitar el teléfono");
    } finally {
      setSavingEdit(false);
    }
  };

  // === NUEVO: Eliminar empleado (DELETE) ===
  const eliminarEmpleado = async () => {
    if (!editEmp) return;
    const ok = window.confirm(
      `Eliminar definitivamente a ${editEmp.apellido}, ${editEmp.nombre}?`
    );
    if (!ok) return;
    try {
      setSavingEdit(true);
      await api.delete(`/api/empleados/${editEmp.id}`); // ⬅️ DELETE
      await cargar();
      setEditOpen(false);
    } catch (e) {
      alert(e?.response?.data?.error || "No se pudo eliminar");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="emp-layout">
      {/* ========== PESTAÑAS ========== */}
      <div className="emp-tabs">
        <button
          className={`emp-tab ${vista === "form" ? "active" : ""}`}
          onClick={() => setVista("form")}
          type="button"
        >
          Nuevo empleado
        </button>
        <button
          className={`emp-tab ${vista === "lista" ? "active" : ""}`}
          onClick={() => setVista("lista")}
          type="button"
        >
          Lista de empleados
        </button>
      </div>

      {/* ========== FORMULARIO (ALTA) ========== */}
      {vista === "form" && (
        <div className="emp-card">
          <h2>Alta de Empleado</h2>
          <form className="emp-form" onSubmit={onSubmit}>
            <div className="row">
              <div className="col">
                <label>
                  Nombre <span className="req">*</span>
                </label>
                <input
                  name="nombre"
                  placeholder="Ej.: Juan"
                  value={form.nombre}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="col">
                <label>
                  Apellido <span className="req">*</span>
                </label>
                <input
                  name="apellido"
                  placeholder="Ej.: Pérez"
                  value={form.apellido}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <div className="row">
              <div className="col">
                <label>
                  DNI <span className="req">*</span>
                </label>
                <input
                  name="dni"
                  placeholder="Solo números"
                  value={form.dni}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="col">
                <label>
                  Email <span className="req">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="correo@empresa.com"
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
                  placeholder="Ej.: 381-5555555"
                  value={form.telefono}
                  onChange={onChange}
                />
              </div>
              <div className="col">
                <label>
                  Fecha de ingreso <span className="req">*</span>
                </label>
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

            {msg && <div className="emp-msg">{msg}</div>}

            <div className="form-actions">
              <button className="btn" disabled={loading}>
                {loading ? "Guardando..." : "Guardar empleado"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========== LISTA (EMPLEADOS) ========== */}
      {vista === "lista" && (
        <div className="emp-card">
          <div className="emp-list-head">
            <h2 style={{ margin: 0 }}>Empleados</h2>
            <div className="emp-list-tools">
              <input
                className="emp-search"
                type="text"
                placeholder="Buscar por nombre o DNI…"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
              />
              <button
                className="btn btn-light"
                type="button"
                onClick={() => setVista("form")}
                title="Crear nuevo empleado"
              >
                + Nuevo
              </button>
            </div>
          </div>

          <div className="emp-table">
            <table>
              <thead>
                <tr>
                  {/*<th>ID</th>*/}
                  <th>Apellido y Nombre</th>
                  <th>DNI</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Ingreso</th>
                  <th>Cargo</th>
                  <th>QR</th>
                  <th>Edición</th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((emp) => (
                  <tr key={emp.id}>
                    {/*<td>{emp.id}</td>*/}
                    <td>
                      {emp.apellido}, {emp.nombre}
                    </td>
                    <td>{emp.dni}</td>
                    <td>{emp.email}</td>
                    <td>{emp.telefono || "—"}</td>
                    <td>{String(emp.fecha_ingreso).slice(0, 10)}</td>
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
                        onClick={() => abrirEditar(emp)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {listaFiltrada.length === 0 && (
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
      )}

      {/* ========== MODAL QR ========== */}
      {showQR && (
        <div className="modal-backdrop" onClick={() => setShowQR(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
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
            <div className="modal-actions">
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

      {/* ========== MODAL EDITAR (TELÉFONO + CARGO + ELIMINAR) ========== */}
      {editOpen && (
        <div className="modal-backdrop" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Editar teléfono y cargo</h3>
            <p className="modal-id">
              <strong>
                {editEmp?.apellido}, {editEmp?.nombre}
              </strong>{" "}
              — DNI: {editEmp?.dni}
            </p>

            <div className="modal-fields">
              <label>Teléfono</label>
              <input
                className="modal-input"
                placeholder="Ej.: 381-5555555"
                value={editTel}
                onChange={(e) => setEditTel(e.target.value)}
              />

              <label style={{ marginTop: 8 }}>Cargo</label>
              <select
                className="modal-select"
                value={editCargo}
                onChange={(e) => setEditCargo(e.target.value)}
              >
                <option value="">(sin especificar)</option>
                <option value="CHOFER">Chofer</option>
                <option value="OPERARIO">Operario</option>
                <option value="JEFE_PLANTA">Jefe de Planta</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div
              className="modal-actions"
              style={{ justifyContent: "space-between" }}
            >
              {/* Izquierda: eliminar empleado */}
              <button
                className="btn btn-danger"
                onClick={eliminarEmpleado}
                disabled={savingEdit}
              >
                Eliminar empleado
              </button>

              {/* Derecha: acciones de edición */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-light"
                  onClick={() => setEditOpen(false)}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
                <button
                  className="btn"
                  onClick={quitarTelefono}
                  disabled={savingEdit}
                >
                  Quitar teléfono
                </button>
                <button
                  className="btn"
                  onClick={guardarEdicion}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
