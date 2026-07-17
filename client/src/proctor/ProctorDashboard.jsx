/**
 * ProctorDashboard — Instructor view with flashcard-style anomaly evidence cards.
 *
 * Shows:
 *   - Session list (left panel)
 *   - Session detail with red warning banner + stats
 *   - Anomaly flashcards with screenshot thumbnails, timestamps, severity badges
 */

import { useState, useEffect } from 'react'

const API = import.meta.env?.VITE_API_BASE_URL || '';

function getToken() {
  try { return localStorage.getItem('tenali-auth-token') || null } catch { return null }
}

const TYPE_ICONS = {
  tab_switch: '🔄', tab_blur: '👁️', no_face: '👤',
  multiple_faces: '👥', face_mismatch: '🎭', blur_detected: '🌫️',
  voice_detected: '🎤', virtual_camera: '💻', security_challenge_failed: '🔒',
  right_click: '🖱️', copy_paste: '📋', devtools: '🛠️',
  ejected: '🚫', idle: '😴', motion_detected: '🏃',
  camera_covered: '🙈', camera_overexposed: '☀️',
}

const TYPE_LABELS = {
  tab_switch: 'Tab Switched', tab_blur: 'Window Lost Focus', no_face: 'No Face Detected',
  multiple_faces: 'Multiple Faces', face_mismatch: 'Identity Mismatch',
  blur_detected: 'Camera Obscured', voice_detected: 'Speaking Detected',
  virtual_camera: 'Virtual Camera', security_challenge_failed: 'Challenge Failed',
  right_click: 'Right Click', copy_paste: 'Copy/Paste', devtools: 'DevTools Opened',
  ejected: 'Session Ejected', idle: 'Inactivity', motion_detected: 'Scene Change',
  camera_covered: 'Camera Covered', camera_overexposed: 'Overexposed',
}

const SEVERITY_STYLES = {
  1: { bg: 'rgba(234,179,8,0.15)', border: '#eab308', label: 'Low', color: '#fde68a' },
  2: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', label: 'Medium', color: '#fcd34d' },
  3: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', label: 'High', color: '#fca5a5' },
}

function ScreenshotModal({ src, onClose }) {
  if (!src) return null
  return (
    <div
      className="proctor-screenshot-modal-overlay"
      onClick={onClose}
    >
      <div className="proctor-screenshot-modal" onClick={e => e.stopPropagation()}>
        <div className="proctor-screenshot-modal-header">
          <span>Evidence Screenshot</span>
          <button onClick={onClose}>✕</button>
        </div>
        <img src={src} alt="Anomaly evidence" />
      </div>
    </div>
  )
}

