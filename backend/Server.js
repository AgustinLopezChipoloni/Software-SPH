import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import empleadosRoutes from "./routes/empleados.routes.js";
import camionesRoutes from "./routes/camiones.routes.js";
import asistenciasRoutes from "./routes/asistencias.routes.js";
import asignacionesRoutes from "./routes/asignaciones.routes.js";
import materialesRoutes from "./routes/materiales.routes.js";
import clientesRoutes from "./routes/clientes.routes.js";
import agendaclientesRoutes from "./routes/agendaclientes.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Test DB al arrancar
(async () => {
  try {
    const c = await pool.getConnection();
    console.log("✅ Conectado a MySQL");
    c.release();
  } catch (e) {
    console.error("❌ Error MySQL:", e.message);
  }
})();

app.get("/", (req, res) => res.send("Servidor funcionando 🚀"));
app.use("/api/auth", authRoutes);
app.use("/api/empleados", empleadosRoutes);
app.use("/api/camiones", camionesRoutes);
app.use("/api/asistencias", asistenciasRoutes);
app.use("/api/asignaciones", asignacionesRoutes);
app.use("/api/materiales", materialesRoutes);
app.use("/api/Clientes", clientesRoutes);
app.use("/api/agendaclientes", agendaclientesRoutes);
app.use("/api/pedidos", pedidosRoutes);
/*
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
*/
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
