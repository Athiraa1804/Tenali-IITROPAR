/**
 * useVoiceDetection — Hook to detect voice/speech using Web Audio API.
 *
 * Uses AnalyserNode to monitor microphone input levels.
 * Fires anomaly callback when audio levels exceed threshold.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export default function useVoiceDetection({ enabled = false, onAnomaly, threshold = 0.15 }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const contextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const onRef = useRef(null)
  const graceRef = useRef(true)

  useEffect(() => {
    onRef.current = onAnomaly
  })

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
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      contextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const check = () => {
        analyser.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
        const avg = sum / dataArray.length / 255
        setAudioLevel(avg)

        if (!graceRef.current && avg > threshold) {
          setIsSpeaking(true)
          onRef.current?.({ type: 'voice_detected', severity: 1, metadata: { level: avg.toFixed(3) } })
        } else {
          setIsSpeaking(false)
        }
        rafRef.current = requestAnimationFrame(check)
      }
      check()
    } catch {
      // Microphone access denied — silently ignore
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
  }, [])

  useEffect(() => {
    if (enabled) startListening()
    else stopListening()
    return stopListening
  }, [enabled, startListening, stopListening])

  return { isSpeaking, audioLevel }
}
