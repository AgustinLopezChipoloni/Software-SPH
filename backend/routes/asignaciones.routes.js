import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

function hoyYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Helpers para combos:
 * - Choferes activos (empleados con cargo CHOFER)
 * - Camiones activos
 */
router.get("/choferes", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT e.id, e.nombre, e.apellido, e.dni
      FROM empleados e
      JOIN cargos c ON c.id = e.id_cargo
      WHERE e.activo = 1 AND c.nombre = 'CHOFER'
      ORDER BY e.apellido, e.nombre
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar choferes" });
  }
});

router.get("/camiones", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, patente, marca, modelo, capacidad_m3
      FROM camiones
      WHERE activo = 1
      ORDER BY patente
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar camiones" });
  }
});

/** GET /api/asignaciones?fecha=YYYY-MM-DD  (default: hoy) */
router.get("/", async (req, res) => {
  try {
    const fecha = req.query.fecha || hoyYYYYMMDD();
    const [rows] = await pool.query(
      `
      SELECT a.id, a.fecha, a.camion_id, a.chofer_id, a.hora_inicio, a.hora_fin, a.observaciones,
             ca.patente, ca.marca, ca.modelo,
             e.nombre, e.apellido, e.dni
      FROM asignaciones_diarias a
      JOIN camiones ca ON ca.id = a.camion_id
      JOIN empleados e ON e.id = a.chofer_id
      WHERE a.fecha = ?
      ORDER BY ca.patente
      `,
      [fecha]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al listar asignaciones" });
  }
});

/**
 * POST /api/asignaciones
 * body: { fecha, camion_id, chofer_id, hora_inicio?, hora_fin?, observaciones? }
 */
router.post("/", async (req, res) => {
  try {
    let { fecha, camion_id, chofer_id, hora_inicio, hora_fin, observaciones } =
      req.body;
    fecha = fecha || hoyYYYYMMDD();
    if (!camion_id || !chofer_id) {
      return res
        .status(400)
        .json({ error: "Faltan datos: camion_id y chofer_id" });
    }

    // Validaciones básicas: camión activo, chofer activo y con cargo CHOFER
    const [[camion]] = await pool.query(
      `SELECT id, activo FROM camiones WHERE id = ?`,
      [camion_id]
    );
    if (!camion) return res.status(400).json({ error: "Camión inexistente" });
    if (!camion.activo)
      return res.status(400).json({ error: "Camión no activo (avería/baja)" });

    const [[chofer]] = await pool.query(
      `
      SELECT e.id, e.activo, c.nombre AS cargo
      FROM empleados e
      JOIN cargos c ON c.id = e.id_cargo
      WHERE e.id = ?
    `,
      [chofer_id]
    );
    if (!chofer) return res.status(400).json({ error: "Chofer inexistente" });
    if (!chofer.activo)
      return res.status(400).json({ error: "Chofer inactivo" });
    if (chofer.cargo !== "CHOFER")
      return res.status(400).json({ error: "El empleado no es CHOFER" });

    // Insert con UNIQUE(fecha, camion_id): evita duplicar camión el mismo día
    await pool.query(
      `
      INSERT INTO asignaciones_diarias
        (fecha, camion_id, chofer_id, hora_inicio, hora_fin, observaciones)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        fecha,
        camion_id,
        chofer_id,
        hora_inicio || null,
        hora_fin || null,
        observaciones || null,
      ]
    );

    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    if (e.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Ese camión ya está asignado en esa fecha" });
    }
    res.status(500).json({ error: "Error al crear asignación" });
  }
});

/** PATCH /api/asignaciones/:id  (editar hora_inicio, hora_fin, chofer, obs; no se edita fecha/camión en este ejemplo) */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { chofer_id, hora_inicio, hora_fin, observaciones } = req.body;

    // Si cambia chofer, validar que sea CHOFER activo
    if (chofer_id) {
      const [[ch]] = await pool.query(
        `
        SELECT e.id, e.activo, c.nombre AS cargo
        FROM empleados e
        JOIN cargos c ON c.id = e.id_cargo
        WHERE e.id = ?
      `,
        [chofer_id]
      );
      if (!ch) return res.status(400).json({ error: "Chofer inexistente" });
      if (!ch.activo) return res.status(400).json({ error: "Chofer inactivo" });
      if (ch.cargo !== "CHOFER")
        return res.status(400).json({ error: "El empleado no es CHOFER" });
    }

    await pool.query(
      `
      UPDATE asignaciones_diarias
      SET chofer_id = COALESCE(?, chofer_id),
          hora_inicio = COALESCE(?, hora_inicio),
          hora_fin = COALESCE(?, hora_fin),
          observaciones = COALESCE(?, observaciones)
      WHERE id = ?
      `,
      [
        chofer_id || null,
        hora_inicio || null,
        hora_fin || null,
        observaciones || null,
        id,
      ]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al actualizar asignación" });
  }
});

/** DELETE /api/asignaciones/:id  (anula la asignación del día) */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM asignaciones_diarias WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al eliminar asignación" });
  }
});

export default router;
