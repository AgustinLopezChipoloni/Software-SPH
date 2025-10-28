// frontend/src/components/AsistenciasQR.jsx
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { api } from "../services/api";
import "../styles/Asistencias.css";

export default function AsistenciasQR() {
  // Referencia al escáner
  const escanerRef = useRef(null);

  // UI
  const [mensaje, setMensaje] = useState("");
  const [ultimoResultado, setUltimoResultado] = useState(null);

  // ⬇️ Filtro por fecha + listado
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset()); // corrige desfase horario
  const hoyCadena = ahora.toISOString().slice(0, 10); // YYYY-MM-DD local

  const [fecha, setFecha] = useState(hoyCadena);
  const [registros, setRegistros] = useState([]);

  // Cargar listado por fecha
  const cargarListado = async (dia) => {
    try {
      const { data } = await api.get("/api/asistencias/by-date", {
        params: { date: dia },
      });
      setRegistros(data);
    } catch {
      setRegistros([]);
    }
  };

  useEffect(() => {
    const idDiv = "qr-reader";
    const escaner = new Html5QrcodeScanner(idDiv, {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true, // linterna (nativo del widget)
      showZoomSliderIfSupported: true, // zoom (nativo del widget)
    });

    // Éxito al leer QR
    const alLeerQR = async (textoLeido) => {
      setMensaje("Procesando QR…");
      try {
        const { data } = await api.post("/api/asistencias/qr", {
          uid: textoLeido,
        });
        setUltimoResultado(data);
        setMensaje(data.msg || "OK");
        await cargarListado(fecha);
      } catch (e) {
        setUltimoResultado(null);
        setMensaje(
          e?.response?.data?.error || "No se pudo registrar la asistencia"
        );
      }
    };

    // Error continuo de lectura (se ignora)
    const alErrorQR = () => {};

    escaner.render(alLeerQR, alErrorQR);
    escanerRef.current = escaner;

    // Listado inicial
    cargarListado(fecha);

    return () => escaner.clear().catch(() => {});
  }, []); // eslint-disable-line

  // Leer QR desde imagen
  const leerDesdeImagen = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    try {
      const texto = await Html5Qrcode.scanFile(archivo, true);
      setMensaje("Procesando QR de imagen…");
      const { data } = await api.post("/api/asistencias/qr", { uid: texto });
      setUltimoResultado(data);
      setMensaje(data.msg || "OK");
      await cargarListado(fecha);
    } catch {
      setMensaje("No se pudo leer/registrar el QR desde la imagen.");
    }
  };

  // ==== Estilos de UI para el "último resultado" ====
  const accion = ultimoResultado?.accion; // 'entrada' | 'salida' | 'completo'
  const claseAccion =
    accion === "entrada"
      ? "ultimo-entrada"
      : accion === "salida"
      ? "ultimo-salida"
      : "ultimo-completo";
  const badgeClase =
    accion === "entrada"
      ? "badge badge-entrada"
      : accion === "salida"
      ? "badge badge-salida"
      : "badge badge-completo";

  return (
    <div className="emp-layout">
      {/* ====== Top: Escáner (izq) + Último resultado (der) ====== */}
      <div className="asis-top">
        {/* Escáner */}
        <div className="emp-card">
          <h2>Asistencia por QR</h2>
          <p className="card-subtitle">
            Escaneá el QR de la credencial o subí una foto del código.
          </p>

          <div className="qr-card">
            {/* Solo subir imagen (se quitó “Espejar”) */}
            <div className="qr-toolbar">
              {/*<label className="btn btn-light" style={{ cursor: "pointer" }}>
                Subir imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={leerDesdeImagen}
                  style={{ display: "none" }}
                />
              </label>*/}
            </div>

            <div id="qr-reader" className="qr-box" />
            <div className="qr-hint">Apuntá el QR dentro del recuadro</div>
          </div>

          {mensaje && (
            <div className="emp-msg" style={{ marginTop: 12 }}>
              {mensaje}
            </div>
          )}
        </div>

        {/* Último resultado a la derecha */}
        <div className="emp-card ultimo-panel">
          <h3 style={{ marginTop: 0 }}>Último resultado</h3>

          {ultimoResultado ? (
            <div
              className={`emp-card ultimo-card ${claseAccion}`}
              style={{ marginTop: 8 }}
            >
              <div className="ultimo-head">
                <span className={badgeClase}>
                  {accion === "entrada"
                    ? "Entrada"
                    : accion === "salida"
                    ? "Salida"
                    : "Completo"}
                </span>
              </div>
              <div className="ultimo-body">
                <p className="ultimo-nombre">
                  <strong>
                    {ultimoResultado.empleado?.apellido},{" "}
                    {ultimoResultado.empleado?.nombre}
                  </strong>{" "}
                  — DNI {ultimoResultado.empleado?.dni}
                </p>
                <div className="ultimo-horas">
                  <span>
                    <strong>Check-in:</strong> {ultimoResultado.check_in || "—"}
                  </span>
                  <span>
                    <strong>Check-out:</strong>{" "}
                    {ultimoResultado.check_out || "—"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="ultimo-placeholder">
              Aún no hay lecturas registradas hoy.
            </div>
          )}
        </div>
      </div>

      {/* ====== Registros por fecha ====== */}
      <div className="emp-card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Registros</h3>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
          <button
            className="btn btn-light"
            onClick={() => cargarListado(fecha)}
          >
            Buscar
          </button>
        </div>

        <div className="emp-table" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>DNI</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.nombre} {r.apellido}
                  </td>
                  <td>{r.dni}</td>
                  <td>
                    {r.check_in
                      ? new Date(r.check_in).toLocaleTimeString()
                      : "—"}
                  </td>
                  <td>
                    {r.check_out
                      ? new Date(r.check_out).toLocaleTimeString()
                      : "—"}
                  </td>
                  <td>{r.estado || "—"}</td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    Sin registros
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
