// SPH-BACK/routes/auth.js
import express from "express";
import pool from "../db.js"; // lo vamos a crear en el próximo paso
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE username = ? AND estado = 'activo'",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    const usuario = rows[0];

    // Comparar contraseña
    const esValido = await bcrypt.compare(password, usuario.password_hash);

    if (!esValido) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.id_rol },
      "secreto123", // en producción debería ir en process.env.JWT_SECRET
      { expiresIn: "2h" }
    );

    res.json({ message: "Login exitoso", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

export default router;
