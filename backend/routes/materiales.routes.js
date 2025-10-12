// backend/routes/materiales.routes.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ✅ Obtener todos los materiales
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM materiales");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    res.status(500).json({ message: "Error al obtener materiales" });
  }
});

// ✅ Actualizar cantidad (stock)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    await pool.query(
      "UPDATE materiales SET cantidad = cantidad + ? WHERE id = ?",
      [cantidad, id]
    );
    res.json({ message: "Stock actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    res.status(500).json({ message: "Error al actualizar stock" });
  }
});

export default router;



