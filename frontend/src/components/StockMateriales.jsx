import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/StockMateriales.css";

export default function StockMateriales() {
  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarAgregar, setMostrarAgregar] = useState(null);
  const [cantidadAgregar, setCantidadAgregar] = useState("");

  const cargar = async () => {
    try {
      const res = await api.get("/api/materiales");
      setMateriales(res.data);
    } catch (err) {
      console.error(err);
      setError("❌ Error al obtener materiales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleAgregarClick = (id) => {
    setMostrarAgregar((prev) => (prev === id ? null : id));
    setCantidadAgregar("");
  };

  const handleConfirmarAgregar = async (id) => {
    if (!cantidadAgregar || isNaN(cantidadAgregar)) return alert("Ingresa un número válido");
    try {
      await api.put(`/api/materiales/${id}`, { cantidad: parseFloat(cantidadAgregar) });
      await cargar();
      setMostrarAgregar(null);
      setCantidadAgregar("");
    } catch {
      alert("❌ No se pudo actualizar el stock.");
    }
  };

  return (
    <section className="stock-container">
      <h2>Stock de Materiales</h2>
      <p className="stock-subtitle">Gestioná el inventario actual de materiales.</p>

      {loading ? (
        <p className="stock-msg">Cargando materiales...</p>
      ) : error ? (
        <p className="stock-error">{error}</p>
      ) : materiales.length === 0 ? (
        <p className="stock-msg">No hay materiales registrados.</p>
      ) : (
        <div className="tarjetas-stock">
          {materiales.map((m) => (
            <div key={m.id} className="tarjeta-material">
              <div className="tarjeta-header">
                <h3>{m.nombre}</h3>
                <p className="cantidad">Cantidad: <span>{m.cantidad}</span> {m.unidad_medida}</p>
              </div>

              <div className="tarjeta-botones">
                <button
                  className="btn-agregar-stock"
                  onClick={() => handleAgregarClick(m.id)}
                >
                  ➕ Agregar Stock
                </button>
              </div>

              {mostrarAgregar === m.id && (
                <div className="tarjeta-agregar">
                  <input
                    type="number"
                    placeholder={`Cantidad (${m.unidad_medida})`}
                    value={cantidadAgregar}
                    onChange={(e) => setCantidadAgregar(e.target.value)}
                  />
                  <div className="tarjeta-agregar-btns">
                    <button
                      className="btn-confirmar"
                      onClick={() => handleConfirmarAgregar(m.id)}
                    >
                      Confirmar
                    </button>
                    <button
                      className="btn-cancelar"
                      onClick={() => setMostrarAgregar(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}



