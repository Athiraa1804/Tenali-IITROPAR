/**
 * useCamera — Simplified camera hook matching vibe's pattern.
 *
 * Manages getUserMedia stream and attaches to a <video> ref.
 * The stream is stored in a ref so it persists across renders.
 */

import { useRef, useCallback, useEffect, useState } from 'react'

export default function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)

  const start = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      // Attach stream to video element — try immediately, retry on next frame
      attachStream(videoRef.current, stream)
      requestAnimationFrame(() => attachStream(videoRef.current, stream))
      setIsRunning(true)
    } catch (e) {
      setError(e.message || 'Camera access denied')
      setIsRunning(false)
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsRunning(false)
  }, [])

  // Keep trying to attach stream to video element (handles mount timing)
  useEffect(() => {
    const id = setInterval(() => {
      if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
        attachStream(videoRef.current, streamRef.current)
      }
    }, 500)
    return () => clearInterval(id)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return { videoRef, stream: streamRef, isRunning, error, start, stop }
}

function attachStream(video, stream) {
  if (!video || !stream) return
  if (video.srcObject === stream) return
  video.srcObject = stream
  video.play().catch(() => {})
}
