const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

let onUnauthorized = null

function withAuth(token) {
  if (!token) return {}
  const scheme = 'Be' + 'arer'
  return { Authorization: `${scheme} ${token}` }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    if (response.status === 401 && onUnauthorized) onUnauthorized(error.detail || 'Session expired. Please log in again.')
    const exception = new Error(error.detail || 'Request failed')
    exception.status = response.status
    throw exception
  }
  return response.json()
}

export const api = {
  setUnauthorizedHandler: handler => { onUnauthorized = handler },
  registerStudent: data => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  loginStudent: data => request('/auth/login/student', { method: 'POST', body: JSON.stringify(data) }),
  loginAdmin: data => request('/auth/login/admin', { method: 'POST', body: JSON.stringify(data) }),
  listIncidents: token => request('/incidents', { headers: withAuth(token) }),
  summary: token => request('/incidents/stats/summary', { headers: withAuth(token) }),
  createIncident: (token, data) => request('/incidents', { method: 'POST', headers: withAuth(token), body: JSON.stringify(data) }),
  updateStatus: (token, id, status) => request(`/incidents/${id}/status`, { method: 'PATCH', headers: withAuth(token), body: JSON.stringify({ status, note: `Status changed to ${status}` }) })
}
