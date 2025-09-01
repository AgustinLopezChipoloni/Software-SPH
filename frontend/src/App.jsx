import { useState } from "react";
import Login from "./components/login";
import Home from "./components/home";


export default function App() {
  const [user, setUser] = useState(null);
  const handleLogin = (u) => setUser(u);
  const handleLogout = () => setUser(null);

  if (!user) return <Login onLogin={handleLogin} />;
  return <Home user={user} onLogout={handleLogout} />;
}
