import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import "../styles/Asistencias.css"; // opcional

export default function Asistencias() {
  const [empleados, setEmpleados] = useState([]);
  const [hoy, setHoy] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const cargar = async () => {
    const [empRes, hoyRes] = await Promise.all([
      api.get("/api/empleados"),
      api.get("/api/asistencias/hoy"),
    ]);
    setEmpleados(empRes.data);
    setHoy(hoyRes.data);
  };

  useEffect(() => {
    cargar();
  }, []);

  const mapHoy = useMemo(() => {
    const m = new Map();
    for (const a of hoy) m.set(a.empleado_id, a);
    return m;
  }, [hoy]);

  const fil = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return empleados;
    return empleados.filter((e) =>
      `${e.nombre} ${e.apellido} ${e.dni}`.toLowerCase().includes(qq)
    );
  }, [empleados, q]);

  const marcar = async (empleado_id, tipo) => {
    try {
      setLoading(true);
      setMsg("");
      if (tipo === "in") {
        await api.post("/api/asistencias/check-in", { empleado_id });
      } else {
        await api.post("/api/asistencias/check-out", { empleado_id });
      }
      await cargar();
      setMsg("Marcación registrada.");
    } catch (e) {
      setMsg(e?.response?.data?.error || "Error al marcar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asis-layout">
      <div className="asis-head">
        <h2>Asistencias (hoy)</h2>
        <input
          placeholder="Buscar por nombre o DNI..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {msg && <div className="asis-msg">{msg}</div>}

      <div className="asis-table">
        <table>
          <thead>
            <tr>
              <th>Empleado</th>
              <th>DNI</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {fil.map((e) => {
              const a = mapHoy.get(e.id);
              return (
                <tr key={e.id}>
                  <td>
                    {e.nombre} {e.apellido}
                  </td>
                  <td>{e.dni}</td>
                  <td>
                    {a?.check_in
                      ? new Date(a.check_in).toLocaleTimeString()
                      : "—"}
                  </td>
                  <td>
                    {a?.check_out
                      ? new Date(a.check_out).toLocaleTimeString()
                      : "—"}
                  </td>
                  <td>{a?.estado || "—"}</td>
                  <td>
                    <button
                      disabled={loading || a?.check_in}
                      onClick={() => marcar(e.id, "in")}
                    >
                      Entró
                    </button>
                    <button
                      disabled={loading || !a?.check_in || a?.check_out}
                      onClick={() => marcar(e.id, "out")}
                    >
                      Salió
                    </button>
                  </td>
                </tr>
              );
            })}
            {fil.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
                  Sin empleados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
