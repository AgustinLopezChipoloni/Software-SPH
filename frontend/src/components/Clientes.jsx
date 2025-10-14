import { useState } from "react";
import { api } from "../services/api";
import "../styles/clientes.css";

export default function Clientes() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    empresa: "",
  });
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nombre, apellido, email } = formData;

    if (!nombre || !apellido || !email) {
      setMensaje({
        tipo: "error",
        texto: "Los campos Nombre, Apellido y Email son obligatorios.",
      });
      return;
    }

    try {
      await api.post("/api/clientes", formData);
      setMensaje({ tipo: "exito", texto: "Cliente guardado correctamente." });

      setFormData({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        empresa: "",
      });

    
      setTimeout(() => setMensaje({ tipo: "", texto: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMensaje({
        tipo: "error",
        texto: "Ocurrió un error al guardar el cliente.",
      });
    }
  };

  return (
    <section className="clientes-container">
      <h2>Clientes</h2>
      <p className="clientes-subtitle">Gestión de clientes</p>

      <div className="clientes-form">
        <h3>Alta de Cliente</h3>

        {mensaje.texto && (
          <p
            className={`mensaje-form ${
              mensaje.tipo === "exito" ? "mensaje-exito" : "mensaje-error"
            }`}
          >
            {mensaje.texto}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-full">
              <label>Empresa</label>
              <input
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="btn-guardar">
            Guardar cliente
          </button>
        </form>
      </div>
    </section>
  );
}