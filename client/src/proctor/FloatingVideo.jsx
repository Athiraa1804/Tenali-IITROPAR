/**
 * FloatingVideo — Left-side proctor panel with live webcam, beautiful alerts, and screen activity.
 *
 * Features:
 *   - Live webcam feed with mirror view
 *   - Animated toast notifications for each anomaly
 *   - Screen activity tracker (idle detection, mouse/keyboard activity)
 *   - Penalty bar with color transitions
 *   - Collapsible sidebar
 *   - Status indicator with pulse animation
 */

import { useState, useEffect, useRef, useCallback } from 'react'

const ALERT_ICONS = {
  tab_switch: '🔄',
  tab_blur: '👁️',
  no_face: '👤',
  multiple_faces: '👥',
  face_mismatch: '🎭',
  blur_detected: '🌫️',
  voice_detected: '🎤',
  virtual_camera: '💻',
  security_challenge_failed: '⚡',
  right_click: '🖱️',
  copy_paste: '📋',
  devtools: '🛠️',
  ejected: '🚫',
  idle: '😴',
  inactivity: '⏱️',
}

const ALERT_LABELS = {
  tab_switch: 'Tab Switched',
  tab_blur: 'Window Lost Focus',
  no_face: 'No Face Detected',
  multiple_faces: 'Multiple Faces',
  face_mismatch: 'Identity Changed',
  blur_detected: 'Camera Obscured',
  voice_detected: 'Voice Activity',
  virtual_camera: 'Virtual Camera',
  security_challenge_failed: 'Challenge Failed',
  right_click: 'Right Click Blocked',
  copy_paste: 'Copy/Paste Blocked',
  devtools: 'DevTools Blocked',
  ejected: 'Ejected',
  idle: 'Inactivity Detected',
  inactivity: 'No Activity',
}

const SEVERITY_STYLES = {
  1: { bg: 'rgba(234,179,8,0.15)', border: '#eab308', text: '#fde68a' },
  2: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fcd34d' },
  3: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#fca5a5' },
}

function Toast({ alert, onDismiss }) {
  const [exiting, setExiting] = useState(false)
  const sev = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES[1]

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 3500)
    const t2 = setTimeout(() => onDismiss(), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDismiss])

  return (
    <div style={{
      padding: '8px 10px',
      borderRadius: 8,
      background: sev.bg,
      border: `1px solid ${sev.border}40`,
      borderLeft: `3px solid ${sev.border}`,
      fontSize: '0.72rem',
      color: sev.text,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 6,
      opacity: exiting ? 0 : 1,
      transform: exiting ? 'translateX(-20px)' : 'translateX(0)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      animation: 'proctor-slide-in 0.3s ease',
    }}>
      <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: -1 }}>
        {ALERT_ICONS[alert.type] || '⚠️'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 1 }}>
          {ALERT_LABELS[alert.type] || alert.type.replace(/_/g, ' ')}
        </div>
        <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>
          {new Date(alert.timestamp).toLocaleTimeString()}
        </div>
      </div>
      <div style={{
        fontSize: '0.6rem',
        background: `${sev.border}30`,
        borderRadius: 4,
        padding: '1px 5px',
        flexShrink: 0,
      }}>
        {alert.severity >= 3 ? 'HIGH' : alert.severity >= 2 ? 'MED' : 'LOW'}
      </div>
    </div>
  )
}

function ActivityDot({ active, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', color: '#888' }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: active ? '#22c55e' : '#555',
        boxShadow: active ? '0 0 4px #22c55e' : 'none',
        transition: 'all 0.3s',
      }} />
      <span>{label}</span>
    </div>
  )
}

