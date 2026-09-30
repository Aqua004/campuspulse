const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

let _token = localStorage.getItem("token") || null;
let _unauthorizedHandler = null;

function formatError(detail) {
  if (!detail) return "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e?.msg ? `${e?.loc?.join?.(" → ") || ""}: ${e.msg}` : JSON.stringify(e))).join(", ");
  if (typeof detail === "object" && detail.msg) return detail.msg;
  return JSON.stringify(detail);
}

async function request(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch {}
  if (res.status === 401 && _unauthorizedHandler) { _unauthorizedHandler(); return; }
  if (!res.ok) throw new Error(formatError(data?.detail || data?.message || res.statusText));
  return data;
}

async function formLogin(url, email, password) {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(formatError(data?.detail || res.statusText));
  return data;
}

const api = {
  setUnauthorizedHandler(handler) { _unauthorizedHandler = handler; },
  setToken(token) { _token = token; localStorage.setItem("token", token); },
  clearToken() { _token = null; localStorage.removeItem("token"); },
  getToken() { return _token; },

  async loginStudent(email, password) { return formLogin("/api/auth/login", email, password); },
  async loginAdmin(email, password) { return formLogin("/api/auth/admin/login", email, password); },
  async register(name, email, password) {
    return request("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  },
  async getMe() { return request("/api/auth/me"); },

  async getIncidents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/api/incidents${query ? "?" + query : ""}`);
  },
  async getMyIncidents() { return request("/api/incidents/my"); },
  async createIncident(data) {
    return request("/api/incidents", { method: "POST", body: JSON.stringify(data) });
  },
  async updateStatus(id, status, note = "") {
    return request(`/api/incidents/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) });
  },
  async getStats() { return request("/api/incidents/stats/summary"); },
};

export default api;
export const { setToken, clearToken, setUnauthorizedHandler } = api;
