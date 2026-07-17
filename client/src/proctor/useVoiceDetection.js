/**
 * useVoiceDetection — Detects voice/speech using Web Audio API.
 *
 * Fixes applied:
 *   - AudioContext.resume() for browser compatibility
 *   - Frequency band filtering (85Hz-4kHz speech range only)
 *   - Raised threshold to reduce false positives
 *   - Error callback for mic permission denied
 *
 * Sets isSpeaking=true when audio levels exceed threshold.
 * Does NOT fire anomaly callbacks — the parent polling loop evaluates state.
 */

import { useEffect, useRef, useCallback, useState } from 'react'

const SPEECH_HIGH_BIN = 23 // ~4kHz with fftSize=256 at 44.1kHz

export default function useVoiceDetection({ enabled = false, onAnomaly, onMicError, threshold = 0.25 }) {
  const [micPermissionDenied, setMicPermissionDenied] = useState(false)
  const contextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const onRef = useRef(null)
  const onErrorRef = useRef(null)
  const graceRef = useRef(true)

  useEffect(() => { onRef.current = onAnomaly })
  useEffect(() => { onErrorRef.current = onMicError })

  useEffect(() => {
    if (enabled) {
      graceRef.current = true
      const t = setTimeout(() => { graceRef.current = false }, 10000)
      return () => clearTimeout(t)
    }
  }, [enabled])

  const startListening = useCallback(async () => {
    if (!enabled) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      setMicPermissionDenied(false)

      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      contextRef.current = ctx

      // Resume AudioContext — required by browsers after user gesture
      await ctx.resume()

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.3
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const check = () => {
        analyser.getByteFrequencyData(dataArray)

        // Sum only speech frequency band (bins 1 to ~4kHz)
        // Skip bin 0 (DC offset / noise floor)
        let sum = 0
        let count = 0
        const highBin = Math.min(SPEECH_HIGH_BIN, dataArray.length)
        for (let i = 1; i < highBin; i++) {
          sum += dataArray[i]
          count++
        }
        const avg = count > 0 ? sum / count / 255 : 0

        if (!graceRef.current) {
          onRef.current?.(avg > threshold)
        }
        rafRef.current = requestAnimationFrame(check)
      }
      check()
    } catch (err) {
      setMicPermissionDenied(true)
      onErrorRef.current?.(err.message || 'Microphone access denied')
    }
  }, [enabled, threshold])

  const stopListening = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (contextRef.current) {
      contextRef.current.close().catch(() => {})
      contextRef.current = null
    }
    analyserRef.current = null
    onRef.current?.(false)
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (enabled) void startListening()
    else void stopListening()
    return () => { void stopListening() }
  }, [enabled, startListening, stopListening])
  /* eslint-enable react-hooks/set-state-in-effect */

  return { micPermissionDenied }
}
