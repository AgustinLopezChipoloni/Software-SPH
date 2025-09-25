import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/**
 * Devuelve la fecha del servidor en formato YYYY-MM-DD.
 * Se usa para agrupar las asistencias por día laboral.
 */
function hoyYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Busca el turno del empleado (si tiene) para poder calcular
 * si llega "presente" o "tarde" según la hora de entrada y tolerancia.
 * Si no tiene turno asignado, devolvemos null (no se setea estado).
 */
async function calcularEstado(empleado_id) {
  const [rows] = await pool.query(
    `SELECT t.hora_inicio, t.tolerancia_min
       FROM empleados e
       LEFT JOIN turnos t ON t.id = e.id_turno
      WHERE e.id = ?`,
    [empleado_id]
  );
  const t = rows[0];
  if (!t?.hora_inicio) return null;
  return {
    hora_inicio: t.hora_inicio,
    tolerancia: Number(t.tolerancia_min || 0),
  };
}

/**
 * POST /api/asistencias/check-in
 * Body: { empleado_id }
 * - Inserta/actualiza la entrada del día.
 * - Si tiene turno, define estado 'presente' o 'tarde'.
 */
router.post("/check-in", async (req, res) => {
  try {
    const { empleado_id } = req.body;
    if (!empleado_id)
      return res.status(400).json({ error: "Falta empleado_id" });

    const fecha = hoyYYYYMMDD();
    const now = new Date();

    const turno = await calcularEstado(empleado_id);

    if (turno) {
      // Insert/Update con cálculo de estado
      await pool.query(
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
      // Sin turno: solo grabamos check_in, sin estado
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

/**
 * POST /api/asistencias/check-out
 * Body: { empleado_id }
 * - Inserta/actualiza la salida del día.
 */
router.post("/check-out", async (req, res) => {
  try {
    const { empleado_id } = req.body;
    if (!empleado_id)
      return res.status(400).json({ error: "Falta empleado_id" });

    const fecha = hoyYYYYMMDD();
    const now = new Date();

    await pool.query(
      `
      INSERT INTO asistencias (empleado_id, fecha, check_out, metodo)
      VALUES (?, ?, ?, 'manual')
      ON DUPLICATE KEY UPDATE
        check_out = VALUES(check_out)
      `,
      [empleado_id, fecha, now]
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error al marcar salida" });
  }
});

/**
 * GET /api/asistencias/hoy
 * - Devuelve asistencias de la fecha actual con datos del empleado.
 */
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

/**
 * GET /api/asistencias/by-date?date=YYYY-MM-DD
 * - Idéntico a /hoy pero para una fecha concreta.
 */
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

/**
 * POST /api/asistencias/qr
 * Body: { uid: "qr_uid_del_empleado" }
 * - Si no hay registro hoy → inserta check_in (y estado si hay turno).
 * - Si hay check_in sin check_out → setea salida.
 * - Si ya tiene ambos → responde "completo".
 */
router.post("/qr", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "Falta uid" });

    // Buscar empleado activo por qr_uid
    const [empRows] = await pool.query(
      `SELECT id, nombre, apellido, dni, activo
         FROM empleados
        WHERE qr_uid = ? LIMIT 1`,
      [uid]
    );
    if (empRows.length === 0) {
      return res
        .status(404)
        .json({ error: "QR no asociado a ningún empleado" });
    }
    const emp = empRows[0];
    if (!emp.activo) {
      return res.status(400).json({ error: "Empleado inactivo" });
    }

    // Traer asistencia del día si existe
    const [asisRows] = await pool.query(
      `SELECT id, check_in, check_out
         FROM asistencias
        WHERE empleado_id = ? AND fecha = CURDATE()
        LIMIT 1`,
      [emp.id]
    );

    let accion = "entrada";
    let check_in = null;
    let check_out = null;

    if (asisRows.length === 0) {
      // Primera marcación del día → check_in
      const turno = await calcularEstado(emp.id);
      if (turno) {
        await pool.query(
          `
          INSERT INTO asistencias (empleado_id, fecha, check_in, estado, metodo)
          VALUES (?, CURDATE(), NOW(),
            CASE 
              WHEN TIME(NOW()) > ADDTIME(?, SEC_TO_TIME(? * 60)) THEN 'tarde'
              ELSE 'presente'
            END,
            'qr'
          )
          `,
          [emp.id, turno.hora_inicio, turno.tolerancia]
        );
      } else {
        await pool.query(
          `INSERT INTO asistencias (empleado_id, fecha, check_in, metodo)
           VALUES (?, CURDATE(), NOW(), 'qr')`,
          [emp.id]
        );
      }
      const [[row]] = await pool.query(
        `SELECT check_in, check_out FROM asistencias WHERE empleado_id=? AND fecha=CURDATE() LIMIT 1`,
        [emp.id]
      );
      check_in = row.check_in;
      check_out = row.check_out;
      accion = "entrada";
    } else {
      // Ya había registro hoy
      const a = asisRows[0];

      if (!a.check_in) {
        // Si por algún motivo tenía registro sin check_in (raro), lo completamos
        await pool.query(
          `UPDATE asistencias SET check_in=NOW(), estado='presente', metodo='qr' WHERE id=?`,
          [a.id]
        );
        accion = "entrada";
      } else if (!a.check_out) {
        // Tenía entrada, completamos la salida
        await pool.query(
          `UPDATE asistencias SET check_out=NOW(), metodo='qr' WHERE id=?`,
          [a.id]
        );
        accion = "salida";
      } else {
        // Ya tenía ambos → no tocamos nada
        accion = "completo";
      }

      const [[row]] = await pool.query(
        `SELECT check_in, check_out FROM asistencias WHERE id=?`,
        [a.id]
      );
      check_in = row?.check_in || null;
      check_out = row?.check_out || null;
    }

    // Respuesta estándar para el frontend
    res.json({
      ok: true,
      msg:
        accion === "entrada"
          ? "Entrada registrada"
          : accion === "salida"
          ? "Salida registrada"
          : "Asistencia ya completa",
      accion,
      empleado: {
        id: emp.id,
        nombre: emp.nombre,
        apellido: emp.apellido,
        dni: emp.dni,
      },
      check_in,
      check_out,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al marcar asistencia por QR" });
  }
});

export default router;
