/**
 * FloatingVideo — Proctor panel matching vibe's architecture.
 *
 * Layout (like vibe):
 *   - Green header bar "All Clear" / Red header bar "Detected Anomalies"
 *   - Live webcam feed below
 *   - Overlay with anomaly details on the video
 *   - Penalty score
 *   - Collapsible
 */

import { useState, useEffect, useRef } from 'react'

const SEVERITY_COLORS = {
  1: { bg: 'rgba(234,179,8,0.2)', border: '#eab308', text: '#fde68a' },
  2: { bg: 'rgba(245,158,11,0.2)', border: '#f59e0b', text: '#fcd34d' },
  3: { bg: 'rgba(239,68,68,0.2)', border: '#ef4444', text: '#fca5a5' },
}

const ANOMALY_LABELS = {
  tab_switch: 'Tab Switched',
  tab_blur: 'Window Lost Focus',
  no_face: 'No Face Detected',
  multiple_faces: 'Multiple Faces',
  blur_detected: 'Camera Obscured',
  voice_detected: 'Speaking Detected',
  virtual_camera: 'Virtual Camera',
  right_click: 'Right Click',
  copy_paste: 'Copy/Paste',
  devtools: 'DevTools',
  idle: 'Inactivity',
}

export default function FloatingVideo({ videoRef, isRunning, error, penaltyScore, anomalies, isAnomalyDetected, penaltyType }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPoppedOut, setIsPoppedOut] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  // Drag handlers for popped-out mode
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return
    if (!isPoppedOut) return
    e.preventDefault()
    setIsDragging(true)
    setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e) => {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    }
    const handleUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, dragOffset])

  const toggleCollapse = (e) => {
    e.stopPropagation()
    setIsCollapsed(c => !c)
  }

  const videoHeight = isCollapsed ? 1 : 196
  const containerHeight = isCollapsed ? 34 : 230

  return (
    <div
      ref={containerRef}
      className="proctor-sidebar"
      style={isPoppedOut ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: 224,
        height: containerHeight,
        zIndex: 999999,
        cursor: isDragging ? 'grabbing' : 'grab',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      } : {
        position: 'fixed',
        top: 60,
        left: 0,
        zIndex: 10000,
        width: 224,
        height: containerHeight,
        transition: 'height 0.3s ease',
        borderRadius: '0 12px 12px 0',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header bar — like vibe: green = clear, red = anomaly */}
      <div
        style={{
          background: isAnomalyDetected ? '#dc2626' : '#16a34a',
          color: 'white',
          padding: '0 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 34,
          fontSize: '0.8rem',
          fontWeight: 600,
          transition: 'background 0.3s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span>{isAnomalyDetected ? '⚠️' : '☑️'}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isCollapsed
              ? (isAnomalyDetected ? `${penaltyType || 'Anomaly'} (${penaltyScore})` : `All Clear (${penaltyScore})`)
              : (isAnomalyDetected ? `Detected Anomalies!` : 'All Clear')
            }
          </span>
        </div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button
            onClick={toggleCollapse}
            style={{
              background: 'none', border: 'none', color: 'white', cursor: 'pointer',
              fontSize: '0.7rem', padding: '2px 4px', borderRadius: 4,
            }}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▲' : '▼'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsPoppedOut(p => !p) }}
            style={{
              background: 'none', border: 'none', color: 'white', cursor: 'pointer',
              fontSize: '0.7rem', padding: '2px 4px', borderRadius: 4,
            }}
            title={isPoppedOut ? 'Dock' : 'Pop out'}
          >
            {isPoppedOut ? '⊡' : '⊞'}
          </button>
        </div>
      </div>

      {/* Video container — like vibe: always renders, hidden when collapsed */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: videoHeight,
        overflow: 'hidden',
        transition: 'height 0.3s',
        background: '#111',
      }}>
        {/* Grace period / loading overlay */}
        {error && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.9)', color: '#fcd34d',
            padding: 16, textAlign: 'center', gap: 8,
          }}>
            <span style={{ fontSize: '2rem' }}>📷</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{error}</span>
            <span style={{ fontSize: '0.65rem', color: '#888' }}>Grant camera permission</span>
          </div>
        )}

        {/* Video element */}
        {!isCollapsed && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: 'block',
            }}
          />
        )}

        {/* Anomaly overlay on video — like vibe */}
        {isAnomalyDetected && !isCollapsed && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            padding: 8,
            pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#fbbf24',
              marginBottom: 4,
            }}>
              Anomaly Details
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {anomalies.slice(-4).reverse().map((a, i) => {
                const sev = SEVERITY_COLORS[a.severity] || SEVERITY_COLORS[1]
                return (
                  <div key={i} style={{
                    fontSize: '0.6rem',
                    color: sev.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <span style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: sev.border, flexShrink: 0,
                    }} />
                    {ANOMALY_LABELS[a.type] || a.type.replace(/_/g, ' ')}
                    {a.severity >= 2 && (
                      <span style={{ color: '#ef4444', fontSize: '0.55rem' }}>
                        ({a.severity >= 3 ? 'HIGH' : 'MED'})
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No face message — like vibe's "Please stay in frame" */}
        {!error && !isCollapsed && isRunning && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            fontSize: '0.65rem',
            textAlign: 'center',
            padding: '4px 8px',
            zIndex: 5,
          }}>
            {!isRunning ? 'Starting camera...' : 'Monitoring active'}
          </div>
        )}
      </div>
    </div>
  )
}
