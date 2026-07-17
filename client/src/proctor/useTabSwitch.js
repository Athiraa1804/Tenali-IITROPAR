/**
 * useTabSwitch — Hook to detect tab/window focus loss.
 *
 * Tracks:
 *   - Whether the document is currently focused
 *   - Count of tab switches during the session
 *   - Fires callback on each tab-away event
 */

import { useState, useEffect, useRef } from 'react'

export default function useTabSwitch({ onTabSwitch, enabled = true }) {
  const [isFocused, setIsFocused] = useState(true)
  const [switchCount, setSwitchCount] = useState(0)
  const onRef = useRef(null)

  useEffect(() => {
    onRef.current = onTabSwitch
  })

  useEffect(() => {
    if (!enabled) return

    const handleVisibility = () => {
      const focused = document.visibilityState === 'visible'
      setIsFocused(focused)
      if (!focused) {
        setSwitchCount(c => c + 1)
        onRef.current?.({ type: 'tab_switch', timestamp: Date.now() })
      }
    }

    const handleBlur = () => {
      setIsFocused(false)
      setSwitchCount(c => c + 1)
      onRef.current?.({ type: 'tab_blur', timestamp: Date.now() })
    }

    const handleFocus = () => {
      setIsFocused(true)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [enabled])

  return { isFocused, switchCount }
}
