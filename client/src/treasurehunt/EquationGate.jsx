import { useEffect, useState } from 'react'
import './equationgate.css'

const API = import.meta.env.VITE_API_BASE_URL || ''

/**
 * EquationGate – popup shown when a non-treasure cell is tapped.
 *
 * Props:
 *   sessionId, row, col, tier, moduleName, lives,
 *   onCorrect(neighborCount, newTier, livesLeft),
 *   onWrong(livesLeft, newTier),
 *   onClose
 */
export default function EquationGate({
  sessionId, row, col, tier, moduleName, lives,
  onCorrect, onWrong, onClose,
}) {
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState([])
  const [checking, setChecking] = useState(false)
  const [currentTier, setCurrentTier] = useState(tier) // from server /question response

  // Wrong-answer feedback state
  const [wrongResult, setWrongResult] = useState(null) // { correctAnswer, tip, livesLeft, newTier }

  // Fetch question on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFetchError('')

    fetch(`${API}/treasurehunt-api/question?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        setQuestionText(data.questionText)
        setOptions(data.options)
        if (data.tier) setCurrentTier(data.tier)
      })
      .catch((e) => {
        if (cancelled) return
        setFetchError(e.message || 'Failed to load question')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [sessionId])

  const handleOptionClick = async (selectedOption) => {
    if (checking || wrongResult) return
    setChecking(true)

    try {
      const r = await fetch(`${API}/treasurehunt-api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, selectedOption, row, col }),
      })
      if (!r.ok) throw new Error(`Server returned ${r.status}`)
      const data = await r.json()

      if (data.correct) {
        onCorrect(data.neighborCount, data.newTier, data.livesLeft, data.floodCells || [])
      } else {
        // Show wrong-answer view; don't close yet
        setWrongResult({
          correctAnswer: data.correctAnswer,
          tip: data.tip,
          livesLeft: data.livesLeft,
          newTier: data.newTier,
        })
      }
    } catch (e) {
      setFetchError(e.message || 'Failed to check answer')
    } finally {
      setChecking(false)
    }
  }

  const handleContinue = () => {
    if (wrongResult) {
      onWrong(wrongResult.livesLeft, wrongResult.newTier)
    }
  }

  // Life dots: filled for remaining lives, empty for lost
  const maxLives = 3
  const currentLives = wrongResult ? wrongResult.livesLeft : lives

  return (
    <div className="eg-overlay" onClick={onClose}>
      <div className="eg-popup" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="eg-header">
          <span className="eg-header-text">
            {moduleName} ({wrongResult ? wrongResult.newTier : currentTier})
          </span>
        </div>

        {/* Body */}
        <div className="eg-body">
          {loading && <p className="eg-loading">Loading question…</p>}
          {fetchError && <p className="eg-error">{fetchError}</p>}

          {!loading && !fetchError && !wrongResult && (
            <>
              <p className="eg-question">{questionText}</p>
              <div className="eg-options">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className="eg-option-btn"
                    disabled={checking}
                    onClick={() => handleOptionClick(opt)}
                  >
                    {String(opt)}
                  </button>
                ))}
              </div>
            </>
          )}

          {wrongResult && (
            <div className="eg-wrong-view">
              <h3 className="eg-wrong-heading">Not quite!</h3>
              <p className="eg-correct-label">
                Correct answer: <strong>{String(wrongResult.correctAnswer)}</strong>
              </p>
              <p className="eg-tip">{wrongResult.tip}</p>
              <button
                type="button"
                className="eg-continue-btn"
                onClick={handleContinue}
              >
                Continue
              </button>
            </div>
          )}

          {/* Life dots */}
          <div className="eg-lives">
            {Array.from({ length: maxLives }, (_, i) => (
              <span
                key={i}
                className={`eg-life-dot ${i < currentLives ? 'filled' : 'empty'}`}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
