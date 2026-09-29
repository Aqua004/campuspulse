const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("token");
}

function formatError(detail) {
  if (!detail) return "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e?.msg ? `${e?.loc?.join?.(" → ") || ""}: ${e.msg}` : JSON.stringify(e)))
      .join(", ");
  }
  if (typeof detail === "object" && detail.msg) return detail.msg;
  return JSON.stringify(detail);
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(formatError(data?.detail || data?.message || res.statusText));
  }
  return data;
}

export function setToken(token) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export async function loginStudent(email, password) {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(formatError(data?.detail || res.statusText));
  return data;
}

export async function loginAdmin(email, password) {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(formatError(data?.detail || res.statusText));
  return data;
}

export async function registerStudent(name, email, password) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getIncidents(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/incidents${query ? "?" + query : ""}`);
}

export async function getMyIncidents() {
  return request("/api/incidents/my");
}

export async function createIncident(data) {
  return request("/api/incidents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIncidentStatus(id, status, note = "") {
  return request(`/api/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export async function getStats() {
  return request("/api/incidents/stats/summary");
}

export async function getMe() {
  return request("/api/auth/me");
}

const api = {
  loginStudent,
  loginAdmin,
  registerStudent,
  getIncidents,
  getMyIncidents,
  createIncident,
  updateIncidentStatus,
  getStats,
  getMe,
  setToken,
  clearToken,
};

export default api;
export { api };
