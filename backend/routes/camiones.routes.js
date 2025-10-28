// backend/routes/camiones.routes.js
import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/** GET /api/camiones */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, patente, marca, modelo, anio, capacidad_m3, activo, created_at
         FROM camiones
     ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error al listar camiones" });
  }
});

/** POST /api/camiones */
router.post("/", async (req, res) => {
  try {
    let { patente, marca, modelo, anio, capacidad_m3, activo = 1 } = req.body;
    if (!patente)
      return res.status(400).json({ error: "La patente es obligatoria" });
    patente = String(patente).trim().toUpperCase();

    const [r] = await pool.query(
      `INSERT INTO camiones (patente, marca, modelo, anio, capacidad_m3, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        patente,
        marca || null,
        modelo || null,
        anio || null,
        capacidad_m3 || null,
        activo ? 1 : 0,
      ]
    );

    const [[row]] = await pool.query(
      `SELECT id, patente, marca, modelo, anio, capacidad_m3, activo, created_at
         FROM camiones WHERE id=?`,
      [r.insertId]
    );
    res.status(201).json(row);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY")
      return res
        .status(409)
        .json({ error: "Ya existe un camión con esa patente" });
    res.status(500).json({ error: "Error al crear camión" });
  }
});

/** PATCH /api/camiones/:id  -> actualizar activo (1/0) */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    if (activo === undefined)
      return res.status(400).json({ error: "Nada para actualizar" });

    await pool.query(`UPDATE camiones SET activo=? WHERE id=?`, [
      activo ? 1 : 0,
      id,
    ]);

    const [[row]] = await pool.query(
      `SELECT id, patente, marca, modelo, anio, capacidad_m3, activo FROM camiones WHERE id=?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: "Camión no encontrado" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Error al actualizar camión" });
  }
});

/** DELETE /api/camiones/:id  -> elimina camión */
router.delete("/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM camiones WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    // Si está referenciado por asignaciones, avisamos
    if (e.code === "ER_ROW_IS_REFERENCED_2")
      return res.status(409).json({
        error: "No se puede eliminar: tiene asignaciones. Marcá Inactivo.",
      });
    res.status(500).json({ error: "Error al eliminar camión" });
  }
});

export default router;
