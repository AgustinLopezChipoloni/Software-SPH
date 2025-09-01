import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../db.js";

const router = Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Faltan credenciales" });

    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.password_hash, u.id_rol, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.id_rol
       WHERE u.username = ? AND u.estado = 'activo'
       LIMIT 1`,
      [username]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: "Usuario o contraseña inválidos" });

    const user = rows[0];

    // Soporta clave plana (arranque) o hasheada con bcrypt (producción)
    let ok;
    if (user.password_hash?.startsWith("$2")) {
      ok = await bcrypt.compare(password, user.password_hash);
    } else {
      ok = password === user.password_hash;
    }

    if (!ok) return res.status(401).json({ error: "Usuario o contraseña inválidos" });

    // 👇 Sin JWT: devolvemos ok + datos básicos del usuario
    return res.json({
      ok: true,
      user: { id: user.id, username: user.username, rol: user.rol },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Error interno" });
  }
});

export default router;
