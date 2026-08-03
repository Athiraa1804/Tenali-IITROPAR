import { useState, useEffect } from "react";
const LEVELS = [
  {
  id: 1,
  title: "Play & Read",
  questions: [
    {
      type: "tap",
      quiz: "🧼 Before 🍽️, wash your hands.\nTap what happens first.",
      options: [
        { label: "🧼", value: "Wash" },
        { label: "🍽️", value: "Eat" },
        { label: "📖", value: "Read" },
        { label: "🛏️", value: "Sleep" }
      ],
      correct: "Wash",
      explanation: "Before eating, we wash our hands first."
    },

    {
  type: "tap",
  quiz: "🧍🏼‍♂️Aman gave Riya🧍🏼‍♀️ his toy🧸.\nWho got the toy?",
  options: [
    { label: "🧍🏼‍♂️", value: "Aman" },
    { label: "🧍🏼‍♀️", value: "Riya" },
    { label: "🧸 ", value: "Toy" },
    { label: "🧍🏼‍♂️🧍🏼‍♀️", value: "Both" }
  ],
  correct: "Riya",
  explanation: "Riya received the toy from Aman."
},

    {
      type: "tap",
      quiz: "Which animal is NOT a bird?",
      options: [
        { label: "🦜", value: "parrot" },
        { label: "🦉", value: "Owl" },
        { label: "🐶", value: "Dog" },
        { label: "🦩", value: "Flamingo" }
      ],
      correct: "Dog",
      explanation: "A dog is not a bird."
    },

    {
  type: "match",
  quiz: "Match the word to the picture.",

  words: [
    "Apple",
    "Ball",
    "Cat"
  ],

  emojis: [
    "🐱",
    "🍎",
    "⚽"
  ],

  correctMatches: [
    { text: "Apple", emoji: "🍎" },
    { text: "Ball", emoji: "⚽" },
    { text: "Cat", emoji: "🐱" }
  ],
   correct: "matched",
  explanation: "Each word matches its correct picture."
},

   {
  type: "order",
  quiz: "Tap these in order.",
  items: [
    { emoji: "🏫", text: "Go to school" },
    { emoji: "🍽️", text: "Eat breakfast" },
    { emoji: "😴", text: "Wake up" },
    { emoji: "🪥", text: "Brush teeth" }
  ],
  correctOrder: [
    { emoji: "😴", text: "Wake up" },
    { emoji: "🪥", text: "Brush teeth" },
    { emoji: "🍽️", text: "Eat breakfast" },
    { emoji: "🏫", text: "Go to school" }
  ],
  correct: "correct-order",
  explanation: "We wake up, brush our teeth, eat, and then go to school."
},
  ]
},
  {
    id:2,
    title: "See the Math",
    questions: [
  {
  
  quiz: 'What happened?',

  questionVisual: ['⭐','⭐','⭐'],
  expressionText: '➕',
  rightVisual: ['⭐','⭐'],

  resultVisual: ['⭐','⭐','⭐','⭐','⭐'],

  options: [
    'Two less ⭐',
    'Double ⭐',
    'Same ⭐',
    'Two more ⭐'
  ],

  correct: 'Two more ⭐',

  explanation:
    'Adding means we put groups together. ⭐⭐⭐ + ⭐⭐ gives two more stars.'
},

  {
  type: 'drag-drop',
  quiz: 'Drag the correct word into the box.',
  questionVisual: ['🍎','🍎','🍎','🍎'],
  expressionText: '➗ 2 = [ ❔ ]', 
  choices:[
    { label: '🍎🍎🍎', value: 'Less' },
    { label: '🍎🍎🍎🍎🍎', value: 'More' },
    { label: '🍎🍎', value: 'Half' },
    { label: '🍎🍎🍎🍎🍎🍎', value: 'Double' }
  ],
  correct: 'Half',
  explanation: 'Dividing by 2 makes half.'
},
{
  type: 'drag-drop',
  quiz: 'Drag the correct result into the box.',
  questionVisual: ['🍎','🍎'],
  expressionText: '✖️ 2 = [ ❔ ]',

  choices: [
    { label: '🍎🍎🍎🍎', value: 'Double' },
    { label: '🍎🍎🍎', value: 'Less' },
    { label: '🍎🍎', value: 'Same' },
    { label: '🍎', value: 'Half' }
  ],

  correct: 'Double',

  explanation: 'Doubling 🍎🍎 gives 🍎🍎🍎🍎.'
},
  {
  type: 'tap',
  quiz: 'Tap the correct symbol.',

  questionVisual: ['🐟','🐟','🐟'],
  expressionText: '[❔]',
  rightVisual: ['🐟','🐟','🐟'],

  options: [
    { label: '➕', value: 'plus' },
    { label: '➖', value: 'minus' },
    { label: '🟰', value: 'equal to' },
    { label: '✖️', value: 'into' }
  ],

  correct: 'equal to',

  explanation: 'Both groups have the same number, so we use =.'
},
 {
  type: 'input',
  quiz: 'Type the symbol that makes this true:',

  questionVisual: ['⭐','⭐','⭐','⭐'],
  expressionText: '❔',
  rightVisual: ['⭐','⭐'],

  correct: '>',

  placeholder: 'Type >, <, or =',

  explanation: '4 stars is greater than 2 stars.'
}
]
},
  {
  id: 3,
  title: "Crack the Code ",
  questions: [
    {
      quiz: "7 → 10\n\nWhat does this mean?\n",
      options: [
        "3 less",
        "3 more",
        "Double",
        "Half"
      ],
      correct: "3 more",
      explanation:
        '"3 more" means the number increased by 3.'
    },

    {
      quiz: "10  11  12 . . .\n\nWhat does this mean?",
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
      quiz: "12  ?  7\n\nChoose the correct symbol:",
      options: [
        "=",
        "<",
        ">",
        "+"
      ],
      correct: ">",
      explanation:
        "12 is greater than 7, so we use the '>' symbol."
    },

    {
      quiz: "5  •──── ❓ ────•  10\n\nDecode:",
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
      quiz: "... 18  19  20\n\nDecode:",
      options: [
        "20 or more",
        "Exactly 20",
        "20 or less",
        "More than 20"
      ],
      correct: "20 or less",
      explanation:
        '"At most" means the value cannot be greater than 20.'
    }
  ]
},
  {
  id: 4,
  title: "Spot the Phrase",
  questions: [
    {
      quiz: "🍎 (A) are 3 × 🍌 (B).\n\nWhich equation is correct?",
      options: [
        "3A = B",
        "A = B + 3",
        "B = A + 3",
         "A = 3B",

      ],
      correct: "A = 3B",
      explanation:
        '"Three times as many" means multiply bananas by 3 to get apples.'
    },

    {
      quiz: "🍎 (A) are 5 more than 🍌 (B).\n\nWhich equation is correct?",
      options: [
        "A = 5B",
        "A = B + 5",
        "B = A + 5",
        "A = B - 5"
      ],
      correct: "A = B + 5",
      explanation:
        '"5 more than" means add 5 to the second quantity.'
    },

    {
      quiz: "🍎 (A) are 7 less than 🍌 (B).\n\nWhich equation is correct?",
      options: [
        "A = 7 - B",
        "A = B - 7",
        "A = 7B",
        "B = A - 7"
      ],
      correct: "A = B - 7",
      explanation:
        '"7 less than" means subtract 7 from the second quantity.'
    },

    {
      quiz: "🍎 (A) are half of 🍌 (B).\n\nWhich equation is correct?",
      options: [
        "A = B ÷ 2",
        "A = 2B",
        "B = A ÷ 2",
        "A = B + 2"
      ],
      correct: "A = B ÷ 2",
      explanation:
        '"Half of" means divide by 2.'
    },

    {
      quiz: "🍎 (A) and 8 make 🍌 (B).\n\nWhich equation is correct?",
      options: [
        "B = A + 8",
        "A = B + 8",
        "B = 8A",
        "A = B - 8"
      ],
      correct: "B = A + 8",
      explanation:
        'Adding 8 to A gives B.'
    }
  ]
},
  {
    id: 5,
    title: "Order Matters",
    questions: [
      {
        title: "Three Less Than",
        concept: "The order of subtraction matters.",
        quiz: 'Which expression represents "three less than twice x"?',
        options: ["3 - 2x", "2(x - 3)", "3x - 2","2x - 3"],
        correct: "2x - 3",
        explanation: 'Start with twice x, then subtract 3.'
      },
      {
        title: "Product Then Add",
        concept: "Identify multiplication before addition.",
        quiz: 'Which expression represents "four more than the product of a and b"?',
        options: ["(a + 4)b", "4ab","ab + 4", "a(b + 4)"],
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
        options: ["m - 3", "m/2 - 6","(m - 6)/2", "(6 - m)/2"],
        correct: "(m - 6)/2",
        explanation: "Subtract first, then divide by two."
      },
      {
        title: "Square of the Sum",
        concept: "The whole sum is squared.",
        quiz: 'Which expression represents "the square of the sum of x and 2"?',
        options: ["x² + 2","(x + 2)²", "x² + 4", "2x²"],
        correct: "(x + 2)²",
        explanation: "The parentheses are squared together."
      }
    ]
  },

   {
  id: 6,
  title: "Boundary Detective",
  questions: [
    {
      title: "Inclusive Counting",
      concept: "Inclusive means count both ends.",
      quiz: "10 ●────────● 20\n\nHow many integers are from 10 to 20 inclusive?",
      options: ["9", "10", "11", "12"],
      correct: "11",
      explanation:
        "Inclusive means both 10 and 20 are counted, so there are 11 integers."
    },

    {
      title: "Exclusive Counting",
      concept: "Exclusive excludes both ends.",
      quiz: "10 ○────────○ 20\n\nWhich list is correct?",
      options: [
        "11, 12, 13, 14, 15, 16, 17, 18, 19",
        "10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20",
        "12, 13, 14, 15, 16, 17, 18",
        "10, 11, 12, 13, 14, 15, 16, 17, 18, 19"
      ],
      correct: "11, 12, 13, 14, 15, 16, 17, 18, 19",
      explanation:
        "Exclusive means we do not count 10 or 20."
    },

    {
      title: "Which Ends Count?",
      concept: "Read the boundary carefully.",
      quiz: "5 ●──────● 9\n\nWhich numbers are counted?",
      options: [
        "Only 5",
        "Both 5 and 9",
        "Only 9",
        "Neither 5 nor 9"
      ],
      correct: "Both 5 and 9",
      explanation:
        "Filled circles (●) show that both endpoints are included."
    },

    {
      title: "Across Zero",
      concept: "Inclusive counting also works across zero.",
      quiz: "−2 ●────0────● 2\n\nHow many integers are from −2 to 2 inclusive?",
      options: ["3", "4", "5", "6"],
      correct: "5",
      explanation:
        "The integers are −2, −1, 0, 1 and 2."
    },

    {
      title: "Spot the Boundary",
      concept: "Exclusive means leave out the endpoints.",
      quiz: "−2 ○────0────○ 2\n\nWhich numbers are NOT counted?",
      options: [
        "−2 and 2",
        "−1 and 1",
        "−2 and 1",
        "−1 and 2"
      ],
      correct: "−2 and 2",
      explanation:
        "Open circles (○) mean the endpoints are excluded."
    }
  ]
},

{
  id: 7,
  title: "Read Between the Lines",
  questions: [
    {
      quiz: "There are three times as many boys as girls.\nIf there are 24 boys, how many girls?",
      options: ["6", "8", "12", "72"],
      correct: "8",
      explanation:
        "Three times as many means Boys = 3 × Girls. So Girls = 24 ÷ 3 = 8."
    },

    {
      quiz: "There are 5 fewer cats than dogs.\nIf there are 12 dogs, how many cats?",
      options: ["7", "12", "17", "60"],
      correct: "7",
      explanation:
        '"5 fewer than" means subtract 5 from the number of dogs.'
    },

    {
      quiz: "There are twice as many students as teachers.\nIf there are 18 students, how many teachers?",
      options: ["18", "36", "9","16"],
      correct: "9",
      explanation:
        'Twice as many means Students = 2 × Teachers. So Teachers = 18 ÷ 2 = 9.'
    },

    {
      quiz: "How many integers are from 30 to 40 inclusive?",
      options: ["10", "11", "12", "13"],
      correct: "11",
      explanation:
        'Inclusive means count both 30 and 40.'
    },

    {
      quiz: 'A number is three less than twice x.\nIf x = 6, what is the value?',
      options: ["9", "12", "15", "18"],
      correct: "9",
      explanation:
        'Translate first: 2x − 3. Then substitute x = 6.'
    }
  ]
},
  {
  id: 8,
  title: "Master Challenge",
  questions: [
    {
      quiz: 'Which expression represents "five less than the sum of x and y"?',
      options: [
        "5 - (x + y)",
        "x + (y - 5)",
         "(x + y) - 5",
        "(x - 5) + y"
      ],
      correct: "(x + y) - 5",
      explanation:
        'Find the sum first, then subtract 5.'
    },

    {
      quiz: "There are three times as many apples as bananas.\nThere are 12 bananas.\n\nRiya says there are 15 apples.\nIs she correct?",
      options: [
        "No, there are 24 apples.",
         "No, there are 36 apples.",
        "Yes",
        "No, there are 48 apples."
      ],
      correct: "No, there are 36 apples.",
      explanation:
        "Three times as many means 3 × 12 = 36."
    },

    {
      quiz: 'A game has levels 5 to 12.\nYou must play every level "from 5 to 12 inclusive".\n\nHow many levels will you play?',
      options: [
        "7",
        "8",
        "9",
        "12"
      ],
      correct: "8",
      explanation:
        "Inclusive means count both 5 and 12."
    },

    {
      quiz: "A basket has 8 oranges.\nAnother basket has twice as many oranges.\nThen 3 more oranges are added.\n\nHow many oranges are in the second basket?",
      options: [
        "16",
        "19",
        "11",
        "22"
      ],
      correct: "19",
      explanation:
        "Twice 8 is 16. Then add 3 to get 19."
    },

    {
      quiz: 'A number is "three less than twice x".\nIf x = 8,\nwhat is the value?',
      options: [
        "13",
        "16",
        "19",
        "21"
      ],
      correct: "13",
      explanation:
        "Translate first: 2x − 3. Then substitute x = 8."
    }
  ]
},
];
function EmojiRow({ emojis }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        margin: '8px 0',
      }}
    >
      {emojis.map((emoji, index) => (
        <div
          key={index}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '1.8rem',
          }}
        >
          {emoji}
        </div>
      ))}
    </div>
  );
}
export default function ReadingTraps() {
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState(null);
  const [msg, setMsg] = useState('');
  const [currentScreen, setCurrentScreen] = useState('levels');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedTap, setSelectedTap] = useState(null);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [orderSelection, setOrderSelection] = useState([]);
  const [draggedChoice, setDraggedChoice] = useState(null);
  const [dropAnswer, setDropAnswer] = useState('');
  const [textAnswer, setTextAnswer] = useState('');
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
      setCurrentScreen("results");
    }
  }, 20000);

  return () => clearTimeout(timer);
}, [idx, checked, currentScreen, questions.length]);
const check = (a) => {
  setAns(a);
  setChecked(true);

  if (a === questions[idx].correct) {
  setScore(score + 1);
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
        Reading Traps
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
  const q = questions[idx];
  const isTapQuestion = q.type === "tap";
  const isMatchQuestion = q.type === "match";
  const isOrderQuestion = q.type === "order";
  const isDragQuestion = q.type === 'drag-drop';
  const isInputQuestion = q.type === 'input';
  return (
    <div>

      <div style={{ background: "var(--clr-surface)",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid var(--clr-border)",
    display: "flex",
    flexDirection: "column",
    marginBottom:"10px",
    alignItems: "center",
    textAlign: "center", }}>
      <div
  style={{
    width: "100%",
    marginBottom: "2px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px",
    }}
  >
    <button
      onClick={() => {
        setCurrentScreen("levels");
        setIdx(0);
        setAns(null);
        setMsg("");
        setChecked(false);
      }}
      style={{
        padding: "6px 14px",
        fontSize: "0.85rem",
        borderRadius: "8px",
        border: "1px solid var(--clr-border)",
        background: "var(--clr-surface)",
        cursor: "pointer",
      }}
    >
      ← Back to Levels
    </button>

    <span
      style={{
        fontSize: "0.95rem",
        fontWeight: "600",
        opacity: 0.75,

      }}
    >
      Question {idx + 1} of {questions.length}
    </span>
  </div>

  <div
    style={{
      width: "100%",
      height: "8px",
      background: "var(--clr-border)",
      borderRadius: "999px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${((idx + 1) / questions.length) * 100}%`,
        height: "100%",
        background: "var(--clr-accent)",
      }}
    />
  </div>
</div>
<h3
  style={{
    margin: "0 0 6px 0",
    fontSize: "1.15rem",
    color: "var(--clr-accent)",
  }}
>
</h3>
        {q.title && (
  <h3
    style={{
      margin: '0 0 6px 0',
      fontSize: '1.15rem',
      color: 'var(--clr-accent)'
    }}
  >
    {q.title}
  </h3>
)}

{q.concept && (
  <p
    style={{
      margin: '0 0 12px 0',
      fontSize: '0.95rem',
      lineHeight: '1.5'
    }}
  >
    {q.concept}
  </p>
)}
        
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
    whiteSpace: "pre-line",
  }}
>
  {q.quiz}
</p>
{q.questionVisual && (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'nowrap',
      marginBottom: '14px',
    }}
  >

    {/* Left visual */}
    {q.questionVisual.map((emoji, index) => (
      <div
        key={`left-${index}`}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '1.8rem',
        }}
      >
        {emoji}
      </div>
    ))}

    {/* Expression */}
    <div
      style={{
        fontSize: '1.8rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        margin: '0 4px',
      }}
    >
      {q.expressionText}
    </div>

    {/* Right visual */}
    {q.rightVisual &&
      q.rightVisual.map((emoji, index) => (
        <div
          key={`right-${index}`}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '1.8rem',
          }}
        >
          {emoji}
        </div>
      ))}

    {/* Result visual */}
    {q.resultVisual && (
      <>
        <div
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            margin: '0 4px',
          }}
        >
          →
        </div>

        {q.resultVisual.map((emoji, index) => (
          <div
            key={`result-${index}`}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '1.8rem',
            }}
          >
            {emoji}
          </div>
        ))}
      </>
    )}

  </div>
)}
{isMatchQuestion ? (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px',
      width: '100%',
      maxWidth: '700px',
      marginBottom: '20px',
      alignItems: 'start',
    }}
  >

    {/* LEFT COLUMN - WORDS */}
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {q.words.map((word) => {
        const alreadyMatched = matchedPairs.some(
          (pair) => pair.text === word
        );

        return (
          <button
            key={word}
            disabled={alreadyMatched}
            onClick={() => setSelectedLeft(word)}
            style={{
              width: '100%',
              minHeight: '90px',
              borderRadius: '20px',
              border:
                selectedLeft === word
                  ? '2px solid var(--clr-accent)'
                  : '1px solid var(--clr-border)',
              background:
                selectedLeft === word
                  ? 'rgba(255,145,77,0.12)'
                  : 'var(--clr-surface)',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: alreadyMatched ? 'default' : 'pointer',
              opacity: alreadyMatched ? 0.6 : 1,
              transition: '0.2s ease',
            }}
          >
            {word}
          </button>
        );
      })}
    </div>

    {/* RIGHT COLUMN - EMOJIS */}
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {q.emojis.map((emoji) => {
        const alreadyUsed = matchedPairs.some(
          (pair) => pair.emoji === emoji
        );

        return (
          <button
            key={emoji}
            disabled={alreadyUsed || !selectedLeft}
            onClick={() => {
              setMatchedPairs((prev) => [
                ...prev,
                { text: selectedLeft, emoji }
              ]);
              setSelectedLeft(null);
            }}
            style={{
              width: '100%',
              minHeight: '90px',
              borderRadius: '20px',
              border: '1px solid var(--clr-border)',
              background: 'var(--clr-surface)',
              fontSize: '2rem',
              cursor:
                alreadyUsed || !selectedLeft
                  ? 'default'
                  : 'pointer',
              opacity: alreadyUsed ? 0.6 : 1,
              transition: '0.2s ease',
            }}
          >
            {emoji}
          </button>
        );
      })}
    </div>

  </div>
) : isOrderQuestion ? (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "25px",
      justifyContent: "center",
      marginBottom: "20px",
      width: "100%",
      maxWidth: "700px",
    }}
  >
    {q.items.map((item) => {
      const selected = orderSelection.some(
  (selectedItem) => selectedItem.emoji === item.emoji
);
      return (
        <button
          key={item.emoji}
          disabled={(checked && !isOrderQuestion) || selected}
          onClick={() => {
            if (!selected) {
              setOrderSelection((prev) => [...prev, item]);
            }
          }}
          style={{
            minWidth: "110px",
            minHeight: "110px",
            padding: "16px",
            borderRadius: "22px",
            border: selected
              ? "2px solid var(--clr-accent)"
              : "1px solid var(--clr-border)",
            background: selected
              ? "rgba(255,145,77,0.12)"
              : "var(--clr-surface)",
            fontSize: "1.2rem",
            fontWeight: 700,
            cursor: checked || selected ? "default" : "pointer",
            transition: "0.2s ease",
          }}
        >
          <div>
  <span>{item.emoji}</span>
  <p>{item.text}</p>
</div>
        </button>
      );
    })}
  </div>
) : isDragQuestion ? (
  <div
    style={{
      width: '100%',
      maxWidth: '520px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '18px',
      marginBottom: '20px',
    }}
  >

    <div
      style={{
        fontSize: '2rem',
        fontWeight: 700,
        textAlign: 'center',
      }}
    >
    </div>

    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => setDropAnswer(draggedChoice)}
      style={{
        width: '220px',
        minHeight: '80px',
        border: '2px dashed var(--clr-accent)',
        borderRadius: '18px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1.1rem',
        fontWeight: 700,
        background: 'rgba(255,145,77,0.08)',
      }}
    >
     {dropAnswer
  ? q.choices.find(c => c.value === dropAnswer)?.label
  : 'Drop here'}
    </div>

    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      {q.choices.map((choice) => (
  <div
    key={choice.value}
    draggable
    onDragStart={() => setDraggedChoice(choice.value)}
    style={{
      padding: '12px 18px',
      borderRadius: '16px',
      border: '1px solid var(--clr-border)',
      background: 'var(--clr-surface)',
      cursor: 'grab',
      userSelect: 'none',
      minWidth: '120px',
      textAlign: 'center',
    }}
  >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span style={{ fontSize: '1.6rem' }}>
        {choice.label}
      </span>

      <span
        style={{
          fontSize: '0.95rem',
          fontWeight: 700,
        }}
      >
        {choice.value}
      </span>
    </div>
  </div>
))}
    </div>

  </div>
) : isInputQuestion ? (
  <div
    style={{
      width: '100%',
      maxWidth: '420px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '18px',
      marginBottom: '20px',
    }}
  >

    <div
      style={{
        fontSize: '2rem',
        fontWeight: 700,
        textAlign: 'center',
      }}
    >
      {q.prompt}
    </div>

    <input
  type="text"
  value={textAnswer}
  onChange={(e) => setTextAnswer(e.target.value)}
  placeholder={q.placeholder}
  maxLength={1}
  style={{
    width: '140px',
    height: '64px',
    textAlign: 'center',
    fontSize: '2rem',
    fontWeight: 700,
    borderRadius: '16px',
    border: '2px solid var(--clr-border)',
    background: 'var(--clr-surface)',
    color: 'inherit',
    outline: 'none',
  }}
/>

  </div>
) : isTapQuestion ? (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(140px, 180px))",
      gap: "16px",
      justifyContent: "center",
      marginBottom: "20px",
      width: "100%",
    }}
  >
    {q.options.map((opt) => (
      <button
  key={opt.value}
  onClick={() => {
    if (!checked) setAns(opt.value);
  }}
  disabled={checked && q.type === "tap"}
  style={{
    minHeight: "140px",
    padding: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    borderRadius: "24px",
    border:
      ans === opt.value
        ? "2px solid var(--clr-accent)"
        : "1px solid rgba(255,255,255,0.10)",
    background:
      ans === opt.value
        ? "rgba(255,145,77,0.16)"
        : "rgba(255,255,255,0.03)",
    boxShadow:
      ans === opt.value
        ? "0 0 0 4px rgba(255,145,77,0.10)"
        : "0 4px 16px rgba(0,0,0,0.15)",
    color: "inherit",
    cursor: checked ? "default" : "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  }}
>
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
    }}
  >
    <span style={{ fontSize: "2rem" }}>
      {opt.label}
    </span>

    <span
      style={{
        fontSize: "0.95rem",
        fontWeight: 600,
      }}
    >
      {opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}
    </span>
  </div>
</button>
    ))}
  </div>
) : (
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
        key={index}
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
)}
        {!checked && (
  <div style={{ marginBottom: "16px" }}>
    <button
      className="submit-btn"
      disabled={
  isMatchQuestion
    ? matchedPairs.length !== q.correctMatches.length
    : isOrderQuestion
    ? orderSelection.length !== q.correctOrder.length
    : isDragQuestion
    ? !dropAnswer
    : isInputQuestion
    ? !textAnswer.trim()
    : !ans
}
      onClick={() => {
  if (isMatchQuestion) {
    const correct = 
      JSON.stringify(
        matchedPairs.sort((a,b)=>a.text.localeCompare(b.text))
      ) ===
      JSON.stringify(
        q.correctMatches.sort((a,b)=>a.text.localeCompare(b.text))
      );

    check(correct ? 'matched' : 'wrong-match');

  } else if (isOrderQuestion) {
    const correct =
      JSON.stringify(orderSelection) ===
      JSON.stringify(q.correctOrder);

    check(correct ? 'correct-order' : 'wrong-order');

  } else if (isDragQuestion) {
    check(dropAnswer);
  
  } else if (isInputQuestion) {
  check(textAnswer.trim());

  } else {
    check(ans);
  }
}}
    >
      Submit
    </button>
  </div>
)}
        {msg && <span style={{ fontSize: '0.9rem', color: msg.startsWith('✅') ? 'var(--clr-correct)' : 'red' }}>{msg}</span>}
        {checked && (
  <div style={{ marginTop: "18px" }}>
    <button
      className="submit-btn"
      onClick={() => {
        if (idx === questions.length - 1) {
          setCurrentScreen("results");
        } else {
          setIdx(idx + 1);
          setAns(null);
          setMsg("");
          setChecked(false);
          setSelectedTap(null);
          setMatchedPairs([]);      
          setOrderSelection([]);   
          setDropAnswer('');
          setTextAnswer('');
          setDraggedChoice(null);
          
        }
      }}
    >
      {idx === questions.length - 1
        ? "Finish Level"
        : "Next Question →"}
    </button>
  </div>
)}
      </div>
    </div>
  );
}
if (currentScreen === "results") {
  return (
    <div
      style={{
        background: "var(--clr-surface)",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid var(--clr-border)",
        textAlign: "center",
      }}
    >
      <h2
  style={{
    color: "var(--clr-accent)",
    marginBottom: "8px",
  }}
>
   Level Complete
</h2>

      <p
  style={{
    fontSize: "1.15rem",
    fontWeight: "600",
    marginBottom: "28px",
  }}
>
  {currentLevel.title}
</p>

      <h1
  style={{
    fontSize: "3rem",
    margin: "0",
    color: "var(--clr-accent)",
  }}
>
  {score}/{questions.length}
</h1>

<p
  style={{
    marginTop: "8px",
    fontSize: "1rem",
    opacity: 0.8,
  }}
>
  You answered {score} out of {questions.length} questions correctly.
</p>
<p
  style={{
    marginTop: "20px",
    marginBottom: "30px",
    fontWeight: "600",
  }}
>
  Accuracy: {Math.round((score / questions.length) * 100)}%
</p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          marginTop: "24px",
          flexWrap: "wrap",
        }}
      >
        <button
          className="submit-btn"
          onClick={() => {
            setIdx(0);
            setScore(0);
            setAns(null);
            setChecked(false);
            setMsg("");
            setCurrentScreen("quiz");
          }}
        >
          Retry Level
        </button>

        <button
          className="submit-btn"
          onClick={() => {
            setIdx(0);
            setScore(0);
            setAns(null);
            setChecked(false);
            setMsg("");
            setCurrentScreen("levels");
          }}
        >
          Back to Levels
        </button>

        {selectedLevel < LEVELS.length && (
          <button
            className="submit-btn"
            onClick={() => {
              setSelectedLevel(selectedLevel + 1);
              setIdx(0);
              setScore(0);
              setAns(null);
              setChecked(false);
              setMsg("");
              setCurrentScreen("quiz");
            }}
          >
            Next Level →
          </button>
        )}
      </div>
    </div>
  );
}
}

