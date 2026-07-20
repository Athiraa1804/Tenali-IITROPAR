import { useState, useRef, useCallback, useEffect } from 'react'

const LANGUAGES = [
  { id: 92, name: 'Python 3.11' },
  { id: 109, name: 'Python 3.13' },
  { id: 97, name: 'JavaScript (Node 20)' },
  { id: 102, name: 'JavaScript (Node 22)' },
  { id: 103, name: 'C (GCC 14)' },
  { id: 105, name: 'C++ (GCC 14)' },
  { id: 104, name: 'C (Clang 18)' },
  { id: 91, name: 'Java (JDK 17)' },
  { id: 106, name: 'Go 1.22' },
  { id: 108, name: 'Rust 1.85' },
  { id: 101, name: 'TypeScript 5.6' },
  { id: 72, name: 'Ruby 2.7' },
  { id: 68, name: 'PHP 7.4' },
  { id: 82, name: 'SQL (SQLite)' },
  { id: 46, name: 'Bash 5.0' },
  { id: 111, name: 'Kotlin 2.1' },
  { id: 60, name: 'Go 1.13' },
  { id: 74, name: 'TypeScript 3.7' },
]

const DEFAULT_CODES = {
  92: 'n = int(input("Enter a number: "))\nresult = sum(range(1, n + 1))\nprint(f"Sum of 1 to {n} = {result}")',
  109: 'n = int(input("Enter a number: "))\nresult = sum(range(1, n + 1))\nprint(f"Sum of 1 to {n} = {result}")',
  97: 'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nrl.on("line", (line) => {\n  const n = parseInt(line);\n  const sum = (n * (n + 1)) / 2;\n  console.log(`Sum of 1 to ${n} = ${sum}`);\n  rl.close();\n});',
  103: '#include <stdio.h>\n\nint main() {\n    int n;\n    printf("Enter a number: ");\n    scanf("%d", &n);\n    int sum = n * (n + 1) / 2;\n    printf("Sum of 1 to %d = %d\\n", n, sum);\n    return 0;\n}',
  105: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cout << "Enter a number: ";\n    cin >> n;\n    int sum = n * (n + 1) / 2;\n    cout << "Sum of 1 to " << n << " = " << sum << endl;\n    return 0;\n}',
  104: '#include <stdio.h>\n\nint main() {\n    int n;\n    printf("Enter a number: ");\n    scanf("%d", &n);\n    int sum = n * (n + 1) / 2;\n    printf("Sum of 1 to %d = %d\\n", n, sum);\n    return 0;\n}',
  91: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.print("Enter a number: ");\n        int n = sc.nextInt();\n        int sum = n * (n + 1) / 2;\n        System.out.println("Sum of 1 to " + n + " = " + sum);\n    }\n}',
  106: 'package main\n\nimport "fmt"\n\nfunc main() {\n    var n int\n    fmt.Print("Enter a number: ")\n    fmt.Scan(&n)\n    sum := n * (n + 1) / 2\n    fmt.Printf("Sum of 1 to %d = %d\\n", n, sum)\n}',
  108: 'use std::io;\n\nfn main() {\n    println!("Enter a number: ");\n    let mut input = String::new();\n    io::stdin().read_line(&mut input).unwrap();\n    let n: i64 = input.trim().parse().unwrap();\n    let sum = n * (n + 1) / 2;\n    println!("Sum of 1 to {} = {}", n, sum);\n}',
  101: 'const n = parseInt(prompt("Enter a number:") || "10");\nconst sum = (n * (n + 1)) / 2;\nconsole.log(`Sum of 1 to ${n} = ${sum}`);',
  72: 'print "Enter a number: "\nn = gets.chomp.to_i\nsum = n * (n + 1) / 2\nputs "Sum of 1 to #{n} = #{sum}"',
  46: 'echo "Enter a number:"\nread n\nsum=$((n * (n + 1) / 2))\necho "Sum of 1 to $n = $sum"',
}

function getDefaultCode(langId) {
  return DEFAULT_CODES[langId] || 'print("Hello, World!")'
}

