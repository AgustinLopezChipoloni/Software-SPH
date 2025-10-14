// backend/routes/clientes.routes.js
import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM clientes ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, apellido, telefono, email, empresa } = req.body;

    if (!nombre || !apellido || !email) {
      return res
        .status(400)
        .json({ message: "Los campos nombre, apellido y email son obligatorios" });
    }

    await pool.query(
      "INSERT INTO clientes (nombre, apellido, telefono, email, empresa) VALUES (?, ?, ?, ?, ?)",
      [nombre, apellido, telefono || null, email, empresa || null]
    );

    res.json({ message: "Cliente guardado correctamente" });
  } catch (error) {
    console.error("Error al guardar cliente:", error);
    res.status(500).json({ message: "Error al guardar cliente" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM clientes WHERE id = ?", [id]);
    res.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
});

export default router;