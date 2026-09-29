import { useEffect, useMemo, useState } from 'react'
import api from "./api";

const SESSION_KEY = 'campuspulse.session'
const categories = ['wifi', 'electricity', 'lab', 'transport', 'canteen', 'cleanliness', 'other']
const statuses = ['open', 'acknowledged', 'in_progress', 'resolved', 'closed']
const initialIncidentForm = { title: '', description: '', category: 'wifi', location: '', priority: 'medium' }

function AuthTabs({ activeTab, onTab }) {
  return <nav><button className={activeTab === 'student' ? 'active' : ''} onClick={() => onTab('student')}>Student Login</button><button className={activeTab === 'admin' ? 'active' : ''} onClick={() => onTab('admin')}>Admin Login</button></nav>
}

function StudentRegistration({ onRegistered }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [feedback, setFeedback] = useState({ loading: false, message: '', error: '' })
  const change = event => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async event => {
    event.preventDefault()
    setFeedback({ loading: true, message: '', error: '' })
    try {
      await api.registerStudent(form)
      setFeedback({ loading: false, message: 'Registration successful. You can now log in.', error: '' })
      setForm({ full_name: '', email: '', password: '' })
      onRegistered(form.email)
    } catch (error) {
      setFeedback({ loading: false, message: '', error: error.message })
    }
  }
  return <form onSubmit={submit} className="form-grid">
    <label>Name<input required minLength="2" name="full_name" value={form.full_name} onChange={change} /></label>
    <label>Email<input required type="email" name="email" value={form.email} onChange={change} /></label>
    <label className="wide">Password<input required minLength="8" type="password" name="password" value={form.password} onChange={change} /></label>
    <div className="wide action-row"><button disabled={feedback.loading}>{feedback.loading ? 'Creating…' : 'Create student account'}</button>{feedback.message && <span className="success">{feedback.message}</span>}{feedback.error && <span className="error">{feedback.error}</span>}</div>
  </form>
}

function LoginPanel({ role, onLoggedIn, defaultEmail = '' }) {
  const [form, setForm] = useState({ email: defaultEmail, password: '' })
  const [feedback, setFeedback] = useState({ loading: false, error: '' })
  useEffect(() => { setForm(current => ({ ...current, email: defaultEmail || current.email })) }, [defaultEmail])
  const change = event => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async event => {
    event.preventDefault()
    setFeedback({ loading: true, error: '' })
    try {
      const payload = role === 'admin' ? await api.loginAdmin(form) : await api.loginStudent(form)
      onLoggedIn(payload)
    } catch (error) {
      setFeedback({ loading: false, error: error.message })
      return
    }
    setFeedback({ loading: false, error: '' })
  }
  return <form onSubmit={submit} className="form-grid">
    <label>Email<input required type="email" name="email" value={form.email} onChange={change} /></label>
    <label>Password<input required minLength="8" type="password" name="password" value={form.password} onChange={change} /></label>
    <div className="wide action-row"><button disabled={feedback.loading}>{feedback.loading ? 'Signing in…' : role === 'admin' ? 'Login as admin' : 'Login as student'}</button>{feedback.error && <span className="error">{feedback.error}</span>}</div>
  </form>
}

