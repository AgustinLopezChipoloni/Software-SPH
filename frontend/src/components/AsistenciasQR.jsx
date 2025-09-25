// frontend/src/components/AsistenciasQR.jsx
import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { api } from "../services/api";

/**
 * AsistenciasQR
 * - Escanea QR con la cámara (html5-qrcode) o desde una imagen.
 * - Envía el texto del QR al backend:
 *     POST /api/asistencias/qr  { uid }
 * - El backend decide si es entrada, salida o ya completo, y responde.
 */
export default function AsistenciasQR() {
  const scannerRef = useRef(null);
  const [msg, setMsg] = useState("");
  const [ultimo, setUltimo] = useState(null); // último resultado del backend

  useEffect(() => {
    const divId = "qr-reader";

    // Config del escáner de cámara
    const scanner = new Html5QrcodeScanner(divId, {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      showTorchButtonIfSupported: true, // botón linterna si el dispositivo lo soporta
      showZoomSliderIfSupported: true, // slider de zoom si lo soporta
    });

    // Callback al detectar QR
    const onScanSuccess = async (decodedText) => {
      setMsg("Procesando QR…");
      try {
        // Mandamos el texto del QR al backend
        const { data } = await api.post("/api/asistencias/qr", {
          uid: decodedText,
        });
        // data: { ok, msg, accion: 'entrada'|'salida'|'completo', empleado, check_in, check_out }
        setUltimo(data);
        setMsg(data.msg || "OK");
      } catch (e) {
        setUltimo(null);
        setMsg(
          e?.response?.data?.error || "No se pudo registrar la asistencia"
        );
      }
    };

    const onScanError = () => {
      // Podés loguear o ignorar errores de lectura continuos
    };

    // Arrancamos el scanner
    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;

    // Limpiar al desmontar
    return () => scanner.clear().catch(() => {});
  }, []);

  // Alternativa: leer QR desde una imagen (útil si no hay HTTPS/cámara)
  const scanFromFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      // Detecta el texto del QR dentro de la imagen
      const text = await Html5Qrcode.scanFile(file, true);
      setMsg("Procesando QR de imagen…");
      const { data } = await api.post("/api/asistencias/qr", { uid: text });
      setUltimo(data);
      setMsg(data.msg || "OK");
    } catch (err) {
      setMsg("No se pudo leer/registrar el QR desde la imagen.");
    }
  };

  return (
    <div className="emp-layout">
      <div className="emp-card">
        <h2>Asistencia por QR</h2>
        <p className="card-subtitle">
          Escaneá el QR de la credencial o subí una foto del código.
        </p>

        {/* Contenedor donde html5-qrcode renderiza la vista de cámara */}
        <div id="qr-reader" style={{ width: 320, maxWidth: "100%" }} />

        {/* Botón para subir imagen con QR si no podés usar cámara */}
        <div style={{ marginTop: 12 }}>
          <label className="btn btn-light" style={{ cursor: "pointer" }}>
            Subir imagen de QR
            <input
              type="file"
              accept="image/*"
              onChange={scanFromFile}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* Mensajes de estado */}
        {msg && (
          <div className="emp-msg" style={{ marginTop: 12 }}>
            {msg}
          </div>
        )}

        {/* Último resultado registrado */}
        {ultimo && (
          <div className="emp-card" style={{ marginTop: 12 }}>
            <h3>Resultado</h3>
            <p>
              <strong>Acción:</strong>{" "}
              {ultimo.accion === "entrada"
                ? "Entrada"
                : ultimo.accion === "salida"
                ? "Salida"
                : "—"}
            </p>
            <p>
              <strong>Empleado:</strong> {ultimo.empleado?.apellido},{" "}
              {ultimo.empleado?.nombre} — DNI {ultimo.empleado?.dni}
            </p>
            <p>
              <strong>Check-in:</strong> {ultimo.check_in || "—"}
            </p>
            <p>
              <strong>Check-out:</strong> {ultimo.check_out || "—"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
