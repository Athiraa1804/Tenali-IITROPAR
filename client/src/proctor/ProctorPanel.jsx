/**
 * ProctorPanel — Left-side proctoring panel matching vibe's architecture.
 *
 * Architecture:
 *   1. Camera lifecycle managed here (with audio for voice detection)
 *   2. ALL detection hooks call reportWithScreenshot directly (no polling loop)
 *   3. isAnomalyDetected derived from anomalies array
 *   4. FloatingVideo renders the UI + toast notifications
 *   5. Screenshots captured on each anomaly for dashboard evidence
 *
 * Detection hooks wired:
 *   - useTabSwitch: tab/window focus loss
 *   - useAntiCheat: keyboard shortcuts, right-click
 *   - useBlurDetector: camera obscured/blurry
 *   - useVoiceDetection: speech/audio activity
 *   - useMotionDetector: camera scene changes
 *   - useFaceDetector: face count (0/1/2+)
 *   - useScreenActivity: user idle detection
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import useProctor from './useProctor'
import FloatingVideo from './FloatingVideo'
import useTabSwitch from './useTabSwitch'
import useAntiCheat from './useAntiCheat'
import useBlurDetector from './useBlurDetector'
import useVoiceDetection from './useVoiceDetection'
import useMotionDetector from './useMotionDetector'
import useFaceDetector from './useFaceDetector'
import useScreenActivity from './useScreenActivity'
import { reportProctorEvent, captureScreenshot } from './proctorEvents'

const GRACE_PERIOD_MS = 10000
const PER_TYPE_COOLDOWN_MS = 5000

export default function ProctorPanel() {
  const {
    enabled, settings, sessionId, penaltyScore, anomalies,
    addPenalty, addAnomaly, camera, cameraError, setCameraError,
  } = useProctor()

  const [faceCount, setFaceCount] = useState(1)
  const [penaltyType, setPenaltyType] = useState('')
  const [anomalyDetectionReady, setAnomalyDetectionReady] = useState(false)
  const [isAnomalyDetected, setIsAnomalyDetected] = useState(false)
  const readyTimeRef = useRef(0)
  const lastAnomalyTime = useRef({})
  const lastPenaltyTime = useRef({})
  const prevAnomalyCountRef = useRef(0)

  const reportWithScreenshot = useCallback(async (evt, severity) => {
    const screenshot = await captureScreenshot(camera.videoRef.current)
    const enriched = { ...evt, screenshot }
    addAnomaly(enriched)

    const now = Date.now()
    const key = evt.type
    if (!lastPenaltyTime.current[key] || now - lastPenaltyTime.current[key] > PER_TYPE_COOLDOWN_MS) {
      lastPenaltyTime.current[key] = now
      addPenalty(severity || evt.severity || 1)
      setPenaltyType(evt.type)
    }

    reportProctorEvent({ sessionId, type: evt.type, severity: severity || evt.severity || 1, evidence: screenshot })
  }, [camera.videoRef, sessionId, addAnomaly, addPenalty])

  const throttledReport = useCallback((evt, severity) => {
    const now = Date.now()
    const key = evt.type
    if (lastAnomalyTime.current[key] && now - lastAnomalyTime.current[key] < PER_TYPE_COOLDOWN_MS) return
    lastAnomalyTime.current[key] = now
    reportWithScreenshot(evt, severity)
  }, [reportWithScreenshot])

  // Derive isAnomalyDetected from anomalies array (runs on every render)
  useEffect(() => {
    if (anomalies.length > prevAnomalyCountRef.current) {
      setIsAnomalyDetected(true)
      prevAnomalyCountRef.current = anomalies.length
      const t = setTimeout(() => setIsAnomalyDetected(false), 8000)
      return () => clearTimeout(t)
    }
  }, [anomalies.length])

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

  useEffect(() => {
    if (enabled && camera.isRunning && !anomalyDetectionReady) {
      const timer = setTimeout(() => {
        readyTimeRef.current = Date.now()
        setAnomalyDetectionReady(true)
      }, GRACE_PERIOD_MS)
      return () => clearTimeout(timer)
    }
  }, [enabled, camera.isRunning, anomalyDetectionReady])

  useTabSwitch({
    onTabSwitch: useCallback((evt) => {
      if (!enabled || !anomalyDetectionReady) return
      throttledReport(evt, 1)
    }, [enabled, anomalyDetectionReady, throttledReport]),
    enabled,
  })

  useAntiCheat({
    enabled,
    onViolation: useCallback((evt) => {
      if (!enabled || !anomalyDetectionReady) return
      throttledReport(evt, 1)
    }, [enabled, anomalyDetectionReady, throttledReport]),
  })

  useBlurDetector({
    videoRef: camera.videoRef,
    enabled: enabled && settings.blurDetection && anomalyDetectionReady,
    onAnomaly: useCallback((isBlur) => {
      if (isBlur) {
        throttledReport({ type: 'blur_detected', severity: 2 }, 2)
      }
    }, [throttledReport]),
  })

  useVoiceDetection({
    enabled: enabled && settings.voiceDetection && anomalyDetectionReady,
    streamRef: camera.stream,
    onAnomaly: useCallback((isSpeaking) => {
      if (isSpeaking) {
        throttledReport({ type: 'voice_detected', severity: 1 }, 1)
      }
    }, [throttledReport]),
  })

  useMotionDetector({
    videoRef: camera.videoRef,
    enabled: enabled && settings.motionDetection && anomalyDetectionReady,
    onAnomaly: useCallback((evt) => {
      if (!anomalyDetectionReady) return
      throttledReport(evt, evt.severity || 1)
    }, [anomalyDetectionReady, throttledReport]),
  })

  useFaceDetector({
    videoRef: camera.videoRef,
    enabled: enabled && settings.faceDetection && anomalyDetectionReady,
    onAnomaly: useCallback((evt) => {
      if (!anomalyDetectionReady) return
      throttledReport(evt, evt.severity || 2)
    }, [anomalyDetectionReady, throttledReport]),
    onFaceCount: useCallback((count) => setFaceCount(count), []),
  })

  useScreenActivity({
    enabled: enabled && anomalyDetectionReady,
    onIdle: useCallback((evt) => {
      if (!anomalyDetectionReady) return
      throttledReport(evt, 1)
    }, [anomalyDetectionReady, throttledReport]),
    onActivity: useCallback(() => {}, []),
  })

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
      faceCount={faceCount}
    />
  )
}
