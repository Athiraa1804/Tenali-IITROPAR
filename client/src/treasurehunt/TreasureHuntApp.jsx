import { useEffect, useMemo, useState } from 'react'
import './treasurehunt.css'
import EquationGate from './EquationGate'

const API = import.meta.env.VITE_API_BASE_URL || ''

function emptyGrid(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ status: 'hidden' }))
  )
}

// ─── Auth helper (reads existing Tenali auth from localStorage) ─────────────
function getUsername() {
  try {
    const raw = localStorage.getItem('tenali-auth-user')
    const user = raw ? JSON.parse(raw) : null
    return user?.username || 'guest'
  } catch { return 'guest' }
}

// ─── Persistence helpers ────────────────────────────────────────────────────
function getProgressKey() {
  return `tenali-treasurehunt-progress-${getUsername()}`
}

function loadAllProgress() {
  try {
    const raw = localStorage.getItem(getProgressKey())
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveWorldProgress(worldId, topicTiers) {
  const all = loadAllProgress()
  all[worldId] = { topicTiers, lastPlayed: Date.now() }
  try {
    localStorage.setItem(getProgressKey(), JSON.stringify(all))
  } catch {}
}

function getWorldProgress(worldId) {
  const all = loadAllProgress()
  return all[worldId] || null
}

export default function TreasureHuntApp({ onBack }) {
  // How-to-Play: show once per browser session
  const [showHowToPlay, setShowHowToPlay] = useState(() => {
    return !sessionStorage.getItem('th-how-to-play-seen')
  })

  // ── Phase machine ──────────────────────────────────────────────────────────
  // Phases: 'worldSelect' → 'confidenceSelect' → 'diagnostic' → 'playing'
  const [phase, setPhase] = useState('worldSelect')

  // World select state
  const [worlds, setWorlds] = useState([])
  const [loadError, setLoadError] = useState('')
  const [loadingWorlds, setLoadingWorlds] = useState(true)
  const [selectedWorldId, setSelectedWorldId] = useState(null)
  const [selectedWorld, setSelectedWorld] = useState(null)

  // Resume-or-fresh prompt state (Part H)
  const [resumePrompt, setResumePrompt] = useState(null)  // { worldId, worldName, savedTiers }

  // Confidence select (no extra state needed beyond selectedWorld)

  // Topic tiers (populated by confidence pick, diagnostic result, or loaded progress)
  const [topicTiers, setTopicTiers] = useState(null)

  // Diagnostic state
  const [diagnosticId, setDiagnosticId] = useState(null)
  const [diagnosticQuestions, setDiagnosticQuestions] = useState([])
  const [diagnosticIndex, setDiagnosticIndex] = useState(0)
  const [diagnosticLoading, setDiagnosticLoading] = useState(false)
  const [diagnosticSubmitting, setDiagnosticSubmitting] = useState(false)

  // Playing state
  const [startError, setStartError] = useState('')
  const [starting, setStarting] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [gridSize, setGridSize] = useState(5)
  const [lives, setLives] = useState(3)
  const [tier, setTier] = useState('easy')
  const [cells, setCells] = useState(() => emptyGrid(5))
  const [revealError, setRevealError] = useState('')
  const [revealing, setRevealing] = useState(false)
  const [activeGateCell, setActiveGateCell] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [hintCell, setHintCell] = useState(null)
  const [hasTappedOnce, setHasTappedOnce] = useState(false)

  const dismissHowToPlay = () => {
    sessionStorage.setItem('th-how-to-play-seen', '1')
    setShowHowToPlay(false)
  }

  // ── Part D: Fetch worlds on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoadingWorlds(true)
    setLoadError('')
    fetch(`${API}/treasurehunt-api/worlds`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        setWorlds(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        if (cancelled) return
        setLoadError(e.message || 'Failed to load worlds')
      })
      .finally(() => {
        if (!cancelled) setLoadingWorlds(false)
      })
    return () => { cancelled = true }
  }, [])

  // ── Part D: Handle world card click ────────────────────────────────────────
  const handleWorldClick = (world) => {
    setSelectedWorldId(world.id)
    setSelectedWorld(world)

    // Part H: Check localStorage for saved progress
    const saved = getWorldProgress(world.id)
    if (saved && saved.topicTiers) {
      setResumePrompt({
        worldId: world.id,
        worldName: world.name,
        savedTiers: saved.topicTiers,
      })
    } else {
      setPhase('confidenceSelect')
    }
  }

  // Part H: Resume with saved tiers
  const handleResume = () => {
    setTopicTiers(resumePrompt.savedTiers)
    setResumePrompt(null)
    startGame(resumePrompt.savedTiers)
  }

  // Part H: Start fresh (go to confidence)
  const handleStartFresh = () => {
    setResumePrompt(null)
    setPhase('confidenceSelect')
  }

  // ── Part E: Confidence pick ────────────────────────────────────────────────
  const handleConfidencePick = (level) => {
    const activeTopics = selectedWorld.topics.filter(t => t.status === 'active')
    if (level === 'adaptive') {
      setPhase('diagnostic')
      return
    }
    const tierValue = { beginner: 'easy', confident: 'medium', advanced: 'hard' }[level]
    const tiers = {}
    activeTopics.forEach(t => { tiers[t.topic] = tierValue })
    setTopicTiers(tiers)
    startGame(tiers)
  }

  // ── Part F: Diagnostic flow ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'diagnostic' || !selectedWorldId) return
    let cancelled = false
    setDiagnosticLoading(true)
    fetch(`${API}/treasurehunt-api/diagnostic/start?worldId=${encodeURIComponent(selectedWorldId)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (cancelled) return
        setDiagnosticId(data.diagnosticId)
        setDiagnosticQuestions(data.questions)
        setDiagnosticIndex(0)
      })
      .catch(e => {
        if (!cancelled) setLoadError(e.message || 'Failed to start diagnostic')
      })
      .finally(() => { if (!cancelled) setDiagnosticLoading(false) })
    return () => { cancelled = true }
  }, [phase, selectedWorldId])

  const handleDiagnosticAnswer = async (selectedOption) => {
    if (diagnosticSubmitting) return
    setDiagnosticSubmitting(true)
    const q = diagnosticQuestions[diagnosticIndex]
    try {
      await fetch(`${API}/treasurehunt-api/diagnostic/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnosticId, topic: q.topic, selectedOption }),
      })

      if (diagnosticIndex < diagnosticQuestions.length - 1) {
        setDiagnosticIndex(diagnosticIndex + 1)
      } else {
        // All answered — finish diagnostic
        const r = await fetch(`${API}/treasurehunt-api/diagnostic/finish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diagnosticId }),
        })
        if (!r.ok) throw new Error(`Server returned ${r.status}`)
        const data = await r.json()
        setTopicTiers(data.topicTiers)
        // Part H: save diagnostic result
        saveWorldProgress(selectedWorldId, data.topicTiers)
        startGame(data.topicTiers)
      }
    } catch (e) {
      setLoadError(e.message || 'Diagnostic error')
    } finally {
      setDiagnosticSubmitting(false)
    }
  }

  // ── Start game (shared by confidence, diagnostic, and resume) ──────────────
  const startGame = async (tiers) => {
    setStarting(true)
    setStartError('')
    try {
      const r = await fetch(`${API}/treasurehunt-api/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worldId: selectedWorldId, topicTiers: tiers, gridSize: 5 }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error || `Server returned ${r.status}`)
      }
      const data = await r.json()
      setSessionId(data.sessionId)
      setGridSize(data.gridSize)
      setLives(data.lives)
      setTier(data.tier || 'easy')
      setCells(emptyGrid(data.gridSize))
      setHintCell(data.hintCell || null)
      setHasTappedOnce(false)
      setRevealError('')
      setGameOver(false)
      setPhase('playing')
    } catch (e) {
      setStartError(e.message || 'Failed to start session')
    } finally {
      setStarting(false)
    }
  }

  // ── Cell tap (updated for flood-fill) ──────────────────────────────────────
  const applyFloodCells = (floodCells) => {
    if (!floodCells || floodCells.length === 0) return
    setCells(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })))
      floodCells.forEach(({ row, col, neighborCount }) => {
        next[row][col] = { status: 'revealed', neighborCount }
      })
      return next
    })
  }

  const handleCellTap = async (row, col) => {
    if (phase !== 'playing' || !sessionId || revealing || gameOver) return
    const cell = cells[row][col]
    if (cell.status !== 'hidden') return

    if (!hasTappedOnce) setHasTappedOnce(true)
    setRevealing(true)
    setRevealError('')
    try {
      const r = await fetch(`${API}/treasurehunt-api/cell/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, row, col }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error || `Server returned ${r.status}`)
      }
      const data = await r.json()
      if (data.type === 'treasure') {
        setCells((prev) => {
          const next = prev.map((r) => r.map((c) => ({ ...c })))
          next[row][col] = { status: 'treasure', neighborCount: data.neighborCount }
          return next
        })
      } else if (data.type === 'revealed') {
        // Flood-fill: zero-count cell auto-revealed without question
        applyFloodCells(data.cells)
      } else {
        // Open the EquationGate popup
        setActiveGateCell({ row, col })
      }
    } catch (e) {
      setRevealError(e.message || 'Failed to reveal cell')
    } finally {
      setRevealing(false)
    }
  }

  const handleGateCorrect = (neighborCount, newTier, livesLeft, floodCells) => {
    const { row, col } = activeGateCell
    setCells((prev) => {
      const next = prev.map((r) => r.map((c) => ({ ...c })))
      next[row][col] = { status: 'revealed', neighborCount }
      return next
    })
    setTier(newTier)
    setLives(livesLeft)
    setActiveGateCell(null)
    // Apply any flood-fill cells from the correct answer
    if (floodCells && floodCells.length > 0) {
      applyFloodCells(floodCells)
    }
  }

  const handleGateWrong = (livesLeft, newTier) => {
    setTier(newTier)
    setLives(livesLeft)
    setActiveGateCell(null)
    if (livesLeft === 0) {
      setGameOver(true)
      // Part H: save progress on game over
      if (topicTiers && selectedWorldId) {
        saveWorldProgress(selectedWorldId, topicTiers)
      }
    }
  }

  const handleGateClose = () => {
    setActiveGateCell(null)
  }

  // Part H: save progress when navigating back
  const handleBack = () => {
    if (topicTiers && selectedWorldId && phase === 'playing') {
      saveWorldProgress(selectedWorldId, topicTiers)
    }
    onBack()
  }

  // ── World name for display ─────────────────────────────────────────────────
  const worldDisplayName = selectedWorld?.name || ''

  return (
    <>
      {/* How to Play modal */}
      {showHowToPlay && (
        <div className="th-htp-overlay">
          <div className="th-htp-popup">
            <h2 className="th-htp-title">How to Play: Treasure Hunt — Solve & Seek</h2>
            <ul className="th-htp-rules">
              <li>Tap a cell to search for treasure</li>
              <li>Find treasure and the cell opens right away, showing how many more treasures are hiding nearby</li>
              <li>Tap an empty cell and you'll need to solve a quick question first</li>
              <li>Get it right, the cell opens. Get it wrong, you lose a life</li>
              <li>Clear the whole grid to win!</li>
            </ul>
            <button type="button" className="th-htp-btn" onClick={dismissHowToPlay}>
              Let the hunt begin!
            </button>
          </div>
        </div>
      )}

      {/* Part H: Resume-or-fresh prompt (overlays worldSelect) */}
      {resumePrompt && (
        <div className="th-htp-overlay">
          <div className="th-htp-popup">
            <h2 className="th-htp-title">{resumePrompt.worldName}</h2>
            <p style={{ color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              You have saved progress in this world.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="button" className="th-htp-btn" onClick={handleResume}>
                Continue where you left off
              </button>
              <button
                type="button"
                className="th-htp-btn"
                style={{ background: 'linear-gradient(135deg, #546e7a, #37474f)' }}
                onClick={handleStartFresh}
              >
                Start fresh
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="header-row">
        <button type="button" className="back-button" onClick={handleBack}>← Home</button>
      </div>
      <h1>Treasure Hunt</h1>
      <p className="subtitle">Solve &amp; seek on a treasure grid</p>

      {/* ═══ PHASE: worldSelect ═══ */}
      {phase === 'worldSelect' && (
        <div className="welcome-box">
          {loadingWorlds && <p className="th-loading">Loading worlds…</p>}
          {loadError && <p className="th-error">{loadError}</p>}
          {!loadingWorlds && !loadError && worlds.length === 0 && (
            <p className="th-loading">No worlds available.</p>
          )}
          {!loadingWorlds && !loadError && worlds.length > 0 && (
            <>
              <p className="welcome-text">Choose your adventure!</p>
              <div className="th-worlds-grid">
                {worlds.map((w) => {
                  const activeCount = w.topics.filter(t => t.status === 'active').length
                  const totalCount = w.topics.length
                  return (
                    <button
                      key={w.id}
                      type="button"
                      className="th-world-card"
                      onClick={() => handleWorldClick(w)}
                    >
                      <span className="th-world-icon">{w.icon}</span>
                      <span className="th-world-name">{w.name}</span>
                      <span className="th-world-meta">
                        {activeCount} of {totalCount} topics ready
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ PHASE: confidenceSelect ═══ */}
      {phase === 'confidenceSelect' && selectedWorld && (
        <div className="welcome-box">
          <h2 className="th-conf-heading">Before we begin...</h2>
          <p className="th-conf-sub">How confident are you in {selectedWorld.name}?</p>
          <div className="th-conf-grid">
            <button type="button" className="th-conf-card th-conf-beginner" onClick={() => handleConfidencePick('beginner')}>
              <span className="th-conf-icon">🟢</span>
              <span className="th-conf-label">Beginner Explorer</span>
              <span className="th-conf-desc">I know the basics.</span>
            </button>
            <button type="button" className="th-conf-card th-conf-confident" onClick={() => handleConfidencePick('confident')}>
              <span className="th-conf-icon">🔵</span>
              <span className="th-conf-label">Confident Learner</span>
              <span className="th-conf-desc">I'm comfortable with most questions.</span>
            </button>
            <button type="button" className="th-conf-card th-conf-advanced" onClick={() => handleConfidencePick('advanced')}>
              <span className="th-conf-icon">🟣</span>
              <span className="th-conf-label">Advanced Challenger</span>
              <span className="th-conf-desc">I enjoy difficult questions.</span>
            </button>
            <button type="button" className="th-conf-card th-conf-adaptive" onClick={() => handleConfidencePick('adaptive')}>
              <span className="th-conf-icon">🟠</span>
              <span className="th-conf-label">Adaptive <small>(Recommended)</small></span>
              <span className="th-conf-desc">Let the game understand my level.</span>
            </button>
          </div>
          {startError && <p className="th-error">{startError}</p>}
          {starting && <p className="th-loading">Starting…</p>}
        </div>
      )}

      {/* ═══ PHASE: diagnostic ═══ */}
      {phase === 'diagnostic' && (
        <div className="welcome-box">
          <h2 className="th-conf-heading">Quick Diagnostic</h2>
          <p className="th-conf-sub">We'll ask 5 quick questions to understand your level.</p>
          {diagnosticLoading && <p className="th-loading">Preparing questions…</p>}
          {loadError && <p className="th-error">{loadError}</p>}
          {!diagnosticLoading && diagnosticQuestions.length > 0 && (
            <div className="th-diagnostic-body">
              <p className="th-diag-progress">
                Question {diagnosticIndex + 1} of {diagnosticQuestions.length}
              </p>
              <div className="th-diag-progress-bar">
                <div
                  className="th-diag-progress-fill"
                  style={{ width: `${((diagnosticIndex) / diagnosticQuestions.length) * 100}%` }}
                />
              </div>
              <p className="th-diag-topic">
                Topic: {diagnosticQuestions[diagnosticIndex].topic}
              </p>
              <p className="eg-question">{diagnosticQuestions[diagnosticIndex].questionText}</p>
              <div className="eg-options">
                {diagnosticQuestions[diagnosticIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    className="eg-option-btn"
                    disabled={diagnosticSubmitting}
                    onClick={() => handleDiagnosticAnswer(opt)}
                  >
                    {String(opt)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {starting && <p className="th-loading">Starting game…</p>}
        </div>
      )}

      {/* ═══ PHASE: playing ═══ */}
      {phase === 'playing' && (
        <>
          <div className="th-status-row">
            <div className="progress-pill">{worldDisplayName}</div>
            <div className="progress-pill">Lives: {lives}</div>
          </div>
          {gameOver ? (
            <div className="th-gameover">
              <h2>Game Over</h2>
              <button
                type="button"
                className="th-htp-btn"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  setPhase('worldSelect')
                  setGameOver(false)
                  setSessionId(null)
                }}
              >
                Back to Worlds
              </button>
            </div>
          ) : (
            <div
              className="th-grid"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {cells.map((row, r) =>
                row.map((cell, c) => {
                  let label = '?'
                  if (cell.status === 'treasure') {
                    label = cell.neighborCount > 0 ? cell.neighborCount : '★'
                  } else if (cell.status === 'revealed') {
                    label = cell.neighborCount > 0 ? cell.neighborCount : '·'
                  }
                  const isHint = !hasTappedOnce && hintCell &&
                    r === hintCell.row && c === hintCell.col &&
                    cell.status === 'hidden'
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      className={`th-cell ${cell.status}${isHint ? ' th-hint-glow' : ''}`}
                      disabled={cell.status !== 'hidden' || revealing || gameOver}
                      onClick={() => handleCellTap(r, c)}
                      aria-label={`Cell ${r + 1}, ${c + 1}`}
                    >
                      {cell.status === 'hidden' ? '?' : label}
                    </button>
                  )
                })
              )}
            </div>
          )}
          {revealError && <p className="th-error">{revealError}</p>}

          {activeGateCell && (
            <EquationGate
              sessionId={sessionId}
              row={activeGateCell.row}
              col={activeGateCell.col}
              tier={tier}
              moduleName={worldDisplayName}
              lives={lives}
              onCorrect={handleGateCorrect}
              onWrong={handleGateWrong}
              onClose={handleGateClose}
            />
          )}
        </>
      )}
    </>
  )
}