export default function ProctorDashboard({ onBack }) {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(() => {
    return getToken() ? true : false
  })
  const [error, setError] = useState(() => getToken() ? null : 'Authentication required')
  const [screenshotModal, setScreenshotModal] = useState(null)
  const [visibleSessions, setVisibleSessions] = useState(20)
  const [visibleEvents, setVisibleEvents] = useState(20)

  const handleSelect = (id) => {
    setSelected(id)
    setVisibleEvents(20)
    if (!id) setDetail(null)
  }

  useEffect(() => {
    const token = getToken()
    if (!token) return

    let cancelled = false
    fetch(`${API}/api/proctor/sessions?all=true`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => { if (!cancelled) { setSessions(d.sessions || []); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message || 'Failed to load sessions'); setLoading(false) } })
    return () => { cancelled = true }
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

  const hasHighSeverity = detail?.events?.some(e => e.severity >= 3)

  return (
    <div className="proctor-dashboard">
      <div className="proctor-dashboard-header">
        <button className="proctor-btn proctor-btn-skip" onClick={onBack}>← Back</button>
        <h2>Proctor Dashboard</h2>
        {detail?.session && (
          <span className="proctor-dashboard-session-badge">
            {detail.events?.length || 0} events recorded
          </span>
        )}
      </div>

      {loading ? (
        <div className="proctor-dashboard-loading">
          <div className="proctor-skeleton-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="proctor-skeleton-card">
                <div className="proctor-skeleton-bar" style={{ width: '60%', height: 14 }} />
                <div className="proctor-skeleton-bar" style={{ width: '80%', height: 10 }} />
                <div className="proctor-skeleton-bar" style={{ width: '40%', height: 10 }} />
              </div>
            ))}
          </div>
          <p>Loading sessions…</p>
        </div>
      ) : error ? (
        <div className="proctor-dashboard-error">
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <h3>Failed to Load Sessions</h3>
          <p>{error}</p>
          <button className="proctor-btn proctor-btn-skip" onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="proctor-dashboard-empty">
          No proctoring sessions found. Sessions are created when students take proctored quizzes.
        </div>
      ) : (
        <div className="proctor-dashboard-content">
          <div className="proctor-dashboard-list">
            {sessions.slice(0, visibleSessions).map(s => (
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
            {sessions.length > visibleSessions && (
              <button className="proctor-btn proctor-btn-skip" style={{ width: '100%', marginTop: 8 }}
                onClick={() => setVisibleSessions(v => v + 20)}>
                Show more ({sessions.length - visibleSessions} remaining)
              </button>
            )}
          </div>

          {detail && detail.session && (
            <div className="proctor-dashboard-detail">
              {/* Red warning banner if high-severity events */}
              {hasHighSeverity && (
                <div className="proctor-detail-warning-banner">
                  <span>⚠️</span>
                  <span>High-severity anomalies detected — review required</span>
                </div>
              )}

              <h3>{detail.session.quizType} — {detail.session.username}</h3>
              <div className="proctor-detail-stats">
                <div className="proctor-detail-stat">
                  <span className="proctor-detail-stat-label">Started</span>
                  <span>{new Date(detail.session.startedAt).toLocaleString()}</span>
                </div>
                <div className="proctor-detail-stat">
                  <span className="proctor-detail-stat-label">Ended</span>
                  <span>{detail.session.endedAt ? new Date(detail.session.endedAt).toLocaleString() : '—'}</span>
                </div>
                <div className="proctor-detail-stat">
                  <span className="proctor-detail-stat-label">Total Penalty</span>
                  <span className={detail.session.totalPenalty >= 10 ? 'proctor-penalty-high' : ''}>{detail.session.totalPenalty}</span>
                </div>
                <div className="proctor-detail-stat">
                  <span className="proctor-detail-stat-label">Status</span>
                  <span className={`proctor-session-status status-${detail.session.status}`}>{detail.session.status}</span>
                </div>
              </div>

              {detail.events && detail.events.length > 0 ? (
                <div className="proctor-anomaly-cards">
                  <div className="proctor-anomaly-cards-header">
                    <h4>Anomaly Evidence</h4>
                    <span>{detail.events.length} events</span>
                  </div>
                  {detail.events.slice(0, visibleEvents).map((ev, i) => {
                    const sev = SEVERITY_STYLES[ev.severity] || SEVERITY_STYLES[1]
                    return (
                      <div
                        key={ev._id || i}
                        className="proctor-anomaly-card"
                        style={{ borderLeftColor: sev.border }}
                      >
                        <div className="proctor-anomaly-card-screenshot">
                          {ev.evidence ? (
                            <img
                              src={ev.evidence}
                              alt="Evidence"
                              onClick={() => setScreenshotModal(ev.evidence)}
                              title="Click to enlarge"
                            />
                          ) : (
                            <div className="proctor-anomaly-card-no-screenshot">
                              No Screenshot
                            </div>
                          )}
                        </div>
                        <div className="proctor-anomaly-card-body">
                          <div className="proctor-anomaly-card-top">
                            <span className="proctor-anomaly-card-icon">
                              {TYPE_ICONS[ev.type] || '⚠️'}
                            </span>
                            <span className="proctor-anomaly-card-type">
                              {TYPE_LABELS[ev.type] || ev.type.replace(/_/g, ' ')}
                            </span>
                            <span
                              className="proctor-anomaly-card-severity"
                              style={{ background: sev.bg, color: sev.color, borderColor: sev.border }}
                            >
                              {sev.label}
                            </span>
                          </div>
                          <div className="proctor-anomaly-card-meta">
                            <span className="proctor-anomaly-card-time">
                              {new Date(ev.timestamp).toLocaleTimeString([], {
                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                              })}
                            </span>
                            {ev.metadata && (
                              <span className="proctor-anomaly-card-detail">
                                {JSON.stringify(ev.metadata).slice(0, 80)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {detail.events.length > visibleEvents && (
                    <button className="proctor-btn proctor-btn-skip" style={{ width: '100%', marginTop: 8 }}
                      onClick={() => setVisibleEvents(v => v + 20)}>
                      Show more ({detail.events.length - visibleEvents} remaining)
                    </button>
                  )}
                </div>
              ) : (
                <p className="proctor-dashboard-no-events">No events recorded — clean session.</p>
              )}
            </div>
          )}
        </div>
      )}

      {screenshotModal && (
        <ScreenshotModal src={screenshotModal} onClose={() => setScreenshotModal(null)} />
      )}
    </div>
  )
}
