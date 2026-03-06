import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/AgendaClientes.css";

export default function AgendaClientes({ onSeleccionar }) {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ paginación simple
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

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

  // ✅ cuando cambia la búsqueda, volver a página 1
  useEffect(() => {
    setPagina(1);
  }, [busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);

  const inicio = (paginaSegura - 1) * porPagina;
  const clientesPagina = clientesFiltrados.slice(inicio, inicio + porPagina);

  return (
    <section className="agenda-container">
      <div className="agenda-header">
        <h2>Agenda de Clientes</h2>
        <input
          type="text"
          className="agenda-buscador"
          placeholder=" Buscar cliente o empresa..."
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
        <>
          <div className="lista-clientes lista-clientes--lista">
            {/* ✅ Encabezado SIEMPRE visible */}
            <div className="cliente-fila cliente-fila--head">
              <div className="cliente-col cliente-col--nombre">Cliente</div>
              <div className="cliente-col cliente-col--empresa">Empresa</div>
              <div className="cliente-col cliente-col--tel">Teléfono</div>
              <div className="cliente-col cliente-col--email">Email</div>
            </div>

            {/* ✅ Filas paginadas */}
            {clientesPagina.map((c) => (
              <div
                key={c.id}
                className="cliente-fila"
                onClick={() => onSeleccionar(c)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSeleccionar(c);
                }}
              >
                <div className="cliente-col cliente-col--nombre">
                  <div className="cliente-nombre">
                    {c.nombre} {c.apellido}
                  </div>
                </div>

                <div className="cliente-col cliente-col--empresa">
                  <span className="cliente-chip">{c.empresa || "Particular"}</span>
                </div>

                <div className="cliente-col cliente-col--tel">{c.telefono || "-"}</div>

                <div className="cliente-col cliente-col--email">{c.email}</div>
              </div>
            ))}
          </div>

          {/* ✅ paginación simple */}
          {clientesFiltrados.length > porPagina && (
            <div className="paginacion-simple">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaSegura === 1}
              >
                ← Anterior
              </button>

              <span>
                Página {paginaSegura} de {totalPaginas}
              </span>

              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaSegura === totalPaginas}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}