export default function FloatingVideo({ videoRef, isRunning, error, penaltyScore, anomalies }) {
  const [collapsed, setCollapsed] = useState(false)
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)
  const prevAnomalyLen = useRef(0)
  const [mouseActive, setMouseActive] = useState(false)
  const [kbdActive, setKbdActive] = useState(false)
  const mouseTimerRef = useRef(null)
  const kbdTimerRef = useRef(null)

  // Track mouse activity
  useEffect(() => {
    const handleMove = () => {
      setMouseActive(true)
      clearTimeout(mouseTimerRef.current)
      mouseTimerRef.current = setTimeout(() => setMouseActive(false), 2000)
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMove)
      clearTimeout(mouseTimerRef.current)
    }
  }, [])

  // Track keyboard activity
  useEffect(() => {
    const handleKey = () => {
      setKbdActive(true)
      clearTimeout(kbdTimerRef.current)
      kbdTimerRef.current = setTimeout(() => setKbdActive(false), 2000)
    }
    window.addEventListener('keydown', handleKey, { passive: true })
    return () => {
      window.removeEventListener('keydown', handleKey)
      clearTimeout(kbdTimerRef.current)
    }
  }, [])

  // Create toast for new anomalies
  useEffect(() => {
    if (anomalies.length > prevAnomalyLen.current) {
      const newOnes = anomalies.slice(prevAnomalyLen.current)
      for (const a of newOnes) {
        const id = ++toastIdRef.current
        setToasts(prev => [...prev.slice(-4), { ...a, id }])
      }
    }
    prevAnomalyLen.current = anomalies.length
  }, [anomalies])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const hasAnomaly = penaltyScore > 0
  const statusColor = error ? '#f59e0b' : hasAnomaly ? '#ef4444' : '#22c55e'
  const statusText = error ? 'Camera Error' : hasAnomaly
    ? `Penalty ${penaltyScore}/50`
    : isRunning ? 'Monitoring' : 'Starting...'

  return (
    <>
      {/* Toast notifications — positioned at top-left of screen */}
      <div style={{
        position: 'fixed',
        top: 70,
        left: collapsed ? 56 : 236,
        zIndex: 10001,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: 220,
        pointerEvents: 'none',
        transition: 'left 0.25s ease',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast alert={t} onDismiss={() => dismissToast(t.id)} />
          </div>
        ))}
      </div>

      {/* Main sidebar panel */}
      <div
        className="proctor-sidebar"
        style={{
          position: 'fixed',
          top: 60,
          left: 0,
          zIndex: 10000,
          width: collapsed ? 48 : 220,
          transition: 'width 0.25s ease',
          overflow: 'hidden',
          background: 'rgba(12, 12, 20, 0.97)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0 12px 12px 0',
          boxShadow: '4px 0 30px rgba(0,0,0,0.6)',
          fontFamily: 'var(--font-body, system-ui, sans-serif)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 60px)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: collapsed ? '10px 10px' : '10px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          minHeight: 38,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 600 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
                display: 'inline-block',
                animation: hasAnomaly ? 'proctor-pulse 1s infinite' : 'none',
              }} />
              <span style={{ color: statusColor }}>{statusText}</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background: 'none', border: 'none', color: '#888', cursor: 'pointer',
              fontSize: '0.8rem', padding: 2, marginLeft: collapsed ? 'auto' : 0,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = '#888'}
            title={collapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Webcam feed or error */}
        {!collapsed && (
          <div style={{ padding: '6px 8px' }}>
            {error ? (
              <div style={{
                width: '100%', height: 130, borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))',
                border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 6, padding: 12, boxSizing: 'border-box',
              }}>
                <span style={{ fontSize: '1.8rem' }}>📷</span>
                <span style={{
                  fontSize: '0.72rem', color: '#fcd34d', textAlign: 'center',
                  lineHeight: 1.4, fontWeight: 500,
                }}>
                  {error}
                </span>
                <span style={{ fontSize: '0.6rem', color: '#888', textAlign: 'center' }}>
                  Grant camera permission to continue monitoring
                </span>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    height: 130,
                    objectFit: 'cover',
                    borderRadius: 8,
                    display: 'block',
                    transform: 'scaleX(-1)',
                    background: isRunning ? '#000' : 'rgba(255,255,255,0.03)',
                  }}
                />
                {/* Live indicator */}
                {isRunning && (
                  <div style={{
                    position: 'absolute', top: 6, right: 8,
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(0,0,0,0.6)', borderRadius: 4,
                    padding: '2px 6px', fontSize: '0.55rem', fontWeight: 600,
                    color: '#ef4444', letterSpacing: '0.5px',
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#ef4444', animation: 'proctor-pulse 1.5s infinite',
                    }} />
                    LIVE
                  </div>
                )}
              </div>
            )}
            {!isRunning && !error && (
              <div style={{
                textAlign: 'center', fontSize: '0.65rem', color: '#666',
                marginTop: 4, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 4,
              }}>
                <span style={{
                  width: 8, height: 8, border: '2px solid #555',
                  borderTopColor: '#aaa', borderRadius: '50%',
                  animation: 'proctor-spin 0.8s linear infinite',
                }} />
                Starting camera...
              </div>
            )}
          </div>
        )}

        {/* Activity indicators */}
        {!collapsed && (
          <div style={{
            display: 'flex', gap: 8, padding: '4px 12px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            <ActivityDot active={mouseActive} label="Mouse" />
            <ActivityDot active={kbdActive} label="Keys" />
            <ActivityDot active={isRunning} label="Camera" />
          </div>
        )}

        {/* Penalty bar */}
        {!collapsed && (
          <div style={{ padding: '6px 12px' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 3,
            }}>
              <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 500 }}>
                PENALTY
              </span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700,
                color: penaltyScore > 30 ? '#ef4444' : penaltyScore > 10 ? '#f59e0b' : '#22c55e',
              }}>
                {penaltyScore}/50
              </span>
            </div>
            <div style={{
              height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                width: `${Math.min(penaltyScore * 2, 100)}%`,
                background: penaltyScore > 30
                  ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                  : penaltyScore > 10
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #22c55e, #16a34a)',
                transition: 'width 0.5s ease, background 0.5s ease',
                boxShadow: penaltyScore > 10
                  ? `0 0 8px ${penaltyScore > 30 ? '#ef4444' : '#f59e0b'}40`
                  : 'none',
              }} />
            </div>
            {penaltyScore >= 40 && (
              <div style={{
                fontSize: '0.6rem', color: '#ef4444', marginTop: 3,
                textAlign: 'center', fontWeight: 600,
                animation: 'proctor-pulse 1s infinite',
              }}>
                ⚠ Ejection imminent
              </div>
            )}
          </div>
        )}

        {/* Anomaly history */}
        {!collapsed && anomalies.length > 0 && (
          <div style={{
            flex: 1, overflowY: 'auto', padding: '4px 8px 8px',
            display: 'flex', flexDirection: 'column', gap: 3,
          }}>
            <div style={{
              fontSize: '0.6rem', color: '#555', fontWeight: 600,
              padding: '0 4px', letterSpacing: '0.5px',
            }}>
              RECENT FLAGS
            </div>
            {anomalies.slice(-8).reverse().map((a, i) => (
              <div key={i} style={{
                fontSize: '0.65rem', padding: '5px 8px',
                borderRadius: 6,
                background: (SEVERITY_STYLES[a.severity] || SEVERITY_STYLES[1]).bg,
                borderLeft: `3px solid ${(SEVERITY_STYLES[a.severity] || SEVERITY_STYLES[1]).border}`,
                color: (SEVERITY_STYLES[a.severity] || SEVERITY_STYLES[1]).text,
                display: 'flex', alignItems: 'center', gap: 5,
                animation: i === 0 ? 'proctor-slide-in 0.3s ease' : 'none',
              }}>
                <span style={{ fontSize: '0.75rem' }}>{ALERT_ICONS[a.type] || '⚠️'}</span>
                <span style={{ flex: 1 }}>{ALERT_LABELS[a.type] || a.type.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>
                  {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!collapsed && anomalies.length === 0 && isRunning && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 6, padding: 16,
          }}>
            <div style={{
              fontSize: '1.5rem', opacity: 0.3,
            }}>✅</div>
            <div style={{
              fontSize: '0.65rem', color: '#555', textAlign: 'center', lineHeight: 1.4,
            }}>
              All clear. Monitoring active.
            </div>
          </div>
        )}

        {/* Collapsed status dot */}
        {collapsed && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 0', gap: 6,
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
              animation: hasAnomaly ? 'proctor-pulse 1s infinite' : 'none',
            }} />
            {penaltyScore > 0 && (
              <span style={{
                fontSize: '0.55rem', fontWeight: 700,
                color: penaltyScore > 30 ? '#ef4444' : '#f59e0b',
              }}>
                {penaltyScore}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  )
}
