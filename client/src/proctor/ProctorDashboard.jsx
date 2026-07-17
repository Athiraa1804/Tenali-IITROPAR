/**
 * ProctorDashboard — Instructor view for reviewing proctoring data.
 *
 * Shows:
 *   - List of proctor sessions with anomaly counts
 *   - Per-session detail with event timeline
 *   - Emotion statistics per quiz type
 */

import { useState, useEffect } from 'react'

const API = import.meta.env?.VITE_API_BASE_URL || '';

function getToken() {
  try { return localStorage.getItem('tenali-auth-token') || null } catch { return null }
}

const TYPE_LABELS = {
  tab_switch: 'Tab Switch', tab_blur: 'Window Blur', no_face: 'No Face',
  multiple_faces: 'Multiple Faces', face_mismatch: 'Identity Mismatch',
  blur_detected: 'Camera Blurred', voice_detected: 'Voice Detected',
  virtual_camera: 'Virtual Camera', security_challenge_failed: 'Challenge Failed',
  right_click: 'Right Click', copy_paste: 'Copy/Paste', devtools: 'DevTools',
}

export default function ProctorDashboard({ onBack }) {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  // Clear detail when selection changes to null
  const handleSelect = (id) => {
    setSelected(id)
    if (!id) setDetail(null)
  }

  useEffect(() => {
    const token = getToken()
    if (!token) return
    fetch(`${API}/api/proctor/sessions`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { setSessions(d.sessions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    const controller = new AbortController()
    const token = getToken()
    fetch(`${API}/api/proctor/session/${selected}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => {})
    return () => controller.abort()
  }, [selected])

  return (
    <div className="proctor-dashboard">
      <div className="proctor-dashboard-header">
        <button className="proctor-btn proctor-btn-skip" onClick={onBack}>← Back</button>
        <h2>Proctor Dashboard</h2>
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--clr-dim)' }}>Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--clr-dim)' }}>
          No proctoring sessions found. Sessions are created when students take proctored quizzes.
        </div>
      ) : (
        <div className="proctor-dashboard-content">
          <div className="proctor-dashboard-list">
            {sessions.map(s => (
              <div
                key={s._id}
                className={`proctor-session-card ${selected === s._id ? 'selected' : ''}`}
                onClick={() => handleSelect(s._id)}
              >
                <div className="proctor-session-card-header">
                  <span className="proctor-session-quiz">{s.quizType}</span>
                  <span className={`proctor-session-status status-${s.status}`}>{s.status}</span>
                </div>
                <div className="proctor-session-meta">
                  <span>{s.username}</span>
                  <span>Penalty: {s.totalPenalty}</span>
                </div>
                <div className="proctor-session-date">
                  {new Date(s.startedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {detail && detail.session && (
            <div className="proctor-dashboard-detail">
              <h3>{detail.session.quizType} — {detail.session.username}</h3>
              <div className="proctor-detail-stats">
                <div>Started: {new Date(detail.session.startedAt).toLocaleString()}</div>
                <div>Ended: {detail.session.endedAt ? new Date(detail.session.endedAt).toLocaleString() : '—'}</div>
                <div>Total Penalty: {detail.session.totalPenalty}</div>
                <div>Status: {detail.session.status}</div>
              </div>

              {detail.events && detail.events.length > 0 ? (
                <table className="proctor-report-table" style={{ marginTop: 16 }}>
                  <thead>
                    <tr><th>Time</th><th>Type</th><th>Severity</th><th>Metadata</th></tr>
                  </thead>
                  <tbody>
                    {detail.events.map((ev, i) => (
                      <tr key={i}>
                        <td>{new Date(ev.timestamp).toLocaleTimeString()}</td>
                        <td>{TYPE_LABELS[ev.type] || ev.type}</td>
                        <td>{ev.severity}</td>
                        <td style={{ fontSize: '0.8rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.metadata ? JSON.stringify(ev.metadata) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ marginTop: 16, color: 'var(--clr-dim)' }}>No events recorded.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
