const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }
  return response.json()
}

export const api = {
  listIncidents: () => request('/incidents'),
  summary: () => request('/incidents/stats/summary'),
  createIncident: data => request('/incidents', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, status) => request(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, changed_by: 'dashboard-admin', note: `Status changed to ${status}` }) })
}
