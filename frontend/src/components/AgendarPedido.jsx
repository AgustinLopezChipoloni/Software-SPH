import { useState } from "react";
import { api } from "../services/api";
import "../styles/AgendarPedido.css";

export default function AgendarPedido({ cliente, onVolver }) {
  const [formData, setFormData] = useState({
    m3: "",
    fecha_entrega: "",
    observacion: "",
  });
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  if (!cliente) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.m3 || !formData.fecha_entrega) {
      setMensaje({ tipo: "error", texto: "Completa todos los campos requeridos." });
      return;
    }

    try {
      await api.post("/api/pedidos", {
        cliente_id: cliente.id,
        nombre_cliente: cliente.nombre,
        apellido_cliente: cliente.apellido,
        empresa: cliente.empresa,
        m3: formData.m3,
        fecha_entrega: formData.fecha_entrega,
        observacion: formData.observacion,
      });

      setMensaje({ tipo: "exito", texto: "✅ Pedido agendado correctamente." });
      setFormData({ m3: "", fecha_entrega: "", observacion: "" });
      setTimeout(() => onVolver(), 1500);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: "error", texto: "❌ Error al agendar pedido." });
    }
  };

  return (
    <section className="agendar-container">
      <h2>Agendar Pedido</h2>
      <p className="agendar-subtitle">
        Cliente: <strong>{cliente.nombre} {cliente.apellido}</strong>
        {cliente.empresa && <> — {cliente.empresa}</>}
      </p>

      {mensaje.texto && (
        <p className={`agendar-mensaje ${mensaje.tipo === "exito" ? "ok" : "error"}`}>
          {mensaje.texto}
        </p>
      )}

      <form onSubmit={handleSubmit} className="agendar-form">
        <div className="form-row">
          <div>
            <label>Cantidad (m³) *</label>
            <input
              type="number"
              name="m3"
              value={formData.m3}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Fecha de entrega *</label>
            <input
              type="date"
              name="fecha_entrega"
              value={formData.fecha_entrega}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-full">
            <label>Observación / Descripción</label>
            <textarea
              name="observacion"
              value={formData.observacion}
              onChange={handleChange}
              placeholder="Ej: Entregar temprano, cliente requiere algo, etc."
              rows="3"
            ></textarea>
          </div>
        </div>

        <button type="submit" className="btn-guardar">Guardar pedido</button>
      </form>

      <button type="button" className="btn-volver" onClick={onVolver}>
        ← Volver a Agenda
      </button>
    </section>
  );
}