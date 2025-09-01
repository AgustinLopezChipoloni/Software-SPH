import { useState } from "react";
import { api } from "../services/api";
import "../styles/Login.css";   // 👈 importamos desde styles

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { username, password });
      if (data.ok) onLogin?.(data.user);
      else setError("Usuario o contraseña inválidos");
    } catch (e) {
      setError(e?.response?.data?.error || "Error de login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">SIGPH</div>
          <h2 className="login-title">Ingresá</h2>
          <p className="login-subtitle">
            Sistema Integral de Gestión para Plantas Hormigoneras
          </p>
        </div>

        <form className="login-form" onSubmit={submit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              required
            />
          </div>

{error && (
  <div className="alert-error" role="alert">
    {error}
  </div>
)}


          <button
            className="btn-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Ingresando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
