// frontend/src/components/ModalQR.jsx
import QRCode from "react-qr-code";

/**
 * ModalQR
 * - Muestra una credencial simple de un empleado con el QR.
 * - Props:
 *    open: boolean (abre/cierra el modal)
 *    onClose: function (callback al click en backdrop o botón Cerrar)
 *    empleado: { nombre, apellido, dni, qr_uid, ... }
 */
export default function ModalQR({ open, onClose, empleado }) {
  // Si no está abierto o no hay empleado, no renderiza nada.
  if (!open || !empleado) return null;

  return (
    // Clic en el fondo cierra el modal
    <div className="modal-backdrop" onClick={onClose}>
      {/* Evitamos que el click dentro del modal cierre */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Credencial QR</h3>

        {/* Datos del empleado */}
        <p>
          <strong>
            {empleado.apellido}, {empleado.nombre}
          </strong>
        </p>
        <p>DNI: {empleado.dni}</p>

        {/* Si el empleado no tiene qr_uid aún, mostramos aviso */}
        {!empleado.qr_uid ? (
          <p style={{ color: "#b91c1c" }}>Este empleado no tiene QR aún.</p>
        ) : (
          // Si tiene qr_uid, renderizamos QR (solo el texto, no URL)
          <div
            style={{
              background: "white",
              padding: 16,
              display: "inline-block",
            }}
          >
            <QRCode value={empleado.qr_uid} size={180} />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button className="btn btn-light" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
