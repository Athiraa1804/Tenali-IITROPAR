/**
 * ProctorPanel — Left-side proctoring panel matching vibe's architecture.
 *
 * Architecture:
 *   1. Camera lifecycle managed here
 *   2. Detection hooks set state (isBlur, isSpeaking, isMotion, faceCount, etc.)
 *   3. Single polling loop (500ms) checks all states → fires anomalies with screenshots
 *   4. FloatingVideo renders the UI
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
const ANOMALY_CHECK_INTERVAL_MS = 500
const PENALTY_COOLDOWN_MS = 5000

export default function ProctorPanel() {
  const {
    enabled, settings, sessionId, penaltyScore, anomalies,
    addPenalty, addAnomaly, camera, cameraError, setCameraError,
  } = useProctor()

  // Detection states (set by hooks, read by polling loop)
  const [isBlur, setIsBlur] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [faceCount, setFaceCount] = useState(1)

  const [penaltyType, setPenaltyType] = useState('')
  const [isAnomalyDetected, setIsAnomalyDetected] = useState(false)
  const [anomalyDetectionReady, setAnomalyDetectionReady] = useState(false)
  const readyTimeRef = useRef(0)
  const lastAnomalyTime = useRef({})
  const lastPenaltyTime = useRef({})

  // Helper: capture screenshot and report anomaly
  const reportWithScreenshot = useCallback(async (evt, severity) => {
    const screenshot = await captureScreenshot(camera.videoRef.current)
    const enriched = { ...evt, screenshot }
    addAnomaly(enriched)
    addPenalty(severity || evt.severity || 1)
    reportProctorEvent({ sessionId, type: evt.type, severity: severity || evt.severity || 1, evidence: screenshot })
  }, [camera.videoRef, sessionId, addAnomaly, addPenalty])

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

  // Tab switch detection
  useTabSwitch({
    onTabSwitch: useCallback((evt) => {
      if (!enabled || !anomalyDetectionReady) return
      const now = Date.now()
      if (lastAnomalyTime.current[evt.type] && now - lastAnomalyTime.current[evt.type] < 5000) return
      lastAnomalyTime.current[evt.type] = now
      reportWithScreenshot(evt, 1)
    }, [enabled, anomalyDetectionReady, reportWithScreenshot]),
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
      reportWithScreenshot(evt, 1)
    }, [enabled, anomalyDetectionReady, reportWithScreenshot]),
  })

  // Blur detection
  useBlurDetector({
    videoRef: camera.videoRef,
    enabled: enabled && settings.blurDetection && anomalyDetectionReady,
    onAnomaly: useCallback((blurState) => {
      setIsBlur(blurState)
    }, []),
  })

  // Voice detection
  useVoiceDetection({
    enabled: enabled && settings.voiceDetection && anomalyDetectionReady,
    onAnomaly: useCallback((voiceState) => {
      setIsSpeaking(voiceState)
    }, []),
  })

  // Motion detection
  useMotionDetector({
    videoRef: camera.videoRef,
    enabled: enabled && settings.motionDetection && anomalyDetectionReady,
    onAnomaly: useCallback((evt) => {
      if (!anomalyDetectionReady) return
      const now = Date.now()
      if (lastAnomalyTime.current[evt.type] && now - lastAnomalyTime.current[evt.type] < 5000) return
      lastAnomalyTime.current[evt.type] = now
      reportWithScreenshot(evt, evt.severity || 1)
    }, [anomalyDetectionReady, reportWithScreenshot]),
  })

  // Face detection
  useFaceDetector({
    videoRef: camera.videoRef,
    enabled: enabled && settings.faceDetection && anomalyDetectionReady,
    onAnomaly: useCallback((evt) => {
      if (!anomalyDetectionReady) return
      const now = Date.now()
      if (lastAnomalyTime.current[evt.type] && now - lastAnomalyTime.current[evt.type] < 5000) return
      lastAnomalyTime.current[evt.type] = now
      reportWithScreenshot(evt, evt.severity || 2)
    }, [anomalyDetectionReady, reportWithScreenshot]),
    onFaceCount: useCallback((count) => setFaceCount(count), []),
  })

  // Screen activity / idle detection
  useScreenActivity({
    enabled: enabled && anomalyDetectionReady,
    onIdle: useCallback((evt) => {
      if (!anomalyDetectionReady) return
      const now = Date.now()
      if (lastAnomalyTime.current['idle'] && now - lastAnomalyTime.current['idle'] < 60000) return
      lastAnomalyTime.current['idle'] = now
      reportWithScreenshot(evt, 1)
    }, [anomalyDetectionReady, reportWithScreenshot]),
    onActivity: useCallback(() => {}, []),
  })

  // Single polling loop — checks all detection states
  useEffect(() => {
    if (!enabled || !anomalyDetectionReady) return

    const interval = setInterval(() => {
      let newType = ''
      const now = Date.now()

      // Check blur
      if (isBlur && settings.blurDetection) {
        newType = 'Camera Obscured'
      }

      // Check voice
      if (isSpeaking && settings.voiceDetection) {
        newType = 'Speaking Detected'
      }

      if (newType) {
        setIsAnomalyDetected(true)
        setPenaltyType(newType)

        // Penalty cooldown — only increment once per 5 seconds per type
        const penaltyKey = isBlur ? 'blur' : 'voice'
        if (!lastPenaltyTime.current[penaltyKey] || now - lastPenaltyTime.current[penaltyKey] > PENALTY_COOLDOWN_MS) {
          lastPenaltyTime.current[penaltyKey] = now
          addPenalty(1)
        }
      } else {
        setIsAnomalyDetected(false)
      }
    }, ANOMALY_CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [enabled, anomalyDetectionReady, isBlur, isSpeaking, settings, addPenalty])

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
