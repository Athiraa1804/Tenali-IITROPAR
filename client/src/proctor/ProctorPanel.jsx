/**
 * ProctorPanel — Left-side proctoring panel matching vibe's architecture.
 *
 * Architecture (like vibe):
 *   1. Camera lifecycle managed here
 *   2. Detection hooks set state (isBlur, isSpeaking, etc.)
 *   3. Single polling loop (100ms) checks all states → fires anomalies
 *   4. FloatingVideo renders the UI
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import useProctor from './useProctor'
import FloatingVideo from './FloatingVideo'
import useTabSwitch from './useTabSwitch'
import useAntiCheat from './useAntiCheat'
import useBlurDetector from './useBlurDetector'
import useVoiceDetection from './useVoiceDetection'
import { reportProctorEvent } from './proctorEvents'

const GRACE_PERIOD_MS = 10000
const ANOMALY_CHECK_INTERVAL_MS = 500

export default function ProctorPanel() {
  const {
    enabled, settings, sessionId, penaltyScore, anomalies,
    addPenalty, addAnomaly, camera, cameraError, setCameraError,
  } = useProctor()

  // Detection states (set by hooks, read by polling loop)
  const [isBlur, setIsBlur] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const [contiguousAnomalyPoints, setContiguousAnomalyPoints] = useState(0)
  const [penaltyType, setPenaltyType] = useState('')
  const [isAnomalyDetected, setIsAnomalyDetected] = useState(false)
  const [anomalyDetectionReady, setAnomalyDetectionReady] = useState(false)
  const readyTimeRef = useRef(0)
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
    return () => { cancelled = true; camera.stop() }
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark anomaly detection ready after grace period
  useEffect(() => {
    if (enabled && camera.isRunning && !anomalyDetectionReady) {
      const timer = setTimeout(() => {
        readyTimeRef.current = Date.now()
        setAnomalyDetectionReady(true)
      }, GRACE_PERIOD_MS)
      return () => clearTimeout(timer)
    }
  }, [enabled, camera.isRunning, anomalyDetectionReady])

  // Tab switch detection — fires addAnomaly directly
  useTabSwitch({
    onTabSwitch: useCallback((evt) => {
      if (!enabled || !anomalyDetectionReady) return
      const now = Date.now()
      if (lastAnomalyTime.current[evt.type] && now - lastAnomalyTime.current[evt.type] < 5000) return
      lastAnomalyTime.current[evt.type] = now
      addAnomaly(evt)
      addPenalty(1)
      reportProctorEvent({ sessionId, type: evt.type, severity: 1 })
    }, [enabled, anomalyDetectionReady, sessionId, addAnomaly, addPenalty]),
    enabled,
  })

  // Anti-cheat detection
  useAntiCheat({
    enabled,
    onViolation: useCallback((evt) => {
      if (!enabled || !anomalyDetectionReady) return
      const now = Date.now()
      if (lastAnomalyTime.current[evt.type] && now - lastAnomalyTime.current[evt.type] < 5000) return
      lastAnomalyTime.current[evt.type] = now
      addAnomaly(evt)
      addPenalty(1)
      reportProctorEvent({ sessionId, type: evt.type, severity: 1 })
    }, [enabled, anomalyDetectionReady, sessionId, addAnomaly, addPenalty]),
  })

  // Blur detection — sets state, polling loop evaluates
  useBlurDetector({
    videoRef: camera.videoRef,
    enabled: enabled && settings.blurDetection && anomalyDetectionReady,
    onAnomaly: useCallback((blurState) => {
      setIsBlur(blurState)
    }, []),
  })

  // Voice detection — sets state, polling loop evaluates
  useVoiceDetection({
    enabled: enabled && settings.voiceDetection && anomalyDetectionReady,
    onAnomaly: useCallback((voiceState) => {
      setIsSpeaking(voiceState)
    }, []),
  })

  // Single polling loop — like vibe's 100ms interval
  useEffect(() => {
    if (!enabled || !anomalyDetectionReady) return

    const interval = setInterval(() => {
      let newPenalty = 0
      let newType = ''
      const activeAnomalies = []

      // Check blur
      if (isBlur && settings.blurDetection) {
        activeAnomalies.push({ type: 'blur_detected', severity: 1 })
        newPenalty += 1
        newType = 'Camera Obscured'
      }

      // Check voice
      if (isSpeaking && settings.voiceDetection) {
        activeAnomalies.push({ type: 'voice_detected', severity: 1 })
        newPenalty += 1
        newType = 'Speaking Detected'
      }

      if (activeAnomalies.length > 0) {
        setIsAnomalyDetected(true)
        setPenaltyType(newType)
        setContiguousAnomalyPoints(prev => {
          const newPoints = prev + newPenalty
          addPenalty(newPenalty)
          for (const a of activeAnomalies) {
            const now = Date.now()
            if (!lastAnomalyTime.current[a.type] || now - lastAnomalyTime.current[a.type] > 5000) {
              lastAnomalyTime.current[a.type] = now
              addAnomaly(a)
              reportProctorEvent({ sessionId, type: a.type, severity: a.severity })
            }
          }
          return newPoints
        })
      } else {
        setIsAnomalyDetected(false)
        if (contiguousAnomalyPoints > 0) {
          setContiguousAnomalyPoints(0)
        }
      }
    }, ANOMALY_CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [enabled, anomalyDetectionReady, isBlur, isSpeaking, settings, contiguousAnomalyPoints, sessionId, addAnomaly, addPenalty])

  if (!enabled) return null

  return (
    <FloatingVideo
      videoRef={camera.videoRef}
      isRunning={camera.isRunning}
      error={cameraError}
      penaltyScore={penaltyScore}
      anomalies={anomalies}
      isAnomalyDetected={isAnomalyDetected}
      penaltyType={penaltyType}
    />
  )
}
