/**
 * FloatingVideo — Proctor panel matching vibe's architecture.
 *
 * Layout:
 *   - Green header bar "All Clear" / Red header bar "Detected Anomalies"
 *   - Live webcam feed below
 *   - Overlay with anomaly details on the video (shown for ALL anomalies)
 *   - Toast notifications for each new anomaly
 *   - Penalty score + face count badge
 *   - Collapsible / pop-out
 *   - Red warning banner across top of screen when anomalies detected
 *   - PiP toggle button (Chrome/Edge only)
 */

import { useState, useEffect, useRef } from 'react'
import usePipWindow from './usePipWindow'

const SEVERITY_COLORS = {
  1: { bg: 'rgba(234,179,8,0.2)', border: '#eab308', text: '#fde68a' },
  2: { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b', text: '#fcd34d' },
  3: { bg: 'rgba(239,68,68,0.2)', border: '#ef4444', text: '#fca5a5' },
}

const SEVERITY_LABELS = { 1: 'Low', 2: 'Medium', 3: 'High' }

const ANOMALY_ICONS = {
  tab_switch: '🔄', tab_blur: '👁️', no_face: '👤',
  multiple_faces: '👥', blur_detected: '🌫️', voice_detected: '🎤',
  virtual_camera: '💻', right_click: '🖱️', copy_paste: '📋',
  devtools: '🛠️', idle: '😴', motion_detected: '🏃',
  camera_covered: '🙈', camera_overexposed: '☀️', face_mismatch: '🎭',
  ejected: '🚫',
}

const ANOMALY_LABELS = {
  tab_switch: 'Tab Switched', tab_blur: 'Window Lost Focus',
  no_face: 'No Face Detected', multiple_faces: 'Multiple Faces',
  blur_detected: 'Camera Obscured', voice_detected: 'Speaking Detected',
  virtual_camera: 'Virtual Camera', right_click: 'Right Click',
  copy_paste: 'Copy/Paste', devtools: 'DevTools', idle: 'Inactivity',
  motion_detected: 'Scene Change', camera_covered: 'Camera Covered',
  camera_overexposed: 'Overexposed', face_mismatch: 'Identity Mismatch',
  ejected: 'Session Ejected',
}

function Toast({ anomaly, onDismiss }) {
  const sev = SEVERITY_COLORS[anomaly.severity] || SEVERITY_COLORS[1]
  const icon = ANOMALY_ICONS[anomaly.type] || '⚠️'
  const label = ANOMALY_LABELS[anomaly.type] || anomaly.type.replace(/_/g, ' ')

  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="proctor-toast" style={{ borderLeftColor: sev.border }}>
      <span className="proctor-toast-icon">{icon}</span>
      <div className="proctor-toast-body">
        <div className="proctor-toast-title">{label}</div>
        <div className="proctor-toast-message">
          Severity: {SEVERITY_LABELS[anomaly.severity] || 'Low'}
          {anomaly.screenshot ? ' · Screenshot captured' : ''}
        </div>
      </div>
      <button className="proctor-toast-close" onClick={onDismiss}>✕</button>
    </div>
  )
}

function FaceBadge({ faceCount }) {
  const color = faceCount === 1 ? '#22c55e' : faceCount === 0 ? '#ef4444' : '#f59e0b'
  const icon = faceCount === 0 ? '👤' : faceCount === 1 ? '✓' : '👥'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 6px', borderRadius: 999, fontSize: '0.55rem',
      background: `${color}22`, color, border: `1px solid ${color}44`,
      fontWeight: 700,
    }}>
      {icon} {faceCount === 0 ? 'No Face' : faceCount === 1 ? '1 Face' : `${faceCount} Faces`}
    </span>
  )
}

