import { useState, useEffect } from "react";
const LEVELS = [
  {
  id: 1,
  title: "Math Decoder",
  description: "Learn what common mathematical phrases really mean.",
  questions: [
    {
      quiz: 'What does "twice as many" mean?',
      options: [
        "Double",
        "Half",
        "Two more",
        "Exactly two"
      ],
      correct: "Double",
      explanation:
        '"Twice as many" means double the amount.'
    },

    {
      quiz: 'What does "at least 10" mean?',
      options: [
        "Exactly 10",
        "10 or more",
        "Less than 10",
        "9 or fewer"
      ],
      correct: "10 or more",
      explanation:
        '"At least" means the number can be 10 or greater.'
    },

    {
      quiz: 'What does "fewer than" mean?',
      options: [
        "More than",
        "Equal to",
        "Less than",
        "Twice as many"
      ],
      correct: "Less than",
      explanation:
        '"Fewer than" simply means a smaller number.'
    },

    {
      quiz: 'What does "between" mean?',
      options: [
        "Before",
        "After",
        "In the middle of two values",
        "Equal to"
      ],
      correct: "In the middle of two values",
      explanation:
        '"Between" means somewhere in the middle of two numbers.'
    },

    {
      quiz: 'What does "at most 20" mean?',
      options: [
        "20 or less",
        "20 or more",
        "Exactly 20",
        "More than 20"
      ],
      correct: "20 or less",
      explanation:
        '"At most" means the value cannot be greater than 20.'
    }
  ]
},
  {
    id: 2,
    title: "Spot the Phrase",
    questions: [
      {
        title: "Three Times As Many",
        concept: 'The phrase "times as many" describes a multiplicative relationship.',
        quiz: "Three times as many apples (A) as bananas (B). Which equation is correct?",
        options: ["3A = B", "A = 3B", "A = B + 3", "B = A + 3"],
        correct: "A = 3B",
        explanation: "Three times as many apples means the number of apples equals three times the number of bananas."
      },
      {
        title: "Five More Than",
        concept: 'The phrase "more than" means add to the quantity that follows.',
        quiz: 'Which expression represents "five more than x"?',
        options: ["5x", "x + 5", "x - 5", "5 - x"],
        correct: "x + 5",
        explanation: '"Five more than x" means start with x and add 5.'
      },
      {
        title: "Seven Less Than",
        concept: 'The phrase "less than" often tricks students because order matters.',
        quiz: 'Which expression represents "seven less than y"?',
        options: ["y - 7", "7 - y", "7y", "y + 7"],
        correct: "y - 7",
        explanation: '"Seven less than y" means subtract 7 from y.'
      },
      {
        title: "Twice a Number",
        concept: '"Twice" means multiply by 2.',
        quiz: 'Which expression represents "twice a number n"?',
        options: ["2n", "n²", "n + 2", "2 + n"],
        correct: "2n",
        explanation: '"Twice" means two times the number.'
      },
      {
        title: "The Sum Of",
        concept: '"The sum of" always indicates addition.',
        quiz: 'Which expression represents "the sum of x and 8"?',
        options: ["x + 8", "8x", "x - 8", "x ÷ 8"],
        correct: "x + 8",
        explanation: 'The words "sum of" indicate addition.'
      }
    ]
  },

  {
    id: 3,
    title: "Order Matters",
    questions: [
      {
        title: "Three Less Than",
        concept: "The order of subtraction matters.",
        quiz: 'Which expression represents "three less than twice x"?',
        options: ["2x - 3", "3 - 2x", "2(x - 3)", "3x - 2"],
        correct: "2x - 3",
        explanation: 'Start with twice x, then subtract 3.'
      },
      {
        title: "Product Then Add",
        concept: "Identify multiplication before addition.",
        quiz: 'Which expression represents "four more than the product of a and b"?',
        options: ["ab + 4", "(a + 4)b", "4ab", "a(b + 4)"],
        correct: "ab + 4",
        explanation: "Find the product first, then add four."
      },
      {
        title: "Twice the Sum",
        concept: "Parentheses matter.",
        quiz: 'Which expression represents "twice the sum of x and y"?',
        options: ["2(x + y)", "2x + y", "x + 2y", "x + y + 2"],
        correct: "2(x + y)",
        explanation: "The entire sum is multiplied by 2."
      },
      {
        title: "Half the Difference",
        concept: "Difference comes before division.",
        quiz: 'Which expression represents "half the difference between m and 6"?',
        options: ["(m - 6)/2", "m - 3", "m/2 - 6", "(6 - m)/2"],
        correct: "(m - 6)/2",
        explanation: "Subtract first, then divide by two."
      },
      {
        title: "Square of the Sum",
        concept: "The whole sum is squared.",
        quiz: 'Which expression represents "the square of the sum of x and 2"?',
        options: ["(x + 2)²", "x² + 2", "x² + 4", "2x²"],
        correct: "(x + 2)²",
        explanation: "The parentheses are squared together."
      }
    ]
  },

  {
    id: 4,
    title: "Mind the Boundaries",
    questions: [
      {
        title: "Inclusive Counting",
        concept: "Inclusive means count both ends.",
        quiz: "How many integers are from 10 to 20 inclusive?",
        options: ["9", "10", "11", "12"],
        correct: "11",
        explanation: "Count both 10 and 20."
      },
      {
        title: "Exclusive Counting",
        concept: "Exclusive excludes both ends.",
        quiz: "How many integers are between 10 and 20 exclusively?",
        options: ["8", "9", "10", "11"],
        correct: "9",
        explanation: "Only 11 through 19 are counted."
      },
      {
        title: "Small Range",
        concept: "Apply inclusive counting.",
        quiz: "How many integers are from 5 to 9 inclusive?",
        options: ["4", "5", "6", "7"],
        correct: "5",
        explanation: "5,6,7,8,9."
      },
      {
        title: "Negative Numbers",
        concept: "Inclusive counting also works across zero.",
        quiz: "How many integers are from −2 to 2 inclusive?",
        options: ["3", "4", "5", "6"],
        correct: "5",
        explanation: "-2,-1,0,1,2."
      },
      {
        title: "Exclusive Across Zero",
        concept: "Remove both endpoints.",
        quiz: "How many integers lie between −2 and 2 exclusively?",
        options: ["2", "3", "4", "5"],
        correct: "3",
        explanation: "-1,0,1."
      }
    ]
  },

  {
    id: 5,
    title: "Read Between the Lines",
    questions: [
      {
        title: "Boys and Girls",
        concept: "Interpret multiplicative wording.",
        quiz: "There are three times as many boys as girls. If there are 24 boys, how many girls?",
        options: ["6", "8", "12", "72"],
        correct: "8",
        explanation: "24 = 3 × girls."
      },
      {
        title: "Cats and Dogs",
        concept: "More than means addition.",
        quiz: "There are 5 more cats than dogs. If there are 7 dogs, how many cats?",
        options: ["12", "35", "2", "14"],
        correct: "12",
        explanation: "7 + 5 = 12."
      },
      {
        title: "Teachers and Students",
        concept: "Twice as many means multiply.",
        quiz: "There are twice as many students as teachers. If there are 10 teachers, how many students?",
        options: ["5", "10", "20", "30"],
        correct: "20",
        explanation: "2 × 10 = 20."
      },
      {
        title: "Counting Numbers",
        concept: "Apply inclusive counting.",
        quiz: "How many integers are from 30 to 40 inclusive?",
        options: ["9", "10", "11", "12"],
        correct: "11",
        explanation: "Include both endpoints."
      },
      {
        title: "Substitute Carefully",
        concept: "Translate before substituting.",
        quiz: 'A number is "three less than twice x". If x = 6, what is the value?',
        options: ["9", "12", "15", "18"],
        correct: "9",
        explanation: "2(6)-3 = 9."
      }
    ]
  },

  {
    id: 6,
    title: "Master Challenge",
    questions: [
      {
        title: "Mixed 1",
        concept: "Combine phrase interpretation.",
        quiz: 'Which expression represents "five less than the sum of x and y"?',
        options: ["x+y-5", "5-(x+y)", "x+(y-5)", "(x-5)+y"],
        correct: "x+y-5",
        explanation: "Find the sum first, then subtract five."
      },
      {
        title: "Mixed 2",
        concept: "Difference before multiplication.",
        quiz: 'Which expression represents "twice the difference between m and 4"?',
        options: ["2(m-4)", "2m-4", "m-8", "(4-m)2"],
        correct: "2(m-4)",
        explanation: "Subtract first, then multiply."
      },
      {
        title: "Mixed 3",
        concept: "Times as many.",
        quiz: "There are four times as many red balls as blue balls. If there are 8 blue balls, how many red balls?",
        options: ["16", "24", "32", "40"],
        correct: "32",
        explanation: "4 × 8 = 32."
      },
      {
        title: "Mixed 4",
        concept: "Inclusive counting.",
        quiz: "How many integers are from -5 to 5 inclusive?",
        options: ["9", "10", "11", "12"],
        correct: "11",
        explanation: "There are 11 integers."
      },
      {
        title: "Mixed 5",
        concept: "Translate carefully.",
        quiz: 'Which expression represents "three more than half of x"?',
        options: ["x/2 + 3", "3x/2", "(x+3)/2", "2x+3"],
        correct: "x/2 + 3",
        explanation: "Take half first, then add three."
      }
    ]
  }
];
export default function ReadingTraps() {
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState(null);
  const [msg, setMsg] = useState('');
  const [currentScreen, setCurrentScreen] = useState('levels');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [checked, setChecked] = useState(false);
  const currentLevel = LEVELS.find(level => level.id === selectedLevel);
  const questions = currentLevel?.questions || [];
  useEffect(() => {
  if (currentScreen !== "quiz") return;
  if (checked) return;

  const timer = setTimeout(() => {
    if (idx < questions.length - 1) {
      setIdx((prev) => prev + 1);
      setAns(null);
      setMsg("");
      setChecked(false);
    } else {
      setChecked(true);
      setMsg("⏰ Time's up!");
    }
  }, 7000);

  return () => clearTimeout(timer);
}, [idx, checked, currentScreen, questions.length]);
const check = (a) => {
  setAns(a);
  setChecked(true);

  if (a === questions[idx].correct) {
    setMsg("✅ Correct! " + questions[idx].explanation);
  } else {
    setMsg("❌ Incorrect. " + questions[idx].explanation);
  }
};
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
    Levels
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginTop: "24px",
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
              height:"100%",
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
            {/* Title */}
           <div
            style={{
              display: "flex",
              justifyContent: "center",
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
            </div>

            <p
              style={{
                margin: "0 0 14px 0",
                fontSize: "0.8rem",
                opacity: 0.7,
                textTransform: "uppercase",
                letterSpacing: "1px",
                textAlign: "center",
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
            </p>
          </div>
        ))}
      </div>
      <button
        className="submit-btn"
        onClick={() => setCurrentScreen("overview")}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          padding: 0,
          fontSize: "1.3rem",
        }}
      >
        👀
      </button>
    </div>
    
  );
}
if (currentScreen === "quiz") {
  return (
    <div>

      <div style={{ background: "var(--clr-surface)",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid var(--clr-border)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center", }}>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: "16px",
  }}
>
  <span
    style={{
      fontSize: "0.9rem",
      opacity: 0.7,
    }}
  >
    Question {idx + 1} of {questions.length}
  </span>

  <button
    onClick={() => {
      setCurrentScreen("levels");
      setIdx(0);
      setAns(null);
      setMsg("");
      setChecked(false);
    }}
    style={{
      padding: "4px 10px",
      fontSize: "0.8rem",
      borderRadius: "8px",
      border: "1px solid var(--clr-border)",
      background: "var(--clr-surface)",
      cursor: "pointer",
    }}
  >
    ← Back To Levels
  </button>
</div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--clr-accent)' }}>{questions[idx].title}</h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', lineHeight: '1.5' }}>{questions[idx].concept}</p>
        
      </div>
      <div style={{ background: "var(--clr-surface)",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid var(--clr-border)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    
     }}>
        <p
  style={{
    margin: "8px 0 16px 0",
    fontSize: "1.25rem",
    fontWeight: 700,
    lineHeight: "1.5",
    textAlign: "center",
    maxWidth: "700px",
  }}
