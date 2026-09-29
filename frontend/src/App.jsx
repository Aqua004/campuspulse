import { useEffect, useState } from 'react'
import { api } from './api'

const initialForm = { reporter_name: '', reporter_email: '', title: '', description: '', category: 'wifi', location: '', priority: 'medium' }
const categories = ['wifi', 'electricity', 'lab', 'transport', 'canteen', 'cleanliness', 'other']
const statuses = ['open', 'acknowledged', 'in_progress', 'resolved', 'closed']

function ReporterForm({ onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [feedback, setFeedback] = useState({ loading: false, message: '', error: '' })
  const change = event => setForm({ ...form, [event.target.name]: event.target.value })
  const submit = async event => {
    event.preventDefault()
    setFeedback({ loading: true, message: '', error: '' })
    try {
      const incident = await api.createIncident(form)
      setForm(initialForm)
      setFeedback({ loading: false, message: `Submitted. Ticket ${incident.id.slice(0, 8)}`, error: '' })
      onCreated()
    } catch (error) {
      setFeedback({ loading: false, message: '', error: error.message })
    }
  }
  return <section className="panel">
    <div className="section-heading"><div><p className="eyebrow">Student portal</p><h2>Report a campus issue</h2></div><span className="live-dot">System online</span></div>
    <form onSubmit={submit} className="form-grid">
      <label>Name<input required minLength="2" name="reporter_name" value={form.reporter_name} onChange={change} placeholder="Your full name" /></label>
      <label>Email<input required type="email" name="reporter_email" value={form.reporter_email} onChange={change} placeholder="student@college.edu" /></label>
      <label className="wide">Issue title<input required minLength="5" name="title" value={form.title} onChange={change} placeholder="Wi-Fi not working in Lab 204" /></label>
      <label>Category<select name="category" value={form.category} onChange={change}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Priority<select name="priority" value={form.priority} onChange={change}>{['low','medium','high','critical'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="wide">Location<input required minLength="2" name="location" value={form.location} onChange={change} placeholder="Block, room or campus area" /></label>
      <label className="wide">Description<textarea required minLength="10" rows="4" name="description" value={form.description} onChange={change} placeholder="Describe what happened and when it started" /></label>
      <div className="wide action-row"><button disabled={feedback.loading}>{feedback.loading ? 'Submitting…' : 'Submit incident'}</button>{feedback.message && <span className="success">{feedback.message}</span>}{feedback.error && <span className="error">{feedback.error}</span>}</div>
    </form>
  </section>
}

function Dashboard({ incidents, summary, refresh }) {
  const [busy, setBusy] = useState('')
  const update = async (id, status) => { setBusy(id); try { await api.updateStatus(id, status); await refresh() } finally { setBusy('') } }
  return <section>
    <div className="stats">{[['Total',summary.total],['Open',summary.open],['In progress',summary.in_progress],['Resolved',summary.resolved],['Critical',summary.critical]].map(([label,value]) => <article className="stat" key={label}><strong>{value || 0}</strong><span>{label}</span></article>)}</div>
    <div className="panel"><div className="section-heading"><div><p className="eyebrow">Admin dashboard</p><h2>Recent incidents</h2></div><button className="secondary" onClick={refresh}>Refresh</button></div>
      {incidents.length === 0 ? <div className="empty">No incidents yet. Submit the first report.</div> : <div className="incident-list">{incidents.map(item => <article className="incident" key={item.id}>
        <div><div className="badges"><span className={`badge priority-${item.priority}`}>{item.priority}</span><span className="badge">{item.category}</span><span className={`badge status-${item.status}`}>{item.status.replace('_',' ')}</span></div><h3>{item.title}</h3><p>{item.description}</p><small>{item.location} · {item.reporter_name} · {new Date(item.created_at).toLocaleString()}</small></div>
        <select aria-label="Update incident status" value={item.status} disabled={busy === item.id} onChange={event => update(item.id, event.target.value)}>{statuses.map(value => <option value={value} key={value}>{value.replace('_',' ')}</option>)}</select>
      </article>)}</div>}
    </div>
  </section>
}

export default function App() {
  const [tab, setTab] = useState('report')
  const [incidents, setIncidents] = useState([])
  const [summary, setSummary] = useState({})
  const [error, setError] = useState('')
  const refresh = async () => {
    try { const [items, counts] = await Promise.all([api.listIncidents(), api.summary()]); setIncidents(items); setSummary(counts); setError('') }
    catch (exception) { setError(`Cannot connect to API: ${exception.message}`) }
  }
  useEffect(() => { refresh() }, [])
  return <><header><a className="brand" href="#"><span>CP</span><div><b>CampusPulse</b><small>Report · Track · Resolve</small></div></a><nav><button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>Report issue</button><button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>Dashboard</button></nav></header>
    <main>{error && <div className="error-banner">{error}</div>}{tab === 'report' ? <ReporterForm onCreated={() => { refresh(); setTab('dashboard') }} /> : <Dashboard incidents={incidents} summary={summary} refresh={refresh} />}</main>
    <footer>CampusPulse Week 1 MVP · DevOps and Cloud Computing Project</footer></>
}
