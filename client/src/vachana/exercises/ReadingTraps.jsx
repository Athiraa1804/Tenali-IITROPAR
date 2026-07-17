import { useState } from 'react';
const TRAPS = [
  { title: 'The 6S = P Equation Trap', concept: 'Phrases like "6 times as many students as professors" lead students to write 6S = P. But substituting S = 12 gives 72 = P, meaning 72 professors! The correct relation is S = 6P.', quiz: 'For 3 times as many apples (A) as bananas (B), what is the correct relation?', options: ['3A = B', 'A = 3B'], correct: 'A = 3B' },
  { title: 'The Inclusive vs. Exclusive Boundary Trap', concept: 'Numbers from 10 to 20 "inclusive" contains 11 numbers (20 − 10 + 1). "Exclusive" contains only 9 numbers (20 − 10 − 1).', quiz: 'How many integers are between 15 and 25, inclusive?', options: ['10', '11'], correct: '11' }
];
const LEVELS = [
  {
    id: 1,
    title: "Spot the Phrase",
    description: "Learn common mathematical wording and translation traps."
  },
  {
    id: 2,
    title: "Mind the Boundaries",
    description: "Understand inclusive, exclusive and counting traps."
  },
  {
    id: 3,
    title: "Translate Like a Mathematician",
    description: "Convert English statements into algebraic expressions."
  },
  {
    id: 4,
    title: "Read Between the Lines",
    description: "Identify multiple traps within a single word problem."
  },
  {
    id: 5,
    title: "Master Challenge",
    description: "A mixed review of everything you've learned."
  }
];
export default function ReadingTraps() {
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState(null);
  const [msg, setMsg] = useState('');
  const [currentScreen, setCurrentScreen] = useState('overview');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const check = (a) => { setAns(a); setMsg(a === TRAPS[idx].correct ? '✅ Correct! You avoided the reading trap.' : '❌ Not quite. Analyze the relation or boundary offset again.'); };
  if (currentScreen === "overview") {
  return (
    <div
      style={{
        background: "var(--clr-surface)",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid var(--clr-border)",
      }}
    >
      <h2 style={{ color: "var(--clr-accent)" }} align = "center">Reading Traps</h2><br></br>

      <h3>What are Reading Traps?</h3>

        <p>Reading traps are common mathematical phrases that are easy to misunderstand.
        Learning to recognize them helps you interpret questions correctly before solving them.</p><br></br>

      <h3>Why is it important?</h3>

        <p>Many mistakes in mathematics happen before calculations begin.
        Understanding the wording correctly is just as important as solving the problem..</p><br></br>

     <div style={{ display: "flex", justifyContent: "center" }}>
  <button
    className="submit-btn"
    onClick={() => setCurrentScreen('levels')}
  >
    Choose a Level
  </button>
</div>
    </div>
  );
}
if (currentScreen === "levels") {
  return (
    <div>
      <h2
        style={{
          color: "var(--clr-accent)",
          textAlign: "center",
        }}
      >
        Choose a Level
      </h2>

      <p
        style={{
          textAlign: "center",
          marginBottom: "24px",
        }}
      >
        Select a Reading Traps level to begin.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          marginTop: "20px",
        }}
      >
        {LEVELS.map((level) => (
          <div
            key={level.id}
            onClick={() => {
              setSelectedLevel(level.id);
              setCurrentScreen("quiz");
            }}
            onMouseEnter={() => setHoveredLevel(level.id)}
            onMouseLeave={() => setHoveredLevel(null)}
            style={{
              background:
                hoveredLevel === level.id
                  ? "var(--clr-card)"
                  : "var(--clr-surface)",
                      border:
                        hoveredLevel === level.id
                          ? "1px solid var(--clr-accent)"
                          : "1px solid var(--clr-border)",
              borderRadius: "12px",
              padding: "20px",
              cursor: "pointer",
            transform:
              hoveredLevel === level.id
                ? "translateY(-3px)"
                : "translateY(0)",

            boxShadow:
              hoveredLevel === level.id
                ? "0 8px 24px rgba(0,0,0,0.18)"
                : "none",
              transition: "all 0.2s ease",
            }}
          >
            {/* Title + Arrow */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.15rem",
                  color: "var(--clr-accent)",
                  fontWeight: "700",
                }}
              >
                {level.title}
              </h3>

              <span
                style={{
                  fontSize: "1.4rem",
                  color: "var(--clr-accent)",
                  fontWeight: "bold",
                }}
              >
                ❯
              </span>
            </div>

            <p
              style={{
                margin: "0 0 14px 0",
                fontSize: "0.8rem",
                opacity: 0.7,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Level {level.id}
            </p>

            <p
              style={{
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              {level.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
if (currentScreen === "quiz") {
  return (
    <div>
      <div style={{ background: 'var(--clr-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--clr-border)', marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--clr-accent)' }}>{TRAPS[idx].title}</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', lineHeight: '1.5' }}>{TRAPS[idx].concept}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button disabled={idx === 0} onClick={() => { setIdx(0); setAns(null); setMsg(''); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--clr-border)', background: 'transparent', color: 'inherit', cursor: 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>◀ Previous Trap</button>
          <button disabled={idx === TRAPS.length - 1} onClick={() => { setIdx(1); setAns(null); setMsg(''); }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--clr-border)', background: 'transparent', color: 'inherit', cursor: 'pointer', opacity: idx === TRAPS.length - 1 ? 0.4 : 1 }}>Next Trap ▶</button>
        </div>
      </div>
      <div style={{ background: 'var(--clr-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--clr-border)' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600 }}>{TRAPS[idx].quiz}</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {TRAPS[idx].options.map(opt => (
            <button key={opt} onClick={() => check(opt)} className="submit-btn" style={{ padding: '6px 14px', background: ans === opt ? 'var(--clr-accent)' : 'transparent', border: '1px solid var(--clr-accent)', color: ans === opt ? '#fff' : 'var(--clr-accent)' }}>{opt}</button>
          ))}
        </div>
        {msg && <span style={{ fontSize: '0.9rem', color: msg.startsWith('✅') ? 'var(--clr-correct)' : 'red' }}>{msg}</span>}
      </div>
    </div>
  );
}
}
