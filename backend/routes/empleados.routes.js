import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/** GET /api/empleados → listar empleados (ahora incluye cargo) */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.nombre, e.apellido, e.dni, e.email, e.telefono,
              e.fecha_ingreso, e.activo, c.nombre AS cargo
         FROM empleados e
    LEFT JOIN cargos c ON c.id = e.id_cargo
     ORDER BY e.id DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar empleados" });
  }
});

/** POST /api/empleados → alta empleado (con cargo_nombre opcional) */
router.post("/", async (req, res) => {
  try {
    const { nombre, apellido, dni, email, telefono, fecha_ingreso, activo = 1, cargo_nombre } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !dni || !email || !fecha_ingreso) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // Resolver id_cargo si vino cargo_nombre (p. ej. "CHOFER")
    let cargoId = null;
    if (cargo_nombre) {
      const [cRows] = await pool.query(
        `SELECT id FROM cargos WHERE nombre = ? LIMIT 1`,
        [cargo_nombre]
      );
      cargoId = cRows[0]?.id || null;
      if (!cargoId) return res.status(400).json({ error: "Cargo inválido" });
    }

    // Insert
    const [result] = await pool.query(
      `INSERT INTO empleados (nombre, apellido, dni, email, telefono, fecha_ingreso, activo, id_cargo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, dni, email, telefono || null, fecha_ingreso, activo ? 1 : 0, cargoId]
    );

    // Devolver el creado
    const [rows] = await pool.query(
      `SELECT e.id, e.nombre, e.apellido, e.dni, e.email, e.telefono,
              e.fecha_ingreso, e.activo, c.nombre AS cargo
         FROM empleados e
    LEFT JOIN cargos c ON c.id = e.id_cargo
        WHERE e.id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    if (e.code === "ER_DUP_ENTRY") {
      const campo = e.sqlMessage?.includes("dni") ? "DNI" : "email";
      return res.status(409).json({ error: `Ya existe un empleado con ese ${campo}` });
    }
    res.status(500).json({ error: "Error al crear empleado" });
  }
});

export default router;
