import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/** GET /api/empleados  → listar empleados */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, apellido, dni, email, telefono, fecha_ingreso, activo
       FROM empleados
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar empleados" });
  }
});

/** POST /api/empleados  → alta empleado */
router.post("/", async (req, res) => {
  try {
    const { nombre, apellido, dni, email, telefono, fecha_ingreso, activo = 1 } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !dni || !email || !fecha_ingreso) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Insert
    const [result] = await pool.query(
      `INSERT INTO empleados (nombre, apellido, dni, email, telefono, fecha_ingreso, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, dni, email, telefono || null, fecha_ingreso, activo ? 1 : 0]
    );

    const [rows] = await pool.query(
      `SELECT id, nombre, apellido, dni, email, telefono, fecha_ingreso, activo
       FROM empleados WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    // Uniques de email/dni
    if (e.code === "ER_DUP_ENTRY") {
      const campo = e.sqlMessage?.includes("dni") ? "DNI" : "email";
      return res.status(409).json({ error: `Ya existe un empleado con ese ${campo}` });
    }
    res.status(500).json({ error: "Error al crear empleado" });
  }
});

export default router;
