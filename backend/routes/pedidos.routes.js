import express from "express";
import { pool } from "../db.js";

const router = express.Router();


router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
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

    const metros = parseFloat(m3);

    // Fórmula por m³
    const consumo = {
      cemento: 200 * metros,
      piedra: 1100 * metros,
      arena: 900 * metros,
      agua: 100 * metros,
    };

    await conn.beginTransaction();

    // 1️⃣ Insertar pedido
    await conn.query(
      `INSERT INTO pedidos 
      (cliente_id, nombre_cliente, apellido_cliente, empresa, m3, fecha_entrega, observacion, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [cliente_id, nombre_cliente, apellido_cliente, empresa || null, metros, fecha_entrega, observacion || null]
    );

    // 2️⃣ Obtener stock actual
    const [materiales] = await conn.query("SELECT * FROM materiales");

    const map = {};
    materiales.forEach(m => {
      map[m.nombre.toLowerCase()] = m;
    });

    // Verificaciones de stock
    if (!map["cemento"] || map["cemento"].cantidad < consumo.cemento)
      throw new Error("No hay suficiente cemento");

    if (!map["piedra"] || map["piedra"].cantidad < consumo.piedra)
      throw new Error("No hay suficiente piedra");

    if (!map["arena"] || map["arena"].cantidad < consumo.arena)
      throw new Error("No hay suficiente arena");

    if (!map["agua"] || map["agua"].cantidad < consumo.agua)
      throw new Error("No hay suficiente agua");

    // 3️⃣ Descontar materiales
    await conn.query(
      "UPDATE materiales SET cantidad = cantidad - ? WHERE nombre = 'Cemento'",
      [consumo.cemento]
    );

    await conn.query(
      "UPDATE materiales SET cantidad = cantidad - ? WHERE nombre = 'Piedra'",
      [consumo.piedra]
    );

    await conn.query(
      "UPDATE materiales SET cantidad = cantidad - ? WHERE nombre = 'Arena'",
      [consumo.arena]
    );

    await conn.query(
      "UPDATE materiales SET cantidad = cantidad - ? WHERE nombre = 'Agua'",
      [consumo.agua]
    );

    await conn.commit();

    res.json({ message: "✅ Pedido agendado y stock actualizado correctamente" });

  } catch (error) {
    console.error("Error al agendar pedido:", error);
    if (conn) await conn.rollback();
    res.status(500).json({ message: error.message || "Error al agendar pedido" });
  } finally {
    if (conn) conn.release();
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