import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import empleadosRoutes from "./routes/empleados.routes.js";
import camionesRoutes from "./routes/camiones.routes.js";



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
app.use("/api/camiones", camionesRoutes); // 👈 monta las rutas de camiones

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