>
  {questions[idx].quiz}
</p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "20px",
            width: "100%",
          }}
        >
           {questions[idx].options.map((opt, index) => (
    <button
      key={opt}
      disabled={checked}
      onClick={() => setAns(opt)}
      style={{
        width: "100%",
        padding: "18px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: "16px",
        border:
          ans === opt
            ? "2px solid var(--clr-accent)"
            : "1px solid var(--clr-border)",
        background:
          ans === opt
            ? "rgba(255,145,77,0.12)"
            : "var(--clr-surface)",
        color: "inherit",
        cursor: checked ? "default" : "pointer",
        transition: "0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(255,255,255,.08)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "bold",
          }}
        >
          {index + 1}
        </div>

        <span
          style={{
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          {opt}
        </span>
      </div>
    </button>
  ))}

        </div>
        {!checked && (
      <div style={{ marginBottom: "16px" }}>
        <button
          className="submit-btn"
          disabled={!ans}
          onClick={() => check(ans)}
        >
          Submit
        </button>
      </div>
    )}
        {msg && <span style={{ fontSize: '0.9rem', color: msg.startsWith('✅') ? 'var(--clr-correct)' : 'red' }}>{msg}</span>}
        {checked && idx < questions.length - 1 && (
  <div style={{ marginTop: "18px" }}>
    <button
      className="submit-btn"
      onClick={() => {
        setIdx(idx + 1);
        setAns(null);
        setMsg("");
        setChecked(false);
      }}
    >
      Next Question →
    </button>
  </div>
)}
{checked && idx === questions.length - 1 && (
  <div
    style={{
      marginTop: "20px",
      textAlign: "center",
      fontWeight: "bold",
      color: "var(--clr-accent)",
    }}
  >
    Level Complete!
  </div>
)}
      </div>
    </div>
  );
}
}
