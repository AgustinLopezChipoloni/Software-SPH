// backend/routes/empleados.routes.js
import { Router } from "express";
import { pool } from "../db.js";
import { v4 as uuidv4 } from "uuid"; // ⬅️ agregado arriba (import único)

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
    const {
      nombre,
      apellido,
      dni,
      email,
      telefono,
      fecha_ingreso,
      activo = 1,
      cargo_nombre,
    } = req.body;

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
      [
        nombre,
        apellido,
        dni,
        email,
        telefono || null,
        fecha_ingreso,
        activo ? 1 : 0,
        cargoId,
      ]
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
      return res
        .status(409)
        .json({ error: `Ya existe un empleado con ese ${campo}` });
    }
    res.status(500).json({ error: "Error al crear empleado" });
  }
});

/**
 * POST /api/empleados/:id/qr  → genera o devuelve el QR UID
 * - Si ya tiene qr_uid y NO viene force=1 → NO regenera, devuelve el actual.
 * - Si no tiene qr_uid o viene force=1 → genera uno nuevo y lo guarda.
 * Respuesta: { ok:true, empleado:{ id, nombre, apellido, dni, email, qr_uid } }
 */
router.post("/:id/qr", async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === "1"; // ?force=1 para forzar regeneración

    // Traemos datos del empleado, incluyendo qr_uid actual
    const [rows] = await pool.query(
      "SELECT id, nombre, apellido, dni, email, qr_uid FROM empleados WHERE id=?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Empleado no encontrado" });
    }

    const emp = rows[0];

    // Si NO hay qr_uid o forzás regeneración → generamos uno nuevo.
    if (!emp.qr_uid || force) {
      const nuevo = uuidv4();
      await pool.query("UPDATE empleados SET qr_uid=? WHERE id=?", [nuevo, id]);
      emp.qr_uid = nuevo;
    }

    return res.json({ ok: true, empleado: emp });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo generar/obtener el QR" });
  }
});

export default router;
