import { Router } from "express";
import { pool } from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

/** GET /api/empleados -> lista (incluye cargo) */
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

/** POST /api/empleados -> alta (acepta cargo_nombre opcional) */
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

    if (!nombre || !apellido || !dni || !email || !fecha_ingreso) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // resolver id_cargo si vino cargo_nombre
    let cargoId = null;
    if (cargo_nombre) {
      const [cRows] = await pool.query(
        `SELECT id FROM cargos WHERE nombre = ? LIMIT 1`,
        [cargo_nombre]
      );
      cargoId = cRows[0]?.id || null;
      if (!cargoId) return res.status(400).json({ error: "Cargo inválido" });
    }

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

/** PATCH /api/empleados/:id -> actualizar teléfono y/o cargo_nombre */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { telefono, cargo_nombre } = req.body;

    const sets = [];
    const vals = [];

    if (telefono !== undefined) {
      sets.push("telefono = ?");
      vals.push(telefono);
    }

    if (cargo_nombre !== undefined) {
      let cargoId = null;
      if (cargo_nombre) {
        const [cRows] = await pool.query(
          `SELECT id FROM cargos WHERE nombre = ? LIMIT 1`,
          [cargo_nombre]
        );
        cargoId = cRows[0]?.id || null;
        if (!cargoId) return res.status(400).json({ error: "Cargo inválido" });
      }
      sets.push("id_cargo = ?");
      vals.push(cargoId);
    }

    if (!sets.length)
      return res.status(400).json({ error: "Nada para actualizar" });

    vals.push(id);
    await pool.query(
      `UPDATE empleados SET ${sets.join(", ")} WHERE id = ?`,
      vals
    );

    const [rows] = await pool.query(
      `SELECT e.id, e.nombre, e.apellido, e.dni, e.email, e.telefono,
              e.fecha_ingreso, e.activo, c.nombre AS cargo
         FROM empleados e
    LEFT JOIN cargos c ON c.id = e.id_cargo
        WHERE e.id = ?`,
      [id]
    );

    if (!rows[0])
      return res.status(404).json({ error: "Empleado no encontrado" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar empleado" });
  }
});

/** DELETE /api/empleados/:id -> eliminar empleado */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [r] = await pool.query(`DELETE FROM empleados WHERE id = ?`, [id]);
    if (r.affectedRows === 0)
      return res.status(404).json({ error: "Empleado no encontrado" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo eliminar el empleado" });
  }
});

/** POST /api/empleados/:id/qr -> genera o devuelve QR UID */
router.post("/:id/qr", async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === "1";

    const [rows] = await pool.query(
      "SELECT id, nombre, apellido, dni, email, qr_uid FROM empleados WHERE id = ?",
      [id]
    );
    if (!rows.length)
      return res.status(404).json({ error: "Empleado no encontrado" });

    const emp = rows[0];

    if (!emp.qr_uid || force) {
      const nuevo = uuidv4();
      await pool.query("UPDATE empleados SET qr_uid = ? WHERE id = ?", [
        nuevo,
        id,
      ]);
      emp.qr_uid = nuevo;
    }
    res.json({ ok: true, empleado: emp });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo generar/obtener el QR" });
  }
});

export default router;
