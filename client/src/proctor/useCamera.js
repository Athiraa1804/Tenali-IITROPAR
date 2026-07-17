/**
 * useCamera — Hook to manage webcam access via getUserMedia.
 *
 * Provides:
 *   - videoRef: attach to a <video> element
 *   - stream: current MediaStream
 *   - error: any error message
 *   - start/stop camera
 *   - isRunning: whether camera is active
 *   - isGracePeriod: 10s grace period after start
 */

import { useState, useRef, useCallback, useEffect } from 'react'

const GRACE_PERIOD_MS = 10000

export default function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)
  const [isGracePeriod, setIsGracePeriod] = useState(false)
  const [currentStream, setCurrentStream] = useState(null)

  const start = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      setCurrentStream(stream)
      setIsRunning(true)
      setIsGracePeriod(true)
      setTimeout(() => setIsGracePeriod(false), GRACE_PERIOD_MS)
    } catch (e) {
      setError(e.message || 'Camera access denied')
      setIsRunning(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
      setCurrentStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsRunning(false)
    setIsGracePeriod(false)
  }, [])

  // Sync stream to video element whenever either changes.
  // This handles the race where getUserMedia resolves before the <video> mounts.
  useEffect(() => {
    if (currentStream && videoRef.current) {
      videoRef.current.srcObject = currentStream
      videoRef.current.play().catch(() => {})
    }
  }, [currentStream])

  // Also sync on every render in case videoRef was just attached.
  useEffect(() => {
    if (currentStream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = currentStream
      videoRef.current.play().catch(() => {})
    }
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return { videoRef, stream: currentStream, isRunning, error, start, stop, isGracePeriod }
}
