import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/Pedidos.css";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

  
  const cargarPedidos = async () => {
    try {
      const res = await api.get("/api/pedidos/activos");
      setPedidos(res.data);
    } catch (err) {
      console.error(err);
      setError("❌ Error al obtener los pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const toggleExpandir = (id) => {
    setPedidoExpandido(pedidoExpandido === id ? null : id);
  };

  const marcarEntregado = async (id) => {
    try {
      await api.put(`/api/pedidos/${id}/estado`, { activo: 0 });
      
      setPedidos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("❌ No se pudo actualizar el pedido.");
    }
  };

  return (
    <section className="pedidos-container">
      <h2>Pedidos Activos</h2>
      <p className="pedidos-subtitle">Listado de pedidos pendientes de entrega</p>

      {loading ? (
        <p className="pedidos-msg">Cargando pedidos...</p>
      ) : error ? (
        <p className="pedidos-error">{error}</p>
      ) : pedidos.length === 0 ? (
        <p className="pedidos-msg">No hay pedidos activos.</p>
      ) : (
        <div className="lista-pedidos">
          {pedidos.map((p) => (
            <div
              key={p.id}
              className={`tarjeta-pedido ${
                pedidoExpandido === p.id ? "expandido" : ""
              }`}
              onClick={() => toggleExpandir(p.id)}
            >
              <div className="pedido-header">
                <h3>
                  {p.nombre_cliente} {p.apellido_cliente}
                </h3>
                <p>
                  <strong>Empresa:</strong> {p.empresa || "Particular"}
                </p>
                <p>
                  <strong>Volumen:</strong> {p.m3} m³
                </p>
              </div>

              {pedidoExpandido === p.id && (
                <div className="pedido-detalle">
                  <p>
                    <strong>Observación:</strong>{" "}
                    {p.observacion || "Sin observaciones"}
                  </p>
                  <button
                    className="btn-entregado"
                    onClick={(e) => {
                      e.stopPropagation();
                      marcarEntregado(p.id);
                    }}
                  >
                    Entregado
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}