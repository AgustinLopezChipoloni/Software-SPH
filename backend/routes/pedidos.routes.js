import express from "express";
import { pool } from "../db.js";

const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const {
      cliente_id,
      nombre_cliente,
      apellido_cliente,
      empresa,
      m3,
      fecha_entrega,
      observacion,
    } = req.body;

    if (!cliente_id || !nombre_cliente || !apellido_cliente || !m3 || !fecha_entrega) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    await pool.query(
      `INSERT INTO pedidos 
      (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [cliente_id, nombre_cliente, apellido_cliente, empresa || null, m3, fecha_entrega, observacion || null]
    );

    res.json({ message: "✅ Pedido agendado correctamente" });
  } catch (error) {
    console.error("Error al agendar pedido:", error);
    res.status(500).json({ message: "Error al agendar pedido" });
  }
});


router.get("/activos", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM pedidos WHERE activo = 1 ORDER BY fecha_agendado DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener pedidos activos:", error);
    res.status(500).json({ message: "Error al obtener pedidos activos" });
  }
});


router.put("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body; // 1 o 0
    await pool.query("UPDATE pedidos SET activo = ? WHERE id = ?", [activo, id]);
    res.json({ message: "✅ Estado del pedido actualizado" });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ message: "Error al actualizar estado del pedido" });
  }
});

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM pedidos ORDER BY fecha_agendado DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
});

export default router;