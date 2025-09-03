// backend/routes/camiones.routes.js
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
      return res.status(409).json({ error: "Ya existe un camión con esa patente" });
    }
    res.status(500).json({ error: "Error al crear camión" });
  }
});

export default router;
