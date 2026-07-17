/**
 * ProctorPanel — Left-side proctoring panel with webcam + detection hooks.
 *
 * Manages camera lifecycle and runs ALL detection hooks at the App level:
 *   - Tab switch, anti-cheat, face detection, blur, voice, virtual camera
 *   - Shows live webcam feed + anomaly alerts on the left side
 */

import { useEffect, useCallback, useRef } from 'react'
import useProctor from './useProctor'
import FloatingVideo from './FloatingVideo'
import useTabSwitch from './useTabSwitch'
import useAntiCheat from './useAntiCheat'
import useFaceDetection from './useFaceDetection'
import useBlurDetector from './useBlurDetector'
import useVoiceDetection from './useVoiceDetection'
import useVirtualCamera from './useVirtualCamera'
import { reportProctorEvent } from './proctorEvents'

export default function ProctorPanel() {
  const {
    enabled, settings, sessionId, penaltyScore, anomalies,
    addPenalty, addAnomaly, camera, cameraError, setCameraError,
  } = useProctor()

  const lastAnomalyTime = useRef({})

  // Start/stop camera based on proctoring state
  useEffect(() => {
    let cancelled = false
    if (enabled) {
      camera.start()
        .then(() => { if (!cancelled) setCameraError(null) })
        .catch(e => { if (!cancelled) setCameraError(e.message || 'Camera access denied') })
    } else {
      camera.stop()
    }
    return () => {
      cancelled = true
      camera.stop()
    }
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Throttled anomaly handler
  const handleAnomaly = useCallback((evt, severity) => {
    if (!enabled) return
    const now = Date.now()
    if (lastAnomalyTime.current[evt.type] && now - lastAnomalyTime.current[evt.type] < 5000) return
    lastAnomalyTime.current[evt.type] = now
    addAnomaly(evt)
    addPenalty(severity || evt.severity || 1)
    reportProctorEvent({ sessionId, type: evt.type, severity: severity || evt.severity || 1 })
  }, [enabled, sessionId, addAnomaly, addPenalty])

  // Tab switch detection — always on when proctoring enabled
  useTabSwitch({
    onTabSwitch: useCallback((evt) => handleAnomaly(evt, 1), [handleAnomaly]),
    enabled,
  })

  // Anti-cheat detection
  useAntiCheat({
    enabled,
    onViolation: useCallback((evt) => handleAnomaly(evt, 1), [handleAnomaly]),
  })

  // Face detection
  useFaceDetection({
    videoRef: camera.videoRef,
    enabled: enabled && settings.faceDetection,
    onAnomaly: useCallback((evt) => handleAnomaly(evt, evt.severity || 1), [handleAnomaly]),
  })

  // Blur detection
  useBlurDetector({
    videoRef: camera.videoRef,
    enabled: enabled && settings.blurDetection,
    onAnomaly: useCallback((evt) => handleAnomaly(evt, evt.severity || 1), [handleAnomaly]),
  })

  // Voice detection
  useVoiceDetection({
    enabled: enabled && settings.voiceDetection,
    onAnomaly: useCallback((evt) => handleAnomaly(evt, evt.severity || 1), [handleAnomaly]),
  })

  // Virtual camera detection
  useVirtualCamera({
    enabled: enabled && settings.virtualCamera,
    onAnomaly: useCallback((evt) => handleAnomaly(evt, evt.severity || 2), [handleAnomaly]),
  })

  if (!enabled) return null

  return (
    <FloatingVideo
      videoRef={camera.videoRef}
      isRunning={camera.isRunning}
      error={cameraError}
      penaltyScore={penaltyScore}
      anomalies={anomalies}
    />
  )
}
