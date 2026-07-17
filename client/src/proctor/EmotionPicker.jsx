/**
 * EmotionPicker — 5-emoji emotion self-report component.
 *
 * Shown after quiz completion. Students can select an emotion
 * and optionally provide text feedback.
 */

import { useState } from 'react'
import { submitEmotion } from './proctorEvents'

const EMOTIONS = [
  { key: 'very_sad', emoji: '😞', label: 'Very Hard', color: '#ef4444' },
  { key: 'sad', emoji: '😕', label: 'Hard', color: '#f97316' },
  { key: 'neutral', emoji: '😐', label: 'Okay', color: '#eab308' },
  { key: 'happy', emoji: '🙂', label: 'Good', color: '#84cc16' },
  { key: 'very_happy', emoji: '😊', label: 'Easy', color: '#22c55e' },
]

export default function EmotionPicker({ quizType, onSubmit, onSkip }) {
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!selected) return
    await submitEmotion({ quizType, emotion: selected, feedback })
    setSubmitted(true)
    setTimeout(() => onSubmit?.(), 1500)
  }

  if (submitted) {
    return (
      <div className="proctor-emotion-container">
        <div className="proctor-emotion-thanks">Thanks for your feedback!</div>
      </div>
    )
  }

  return (
    <div className="proctor-emotion-container">
      <h3 className="proctor-emotion-title">How was that quiz?</h3>
      <p className="proctor-emotion-subtitle">Your feedback helps us improve</p>

      <div className="proctor-emotion-row">
        {EMOTIONS.map(e => (
          <button
            key={e.key}
            className={`proctor-emotion-btn ${selected === e.key ? 'selected' : ''}`}
            style={selected === e.key ? { borderColor: e.color, background: `${e.color}15` } : {}}
            onClick={() => setSelected(e.key)}
          >
            <span className="proctor-emotion-emoji">{e.emoji}</span>
            <span className="proctor-emotion-label">{e.label}</span>
          </button>
        ))}
      </div>

      {selected && (
        <textarea
          className="proctor-emotion-feedback"
          placeholder="Optional: tell us more (max 300 chars)"
          maxLength={300}
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
        />
      )}

      <div className="proctor-emotion-actions">
        <button className="proctor-btn proctor-btn-skip" onClick={onSkip}>Skip</button>
        <button
          className="proctor-btn proctor-btn-accept"
          onClick={handleSubmit}
          disabled={!selected}
        >
          Submit Feedback
        </button>
      </div>
    </div>
  )
}