function StudentPortal({ token, incidents, refresh }) {
  const [form, setForm] = useState(initialIncidentForm)
  const [feedback, setFeedback] = useState({ loading: false, message: '', error: '' })
  const change = event => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async event => {
    event.preventDefault()
    setFeedback({ loading: true, message: '', error: '' })
    try {
      const incident = await api.createIncident(token, form)
      setForm(initialIncidentForm)
      setFeedback({ loading: false, message: `Submitted. Ticket ${incident.id.slice(0, 8)}`, error: '' })
      await refresh()
    } catch (error) {
      setFeedback({ loading: false, message: '', error: error.message })
    }
  }
  return <section>
    <div className="panel">
      <div className="section-heading"><div><p className="eyebrow">Student portal</p><h2>Report a campus issue</h2></div></div>
      <form onSubmit={submit} className="form-grid">
        <label className="wide">Issue title<input required minLength="5" name="title" value={form.title} onChange={change} /></label>
        <label>Category<select name="category" value={form.category} onChange={change}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Priority<select name="priority" value={form.priority} onChange={change}>{['low', 'medium', 'high', 'critical'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="wide">Location<input required minLength="2" name="location" value={form.location} onChange={change} /></label>
        <label className="wide">Description<textarea required minLength="10" rows="4" name="description" value={form.description} onChange={change} /></label>
        <div className="wide action-row"><button disabled={feedback.loading}>{feedback.loading ? 'Submitting…' : 'Submit incident'}</button>{feedback.message && <span className="success">{feedback.message}</span>}{feedback.error && <span className="error">{feedback.error}</span>}</div>
      </form>
    </div>
    <div className="panel">
      <div className="section-heading"><div><p className="eyebrow">My incidents</p><h2>Track submitted issues</h2></div><button className="secondary" onClick={refresh}>Refresh</button></div>
      {incidents.length === 0 ? <div className="empty">You have not submitted incidents yet.</div> : <div className="incident-list">{incidents.map(item => <article className="incident" key={item.id}>
        <div><div className="badges"><span className={`badge priority-${item.priority}`}>{item.priority}</span><span className="badge">{item.category}</span><span className={`badge status-${item.status}`}>{item.status.replace('_', ' ')}</span></div><h3>{item.title}</h3><p>{item.description}</p><small>{item.location} · {new Date(item.created_at).toLocaleString()}</small></div>
      </article>)}</div>}
    </div>
  </section>
}

function AdminDashboard({ token, incidents, summary, refresh }) {
  const [busy, setBusy] = useState('')
  const update = async (id, status) => {
    setBusy(id)
    try {
      await api.updateStatus(token, id, status)
      await refresh()
    } finally {
      setBusy('')
    }
  }
  return <section>
    <div className="stats">{[['Total', summary.total], ['Open', summary.open], ['In progress', summary.in_progress], ['Resolved', summary.resolved], ['Critical', summary.critical]].map(([label, value]) => <article className="stat" key={label}><strong>{value || 0}</strong><span>{label}</span></article>)}</div>
    <div className="panel">
      <div className="section-heading"><div><p className="eyebrow">Admin dashboard</p><h2>All incidents</h2></div><button className="secondary" onClick={refresh}>Refresh</button></div>
      {incidents.length === 0 ? <div className="empty">No incidents yet.</div> : <div className="incident-list">{incidents.map(item => <article className="incident" key={item.id}>
        <div><div className="badges"><span className={`badge priority-${item.priority}`}>{item.priority}</span><span className="badge">{item.category}</span><span className={`badge status-${item.status}`}>{item.status.replace('_', ' ')}</span></div><h3>{item.title}</h3><p>{item.description}</p><small>{item.location} · {item.reporter_name} ({item.reporter_email}) · {new Date(item.created_at).toLocaleString()}</small></div>
        <select aria-label="Update incident status" value={item.status} disabled={busy === item.id} onChange={event => update(item.id, event.target.value)}>{statuses.map(value => <option value={value} key={value}>{value.replace('_', ' ')}</option>)}</select>
      </article>)}</div>}
    </div>
  </section>
}

export default function App() {
  const [authTab, setAuthTab] = useState('student')
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    } catch {
      return null
    }
  })
  const [preferredEmail, setPreferredEmail] = useState('')
  const [incidents, setIncidents] = useState([])
  const [summary, setSummary] = useState({})
  const [error, setError] = useState('')

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    api.setUnauthorizedHandler(message => {
      localStorage.removeItem(SESSION_KEY)
      setSession(null)
      setError(message || 'Session expired. Please log in again.')
    })
  }, [])

  const saveSession = payload => {
    const next = { access_token: payload.access_token, user: payload.user }
    localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    setSession(next)
    setError('')
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setSession(null)
    setIncidents([])
    setSummary({})
    setError('')
  }

  const refresh = async () => {
    if (!session?.access_token) return
    try {
      if (isAdmin) {
        const [items, counts] = await Promise.all([api.listIncidents(session.access_token), api.summary(session.access_token)])
        setIncidents(items)
        setSummary(counts)
      } else {
        const items = await api.listIncidents(session.access_token)
        setIncidents(items)
      }
      setError('')
    } catch (exception) {
      if (exception.status !== 401) setError(`Cannot connect to API: ${exception.message}`)
    }
  }

  useEffect(() => { refresh() }, [session?.access_token, isAdmin])

  const authTitle = useMemo(() => authTab === 'admin' ? 'Admin access' : 'Student access', [authTab])

  if (!session) {
    return <><header><a className="brand" href="#"><span>CP</span><div><b>CampusPulse</b><small>Report · Track · Resolve</small></div></a><AuthTabs activeTab={authTab} onTab={setAuthTab} /></header>
      <main>{error && <div className="error-banner">{error}</div>}
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">Authentication</p><h2>{authTitle}</h2></div></div>
          <LoginPanel role={authTab} onLoggedIn={saveSession} defaultEmail={preferredEmail} />
        </section>
        {authTab === 'student' && <section className="panel"><div className="section-heading"><div><p className="eyebrow">New student?</p><h2>Create your account</h2></div></div><StudentRegistration onRegistered={email => setPreferredEmail(email)} /></section>}
      </main>
      <footer>CampusPulse Week 1 MVP · DevOps and Cloud Computing Project</footer></>
  }

  return <><header><a className="brand" href="#"><span>CP</span><div><b>CampusPulse</b><small>Report · Track · Resolve</small></div></a><nav><button className="active">{isAdmin ? 'Admin Dashboard' : 'Student Portal'}</button><button className="secondary" onClick={logout}>Logout</button></nav></header>
    <main>{error && <div className="error-banner">{error}</div>}{isAdmin ? <AdminDashboard token={session.access_token} incidents={incidents} summary={summary} refresh={refresh} /> : <StudentPortal token={session.access_token} incidents={incidents} refresh={refresh} />}</main>
    <footer>CampusPulse Week 1 MVP · DevOps and Cloud Computing Project</footer></>
}
