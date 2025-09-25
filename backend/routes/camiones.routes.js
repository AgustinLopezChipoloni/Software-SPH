// backend/routes/asignaciones.routes.js
import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/**
 * GET /api/camiones
 * Lista todos los camiones
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, patente, marca, modelo, anio, capacidad_m3, activo, created_at
         FROM camiones
     ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar camiones" });
  }
});

/**
 * POST /api/camiones
 * Alta de camión
 * Body esperado: { patente, marca?, modelo?, anio?, capacidad_m3?, activo? }
 */
router.post("/", async (req, res) => {
  try {
    let { patente, marca, modelo, anio, capacidad_m3, activo = 1 } = req.body;

    // Validación básica
    if (!patente) {
      return res.status(400).json({ error: "La patente es obligatoria" });
    }

    // Normalizar patente (opcional): mayúsculas y sin espacios
    patente = String(patente).trim().toUpperCase();

    // Insert
    const [result] = await pool.query(
      `INSERT INTO camiones (patente, marca, modelo, anio, capacidad_m3, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        patente,
        marca || null,
        modelo || null,
        anio ? Number(anio) : null,
        capacidad_m3 ? Number(capacidad_m3) : null,
        activo ? 1 : 0,
      ]
    );

    // Devolver el creado
    const [rows] = await pool.query(
      `SELECT id, patente, marca, modelo, anio, capacidad_m3, activo, created_at
         FROM camiones
        WHERE id = ?`,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    if (e.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Ya existe un camión con esa patente" });
    }
    res.status(500).json({ error: "Error al crear camión" });
  }
});

/** Camiones para asignar (incluye ACTIVO) */
router.get("/camiones", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, patente, marca, modelo, activo
         FROM camiones
        ORDER BY patente`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar camiones" });
  }
});

/** Choferes (empleados con cargo CHOFER) */
router.get("/choferes", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.nombre, e.apellido, e.dni
         FROM empleados e
         JOIN cargos c ON c.id = e.id_cargo
        WHERE c.nombre = 'CHOFER' AND e.activo = 1
        ORDER BY e.apellido, e.nombre`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar choferes" });
  }
});

/** Listado de asignaciones por fecha */
router.get("/", async (req, res) => {
  try {
    const { fecha } = req.query; // YYYY-MM-DD
    const [rows] = await pool.query(
      `SELECT a.id, a.camion_id, a.chofer_id, a.hora_inicio, a.hora_fin, a.observaciones,
              c.patente, c.marca, c.modelo,
              e.apellido, e.nombre
         FROM asignaciones_diarias a
         JOIN camiones c ON c.id = a.camion_id
         JOIN empleados e ON e.id = a.chofer_id
        WHERE a.fecha = ?
        ORDER BY c.patente`,
      [fecha]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar asignaciones" });
  }
});

/** Crear asignación */
router.post("/", async (req, res) => {
  try {
    const {
      fecha,
      camion_id,
      chofer_id,
      hora_inicio,
      hora_fin,
      observaciones,
    } = req.body;
    await pool.query(
      `INSERT INTO asignaciones_diarias (fecha, camion_id, chofer_id, hora_inicio, hora_fin, observaciones)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fecha, camion_id, chofer_id, hora_inicio, hora_fin, observaciones]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Ese camión ya está asignado en esa fecha" });
    }
    console.error(e);
    res.status(500).json({ error: "Error al crear asignación" });
  }
});

/** Eliminar asignación */
router.delete("/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM asignaciones_diarias WHERE id = ?`, [
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al eliminar asignación" });
  }
});

export default router;
