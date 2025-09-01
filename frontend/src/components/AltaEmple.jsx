import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/AltaEmple.css";

const initial = {
  nombre: "", apellido: "", dni: "", email: "",
  telefono: "", fecha_ingreso: "", activo: true
};

export default function Employees() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const cargar = async () => {
    const { data } = await api.get("/api/empleados");
    setLista(data);
  };

  useEffect(() => { cargar(); }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      await api.post("/api/empleados", form);
      setForm(initial);
      await cargar();
      setMsg("Empleado creado correctamente.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Error al crear empleado");
    } finally {
      setLoading(false);
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
              <input name="nombre" value={form.nombre} onChange={onChange} required />
            </div>
            <div className="col">
              <label>Apellido *</label>
              <input name="apellido" value={form.apellido} onChange={onChange} required />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>DNI *</label>
              <input name="dni" value={form.dni} onChange={onChange} required />
            </div>
            <div className="col">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={onChange} required />
            </div>
          </div>

          <div className="row">
            <div className="col">
              <label>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={onChange} />
            </div>
            <div className="col">
              <label>Fecha de ingreso *</label>
              <input type="date" name="fecha_ingreso" value={form.fecha_ingreso} onChange={onChange} required />
            </div>
          </div>

          <div className="row">
            <label className="chk">
              <input type="checkbox" name="activo" checked={form.activo} onChange={onChange} />
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
                <th>ID</th><th>Nombre</th><th>DNI</th><th>Email</th><th>Teléfono</th><th>Ingreso</th><th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td>{emp.nombre} {emp.apellido}</td>
                  <td>{emp.dni}</td>
                  <td>{emp.email}</td>
                  <td>{emp.telefono || "—"}</td>
                  <td>{emp.fecha_ingreso}</td>
                  <td>{emp.activo ? "Sí" : "No"}</td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr><td colSpan="7" style={{textAlign:"center"}}>Sin empleados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
