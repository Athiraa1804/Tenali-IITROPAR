/**
 * FloatingVideo — Left-side proctor panel with webcam feed, errors, and anomaly alerts.
 */

import { useState } from 'react'

export default function FloatingVideo({ videoRef, isRunning, error, penaltyScore, anomalies }) {
  const [collapsed, setCollapsed] = useState(false)

  const hasAnomaly = penaltyScore > 0
  const statusColor = error ? '#f59e0b' : hasAnomaly ? '#ef4444' : '#22c55e'
  const statusText = error ? 'Camera Error' : hasAnomaly ? `Penalty: ${penaltyScore}` : 'All Clear'

  return (
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
        background: 'rgba(15, 15, 25, 0.95)',
        borderRight: '2px solid rgba(255,255,255,0.08)',
        borderRadius: '0 12px 12px 0',
        boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
        fontFamily: 'var(--font-body, system-ui, sans-serif)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: collapsed ? '8px 10px' : '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        minHeight: 36,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
              display: 'inline-block',
              animation: hasAnomaly ? 'proctor-pulse 1s infinite' : 'none',
            }} />
            <span style={{ color: statusColor }}>{statusText}</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'none', border: 'none', color: '#aaa', cursor: 'pointer',
            fontSize: '0.85rem', padding: 2, marginLeft: collapsed ? 'auto' : 0,
          }}
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
              width: '100%', height: 140, borderRadius: 8,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 6, padding: 12, boxSizing: 'border-box',
            }}>
              <span style={{ fontSize: '1.5rem' }}>📷</span>
              <span style={{ fontSize: '0.7rem', color: '#fcd34d', textAlign: 'center', lineHeight: 1.3 }}>
                {error}
              </span>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: 140,
                objectFit: 'cover',
                borderRadius: 8,
                display: 'block',
                transform: 'scaleX(-1)',
                background: isRunning ? '#000' : 'rgba(255,255,255,0.05)',
              }}
            />
          )}
          {!isRunning && !error && (
            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#888', marginTop: 4 }}>
              Starting camera...
            </div>
          )}
        </div>
      )}

      {/* Penalty bar */}
      {!collapsed && (
        <div style={{ padding: '4px 12px' }}>
          <div style={{
            height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${Math.min(penaltyScore * 2, 100)}%`,
              background: penaltyScore > 30 ? '#ef4444' : penaltyScore > 10 ? '#f59e0b' : '#22c55e',
              transition: 'width 0.3s, background 0.3s',
            }} />
          </div>
          <div style={{ fontSize: '0.65rem', color: '#888', marginTop: 2, textAlign: 'right' }}>
            {penaltyScore} / 50
          </div>
        </div>
      )}

      {/* Anomaly alerts */}
      {!collapsed && anomalies.length > 0 && (
        <div style={{
          flex: 1, overflowY: 'auto', padding: '4px 8px 8px',
          display: 'flex', flexDirection: 'column', gap: 4,
          maxHeight: 200,
        }}>
          {anomalies.slice(-6).reverse().map((a, i) => (
            <div key={i} style={{
              fontSize: '0.7rem', padding: '4px 8px',
              borderRadius: 6,
              background: a.severity >= 3 ? 'rgba(239,68,68,0.2)' : a.severity >= 2 ? 'rgba(245,158,11,0.2)' : 'rgba(234,179,8,0.15)',
              color: a.severity >= 3 ? '#fca5a5' : a.severity >= 2 ? '#fcd34d' : '#fde68a',
              borderLeft: `3px solid ${a.severity >= 3 ? '#ef4444' : a.severity >= 2 ? '#f59e0b' : '#eab308'}`,
            }}>
              {a.type.replace(/_/g, ' ')}
            </div>
          ))}
        </div>
      )}

      {/* Collapsed status dot */}
      {collapsed && (
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '6px 0',
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
          }} />
        </div>
      )}
    </div>
  )
}
