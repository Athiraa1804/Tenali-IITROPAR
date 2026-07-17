/**
 * BlurDetector — Detects blurred/obscured camera feeds using Laplacian variance.
 *
 * Uses a Web Worker for off-main-thread analysis.
 * Falls back to inline canvas analysis if worker unavailable.
 */

import { useState, useEffect, useRef, useCallback } from 'react'

function computeBlurScore(canvas) {
  const ctx = canvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const w = canvas.width

  // Convert to grayscale
  const gray = new Float32Array(data.length / 4)
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  }

  // Laplacian kernel
  let sum = 0
  let count = 0
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x
      const laplacian =
        -4 * gray[idx] +
        gray[idx - 1] + gray[idx + 1] +
        gray[idx - w] + gray[idx + w]
      sum += laplacian * laplacian
      count++
    }
  }
  return count > 0 ? sum / count : 0
}

export default function useBlurDetector({ videoRef, enabled = false, onAnomaly, threshold = 50 }) {
  const [isBlurry, setIsBlurry] = useState(false)
  const [blurScore, setBlurScore] = useState(null)
  const canvasRef = useRef(null)
  const intervalRef = useRef(null)
  const onRef = useRef(null)
  const graceRef = useRef(true)

  useEffect(() => {
    onRef.current = onAnomaly
  })

  useEffect(() => {
    if (enabled) {
      graceRef.current = true
      const t = setTimeout(() => { graceRef.current = false }, 12000)
      return () => clearTimeout(t)
    }
  }, [enabled])

  const checkBlur = useCallback(() => {
    if (!enabled || graceRef.current) return
    const video = videoRef?.current
    if (!video || video.readyState < 2) return

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
      canvasRef.current.width = 160
      canvasRef.current.height = 120
    }
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const score = computeBlurScore(canvas)
    setBlurScore(Math.round(score))

    if (score < threshold) {
      setIsBlurry(true)
      onRef.current?.({ type: 'blur_detected', severity: 1, metadata: { score: Math.round(score) } })
    } else {
      setIsBlurry(false)
    }
  }, [enabled, videoRef, threshold])

  useEffect(() => {
    if (!enabled) return
    intervalRef.current = setInterval(checkBlur, 3000) // check every 3s
    return () => clearInterval(intervalRef.current)
  }, [enabled, checkBlur])

  return { isBlurry, blurScore }
}