export default function FloatingVideo({ videoRef, isRunning, error, penaltyScore, anomalies, isAnomalyDetected, penaltyType, faceCount = 1 }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPoppedOut, setIsPoppedOut] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showRedBanner, setShowRedBanner] = useState(false)
  const [toasts, setToasts] = useState([])
  const prevAnomalyCountRef = useRef(0)
  const bannerShowRef = useRef(null)
  const bannerHideRef = useRef(null)
  const { pipActive, pipSupported, togglePip } = usePipWindow({ videoRef, enabled: isRunning })

  const recentAnomalies = anomalies.slice(-5)

  useEffect(() => {
    const newCount = anomalies.length
    if (newCount > prevAnomalyCountRef.current) {
      const newAnomalies = anomalies.slice(prevAnomalyCountRef.current)
      newAnomalies.forEach(a => {
        setToasts(prev => [...prev.slice(-3), { ...a, _toastId: a.id || Date.now() + Math.random() }])
      })
      prevAnomalyCountRef.current = newCount
    }
  }, [anomalies])

  useEffect(() => {
    if (isAnomalyDetected && penaltyScore > 0) {
      clearTimeout(bannerShowRef.current)
      clearTimeout(bannerHideRef.current)
      bannerShowRef.current = setTimeout(() => {
        setShowRedBanner(true)
        bannerHideRef.current = setTimeout(() => setShowRedBanner(false), 5000)
      }, 0)
    }
    return () => { clearTimeout(bannerShowRef.current); clearTimeout(bannerHideRef.current) }
  }, [isAnomalyDetected, penaltyScore])

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return
    if (!isPoppedOut) return
    e.preventDefault()
    setIsDragging(true)
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e) => setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    const handleUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => { document.removeEventListener('mousemove', handleMove); document.removeEventListener('mouseup', handleUp) }
  }, [isDragging, dragOffset])

  const toggleCollapse = (e) => { e.stopPropagation(); setIsCollapsed(c => !c) }

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t._toastId !== toastId))
  }

  const videoHeight = isCollapsed ? 1 : 196
  const containerHeight = isCollapsed ? 34 : 230

  return (
    <>
      {/* Toast notifications — top right */}
      <div className="proctor-toast-container">
        {toasts.map(t => (
          <Toast key={t._toastId} anomaly={t} onDismiss={() => removeToast(t._toastId)} />
        ))}
      </div>

      {/* Red warning banner */}
      {showRedBanner && isAnomalyDetected && (
        <div className="proctor-red-banner" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100001,
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white',
          padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, fontWeight: 700, fontSize: '0.9rem',
          boxShadow: '0 4px 20px rgba(220,38,38,0.5)', animation: 'proctor-slide-down 0.3s ease',
        }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <span>Anomaly Detected: {ANOMALY_LABELS[penaltyType] || penaltyType || 'Suspicious Activity'}</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem' }}>
            Penalty: {penaltyScore}/50
          </span>
        </div>
      )}

      {/* Main sidebar */}
      <div className="proctor-sidebar" style={isPoppedOut ? {
        position: 'fixed', left: `${position.x}px`, top: `${position.y}px`,
        width: 224, height: containerHeight, zIndex: 100000,
        cursor: isDragging ? 'grabbing' : 'grab', borderRadius: 12,
        overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      } : {
        position: 'fixed', top: showRedBanner ? 44 : 60, left: 0,
        zIndex: 10000, width: 224, height: containerHeight,
        transition: 'height 0.3s ease, top 0.3s ease', borderRadius: '0 12px 12px 0',
      }} onMouseDown={handleMouseDown}>

        {/* Header bar */}
        <div style={{
          background: isAnomalyDetected ? '#dc2626' : '#16a34a', color: 'white',
          padding: '0 8px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', minHeight: 34, fontSize: '0.8rem', fontWeight: 600,
          transition: 'background 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            <span>{isAnomalyDetected ? '⚠️' : '☑️'}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isCollapsed
                ? (isAnomalyDetected ? `${ANOMALY_LABELS[penaltyType] || 'Anomaly'} (${penaltyScore})` : `All Clear (${penaltyScore})`)
                : (isAnomalyDetected ? 'Detected Anomalies!' : 'All Clear')
              }
            </span>
          </div>
          <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {pipSupported && (
              <button onClick={(e) => { e.stopPropagation(); togglePip() }}
                style={{ background: pipActive ? 'rgba(255,255,255,0.2)' : 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 4px', borderRadius: 4 }}
                title={pipActive ? 'Close PiP' : 'Pop-out video (PiP)'}
              >⊞</button>
            )}
            <button onClick={toggleCollapse}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 4px', borderRadius: 4 }}
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >{isCollapsed ? '▲' : '▼'}</button>
            <button onClick={(e) => { e.stopPropagation(); setIsPoppedOut(p => !p) }}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.7rem', padding: '2px 4px', borderRadius: 4 }}
              title={isPoppedOut ? 'Dock' : 'Pop out'}
            >{isPoppedOut ? '⊡' : '⊞'}</button>
          </div>
        </div>

        {/* Video container */}
        <div style={{ position: 'relative', width: '100%', height: videoHeight, overflow: 'hidden', transition: 'height 0.3s', background: '#111' }}>
          {error && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.9)', color: '#fcd34d', padding: 16, textAlign: 'center', gap: 8,
            }}>
              <span style={{ fontSize: '2rem' }}>📷</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{error}</span>
              <span style={{ fontSize: '0.65rem', color: '#888' }}>Grant camera permission</span>
            </div>
          )}

          {!isCollapsed && (
            <video ref={videoRef} autoPlay muted playsInline style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: 'scaleX(-1)', display: 'block',
            }} />
          )}

          {/* Anomaly overlay — always show when there are recent anomalies */}
          {recentAnomalies.length > 0 && !isCollapsed && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.75)', zIndex: 10,
              display: 'flex', flexDirection: 'column', padding: 10, pointerEvents: 'none',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'proctor-pulse 1s infinite' }} />
                Anomaly Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {recentAnomalies.slice(-5).reverse().map((a, i) => {
                  const sev = SEVERITY_COLORS[a.severity] || SEVERITY_COLORS[1]
                  return (
                    <div key={i} style={{
                      fontSize: '0.6rem', color: sev.text, display: 'flex', alignItems: 'center',
                      gap: 5, padding: '3px 6px', borderRadius: 4, background: sev.bg,
                      borderLeft: `3px solid ${sev.border}`,
                    }}>
                      <span>{ANOMALY_ICONS[a.type] || '⚠️'}</span>
                      <span style={{ flex: 1 }}>{ANOMALY_LABELS[a.type] || a.type.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>
                        {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!error && !isCollapsed && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(0,0,0,0.7)', color: isRunning ? '#22c55e' : '#888',
              fontSize: '0.6rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, padding: '3px 8px', zIndex: 5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: isRunning ? '#22c55e' : '#555', boxShadow: isRunning ? '0 0 4px #22c55e' : 'none' }} />
              <span>{isRunning ? 'Monitoring Active' : 'Starting...'}</span>
              <FaceBadge faceCount={faceCount} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
