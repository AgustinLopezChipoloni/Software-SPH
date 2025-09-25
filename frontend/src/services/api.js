//import axios from "axios";

//export const api = axios.create({
//  baseURL: "http://localhost:3001",
//});

// frontend/src/services/api.js
import axios from "axios";

// Si hay VITE_API_URL lo usa; si no, arma uno con la IP/host actual + :3001
const fallback = `http://${window.location.hostname}:3001`;
const baseURL = import.meta.env.VITE_API_URL || fallback;

console.log("[API] baseURL:", baseURL); // 👈 para verificar en consola

export const api = axios.create({ baseURL });
