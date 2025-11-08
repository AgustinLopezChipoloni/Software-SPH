import { useState, useEffect } from "react";
import { api } from "../services/api";
import "../styles/HistorialPedidos.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function HistorialPedidos({ onVolver }) {
  const [pedidos, setPedidos] = useState([]);

  const cargar = async () => {
    const { data } = await api.get("/api/pedidos");
    setPedidos(data.filter((p) => Number(p.activo) === 0));
  };

  useEffect(() => {
    cargar();
  }, []);

  const totales = pedidos.reduce((acc, p) => {
    const fecha = new Date(p.fecha_entrega).toLocaleDateString("es-AR");
    acc[fecha] = (acc[fecha] || 0) + 1;
    return acc;
  }, {});

  const labels = Object.keys(totales);
  const values = Object.values(totales);

  const data = {
    labels,
    datasets: [
      {
        label: "Pedidos por día",
        data: values,
        backgroundColor: "#d80808ff",
      },
    ],
  };

  const exportarExcel = () => {
    const hoja = pedidos.map((p) => ({
      Cliente: `${p.nombre_cliente} ${p.apellido_cliente}`,
      Empresa: p.empresa || "—",
      "m³": p.m3,
      Fecha: new Date(p.fecha_entrega).toLocaleDateString("es-AR"),
      Observación: p.observacion || "—",
    }));

    const libro = XLSX.utils.book_new();
    const hojaExcel = XLSX.utils.json_to_sheet(hoja);
    XLSX.utils.book_append_sheet(libro, hojaExcel, "Historial");

    XLSX.writeFile(libro, "historial-pedidos.xlsx");
  };

  return (
    <section className="historial-page">
      <button className="btn-volver" onClick={onVolver}>
        ← Volver al Dashboard
      </button>

      <h2>Historial de pedidos entregados</h2>

      <div className="chart-box">
        <Bar data={data} height={80} />
      </div>

      <div className="tabla-box">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Empresa</th>
              <th>m³</th>
              <th>Fecha</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre_cliente} {p.apellido_cliente}</td>
                <td>{p.empresa || "—"}</td>
                <td>{p.m3}</td>
                <td>{new Date(p.fecha_entrega).toLocaleDateString("es-AR")}</td>
                <td>{p.observacion || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="btn-excel" onClick={exportarExcel}>
          Descargar Excel
        </button>
      </div>
    </section>
  );
}