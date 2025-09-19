import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/**
 * Normaliza la fecha del servidor (sin hora) para usar como “día laboral”
 */
function hoyYYYYMMDD() {
  const d = new Date();
  // Tomamos fecha local del server (ajustá si querés TZ distinta)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calcula el estado (presente/tarde) si el empleado tiene turno asignado.
 * - Si no hay turno → estado queda null y lo puede ajustar un supervisor si quiere.
 */
async function calcularEstado(empleado_id) {
  // Buscamos hora_inicio + tolerancia (si el empleado tiene turno)
  const [rows] = await pool.query(
    `SELECT t.hora_inicio, t.tolerancia_min
       FROM empleados e
       LEFT JOIN turnos t ON t.id = e.id_turno
      WHERE e.id = ?`,
    [empleado_id]
  );

  const t = rows[0];
  if (!t?.hora_inicio) return null; // sin turno asignado

  // Minutos de tolerancia
  const tolerancia = Number(t.tolerancia_min || 0);

  // Si check_in > (hora_inicio + tolerancia) => tarde
  // Esto lo vamos a evaluar en SQL al momento de grabar.
  return { hora_inicio: t.hora_inicio, tolerancia };
}

/** POST /api/asistencias/check-in  { empleado_id } */
router.post("/check-in", async (req, res) => {
  try {
    const { empleado_id } = req.body;
    if (!empleado_id)
      return res.status(400).json({ error: "Falta empleado_id" });

    const fecha = hoyYYYYMMDD();
    const now = new Date();

    // Intentamos calcular estado si tiene turno
    const turno = await calcularEstado(empleado_id);

    if (turno) {
      // Insert / update con cálculo de estado (presente/tarde)
      const [result] = await pool.query(
        `
        INSERT INTO asistencias (empleado_id, fecha, check_in, estado, metodo)
        VALUES (?, ?, ?, 
          CASE 
            WHEN TIME(?) > ADDTIME(?, SEC_TO_TIME(? * 60)) THEN 'tarde'
            ELSE 'presente'
          END,
          'manual'
        )
        ON DUPLICATE KEY UPDATE
          check_in = IF(check_in IS NULL, VALUES(check_in), check_in),
          estado = IF(estado IS NULL,
            CASE 
              WHEN TIME(?) > ADDTIME(?, SEC_TO_TIME(? * 60)) THEN 'tarde'
              ELSE 'presente'
            END,
            estado
          ),
          metodo = 'manual'
        `,
        [
          empleado_id,
          fecha,
          now,
          now,
          turno.hora_inicio,
          turno.tolerancia,
          now,
          turno.hora_inicio,
          turno.tolerancia,
        ]
      );
      return res.json({ ok: true });
    } else {
      // Sin turno: grabamos sin estado (queda a revisión si querés)
      await pool.query(
        `
        INSERT INTO asistencias (empleado_id, fecha, check_in, metodo)
        VALUES (?, ?, ?, 'manual')
        ON DUPLICATE KEY UPDATE
          check_in = IF(check_in IS NULL, VALUES(check_in), check_in),
          metodo = 'manual'
        `,
        [empleado_id, fecha, now]
      );
      return res.json({ ok: true });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error al marcar entrada" });
  }
});

/** POST /api/asistencias/check-out  { empleado_id } */
router.post("/check-out", async (req, res) => {
  try {
    const { empleado_id } = req.body;
    if (!empleado_id)
      return res.status(400).json({ error: "Falta empleado_id" });

    const fecha = hoyYYYYMMDD();
    const now = new Date();

    // Debe existir el registro del día (por check-in). Si no existe, lo creamos igual.
    await pool.query(
      `
      INSERT INTO asistencias (empleado_id, fecha, check_out, metodo)
      VALUES (?, ?, ?, 'manual')
      ON DUPLICATE KEY UPDATE
        check_out = VALUES(check_out)   -- siempre actualizamos la salida
      `,
      [empleado_id, fecha, now]
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error al marcar salida" });
  }
});

/** GET /api/asistencias/hoy  -> listado hoy con nombre empleado */
router.get("/hoy", async (_req, res) => {
  try {
    const fecha = hoyYYYYMMDD();
    const [rows] = await pool.query(
      `
      SELECT a.id, a.empleado_id, a.fecha, a.check_in, a.check_out, a.estado, a.metodo,
             e.nombre, e.apellido, e.dni
        FROM asistencias a
        JOIN empleados e ON e.id = a.empleado_id
       WHERE a.fecha = ?
       ORDER BY COALESCE(a.check_in, a.created_at) ASC
      `,
      [fecha]
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "Error al listar asistencias de hoy" });
  }
});

/** GET /api/asistencias/by-date?date=YYYY-MM-DD */
router.get("/by-date", async (req, res) => {
  try {
    const fecha = req.query.date;
    if (!fecha)
      return res.status(400).json({ error: "Falta date (YYYY-MM-DD)" });

    const [rows] = await pool.query(
      `
      SELECT a.id, a.empleado_id, a.fecha, a.check_in, a.check_out, a.estado, a.metodo,
             e.nombre, e.apellido, e.dni
        FROM asistencias a
        JOIN empleados e ON e.id = a.empleado_id
       WHERE a.fecha = ?
       ORDER BY COALESCE(a.check_in, a.created_at) ASC
      `,
      [fecha]
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error al listar asistencias" });
  }
});

export default router;