const STATUS_MAP = {
  3: { label: 'Accepted', cls: 'correct' },
  4: { label: 'Wrong Answer', cls: 'wrong' },
  5: { label: 'Time Limit Exceeded', cls: 'wrong' },
  6: { label: 'Compilation Error', cls: 'wrong' },
  7: { label: 'Runtime Error', cls: 'wrong' },
  11: { label: 'Output Limit Exceeded', cls: 'wrong' },
  12: { label: 'Memory Limit Exceeded', cls: 'wrong' },
  13: { label: 'Illegal System Call', cls: 'wrong' },
  14: { label: 'Internal Error', cls: 'wrong' },
}

export default function PlaygroundApp({ onBack }) {
  const [langId, setLangId] = useState(92)
  const [code, setCode] = useState(getDefaultCode(92))
  const [stdin, setStdin] = useState('')
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [showStdin, setShowStdin] = useState(false)
  const [activeTab, setActiveTab] = useState('stdout')
  const [copied, setCopied] = useState(null)
  const lastRunTime = useRef(0)
  const codeRef = useRef(null)

  const handleLangChange = useCallback((newId) => {
    setLangId(newId)
    setCode(getDefaultCode(newId))
    setOutput(null)
    setError(null)
    setActiveTab('stdout')
  }, [])

  const handleRun = useCallback(async () => {
    const now = Date.now()
    if (now - lastRunTime.current < 2000) return
    lastRunTime.current = now
    setRunning(true)
    setOutput(null)
    setError(null)
    setActiveTab('stdout')
    try {
      const res = await fetch('/api/playground/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code, language_id: langId, stdin: stdin || undefined }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setOutput(data)
      if (data.stdout) setActiveTab('stdout')
      else if (data.compile_output) setActiveTab('compile')
      else if (data.stderr) setActiveTab('stderr')
    } catch (err) {
      setError(err.message || 'Failed to execute code')
    } finally {
      setRunning(false)
    }
  }, [code, langId, stdin])

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleRun() }
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target
      const start = ta.selectionStart, end = ta.selectionEnd
      const val = ta.value
      ta.value = val.substring(0, start) + '  ' + val.substring(end)
      ta.selectionStart = ta.selectionEnd = start + 2
      setCode(ta.value)
    }
  }, [handleRun])

  const handleCopy = useCallback((text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    })
  }, [])

  const statusInfo = output?.status ? STATUS_MAP[output.status.id] : null
  const stdout = output?.stdout || ''
  const stderr = output?.stderr || ''
  const compileOut = output?.compile_output || ''

  const tabs = [
    { key: 'stdout', label: 'Output', text: stdout, count: stdout.trim() ? 1 : 0 },
    { key: 'stderr', label: 'Errors', text: stderr, count: stderr.trim() ? 1 : 0 },
    { key: 'compile', label: 'Compiler', text: compileOut, count: compileOut.trim() ? 1 : 0 },
  ]

  useEffect(() => {
    if (!output) return
    const hasStdout = !!stdout.trim()
    const hasStderr = !!stderr.trim()
    const hasCompile = !!compileOut.trim()
    if (!hasStdout && hasCompile) setActiveTab('compile')
    else if (!hasStdout && hasStderr) setActiveTab('stderr')
    else setActiveTab('stdout')
  }, [output]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-shell">
      <div className="card is-wide" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Header row */}
        <div className="header-row" style={{ marginBottom: 16 }}>
          <button className="back-button" onClick={onBack}>← Back</button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 2 }}>
              💻 Code Playground
            </h1>
            <p className="subtitle" style={{ marginBottom: 0, fontSize: '0.88rem' }}>
              Write, run, and test code in 50+ languages
            </p>
          </div>
          <div style={{ width: 80 }} />
        </div>

        {/* Language selector — pill row */}
        <div className="radio-group" style={{ marginBottom: 20, justifyContent: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
          {LANGUAGES.map(l => (
            <button
              key={l.id}
              className={`radio-pill${langId === l.id ? ' active' : ''}`}
              onClick={() => handleLangChange(l.id)}
              style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            >
              {l.name}
            </button>
          ))}
        </div>

        {/* Editor + Output side by side on wide, stacked on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}
          className="playground-grid"
        >
          {/* Left: Code editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
            <div style={{
              background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
              borderRadius: 'var(--radius)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              flex: 1, minHeight: 300,
            }}>
              <div style={{
                padding: '8px 14px', borderBottom: '1px solid var(--clr-border)',
                fontSize: '0.75rem', color: 'var(--clr-text-soft)', fontWeight: 600,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>Source Code</span>
                <span style={{ opacity: 0.5 }}>⌘/Ctrl + Enter</span>
              </div>
              <textarea
                ref={codeRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                style={{
                  flex: 1, width: '100%', background: 'transparent', color: 'var(--clr-text)',
                  border: 'none', outline: 'none', resize: 'none', padding: '14px 16px',
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontSize: '0.88rem', lineHeight: 1.65, tabSize: 2, minHeight: 260,
                }}
                placeholder="Write your code here..."
              />
            </div>

            {/* Stdin toggle */}
            <div>
              <button
                className="back-button"
                onClick={() => setShowStdin(s => !s)}
                style={{ fontSize: '0.82rem', padding: '5px 12px' }}
              >
                {showStdin ? '▾ Hide' : '▸ Show'} Standard Input
              </button>
              {showStdin && (
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  spellCheck={false}
                  rows={3}
                  style={{
                    width: '100%', marginTop: 8, background: 'var(--clr-surface)',
                    color: 'var(--clr-text)', border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)', outline: 'none', resize: 'vertical',
                    padding: '10px 14px', minHeight: 40, maxHeight: 120, boxSizing: 'border-box',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', lineHeight: 1.5,
                  }}
                  placeholder="Optional — stdin for your program..."
                />
              )}
            </div>

            {/* Run button */}
            <div className="button-row" style={{ marginTop: 4 }}>
              <button
                onClick={handleRun}
                disabled={running}
                style={{ minWidth: 160, fontSize: '1rem', fontWeight: 700 }}
              >
                {running ? '⏳ Running...' : '▶  Run Code'}
              </button>
            </div>
          </div>

          {/* Right: Output panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Status pill */}
            {statusInfo && (
              <div className={`feedback ${statusInfo.cls}`} style={{ marginBottom: 12, padding: '10px 16px' }}>
                {statusInfo.cls === 'correct' ? '✓' : '✗'} {statusInfo.label}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="feedback wrong" style={{ marginBottom: 12, padding: '10px 16px' }}>
                ✗ {error}
              </div>
            )}

            {/* Stats row */}
            {output?.time && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="score-pill">⏱ {output.time}s</span>
                {output.memory > 0 && (
                  <span className="score-pill">💾 {(output.memory / 1024).toFixed(1)} MB</span>
                )}
                {output.status?.id === 3 && (
                  <span className="score-pill" style={{ color: 'var(--clr-correct)' }}>✓ Passed</span>
                )}
              </div>
            )}

            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 0, borderBottom: '1px solid var(--clr-border)',
              marginBottom: 0,
            }}>
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    background: activeTab === t.key ? 'var(--clr-surface)' : 'transparent',
                    color: activeTab === t.key ? 'var(--clr-text)' : 'var(--clr-text-soft)',
                    border: 'none', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all var(--transition)',
                    borderBottom: activeTab === t.key ? '2px solid var(--clr-accent)' : '2px solid transparent',
                    boxShadow: 'none', transform: 'none', position: 'relative',
                  }}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span style={{
                      display: 'inline-block', marginLeft: 6,
                      width: 6, height: 6, borderRadius: '50%',
                      background: t.key === 'stdout' ? 'var(--clr-correct)' : 'var(--clr-wrong)',
                    }} />
                  )}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              {output && tabs.find(t => t.key === activeTab)?.text && (
                <button
                  onClick={() => handleCopy(tabs.find(t => t.key === activeTab).text, activeTab)}
                  className="back-button"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', margin: '4px 8px 4px 0', borderRadius: 6 }}
                >
                  {copied === activeTab ? '✓ Copied' : '📋 Copy'}
                </button>
              )}
            </div>

            {/* Tab content */}
            <div style={{
              background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
              borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)',
              padding: '14px 16px', minHeight: 180, maxHeight: 400, overflow: 'auto',
            }}>
              {!output && !error && !running && (
                <div style={{ color: 'var(--clr-text-soft)', fontSize: '0.88rem', textAlign: 'center', padding: '32px 16px' }}>
                  Click <strong style={{ color: 'var(--clr-accent)' }}>▶ Run Code</strong> to see output here
                </div>
              )}

              {running && (
                <div style={{ color: 'var(--clr-text-soft)', fontSize: '0.88rem', textAlign: 'center', padding: '32px 16px' }}>
                  <span className="playground-spinner" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
                  Executing your code...
                </div>
              )}

              {output && activeTab === 'stdout' && (
                stdout.trim()
                  ? <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--clr-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stdout}</pre>
                  : <div style={{ color: 'var(--clr-text-soft)', fontSize: '0.85rem', padding: 16, textAlign: 'center' }}>No output</div>
              )}

              {output && activeTab === 'stderr' && (
                stderr.trim()
                  ? <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--clr-wrong)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{stderr}</pre>
                  : <div style={{ color: 'var(--clr-text-soft)', fontSize: '0.85rem', padding: 16, textAlign: 'center' }}>No errors</div>
              )}

              {output && activeTab === 'compile' && (
                compileOut.trim()
                  ? <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--clr-wrong)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{compileOut}</pre>
                  : <div style={{ color: 'var(--clr-text-soft)', fontSize: '0.85rem', padding: 16, textAlign: 'center' }}>No compiler output</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent history */}
        <History output={output} langId={langId} />
      </div>

      <style>{`
        .playground-spinner {
          width: 18px; height: 18px;
          border: 2px solid var(--clr-border); border-top-color: var(--clr-accent);
          border-radius: 50%; animation: pgspin 0.6s linear infinite;
        }
        @keyframes pgspin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .playground-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

/* ─── Execution history ─────────────────────────────────────────────────────── */
function History({ output, langId }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!output) return
    const langName = LANGUAGES.find(l => l.id === langId)?.name || ''
    const entry = {
      id: Date.now(),
      lang: langName,
      status: output.status?.description || 'Unknown',
      statusId: output.status?.id,
      time: output.time,
      memory: output.memory,
      stdout: output.stdout || '',
    }
    setHistory(prev => [entry, ...prev].slice(0, 10))
  }, [output, langId])

  if (history.length === 0) return null

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        fontSize: '0.78rem', fontWeight: 600, color: 'var(--clr-text-soft)',
        marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        Recent Runs
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {history.map((h, i) => (
          <div key={h.id} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            background: i === 0 ? 'var(--clr-surface)' : 'transparent',
            border: `1px solid ${i === 0 ? 'var(--clr-border)' : 'transparent'}`,
            borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
            transition: 'background var(--transition)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: h.statusId === 3 ? 'var(--clr-correct)' : 'var(--clr-wrong)',
            }} />
            <span style={{ color: 'var(--clr-text)', fontWeight: 500 }}>{h.lang}</span>
            <span style={{ color: 'var(--clr-text-soft)' }}>·</span>
            <span style={{
              color: h.statusId === 3 ? 'var(--clr-correct)' : 'var(--clr-wrong)',
              fontWeight: 500, fontSize: '0.78rem',
            }}>{h.status}</span>
            {h.time && <span style={{ color: 'var(--clr-text-soft)', marginLeft: 'auto' }}>{h.time}s</span>}
            {h.stdout && h.stdout.trim().length > 0 && (
              <span style={{
                color: 'var(--clr-text-soft)', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.75rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{h.stdout.trim()}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
