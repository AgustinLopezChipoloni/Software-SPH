import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/AgendaClientes.css";

export default function AgendaClientes({ onSeleccionar }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarClientes = async () => {
    try {
      const res = await api.get("/api/agendaclientes");
      setClientes(res.data);
    } catch (err) {
      console.error(err);
      setError("❌ Error al obtener los clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const clientesFiltrados = clientes.filter((c) => {
    const texto = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(texto) ||
      c.apellido.toLowerCase().includes(texto) ||
      (c.empresa && c.empresa.toLowerCase().includes(texto))
    );
  });

  return (
    <section className="agenda-container">
      <div className="agenda-header">
        <h2>Agenda de Clientes</h2>
        <input
          type="text"
          className="agenda-buscador"
          placeholder="🔍 Buscar cliente o empresa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="agenda-msg">Cargando clientes...</p>
      ) : error ? (
        <p className="agenda-error">{error}</p>
      ) : clientesFiltrados.length === 0 ? (
        <p className="agenda-msg">No hay clientes que coincidan con la búsqueda.</p>
      ) : (
        <div className="lista-clientes">
          {clientesFiltrados.map((c) => (
            <div
              key={c.id}
              className="tarjeta-cliente"
              onClick={() => onSeleccionar(c)}
            >
              <h3>{c.nombre} {c.apellido}</h3>
              <p><strong>Teléfono:</strong> {c.telefono || "-"}</p>
              <p><strong>Email:</strong> {c.email}</p>
              <p><strong>Empresa:</strong> {c.empresa || "Particular"}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}