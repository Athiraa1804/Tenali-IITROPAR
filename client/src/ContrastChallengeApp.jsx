/**
 * ContrastChallengeApp - Help students distinguish between commonly confused concepts
 * 
 * A component that presents interactive activities followed by
 * side-by-side comparison of concept pairs.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Hardcoded list of all contrast pairs (replaces server JSON + API)
const CONTRAST_PAIRS = [
  { id: 'area-perimeter', title: 'Area vs Perimeter' },
  { id: 'congruence-similarity', title: 'Congruence vs Similarity' },
  { id: 'decimals-fractions', title: 'Decimals vs Fractions' },
  { id: 'differentiation-integration', title: 'Differentiation vs Integration' },
  { id: 'factors-multiples', title: 'Factors vs Multiples' },
  { id: 'hcf-lcm', title: 'HCF vs LCM' },
  { id: 'interior-exterior', title: 'Interior vs Exterior Angles' },
  { id: 'limits-differentiation', title: 'Limits vs Differentiation' },
  { id: 'linear-simultaneous', title: 'Linear vs Simultaneous Equations' },
  { id: 'matrices-determinants', title: 'Matrices vs Determinants' },
  { id: 'mean-median-mode', title: 'Mean vs Median vs Mode' },
  { id: 'permutation-combination', title: 'Permutation vs Combination' },
  { id: 'prime-composite', title: 'Prime vs Composite Numbers' },
  { id: 'radius-diameter', title: 'Radius vs Diameter' },
  { id: 'trig-inverse-trig', title: 'Trigonometry vs Inverse Trig' },
];

export function getUsernameNamespace() {
  try {
    const authUserStr = localStorage.getItem('tenali-auth-user');
    if (authUserStr) {
      const authUser = JSON.parse(authUserStr);
      if (authUser && authUser.username) {
        return authUser.username;
      }
    }
  } catch (e) {}
  return 'guest';
}

export function getStorageKeys() {
  const ns = getUsernameNamespace();
  return {
    seen: `tenali-contrast-seen-${ns}`,
    unlocked: `tenali-contrast-unlocked-${ns}`,
    completedModules: `tenali-completed-modules-${ns}`
  };
}

// Load progress from localStorage
function loadProgress() {
  try {
    const keys = getStorageKeys();
    const data = localStorage.getItem(keys.seen);
    return data ? JSON.parse(data) : { seenPairs: [], completedPairs: [] };
  } catch {
    return { seenPairs: [], completedPairs: [] };
  }
}

// Save progress to localStorage
function saveProgress(progress) {
  try {
    const keys = getStorageKeys();
    localStorage.setItem(keys.seen, JSON.stringify(progress));
  } catch { }
}

// Bidirectional progress sync with the server database
export async function syncContrastProgress(token) {
  if (!token) return;
  try {
    const API = import.meta.env.VITE_API_BASE_URL || '';
    
    // Get current logged in username to identify user switches
    const authUserStr = localStorage.getItem('tenali-auth-user');
    let currentUsername = null;
    if (authUserStr) {
      try {
        const authUser = JSON.parse(authUserStr);
        currentUsername = authUser ? authUser.username : null;
      } catch {}
    }
    if (!currentUsername) return;

    const userKeys = {
      completedModules: `tenali-completed-modules-${currentUsername}`,
      unlocked: `tenali-contrast-unlocked-${currentUsername}`,
      seen: `tenali-contrast-seen-${currentUsername}`
    };

    // 1. Get current namespaced localStorage values
    const localCompletedModules = JSON.parse(localStorage.getItem(userKeys.completedModules) || '[]');
    const localUnlocked = JSON.parse(localStorage.getItem(userKeys.unlocked) || '[]');
    const localSeen = JSON.parse(localStorage.getItem(userKeys.seen) || '{"seenPairs":[],"completedPairs":[]}');

    // 2. Fetch server values
    const res = await fetch(`${API}/contrast-api/progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch server progress');
    const data = await res.json();
    const serverProgress = data.progress || {};

    // 3. Merge states: Local User + Server Progress
    const mergedCompletedModules = Array.from(new Set([
      ...localCompletedModules,
      ...(serverProgress.completedModules || [])
    ]));
    const mergedUnlocked = Array.from(new Set([
      ...localUnlocked,
      ...(serverProgress.unlockedPairs || [])
    ]));
    const mergedSeenPairs = Array.from(new Set([
      ...(localSeen.seenPairs || []),
      ...(serverProgress.seenPairs || [])
    ]));
    const mergedCompletedPairs = Array.from(new Set([
      ...(localSeen.completedPairs || []),
      ...(serverProgress.completedPairs || [])
    ]));

    // 4. Save merged states back to user localStorage
    localStorage.setItem(userKeys.completedModules, JSON.stringify(mergedCompletedModules));
    localStorage.setItem(userKeys.unlocked, JSON.stringify(mergedUnlocked));
    localStorage.setItem(userKeys.seen, JSON.stringify({
      seenPairs: mergedSeenPairs,
      completedPairs: mergedCompletedPairs
    }));

    // 7. Send merged states back to server
    await fetch(`${API}/contrast-api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        completedModules: mergedCompletedModules,
        unlockedPairs: mergedUnlocked,
        seenPairs: mergedSeenPairs,
        completedPairs: mergedCompletedPairs
      })
    });
  } catch (err) {
    console.error('[contrast] Error syncing progress with server:', err);
  }
}

// Shuffle array helper
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const CONTRAST_MAPPING = {
  'area-perimeter': ['mensur'],
  'congruence-similarity': ['congruence', 'similarity'],
  'decimals-fractions': ['decimals', 'fractionadd'],
  'differentiation-integration': ['diff', 'integ'],
  'factors-multiples': ['hcflcm'],
  'hcf-lcm': ['hcflcm'],
  'interior-exterior': ['polygons'],
  'limits-differentiation': ['limits', 'diff'],
  'linear-simultaneous': ['lineareq', 'simul'],
  'matrices-determinants': ['matrix'],
  'mean-median-mode': ['stats'],
  'permutation-combination': ['permcomb'],
  'prime-composite': ['primefactor', 'basicarith'],
  'radius-diameter': ['circleth', 'circmeasure', 'mensur'],
  'trig-inverse-trig': ['trig', 'invtrig']
};

export const MODULE_NAMES = {
  primefactor: "Prime Factorization",
  basicarith: "Arithmetic",
  hcflcm: "HCF & LCM",
  decimals: "Decimals",
  fractionadd: "Fraction Addition",
  congruence: "Congruence",
  similarity: "Similarity",
  mensur: "Mensuration",
  circleth: "Circle Theorems",
  circmeasure: "Circular Measure",
  trig: "Trigonometry",
  invtrig: "Inverse Trigonometry",
  permcomb: "Permutations & Combinations",
  diff: "Differentiation",
  integ: "Integration",
  limits: "Limits",
  lineareq: "Linear Equations",
  simul: "Simultaneous Equations",
  matrix: "Matrices",
  stats: "Statistics",
  polygons: "Polygons"
};

export const CHALLENGE_TITLES = {
  'area-perimeter': "Area vs Perimeter",
  'congruence-similarity': "Congruence vs Similarity",
  'decimals-fractions': "Decimals vs Fractions",
  'differentiation-integration': "Diff vs Integration",
  'factors-multiples': "Factors vs Multiples",
  'hcf-lcm': "HCF vs LCM",
  'interior-exterior': "Interior vs Exterior Angles",
  'limits-differentiation': "Limits vs Diff",
  'linear-simultaneous': "Linear vs Sim Equations",
  'matrices-determinants': "Matrices vs Determinants",
  'mean-median-mode': "Mean, Median, Mode",
  'permutation-combination': "Permutation vs Combination",
  'prime-composite': "Prime vs Composite",
  'radius-diameter': "Radius vs Diameter",
  'trig-inverse-trig': "Trig vs Inverse Trig"
};

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--clr-correct)" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

export default function ContrastChallengeApp({ studentName, onBack }) {
  const [phase, setPhase] = useState('list'); // list, activity
  const [currentPair, setCurrentPair] = useState(null);
  const [progress, setProgress] = useState(loadProgress());
  const [unlockedPairs, setUnlockedPairs] = useState(() => {
    try {
      const keys = getStorageKeys();
      const data = localStorage.getItem(keys.unlocked);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // On mount, sync progress with server if authenticated
  useEffect(() => {
    const token = localStorage.getItem('tenali-auth-token');
    if (token) {
      syncContrastProgress(token).then(() => {
        setProgress(loadProgress());
        try {
          const keys = getStorageKeys();
          const data = localStorage.getItem(keys.unlocked);
          setUnlockedPairs(data ? JSON.parse(data) : []);
        } catch {}
      });
    }
  }, []);

  // Listen for login/logout changes to clean up or reset progress local state
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem('tenali-auth-token');
      // Reload states from localStorage immediately for the new namespace (guest or logged-in user)
      setProgress(loadProgress());
      try {
        const keys = getStorageKeys();
        const data = localStorage.getItem(keys.unlocked);
        setUnlockedPairs(data ? JSON.parse(data) : []);
      } catch {}

      if (token) {
        // User logged in: trigger sync
        syncContrastProgress(token).then(() => {
          setProgress(loadProgress());
          try {
            const keys = getStorageKeys();
            const data = localStorage.getItem(keys.unlocked);
            setUnlockedPairs(data ? JSON.parse(data) : []);
          } catch {}
        });
      }
    };
    window.addEventListener('tenali-auth-change', handleAuthChange);
    return () => window.removeEventListener('tenali-auth-change', handleAuthChange);
  }, []);

  // All pairs are hardcoded — no API needed
  const allPairs = CONTRAST_PAIRS;

  // Open a specific pair by ID (pure local — no network call)
  const fetchPairById = useCallback((pairId) => {
    const pair = CONTRAST_PAIRS.find(p => p.id === pairId);
    if (pair) {
      setCurrentPair(pair);
      setPhase('activity');
    }
  }, []);

  // Refresh unlocked list from localStorage whenever we return to list view
  useEffect(() => {
    if (phase === 'list') {
      try {
        const keys = getStorageKeys();
        const data = localStorage.getItem(keys.unlocked);
        setUnlockedPairs(data ? JSON.parse(data) : []);
      } catch { }
    }
  }, [phase]);

  // Deep-link: start a specific pair if stored in localStorage
  useEffect(() => {
    const startId = localStorage.getItem('tenali-start-contrast-id');
    if (startId) {
      localStorage.removeItem('tenali-start-contrast-id');
      fetchPairById(startId);
    }
  }, [fetchPairById]);

  // Mark a pair as completed and return to list
  const handlePairComplete = (pairId) => {
    const newProgress = {
      seenPairs: progress.seenPairs.includes(pairId)
        ? progress.seenPairs
        : [...progress.seenPairs, pairId],
      completedPairs: progress.completedPairs.includes(pairId)
        ? progress.completedPairs
        : [...progress.completedPairs, pairId]
    };
    setProgress(newProgress);
    saveProgress(newProgress);

    // Sync to server if authenticated
    const token = localStorage.getItem('tenali-auth-token');
    if (token) {
      syncContrastProgress(token);
    }

    setPhase('list');
  };

  // Render list view
  if (phase === 'list') {
    return (
      <>
        <div className="header-row">
          <button className="back-button" onClick={onBack}>← Home</button>
        </div>
        <h1>Contrast Challenge</h1>
        <p className="subtitle">Distinguish similar concepts</p>

        <div className="menu-grid">
          {allPairs.filter(pair => CONTRAST_MAPPING[pair.id]).map(pair => {
            const isUnlocked = unlockedPairs.includes(pair.id);
            const isCompleted = progress.completedPairs.includes(pair.id);
            const reqModules = CONTRAST_MAPPING[pair.id] || [];
            const reqNames = reqModules.map(m => MODULE_NAMES[m] || m).join(' & ');

            return (
              <button
                key={pair.id}
                className={`menu-card ${isUnlocked ? 'featured' : 'placeholder'}`}
                onClick={() => isUnlocked && fetchPairById(pair.id)}
                disabled={!isUnlocked}
                style={{
                  position: 'relative',
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  opacity: isUnlocked ? 1 : 0.6
                }}
              >
                <span className="menu-title" style={{ width: '100%' }}>{pair.title}</span>
                <span className="menu-subtitle" style={{ minHeight: 'unset', marginTop: '8px', fontSize: '0.78rem' }}>
                  {isCompleted ? (
                    <span style={{ color: 'var(--clr-correct)', fontWeight: 'bold' }}>
                      <CheckIcon /> Done
                    </span>
                  ) : !isUnlocked ? (
                    <span style={{ color: 'var(--clr-text-soft)' }}>
                      <LockIcon /> Requires: {reqNames}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--clr-accent)', fontWeight: '500' }}>
                      Available
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  // Render loading
  // Render custom Area vs Perimeter challenge if matched
  if (currentPair?.id === 'area-perimeter' && phase === 'activity') {
    return (
      <AreaPerimeterChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('area-perimeter')}
      />
    );
  }

  // Render custom Radius vs Diameter challenge if matched
  if (currentPair?.id === 'radius-diameter' && phase === 'activity') {
    return (
      <RadiusDiameterChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('radius-diameter')}
      />
    );
  }

  // Render custom HCF vs LCM challenge if matched
  if (currentPair?.id === 'hcf-lcm' && phase === 'activity') {
    return (
      <HcfLcmChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('hcf-lcm')}
      />
    );
  }

  // Render custom Factors vs Multiples challenge if matched
  if (currentPair?.id === 'factors-multiples' && phase === 'activity') {
    return (
      <FactorsMultiplesChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('factors-multiples')}
      />
    );
  }

  // Render custom Congruence vs Similarity challenge if matched
  if (currentPair?.id === 'congruence-similarity' && phase === 'activity') {
    return (
      <CongruenceSimilarityChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('congruence-similarity')}
      />
    );
  }

  // Render custom Matrices vs Determinants challenge if matched
  if (currentPair?.id === 'matrices-determinants' && phase === 'activity') {
    return (
      <MatricesDeterminantsChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('matrices-determinants')}
      />
    );
  }

  // Render custom Mean vs Median vs Mode challenge if matched
  if (currentPair?.id === 'mean-median-mode' && phase === 'activity') {
    return (
      <MeanMedianModeChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('mean-median-mode')}
      />
    );
  }

  // Render custom Limits vs Differentiation challenge if matched
  if (currentPair?.id === 'limits-differentiation' && phase === 'activity') {
    return (
      <LimitsDifferentiationChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('limits-differentiation')}
      />
    );
  }

  // Render custom Differentiation vs Integration challenge if matched
  if (currentPair?.id === 'differentiation-integration' && phase === 'activity') {
    return (
      <DifferentiationIntegrationChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('differentiation-integration')}
      />
    );
  }

  // Render custom Decimals vs Fractions challenge if matched
  if (currentPair?.id === 'decimals-fractions' && phase === 'activity') {
    return (
      <DecimalsFractionsChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('decimals-fractions')}
      />
    );
  }

  // Render custom Permutation vs Combination challenge if matched
  if (currentPair?.id === 'permutation-combination' && phase === 'activity') {
    return (
      <PermutationCombinationChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('permutation-combination')}
      />
    );
  }

  // Render custom Prime vs Composite challenge if matched
  if (currentPair?.id === 'prime-composite' && phase === 'activity') {
    return (
      <PrimeCompositeChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('prime-composite')}
      />
    );
  }

  // Render custom Trigonometry vs Inverse Trigonometry challenge if matched
  if (currentPair?.id === 'trig-inverse-trig' && phase === 'activity') {
    return (
      <TrigInverseTrigChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('trig-inverse-trig')}
      />
    );
  }

  // Render custom Linear Equation vs Simultaneous Equations challenge if matched
  if (currentPair?.id === 'linear-simultaneous' && phase === 'activity') {
    return (
      <LinearSimultaneousChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('linear-simultaneous')}
      />
    );
  }

  // Render custom Interior Angles vs Exterior Angles challenge if matched
  if (currentPair?.id === 'interior-exterior' && phase === 'activity') {
    return (
      <InteriorExteriorChallenge
        onBack={() => setPhase('list')}
        onComplete={() => handlePairComplete('interior-exterior')}
      />
    );
  }

  // Safety fallback — should never render since all pair IDs are handled above
  return null;
}

export function QuizLayoutExtension({ children }) {
  const [currentMode, setCurrentMode] = useState(null);
  const [unlockedList, setUnlockedList] = useState([]);
  const [completedModulesList, setCompletedModulesList] = useState([]);
  const [completedPairsList, setCompletedPairsList] = useState([]);

  useEffect(() => {
    setCurrentMode(window.currentTenaliMode);
  }, []);

  const isFinished = hasFinishedBox(children);

  // Auto unlock when finished and sync states to ensure UI matches updated localStorage
  useEffect(() => {
    if (isFinished && currentMode) {
      unlockContrastChallengeForMode(currentMode);

      try {
        const keys = getStorageKeys();
        const completedStr = localStorage.getItem(keys.completedModules) || '[]';
        setCompletedModulesList(JSON.parse(completedStr));

        const unlockedStr = localStorage.getItem(keys.unlocked) || '[]';
        setUnlockedList(JSON.parse(unlockedStr));

        const seenStr = localStorage.getItem(keys.seen) || '{"seenPairs":[],"completedPairs":[]}';
        setCompletedPairsList(JSON.parse(seenStr).completedPairs || []);
      } catch (e) {
        console.error('Error reading localStorage in effect:', e);
      }
    }
  }, [isFinished, currentMode]);

  if (!isFinished || !currentMode) return null;

  // Get all associated contrast challenges for the current mode
  const associatedContrasts = Object.entries(CONTRAST_MAPPING)
    .filter(([_, modes]) => modes.includes(currentMode))
    .map(([id, requiredModules]) => {
      const keys = getStorageKeys();
      const completed = completedModulesList.length > 0
        ? completedModulesList
        : (() => {
          try {
            return JSON.parse(localStorage.getItem(keys.completedModules) || '[]');
          } catch { return []; }
        })();

      const unlocked = unlockedList.length > 0
        ? unlockedList
        : (() => {
          try {
            return JSON.parse(localStorage.getItem(keys.unlocked) || '[]');
          } catch { return []; }
        })();

      const completedPairs = completedPairsList.length > 0
        ? completedPairsList
        : (() => {
          try {
            const seenStr = localStorage.getItem(keys.seen) || '{"seenPairs":[],"completedPairs":[]}';
            return JSON.parse(seenStr).completedPairs || [];
          } catch { return []; }
        })();

      const isUnlocked = requiredModules.every(m => completed.includes(m)) || unlocked.includes(id);
      const isCompleted = completedPairs.includes(id);
      const pendingModules = isUnlocked ? [] : requiredModules.filter(m => !completed.includes(m));

      return {
        id,
        title: CHALLENGE_TITLES[id] || id,
        isUnlocked,
        isCompleted,
        pendingModules,
        requiredModules
      };
    });

  if (associatedContrasts.length === 0) return null;

  // Sort challenges: active (unlocked, incomplete) first, then completed, then locked
  associatedContrasts.sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    if (a.isUnlocked && b.isUnlocked) {
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
    }
    return 0;
  });

  return (
    <div style={{
      marginTop: '32px',
      padding: '24px',
      background: 'var(--clr-surface)',
      borderRadius: '12px',
      border: '1px solid var(--clr-border)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      textAlign: 'left'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
        <span style={{ fontSize: '1.6rem', userSelect: 'none' }}>🧩</span>
        <div>
          <h3 style={{ margin: 0, color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: '700' }}>
            Contrast Challenges
          </h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem', color: 'var(--clr-text-soft)' }}>
            Deepen your understanding by comparing similar concepts in this topic.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {associatedContrasts.map(challenge => {
          const { id, title, isUnlocked, isCompleted, pendingModules } = challenge;

          if (!isUnlocked) {
            const pendingNames = pendingModules.map(m => MODULE_NAMES[m] || m).join(' & ');
            return (
              <div
                key={id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.02)',
                  border: '1px dashed var(--clr-border)',
                  color: 'var(--clr-text-soft)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  opacity: 0.8
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.05)',
                      color: 'var(--clr-text-soft)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <LockIcon /> Locked
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--clr-text-soft)', fontWeight: '600' }}>
                    {title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>
                    Requires: {pendingNames ? `Complete ${pendingNames}` : 'Prerequisites not met'}
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={id}
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: 'var(--clr-surface)',
                border: isCompleted ? '1.5px solid var(--clr-correct)' : '1.5px solid var(--clr-accent)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
              onClick={() => {
                localStorage.setItem('tenali-start-contrast-id', id);
                window.dispatchEvent(new CustomEvent('tenali-change-mode', { detail: 'contrastlist' }));
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isCompleted ? 'rgba(92, 184, 122, 0.1)' : 'var(--clr-accent-soft)',
                    color: isCompleted ? 'var(--clr-correct)' : 'var(--clr-accent)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isCompleted ? <><CheckIcon /> Completed</> : 'Available'}
                  </span>
                </div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--clr-text)', fontWeight: '600' }}>
                  {title}
                </h4>
              </div>
              <button
                style={{
                  width: '100%',
                  background: isCompleted ? 'var(--clr-correct)' : 'var(--clr-accent)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  pointerEvents: 'none'
                }}
              >
                {isCompleted ? 'Review Challenge' : 'Start Challenge'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to check if a welcome-box / finished screen is rendered
function hasFinishedBox(children) {
  try {
    let found = false;
    const traverse = (node) => {
      if (found || !node) return;
      if (typeof node === 'object') {
        if (node.props) {
          if (node.props.className === 'final-score') {
            found = true;
            return;
          }
          if (node.props.className === 'welcome-box') {
            if (hasFinishedText(node.props.children)) {
              found = true;
              return;
            }
          }
          if (node.props.children) {
            if (Array.isArray(node.props.children)) {
              node.props.children.forEach(traverse);
            } else {
              traverse(node.props.children);
            }
          }
        }
      }
    };

    const hasFinishedText = (childNode) => {
      if (!childNode) return false;
      if (typeof childNode === 'string') {
        const lower = childNode.toLowerCase();
        return lower.includes('score') || lower.includes('complete') || lower.includes('again');
      }
      if (typeof childNode === 'number') {
        return false;
      }
      if (typeof childNode === 'object') {
        if (Array.isArray(childNode)) {
          return childNode.some(hasFinishedText);
        }
        if (childNode.props && childNode.props.children) {
          return hasFinishedText(childNode.props.children);
        }
      }
      return false;
    };

    if (Array.isArray(children)) {
      children.forEach(traverse);
    } else {
      traverse(children);
    }
    return found;
  } catch (e) {
    console.error('Error in hasFinishedBox:', e);
    return false;
  }
}

export function unlockContrastChallengeForMode(mode) {
  try {
    const keys = getStorageKeys();
    // 1. Load and update completed modules
    const completedStr = localStorage.getItem(keys.completedModules) || '[]';
    const completed = JSON.parse(completedStr);
    let updated = false;
    if (!completed.includes(mode)) {
      completed.push(mode);
      localStorage.setItem(keys.completedModules, JSON.stringify(completed));
      updated = true;
    }

    // 2. Load current unlocked contrast challenges
    const unlockedStr = localStorage.getItem(keys.unlocked) || '[]';
    const unlocked = JSON.parse(unlockedStr);

    // 3. Find which contrast challenges can be unlocked now (all required modules must be completed)
    Object.entries(CONTRAST_MAPPING).forEach(([challengeId, requiredModules]) => {
      const allCompleted = requiredModules.every(m => completed.includes(m));
      if (allCompleted && !unlocked.includes(challengeId)) {
        unlocked.push(challengeId);
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(keys.unlocked, JSON.stringify(unlocked));
    }

    // Sync to server if authenticated
    const token = localStorage.getItem('tenali-auth-token');
    if (token) {
      syncContrastProgress(token);
    }
  } catch (e) {
    console.error('Error unlocking contrast challenge:', e);
  }
}

const styles = {
  loadingSpinner: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: 'var(--clr-text-soft)',
    marginBottom: '4px',
  },
  conceptText: {
    margin: 0,
    fontSize: '1rem',
    lineHeight: '1.4',
  },
  conceptFormula: {
    margin: 0,
    fontSize: '1rem',
    fontFamily: 'monospace',
    color: 'var(--clr-text)',
  },
  conceptExample: {
    margin: 0,
    fontSize: '1rem',
    fontStyle: 'italic',
    color: 'var(--clr-text-soft)',
  },
  conceptSignal: {
    margin: 0,
    fontSize: '1rem',
    color: 'var(--clr-accent)',
  },
};

function AreaPerimeterChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, r3_1, r3_2, comparison
  const [isFilled, setIsFilled] = useState(false);
  const [isBorderGlowing, setIsBorderGlowing] = useState(false);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');
  const [revealedConcept, setRevealedConcept] = useState(''); // "That's Area!" or "That's Perimeter!"

  // Layer 3 state
  const [q1Answer, setQ1Answer] = useState(null); // 'unanswered', 'correct', 'wrong'
  const [q2Answer, setQ2Answer] = useState(null); // 'unanswered', 'correct', 'wrong'
  const [q3Answer, setQ3Answer] = useState(null); // 'unanswered', 'correct', 'wrong'
  const [selectedQOption, setSelectedQOption] = useState(null);

  // Q4 Sorting state
  const [q4Tasks, setQ4Tasks] = useState([
    { id: 'carpet', label: '📐 Carpet a room', category: 'Area' },
    { id: 'fence', label: '📏 Fence a playground', category: 'Perimeter' },
    { id: 'paint', label: '🖌️ Paint a wall', category: 'Area' },
    { id: 'ribbon', label: '🎀 Put ribbon around a gift', category: 'Perimeter' }
  ]);
  const [activeTask, setActiveTask] = useState(null);
  const [q4Sorted, setQ4Sorted] = useState({ Area: [], Perimeter: [] });
  const [q4Feedback, setQ4Feedback] = useState('');

  // Reset animations and states when moving to a new step
  useEffect(() => {
    setIsFilled(false);
    setIsBorderGlowing(false);
    setAnswerState('unanswered');
    setWrongAttempts(0);
    setFeedbackText('');
    setHintText('');
    setRevealedConcept('');

    // Reset Layer 3
    setQ1Answer(null);
    setQ2Answer(null);
    setQ3Answer(null);
    setSelectedQOption(null);
  }, [subStep]);

  // Q1 handling
  const handleQ1Select = (option) => {
    if (q1Answer !== null) return;
    setSelectedQOption(option);
    if (option === 'Perimeter') {
      setQ1Answer('correct');
      setFeedbackText("Correct! Before choosing a formula, first identify what is being measured. A fence goes around the garden, so you need the Perimeter.");
    } else {
      setQ1Answer('wrong');
      setFeedbackText("Not quite. Remember, a fence surrounding the outer edge measures the boundary, which is the Perimeter.");
    }
  };

  // Q2 handling
  const handleQ2Select = (option) => {
    if (q2Answer !== null) return;
    setSelectedQOption(option);
    if (option === '96 m²') {
      setQ2Answer('correct');
      setFeedbackText("Correct! Laying grass turf covers the entire surface area. Area = 12 m × 8 m = 96 m².");
    } else {
      setQ2Answer('wrong');
      if (option === '40 m') {
        setFeedbackText("Not quite. 40 m is the distance around (perimeter). Laying grass turf covers the surface inside, which is the Area (Length × Width).");
      } else {
        setFeedbackText("Not quite. Laying grass turf covers the space inside, so we measure Area: 12 m × 8 m = 96 m².");
      }
    }
  };

  // Q3 handling
  const handleQ3Select = (option) => {
    if (q3Answer !== null) return;
    setSelectedQOption(option);
    if (option === '40 m') {
      setQ3Answer('correct');
      setFeedbackText("Correct! Lights around the boundary require the distance around the edge. Perimeter = 2 × (12 + 8) = 40 m.");
    } else {
      setQ3Answer('wrong');
      if (option === '96 m²') {
        setFeedbackText("Not quite. 96 m² is the inside space (Area). Decorative lights need to surround the outer boundary, which is the Perimeter.");
      } else {
        setFeedbackText("Not quite. Placing lights around the boundary edge requires the distance around (Perimeter): 2 × (12 + 8) = 40 m.");
      }
    }
  };

  // Q4 handling
  const handleTaskClick = (task) => {
    const inArea = q4Sorted.Area.find(t => t.id === task.id);
    const inPerimeter = q4Sorted.Perimeter.find(t => t.id === task.id);

    if (inArea || inPerimeter) {
      setQ4Sorted(prev => ({
        Area: prev.Area.filter(t => t.id !== task.id),
        Perimeter: prev.Perimeter.filter(t => t.id !== task.id)
      }));
      setQ4Feedback('');
      return;
    }

    setActiveTask(task);
  };

  const handleBucketPlace = (bucketName) => {
    if (!activeTask) return;

    if (activeTask.category !== bucketName) {
      setQ4Feedback(`Not quite. "${activeTask.label}" belongs in ${activeTask.category} because it measures ${activeTask.category === 'Area' ? 'inside space' : 'around the boundary'}.`);
      setActiveTask(null);
      return;
    }

    setQ4Sorted(prev => ({
      ...prev,
      [bucketName]: [...prev[bucketName], activeTask]
    }));
    setActiveTask(null);
    setQ4Feedback('Correct placement!');
  };

  const allQ4Placed = (q4Sorted.Area.length + q4Sorted.Perimeter.length) === 4;

  const handleRegionClick = (clickedRegion) => {
    if (answerState === 'correct') return;

    // Determine target region for current step
    let targetRegion = 'inside';
    let conceptLabel = "Area";
    if (subStep === 'r1' || subStep === 'r3_1') {
      targetRegion = 'inside';
      conceptLabel = "Area";
    } else if (subStep === 'r2' || subStep === 'r3_2') {
      targetRegion = 'boundary';
      conceptLabel = "Perimeter";
    }

    if (clickedRegion === targetRegion) {
      setAnswerState('correct');
      setRevealedConcept(`That's ${conceptLabel}!`);

      if (conceptLabel === 'Area') {
        setIsFilled(true);
        setIsBorderGlowing(false);
      } else {
        setIsBorderGlowing(true);
        setIsFilled(false);
      }

      // Set feedback text based on step
      if (subStep === 'r1') {
        setFeedbackText("Correct! You selected the inside of the garden, so we're measuring Area.");
      } else if (subStep === 'r2') {
        setFeedbackText("Correct! Only the boundary is measured, so this is Perimeter.");
      } else if (subStep === 'r3_1') {
        setFeedbackText("Correct! Tiles cover the floor, which is the Area inside.");
      } else if (subStep === 'r3_2') {
        setFeedbackText("Correct! Rope surrounds the pool boundary, which is the Perimeter.");
      }
      setHintText('');
    } else {
      // Wrong click
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);

      // Flash wrong feedback visual cue briefly
      if (clickedRegion === 'inside') {
        setIsFilled(true);
        setTimeout(() => {
          setIsFilled(false);
        }, 1000);
      } else {
        setIsBorderGlowing(true);
        setTimeout(() => {
          setIsBorderGlowing(false);
        }, 1000);
      }

      if (newAttempts === 1) {
        setHintText("Hint 1: Are we covering the inside or surrounding it?");
      } else if (newAttempts === 2) {
        setHintText("Hint 2: Look carefully at where the work happens.");
      } else {
        // Auto reveal after 3 wrong clicks
        setAnswerState('correct');
        setRevealedConcept(`That's ${conceptLabel}!`);
        if (conceptLabel === 'Area') {
          setIsFilled(true);
          setIsBorderGlowing(false);
        } else {
          setIsBorderGlowing(true);
          setIsFilled(false);
        }
      }
    }
  };

  const handleNext = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('r3_1');
    else if (subStep === 'r3_1') setSubStep('r3_2');
    else if (subStep === 'r3_2') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
    else if (subStep === 'q2') setSubStep('q3');
    else if (subStep === 'q3') setSubStep('q4');
  };

  const hoverStyles = `
    .region-inside {
      fill: transparent;
      transition: fill 0.2s ease;
      cursor: pointer;
    }
    .region-inside:hover {
      fill: rgba(92, 184, 122, 0.12) !important;
    }
    .region-boundary {
      fill: none;
      stroke: transparent;
      stroke-width: 16;
      transition: stroke 0.2s ease;
      cursor: pointer;
    }
    .region-boundary:hover {
      stroke: rgba(232, 134, 74, 0.22) !important;
    }
  `;

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '10px' }}>
      <style>{hoverStyles}</style>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Area vs Perimeter
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Paint or Fence
      </p>

      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <svg width="300" height="180" viewBox="0 0 300 180" style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-btn)' }}>
              <rect x="25" y="25" width="250" height="130" rx="8" fill="none" stroke="var(--clr-border)" strokeWidth="2" />
              <text x="150" y="95" textAnchor="middle" fill="var(--clr-text-soft)" fontSize="16" fontFamily="var(--font-body)">Garden</text>
            </svg>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            The same garden can require different measurements depending on the task. Can you identify which one?
          </p>
          <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Activity</button>
        </div>
      )}

      {(subStep === 'r1' || subStep === 'r2') && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <svg width="300" height="180" viewBox="0 0 300 180" style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-btn)' }}>
              {/* Paint Fill Animation (Left to Right) */}
              <rect
                x="25"
                y="25"
                width={isFilled ? 250 : 0}
                height="130"
                fill="rgba(92, 184, 122, 0.4)"
                style={{ transition: 'width 1.5s ease-in-out' }}
              />
              {/* Fence Drawing Animation (strokeDashoffset) */}
              <rect
                x="25"
                y="25"
                width="250"
                height="130"
                rx="8"
                fill="none"
                stroke="var(--clr-accent)"
                strokeWidth="6"
                strokeDasharray="760"
                strokeDashoffset={isBorderGlowing ? 0 : 760}
                style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
              />
              <text x="150" y="95" textAnchor="middle" fill="var(--clr-text)" fontSize="16" fontWeight="600" style={{ pointerEvents: 'none' }}>Garden</text>

              {/* Clickable regions (invisible overlays with hover effects) */}
              <rect
                className="region-inside"
                x="28"
                y="28"
                width="244"
                height="124"
                onClick={() => handleRegionClick('inside')}
              />
              <rect
                className="region-boundary"
                x="25"
                y="25"
                width="250"
                height="130"
                rx="8"
                onClick={() => handleRegionClick('boundary')}
              />
            </svg>
          </div>

          <p style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '8px' }}>
            {subStep === 'r1' ? 'The owner wants to cover the garden floor with green grass.' : 'The owner wants to build a fence around the garden boundary.'}
          </p>
          <p style={{ color: 'var(--clr-text-soft)', fontSize: '1.02rem', marginBottom: '24px' }}>
            Hover and click the part of the garden that should be measured.
          </p>

          {answerState === 'unanswered' ? (
            <div style={{ minHeight: '60px' }}>
              {hintText && (
                <p style={{ color: 'var(--clr-accent)', fontWeight: '600', margin: '0', fontSize: '1.05rem' }}>
                  {hintText}
                </p>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '18px 24px',
                background: 'var(--clr-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--clr-border)',
                borderLeft: '5px solid var(--clr-correct)',
                marginBottom: '20px'
              }}>
                <span style={{ color: 'var(--clr-accent)', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {revealedConcept}
                </span>
                <span style={{ color: 'var(--clr-text)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--clr-correct)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  {feedbackText}
                </span>
              </div>
              <div>
                <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {(subStep === 'r3_1' || subStep === 'r3_2') && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <svg width="300" height="180" viewBox="0 0 300 180" style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-btn)' }}>
              {/* Tiles Fill Animation */}
              <rect
                x="25"
                y="25"
                width={isFilled ? 250 : 0}
                height="130"
                rx="12"
                fill="rgba(75, 163, 227, 0.4)"
                style={{ transition: 'width 1.5s ease-in-out' }}
              />
              {/* Rope Drawing Animation */}
              <rect
                x="25"
                y="25"
                width="250"
                height="130"
                rx="12"
                fill="none"
                stroke="#e05a4a"
                strokeWidth="6"
                strokeDasharray="760"
                strokeDashoffset={isBorderGlowing ? 0 : 760}
                style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
              />
              <text x="150" y="95" textAnchor="middle" fill="var(--clr-text)" fontSize="16" fontWeight="600" style={{ pointerEvents: 'none' }}>Swimming Pool</text>

              {/* Clickable regions */}
              <rect
                className="region-inside"
                x="28"
                y="28"
                width="244"
                height="124"
                onClick={() => handleRegionClick('inside')}
              />
              <rect
                className="region-boundary"
                x="25"
                y="25"
                width="250"
                height="130"
                rx="12"
                onClick={() => handleRegionClick('boundary')}
              />
            </svg>
          </div>

          <p style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '8px' }}>
            {subStep === 'r3_1' ? 'The owner wants to cover the pool floor with tiles.' : 'The owner wants to put a safety rope around the pool edge.'}
          </p>
          <p style={{ color: 'var(--clr-text-soft)', fontSize: '1.02rem', marginBottom: '24px' }}>
            Hover and click the part of the pool that should be measured.
          </p>

          {answerState === 'unanswered' ? (
            <div style={{ minHeight: '60px' }}>
              {hintText && (
                <p style={{ color: 'var(--clr-accent)', fontWeight: '600', margin: '0', fontSize: '1.05rem' }}>
                  {hintText}
                </p>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '18px 24px',
                background: 'var(--clr-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--clr-border)',
                borderLeft: '5px solid var(--clr-correct)',
                marginBottom: '20px'
              }}>
                <span style={{ color: 'var(--clr-accent)', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {revealedConcept}
                </span>
                <span style={{ color: 'var(--clr-text)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--clr-correct)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  {feedbackText}
                </span>
              </div>
              <div>
                <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
            <p style={{ color: 'var(--clr-text-soft)', fontSize: '1.02rem', marginBottom: '16px', fontWeight: '500' }}>
              Hover & click inside or border of the shape to visualize the contrast:
            </p>
            <svg width="300" height="180" viewBox="0 0 300 180" style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-btn)' }}>
              <rect
                x="25"
                y="25"
                width={isFilled ? 250 : 0}
                height="130"
                fill="rgba(92, 184, 122, 0.4)"
                style={{ transition: 'width 0.8s ease-in-out' }}
              />
              <rect
                x="25"
                y="25"
                width="250"
                height="130"
                rx="8"
                fill="none"
                stroke="var(--clr-accent)"
                strokeWidth="6"
                strokeDasharray="760"
                strokeDashoffset={isBorderGlowing ? 0 : 760}
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
              <text x="150" y="95" textAnchor="middle" fill="var(--clr-text)" fontSize="16" fontWeight="600" style={{ pointerEvents: 'none' }}>Garden</text>

              <rect
                className="region-inside"
                x="28"
                y="28"
                width="244"
                height="124"
                onClick={() => { setIsFilled(true); setIsBorderGlowing(false); }}
              />
              <rect
                className="region-boundary"
                x="25"
                y="25"
                width="250"
                height="130"
                rx="8"
                onClick={() => { setIsFilled(false); setIsBorderGlowing(true); }}
              />
            </svg>
          </div>

          {/* Premium side-by-side comparison cards */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Area Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              border: isFilled ? '2px solid var(--clr-correct)' : '2.5px solid var(--clr-border)',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                AREA (Inside Space)
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Measures:</strong> Space *inside* a shape (e.g., laying tiles, painting).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Formula:</strong> Length × Width (rectangles).
              </p>
              <p style={{ margin: '0 0 14px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Units:</strong> Square units (e.g., m², cm²).
              </p>

              <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '12px', marginTop: '14px' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-soft)', marginBottom: '4px' }}>Common Mistake</span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--clr-wrong)', lineHeight: '1.4' }}>
                  Adding sides instead of multiplying length × width.
                </p>
              </div>
            </div>

            {/* Perimeter Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              border: isBorderGlowing ? '2px solid var(--clr-accent)' : '2.5px solid var(--clr-border)',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                PERIMETER (Boundary Line)
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Measures:</strong> Distance *around* a shape (e.g., fencing, borders).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Formula:</strong> Add all side lengths together.
              </p>
              <p style={{ margin: '0 0 14px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Units:</strong> Linear units (e.g., m, cm).
              </p>

              <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: '12px', marginTop: '14px' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--clr-text-soft)', marginBottom: '4px' }}>Common Mistake</span>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--clr-wrong)', lineHeight: '1.4' }}>
                  Multiplying sides instead of adding them up.
                </p>
              </div>
            </div>
          </div>

          {/* Memory / Decision Rule card */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '500' }}>
              Before solving, ask yourself: Am I measuring...
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '200px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Am I covering the</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)' }}>INSIDE?</strong>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', marginTop: '4px' }}>Use Area</span>
              </div>
              <div style={{ background: 'var(--clr-card)', padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '200px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Am I going</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-accent)' }}>AROUND?</strong>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', marginTop: '4px' }}>Use Perimeter</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Apply the Rule */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 4: Recognition</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.6', margin: '0 0 16px 0', fontWeight: '500' }}>
              A rectangular garden has:<br />
              <strong>Length = 10 m</strong><br />
              <strong>Breadth = 6 m</strong>
            </p>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '20px' }}>
              The owner wants to build a fence around it. What should you calculate first?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Area', 'Perimeter'].map(opt => {
                const isSelected = selectedQOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleQ1Select(opt)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 4: Concept + Calculation</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="320" height="160" viewBox="0 0 320 160" style={{ background: 'var(--clr-card)', borderRadius: '6px', border: '1px solid var(--clr-border)' }}>
                <rect x="40" y="35" width="200" height="100" fill="none" stroke="var(--clr-accent)" strokeWidth="2.5" />
                <text x="140" y="25" textAnchor="middle" fontSize="13" fill="var(--clr-text-soft)" fontWeight="600">Length = 12 m</text>
                <text x="248" y="90" textAnchor="start" fontSize="13" fill="var(--clr-text-soft)" fontWeight="600">Breadth = 8 m</text>
              </svg>
            </div>

            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '20px' }}>
              The owner wants to lay grass turf over the entire garden floor. Find the required value.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {['40 m', '96 m²', '20 m', '48 m²'].map(opt => {
                const isSelected = selectedQOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleQ2Select(opt)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q2Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {subStep === 'q3' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 3 of 4: Reverse Confusion</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="320" height="160" viewBox="0 0 320 160" style={{ background: 'var(--clr-card)', borderRadius: '6px', border: '1px solid var(--clr-border)' }}>
                <rect x="40" y="35" width="200" height="100" fill="none" stroke="var(--clr-accent)" strokeWidth="2.5" />
                <text x="140" y="25" textAnchor="middle" fontSize="13" fill="var(--clr-text-soft)" fontWeight="600">Length = 12 m</text>
                <text x="248" y="90" textAnchor="start" fontSize="13" fill="var(--clr-text-soft)" fontWeight="600">Breadth = 8 m</text>
              </svg>
            </div>

            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '20px' }}>
              Decorative lights need to be placed around the boundary of the same garden. Find the required value.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {['96 m²', '40 m', '20 m', '24 m'].map(opt => {
                const isSelected = selectedQOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleQ3Select(opt)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q3Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {q3Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q3Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q3Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q3Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q3Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {subStep === 'q4' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '16px' }}>Question 4 of 4: Real-Life Decisions</p>
          <p style={{ color: 'var(--clr-text)', fontSize: '1.05rem', marginBottom: '24px' }}>
            Click a task card to select it, then click its correct category bucket.
          </p>

          {/* Cards to sort */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            {q4Tasks.map(task => {
              const isSorted = q4Sorted.Area.find(t => t.id === task.id) || q4Sorted.Perimeter.find(t => t.id === task.id);
              const isActive = activeTask?.id === task.id;

              return (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="option-card"
                  style={{
                    padding: '12px 18px',
                    fontSize: '0.98rem',
                    background: isSorted ? 'transparent' : isActive ? 'var(--clr-accent-soft)' : 'var(--clr-card)',
                    border: isSorted ? '1.5px dashed var(--clr-border)' : isActive ? '2px solid var(--clr-accent)' : '1.5px solid var(--clr-border)',
                    opacity: isSorted ? 0.4 : 1,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                  disabled={!!isSorted}
                >
                  {task.label}
                </button>
              );
            })}
          </div>

          {/* Buckets */}
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            {['Area', 'Perimeter'].map(bucketName => {
              const isBucketTarget = !!activeTask;
              return (
                <div
                  key={bucketName}
                  onClick={() => handleBucketPlace(bucketName)}
                  style={{
                    flex: '1 1 240px',
                    maxWidth: '280px',
                    minHeight: '160px',
                    padding: '20px',
                    background: 'var(--clr-surface)',
                    border: `2px ${isBucketTarget ? 'dashed' : 'solid'} ${isBucketTarget ? 'var(--clr-accent)' : 'var(--clr-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: isBucketTarget ? 'pointer' : 'default',
                    transition: 'all 0.18s ease',
                    boxShadow: 'var(--shadow-btn)'
                  }}
                >
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', color: bucketName === 'Area' ? 'var(--clr-correct)' : 'var(--clr-accent)', fontFamily: 'var(--font-display)' }}>
                    {bucketName} Tasks
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q4Sorted[bucketName].map(task => (
                      <span
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--clr-card)',
                          borderRadius: '4px',
                          border: '1px solid var(--clr-border)',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {task.label} ✅
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {q4Feedback && (
            <div style={{
              padding: '12px 18px',
              background: q4Feedback.startsWith('Correct') ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: `4px solid ${q4Feedback.startsWith('Correct') ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
              textAlign: 'center',
              maxWidth: '500px',
              margin: '0 auto 24px auto',
              fontSize: '0.95rem'
            }}>
              {q4Feedback}
            </div>
          )}

          {allQ4Placed && (
            <div>
              <p style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '1.15rem', marginBottom: '16px' }}>
                🎉 Magnificent! All tasks are sorted correctly!
              </p>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RadiusDiameterChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, r3, comparison, q1, q2
  const [firstClick, setFirstClick] = useState(null);
  const [secondClick, setSecondClick] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');
  const [revealedConcept, setRevealedConcept] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);

  // Layer 2
  const [comparisonMode, setComparisonMode] = useState('both'); // radius, diameter, both

  // Layer 3
  const [q1Answer, setQ1Answer] = useState(null);
  const [q2Answer, setQ2Answer] = useState(null);
  const [selectedQOption, setSelectedQOption] = useState(null);

  // R3 animation stages
  const [r3Stage, setR3Stage] = useState('stage1');

  useEffect(() => {
    if (subStep === 'r3') {
      setR3Stage('stage1');
      const t1 = setTimeout(() => setR3Stage('stage2'), 1500);
      const t2 = setTimeout(() => setR3Stage('stage3'), 3200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [subStep]);

  useEffect(() => {
    // Reset drawing state when moving to a drawing step
    setFirstClick(null);
    setSecondClick(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setRevealedConcept('');
    setWrongAttempts(0);

    // Reset Layer 3
    setQ1Answer(null);
    setQ2Answer(null);
    setSelectedQOption(null);
  }, [subStep]);

  const svgRef = useRef(null);

  const handleSvgClick = (e) => {
    if (answerState === 'correct') return;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 300;
    const y = ((e.clientY - rect.top) / rect.height) * 200;

    const distToCenter = Math.sqrt(Math.pow(x - 150, 2) + Math.pow(y - 100, 2));
    let clickedPoint = null;

    if (distToCenter <= 16) {
      clickedPoint = { x: 150, y: 100, type: 'center' };
    } else if (distToCenter >= 50 && distToCenter <= 95) {
      const angle = Math.atan2(y - 100, x - 150);
      const projX = 150 + 70 * Math.cos(angle);
      const projY = 100 + 70 * Math.sin(angle);
      clickedPoint = { x: projX, y: projY, type: 'boundary' };
    }

    if (!clickedPoint) return;

    if (!firstClick) {
      setFirstClick(clickedPoint);
    } else if (!secondClick) {
      const sameSpot = Math.sqrt(Math.pow(clickedPoint.x - firstClick.x, 2) + Math.pow(clickedPoint.y - firstClick.y, 2)) < 12;
      if (sameSpot) return;

      setSecondClick(clickedPoint);
      checkLine(firstClick, clickedPoint);
    }
  };

  const handleClear = () => {
    setFirstClick(null);
    setSecondClick(null);
    setAnswerState('unanswered');
    setHintText('');
  };

  const checkLine = (p1, p2) => {
    if (subStep === 'r1') {
      const hasCenter = p1.type === 'center' || p2.type === 'center';
      const hasBoundary = p1.type === 'boundary' || p2.type === 'boundary';

      if (hasCenter && hasBoundary) {
        setAnswerState('correct');
        setRevealedConcept("That's a Radius!");
        setFeedbackText("Great! A radius always starts from the center and ends at the circle boundary.");
        setHintText('');
      } else {
        setAnswerState('wrong');
        setWrongAttempts(prev => prev + 1);
        setHintText("Hint: Does your line begin at the center? A radius must start at the center dot.");
      }
    } else if (subStep === 'r2') {
      const bothBoundary = p1.type === 'boundary' && p2.type === 'boundary';

      const vx = p2.x - p1.x;
      const vy = p2.y - p1.y;
      const wx = 150 - p1.x;
      const wy = 100 - p1.y;

      const lensq = vx * vx + vy * vy;
      let t = (wx * vx + wy * vy) / lensq;
      t = Math.max(0, Math.min(1, t));
      const projX = p1.x + t * vx;
      const projY = p1.y + t * vy;
      const distToCenter = Math.sqrt(Math.pow(150 - projX, 2) + Math.pow(100 - projY, 2));

      const passesThroughCenter = distToCenter <= 12;

      if (bothBoundary && passesThroughCenter) {
        setAnswerState('correct');
        setRevealedConcept("That's a Diameter!");
        setFeedbackText("Great! A diameter joins two points on the circle and passes directly through the center.");
        setHintText('');
      } else {
        setAnswerState('wrong');
        setWrongAttempts(prev => prev + 1);
        if (p1.type === 'center' || p2.type === 'center') {
          setHintText("Hint: A diameter must cross the entire circle from one side to the other. Try selecting two opposite points on the boundary.");
        } else {
          setHintText("Hint: A diameter must pass through the center point. Try selecting two opposite points.");
        }
      }
    }
  };

  const handleNext = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('r3');
    else if (subStep === 'r3') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleQ1Select = (option) => {
    if (q1Answer !== null) return;
    setSelectedQOption(option);
    if (option === '18 cm') {
      setQ1Answer('correct');
      setFeedbackText("Correct! The diameter is always twice the radius: d = 2 × r. So, 2 × 9 cm = 18 cm.");
    } else {
      setQ1Answer('wrong');
      if (option === '4.5 cm') {
        setFeedbackText("Not quite. 4.5 cm is half the radius. The diameter is twice the length of the radius (2 × Radius).");
      } else {
        setFeedbackText("Not quite. Diameter is twice the length of the radius: d = 2 × r. So, 2 × 9 cm = 18 cm.");
      }
    }
  };

  const handleQ2Select = (option) => {
    if (q2Answer !== null) return;
    setSelectedQOption(option);
    if (option === 'Circle A and Circle B') {
      setQ2Answer('correct');
      setFeedbackText("Correct! Circle A's radius is 5 cm, making its diameter 10 cm. Circle B also has a diameter of 10 cm. They are identical in size!");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Not quite. Calculate the diameter of each: Circle A's diameter = 2 × 5 = 10 cm. Circle B's diameter = 10 cm. Circle C's diameter = 20 cm.");
    }
  };

  const drawInteractiveCircle = () => (
    <svg
      ref={svgRef}
      width="300"
      height="200"
      viewBox="0 0 300 200"
      onClick={handleSvgClick}
      style={{
        background: 'var(--clr-surface)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-btn)',
        cursor: answerState === 'correct' ? 'default' : 'crosshair'
      }}
    >
      <circle cx="150" cy="100" r="70" fill="none" stroke="var(--clr-border)" strokeWidth="3" />
      <circle cx="150" cy="100" r="6" fill="var(--clr-accent)" style={{ cursor: 'pointer' }} />
      <text x="150" y="120" textAnchor="middle" fill="var(--clr-accent)" fontSize="11" fontWeight="600" style={{ pointerEvents: 'none' }}>Center</text>

      {firstClick && (
        <circle cx={firstClick.x} cy={firstClick.y} r="6" fill="var(--clr-accent)" />
      )}
      {secondClick && (
        <circle cx={secondClick.x} cy={secondClick.y} r="6" fill="var(--clr-accent)" />
      )}
      {firstClick && secondClick && (
        <line
          x1={firstClick.x}
          y1={firstClick.y}
          x2={secondClick.x}
          y2={secondClick.y}
          stroke={answerState === 'correct' ? 'var(--clr-correct)' : answerState === 'wrong' ? 'var(--clr-wrong)' : 'var(--clr-accent)'}
          strokeWidth="4"
        />
      )}
    </svg>
  );

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Radius vs Diameter
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Draw the Line
      </p>

      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <svg width="300" height="200" viewBox="0 0 300 200" style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-btn)' }}>
              <circle cx="150" cy="100" r="70" fill="none" stroke="var(--clr-border)" strokeWidth="2.5" />
              <circle cx="150" cy="100" r="6" fill="var(--clr-accent)" />
              <line x1="150" y1="100" x2="220" y2="100" stroke="var(--clr-text-soft)" strokeWidth="2" strokeDasharray="4,4" />
              <text x="185" y="90" textAnchor="middle" fontSize="12" fill="var(--clr-text-soft)">Radius</text>
            </svg>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Circles have unique lines that measure them. Let's learn to draw and recognize them interactively!
          </p>
          <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Drawing</button>
        </div>
      )}

      {(subStep === 'r1' || subStep === 'r2') && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            {drawInteractiveCircle()}
          </div>

          <p style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '8px' }}>
            {subStep === 'r1' ? 'Draw a Radius' : 'Now draw a Diameter'}
          </p>
          <p style={{ color: 'var(--clr-text-soft)', fontSize: '1.02rem', marginBottom: '24px' }}>
            {subStep === 'r1'
              ? 'Click the Center dot, then click any point on the outer circle boundary.'
              : 'Click a point on the circle boundary, then click a point on the opposite side passing through the center.'}
          </p>

          {answerState === 'unanswered' && (
            <div style={{ minHeight: '60px' }}>
              {firstClick && !secondClick && (
                <p style={{ color: 'var(--clr-accent)', fontWeight: '500' }}>
                  First point selected! Now click the second point to draw the line.
                </p>
              )}
            </div>
          )}

          {answerState === 'wrong' && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: 'var(--clr-wrong)', fontWeight: '600', marginBottom: '12px' }}>
                {hintText}
              </p>
              <button className="secondary" onClick={handleClear} style={{ padding: '8px 16px', fontSize: '0.95rem' }}>Clear & Try Again</button>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '18px 24px',
                background: 'var(--clr-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--clr-border)',
                borderLeft: '5px solid var(--clr-correct)',
                marginBottom: '20px'
              }}>
                <span style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '1.25rem' }}>
                  {revealedConcept}
                </span>
                <span style={{ color: 'var(--clr-text)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--clr-correct)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  {feedbackText}
                </span>
              </div>
              <div>
                <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {subStep === 'r3' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <svg width="300" height="200" viewBox="0 0 300 200" style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-btn)' }}>
              <circle cx="150" cy="100" r="70" fill="none" stroke="var(--clr-border)" strokeWidth="3" />
              <circle cx="150" cy="100" r="6" fill="var(--clr-accent)" />

              {(r3Stage === 'stage1' || r3Stage === 'stage2' || r3Stage === 'stage3') && (
                <>
                  <line x1="150" y1="100" x2="220" y2="100" stroke="#4ba3e3" strokeWidth="4.5" />
                  <text x="185" y="88" textAnchor="middle" fill="#4ba3e3" fontSize="12" fontWeight="bold">Radius (r)</text>
                </>
              )}

              {(r3Stage === 'stage2') && (
                <>
                  <line x1="150" y1="100" x2="80" y2="100" stroke="#e8864a" strokeWidth="4.5" strokeDasharray="3,3" />
                  <text x="115" y="88" textAnchor="middle" fill="#e8864a" fontSize="12" fontWeight="bold">Radius (r)</text>
                </>
              )}

              {(r3Stage === 'stage3') && (
                <>
                  <line x1="80" y1="100" x2="220" y2="100" stroke="var(--clr-correct)" strokeWidth="5" />
                  <text x="115" y="88" textAnchor="middle" fill="#e8864a" fontSize="12" fontWeight="bold">Radius (r)</text>
                  <text x="150" y="130" textAnchor="middle" fill="var(--clr-correct)" fontSize="13" fontWeight="bold">Diameter (d) = 2r</text>
                </>
              )}
            </svg>
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '12px' }}>
            Visual Discovery: The Relationship
          </h3>

          <div style={{ minHeight: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
            {r3Stage === 'stage1' && (
              <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)' }}>
                Here is one <strong>Radius (r)</strong> extending from center to circle boundary.
              </p>
            )}
            {r3Stage === 'stage2' && (
              <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', animation: 'pulse 1s infinite' }}>
                Adding a second <strong>Radius (r)</strong> extending in the exact opposite direction...
              </p>
            )}
            {r3Stage === 'stage3' && (
              <p style={{ fontSize: '1.2rem', color: 'var(--clr-correct)', fontWeight: '600' }}>
                They merge together! Radius + Radius = 2 × Radius = <strong>Diameter (d)</strong>!
              </p>
            )}
          </div>

          <div>
            <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Continue to Review →</button>
          </div>
        </div>
      )}

      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
            <p style={{ color: 'var(--clr-text-soft)', fontSize: '1.02rem', marginBottom: '16px', fontWeight: '500' }}>
              Select a view mode to inspect the radius and diameter:
            </p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                className={comparisonMode === 'radius' ? 'primary' : 'secondary'}
                onClick={() => setComparisonMode('radius')}
                style={{ padding: '8px 16px', fontSize: '0.95rem' }}
              >
                Show Radius
              </button>
              <button
                className={comparisonMode === 'diameter' ? 'primary' : 'secondary'}
                onClick={() => setComparisonMode('diameter')}
                style={{ padding: '8px 16px', fontSize: '0.95rem' }}
              >
                Show Diameter
              </button>
              <button
                className={comparisonMode === 'both' ? 'primary' : 'secondary'}
                onClick={() => setComparisonMode('both')}
                style={{ padding: '8px 16px', fontSize: '0.95rem' }}
              >
                Show Both
              </button>
            </div>

            <svg width="300" height="200" viewBox="0 0 300 200" style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-btn)' }}>
              <circle cx="150" cy="100" r="70" fill="none" stroke="var(--clr-border)" strokeWidth="3" />
              <circle cx="150" cy="100" r="6" fill="var(--clr-accent)" />

              {(comparisonMode === 'radius' || comparisonMode === 'both') && (
                <>
                  <line x1="150" y1="100" x2="150" y2="30" stroke="#4ba3e3" strokeWidth="4.5" />
                  <text x="162" y="65" textAnchor="start" fill="#4ba3e3" fontSize="12" fontWeight="bold">Radius (r)</text>
                </>
              )}

              {(comparisonMode === 'diameter' || comparisonMode === 'both') && (
                <>
                  <line x1="80" y1="100" x2="220" y2="100" stroke="var(--clr-correct)" strokeWidth="4.5" />
                  <text x="150" y="118" textAnchor="middle" fill="var(--clr-correct)" fontSize="12" fontWeight="bold">Diameter (d)</text>
                </>
              )}
            </svg>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid #4ba3e3',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: '#4ba3e3' }}>
                RADIUS
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Span:</strong> Starts at center, ends on boundary ($r$).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Relation:</strong> Half of diameter ($r = d / 2$).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Visuals:</strong> Spokes of a wheel, hands on a clock.
              </p>
            </div>

            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                DIAMETER
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Span:</strong> Corner to corner, passing through center ($d$).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Relation:</strong> Twice the radius ($d = 2r$).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Visuals:</strong> Slicing a pizza in half.
              </p>
            </div>
          </div>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Mistake
            </h4>
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>
              Thinking any line crossing a circle is a diameter. **It must pass through the center.** Otherwise, it's just a chord.
            </p>
          </div>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '500' }}>
              Before solving a circular question, ask:
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '220px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Does the line start at center?</span>
                <strong style={{ fontSize: '1.25rem', color: '#4ba3e3' }}>RADIUS</strong>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', marginTop: '4px' }}>d / 2</span>
              </div>
              <div style={{ background: 'var(--clr-card)', padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '220px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Does it cross center completely?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)' }}>DIAMETER</strong>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', marginTop: '4px' }}>2r</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Calculation</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="240" height="150" viewBox="0 0 240 150" style={{ background: 'var(--clr-card)', borderRadius: '6px', border: '1px solid var(--clr-border)' }}>
                <circle cx="120" cy="75" r="50" fill="none" stroke="var(--clr-border)" strokeWidth="2.5" />
                <circle cx="120" cy="75" r="4.5" fill="var(--clr-accent)" />
                <line x1="120" y1="75" x2="170" y2="75" stroke="#4ba3e3" strokeWidth="3" />

                {q1Answer === 'correct' && (
                  <line x1="120" y1="75" x2="70" y2="75" stroke="var(--clr-correct)" strokeWidth="3.5" style={{ transition: 'all 0.5s ease' }} />
                )}

                <text x="145" y="65" textAnchor="middle" fontSize="12" fill="#4ba3e3" fontWeight="bold">r = 9 cm</text>
              </svg>
            </div>

            <p style={{ fontSize: '1.25rem', color: 'var(--clr-text)', marginBottom: '20px', fontWeight: '500' }}>
              If a circle has a <strong>Radius = 9 cm</strong>, find its diameter.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {['4.5 cm', '9 cm', '18 cm', '27 cm'].map(opt => {
                const isSelected = selectedQOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleQ1Select(opt)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Mixed Understanding</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ background: 'var(--clr-card)', borderRadius: '6px', border: '1px solid var(--clr-border)' }}>
                  <circle cx="60" cy="60" r="30" fill="none" stroke="var(--clr-border)" strokeWidth="2" />
                  <circle cx="60" cy="60" r="3" fill="var(--clr-accent)" />
                  <line x1="60" y1="60" x2="90" y2="60" stroke="#4ba3e3" strokeWidth="2.5" />
                  <text x="75" y="53" textAnchor="middle" fontSize="9" fill="#4ba3e3" fontWeight="bold">r = 5 cm</text>
                </svg>
                <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Circle A</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ background: 'var(--clr-card)', borderRadius: '6px', border: '1px solid var(--clr-border)' }}>
                  <circle cx="60" cy="60" r="30" fill="none" stroke="var(--clr-border)" strokeWidth="2" />
                  <circle cx="60" cy="60" r="3" fill="var(--clr-accent)" />
                  <line x1="30" y1="60" x2="90" y2="60" stroke="var(--clr-correct)" strokeWidth="2.5" />
                  <text x="60" y="53" textAnchor="middle" fontSize="9" fill="var(--clr-correct)" fontWeight="bold">d = 10 cm</text>
                </svg>
                <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Circle B</p>
              </div>

              <div style={{ textAlign: 'center' }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ background: 'var(--clr-card)', borderRadius: '6px', border: '1px solid var(--clr-border)' }}>
                  <circle cx="60" cy="60" r="45" fill="none" stroke="var(--clr-border)" strokeWidth="2" />
                  <circle cx="60" cy="60" r="3" fill="var(--clr-accent)" />
                  <line x1="15" y1="60" x2="105" y2="60" stroke="var(--clr-correct)" strokeWidth="2.5" />
                  <text x="60" y="53" textAnchor="middle" fontSize="9" fill="var(--clr-correct)" fontWeight="bold">d = 20 cm</text>
                </svg>
                <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', fontSize: '0.9rem' }}>Circle C</p>
              </div>
            </div>

            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '20px', fontWeight: '500' }}>
              Which two circles are the same size?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Circle A and Circle B',
                'Circle B and Circle C',
                'Circle A and Circle C'
              ].map(opt => {
                const isSelected = selectedQOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleQ2Select(opt)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q2Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HcfLcmChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, comparison, q1, q2
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // R1: LCM conveyor simulation
  const [simTime, setSimTime] = useState(0);
  const [isSimRunning, setIsSimRunning] = useState(false);

  // R2: HCF nuts & bolts factory
  const [numKits, setNumKits] = useState(6);
  const [leftovers, setLeftovers] = useState({ nuts: 0, bolts: 0 });

  // Layer 3
  const [q1Answer, setQ1Answer] = useState(null);
  const [q2Answer, setQ2Answer] = useState(null);
  const [selectedQOption, setSelectedQOption] = useState(null);

  // LCM simulation tick timer
  useEffect(() => {
    let timer = null;
    if (isSimRunning) {
      timer = setInterval(() => {
        setSimTime((prev) => {
          const next = prev + 1;
          if (next > 30) return 0; // loop back to 0 if they miss it
          return next;
        });
      }, 300); // 1 simulation second = 300ms
    }
    return () => clearInterval(timer);
  }, [isSimRunning]);

  // Recalculate HCF leftovers
  useEffect(() => {
    const nutsLeft = 36 % numKits;
    const boltsLeft = 24 % numKits;
    setLeftovers({ nuts: nutsLeft, bolts: boltsLeft });
  }, [numKits]);

  // Reset states between subSteps
  useEffect(() => {
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setSimTime(0);
    setIsSimRunning(false);
    setQ1Answer(null);
    setQ2Answer(null);
    setSelectedQOption(null);
  }, [subStep]);

  const handleStartStop = () => {
    if (!isSimRunning) {
      setIsSimRunning(true);
      setAnswerState('unanswered');
      setFeedbackText('');
      setHintText('');
    } else {
      setIsSimRunning(false);
      // Check if stopped on a common multiple (where both fire together)
      const isMatch = simTime > 0 && simTime % 6 === 0 && simTime % 8 === 0;
      if (isMatch) {
        setAnswerState('correct');
        setFeedbackText(`Perfect! You stopped at ${simTime} seconds. At this moment, Machine A has fired ${simTime / 6} times and Machine B has fired ${simTime / 8} times. They match together! 24 is the Least Common Multiple (LCM) of 6 and 8.`);
      } else {
        setAnswerState('wrong');
        const firedA = simTime % 6 === 0;
        const firedB = simTime % 8 === 0;
        if (firedA && !firedB) {
          setHintText(`Not quite! At ${simTime} seconds, only Machine A fired (fired every 6 seconds). Machine B only fires on multiples of 8 (8, 16, 24...). Watch for when they both fire together!`);
        } else if (!firedA && firedB) {
          setHintText(`Not quite! At ${simTime} seconds, only Machine B fired (fired every 8 seconds). Machine A only fires on multiples of 6 (6, 12, 18, 24...). Watch for when they both fire together!`);
        } else {
          setHintText(`Neither machine fired at ${simTime} seconds! Keep watching for the moment when both tracks glow at the same time (at 24 seconds).`);
        }
      }
    }
  };

  const handleCheckHcf = () => {
    const nutsLeft = 36 % numKits;
    const boltsLeft = 24 % numKits;

    if (nutsLeft === 0 && boltsLeft === 0) {
      if (numKits === 12) {
        setAnswerState('correct');
        setFeedbackText(`Excellent! 12 is the Highest Common Factor (HCF) of 24 and 36. We can pack exactly 12 identical kits, each containing 3 nuts and 2 bolts, leaving absolutely zero leftovers!`);
        setHintText('');
      } else {
        setAnswerState('wrong');
        setHintText(`Everything fits with no leftovers! But can you split them into more boxes? Try to find a larger number of kits!`);
      }
    } else {
      setAnswerState('wrong');
      setHintText(`Not quite! With ${numKits} kits, we have leftover parts: ${nutsLeft} nuts and ${boltsLeft} bolts. Every kit must be identical with no leftovers!`);
    }
  };

  const handleNext = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleQ1Select = (option) => {
    if (q1Answer !== null) return;
    setSelectedQOption(option);
    if (option === 'HCF') {
      setQ1Answer('correct');
      setFeedbackText("Correct! We are dividing the apples and oranges into the largest possible identical boxes (equal groups), so we must find the Highest Common Factor (HCF).");
    } else {
      setQ1Answer('wrong');
      setFeedbackText("Not quite. Remember: when splitting items into equal groups or dividing shapes, we look for factors (HCF). We are not waiting for repeating events to meet.");
    }
  };

  const handleQ2Select = (option) => {
    if (q2Answer !== null) return;
    setSelectedQOption(option);
    if (option === 'LCM') {
      setQ2Answer('correct');
      setFeedbackText("Correct! We are waiting for two repeating intervals (10 and 15 minutes) to synchronize and happen together, which requires the Least Common Multiple (LCM).");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Not quite. Remember: when events repeat and meet together in the future, we find the common multiple (LCM).");
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: HCF vs LCM
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Two Machines
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div style={{ background: 'var(--clr-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '200px' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔩</span>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--clr-accent)' }}>Dividing into Groups</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-soft)', margin: '6px 0 0 0' }}>Splitting resources evenly with no leftovers.</p>
            </div>
            <div style={{ background: 'var(--clr-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '200px' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>⏰</span>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--clr-correct)' }}>Synchronizing Events</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-soft)', margin: '6px 0 0 0' }}>Finding when repeating items meet together.</p>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            HCF and LCM are mathematical tools for grouping and timing. Let's explore how they work in real situations!
          </p>
          <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Challenge</button>
        </div>
      )}

      {/* R1: LCM Two Machines Simulation */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '20px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            marginBottom: '24px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-display)', color: 'var(--clr-accent)' }}>
              Machine Sync Mission
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '1.05rem', lineHeight: '1.5' }}>
              We have two production machines:
            </p>
            <ul style={{ margin: '0 0 12px 18px', padding: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              <li><strong>Machine A</strong> fires every <strong style={{ color: '#4ba3e3' }}>6 seconds</strong> (blue dots).</li>
              <li><strong>Machine B</strong> fires every <strong style={{ color: '#e8864a' }}>8 seconds</strong> (orange dots).</li>
            </ul>
            <p style={{ margin: 0, fontSize: '0.98rem', color: 'var(--clr-text-soft)', lineHeight: '1.5' }}>
              <strong>Your Task:</strong> Click <strong>Start</strong> to run the timeline, and press <strong>Stop</strong> at the exact second when both machines fire at the same time!
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ width: '100%', maxWidth: '400px', background: 'var(--clr-surface)', padding: '18px', borderRadius: '8px', border: '1px solid var(--clr-border)' }}>
              {/* Conveyor Belt Track */}
              <svg width="100%" height="110" viewBox="0 0 320 110" style={{ background: 'var(--clr-card)', borderRadius: '6px', border: '1px solid var(--clr-border)' }}>
                {/* Track A */}
                <line x1="10" y1="30" x2="310" y2="30" stroke="var(--clr-border)" strokeWidth="8" strokeLinecap="round" />
                {[6, 12, 18, 24, 30].map(sec => (
                  <circle
                    key={sec}
                    cx={10 + sec * 10}
                    cy="30"
                    r="8"
                    fill={simTime === sec ? 'var(--clr-accent)' : simTime > sec ? '#4ba3e3' : 'var(--clr-border)'}
                    stroke={simTime === sec ? '#fff' : 'none'}
                    strokeWidth="1.5"
                  />
                ))}
                <text x="315" y="34" fontSize="10" fill="var(--clr-text-soft)" textAnchor="start">6s</text>

                {/* Track B */}
                <line x1="10" y1="70" x2="310" y2="70" stroke="var(--clr-border)" strokeWidth="8" strokeLinecap="round" />
                {[8, 16, 24].map(sec => (
                  <circle
                    key={sec}
                    cx={10 + sec * 10}
                    cy="70"
                    r="8"
                    fill={simTime === sec ? 'var(--clr-accent)' : simTime > sec ? '#e8864a' : 'var(--clr-border)'}
                    stroke={simTime === sec ? '#fff' : 'none'}
                    strokeWidth="1.5"
                  />
                ))}
                <text x="315" y="74" fontSize="10" fill="var(--clr-text-soft)" textAnchor="start">8s</text>

                {/* Red Time Bar */}
                <line
                  x1={10 + simTime * 10}
                  y1="10"
                  x2={10 + simTime * 10}
                  y2="90"
                  stroke="var(--clr-accent)"
                  strokeWidth="2.5"
                />
                <circle cx={10 + simTime * 10} cy="10" r="4" fill="var(--clr-accent)" />

                {/* Current Time Label */}
                <text x={10 + simTime * 10} y="105" textAnchor="middle" fontSize="10" fill="var(--clr-accent)" fontWeight="bold">{simTime}s</text>
              </svg>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ padding: '8px 16px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: '6px' }}>
              <strong>Machine A:</strong> Produces every <span style={{ color: '#4ba3e3' }}>6 sec</span>
            </div>
            <div style={{ padding: '8px 16px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: '6px' }}>
              <strong>Machine B:</strong> Produces every <span style={{ color: '#e8864a' }}>8 sec</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button
              onClick={handleStartStop}
              className={isSimRunning ? 'secondary' : 'primary'}
              style={{ padding: '12px 32px', fontSize: '1.1rem', minWidth: '140px' }}
            >
              {isSimRunning ? '⏸ Stop' : '▶ Start'}
            </button>
            <button
              onClick={() => { setSimTime(0); setAnswerState('unanswered'); setHintText(''); }}
              className="secondary"
              style={{ padding: '12px 24px', fontSize: '1.05rem' }}
            >
              Reset
            </button>
          </div>

          {answerState === 'wrong' && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(235, 94, 85, 0.1)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '5px solid var(--clr-wrong)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--clr-wrong)' }}>Try again!</strong>
              <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{
              padding: '20px',
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--clr-border)',
              borderLeft: '5px solid var(--clr-correct)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--clr-correct)', fontSize: '1.2rem' }}>
                ✅ Correct! LCM Discovered
              </strong>
              <p style={{ margin: '0 0 16px 0', fontSize: '1rem', lineHeight: '1.5' }}>{feedbackText}</p>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next: Factory Challenge →</button>
            </div>
          )}
        </div>
      )}

      {/* R2: HCF Factory Kits packing */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '20px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            marginBottom: '24px'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-display)', color: 'var(--clr-accent)' }}>
              Factory Packing Mission
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '1.05rem', lineHeight: '1.5' }}>
              We have a pile of <strong>36 Nuts (🔩)</strong> and <strong>24 Bolts (⚙️)</strong>.
            </p>
            <p style={{ margin: 0, fontSize: '0.98rem', color: 'var(--clr-text-soft)', lineHeight: '1.5' }}>
              <strong>Your Task:</strong> Divide all parts into the <strong>largest possible</strong> number of identical kits.
              Every kit box must contain the same contents, and there must be <strong>no leftover parts</strong> outside.
              <br /><br />
              Use the <strong>+</strong> and <strong>-</strong> buttons to adjust the number of boxes!
            </p>
          </div>

          {/* Adjuster Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <button
              className="secondary"
              onClick={() => { setNumKits(k => Math.max(1, k - 1)); setAnswerState('unanswered'); }}
              style={{ width: '44px', height: '44px', fontSize: '1.3rem', borderRadius: '50%' }}
            >
              -
            </button>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', minWidth: '100px' }}>
              {numKits} Kits
            </span>
            <button
              className="secondary"
              onClick={() => { setNumKits(k => Math.min(18, k + 1)); setAnswerState('unanswered'); }}
              style={{ width: '44px', height: '44px', fontSize: '1.3rem', borderRadius: '50%' }}
            >
              +
            </button>
          </div>

          {/* Leftovers alert */}
          <div style={{
            background: leftovers.nuts === 0 && leftovers.bolts === 0 ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.05)',
            border: `1.5px solid ${leftovers.nuts === 0 && leftovers.bolts === 0 ? 'var(--clr-correct)' : 'var(--clr-border)'}`,
            padding: '12px 18px',
            borderRadius: '6px',
            maxWidth: '360px',
            margin: '0 auto 20px auto',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            <h5 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--clr-text-soft)' }}>Leftovers Tray</h5>
            {leftovers.nuts === 0 && leftovers.bolts === 0 ? (
              <span style={{ color: 'var(--clr-correct)' }}>0 leftovers! Fits perfectly! ✓</span>
            ) : (
              <span style={{ color: 'var(--clr-wrong)' }}>
                🔩 Leftover Nuts: {leftovers.nuts} | ⚙️ Leftover Bolts: {leftovers.bolts}
              </span>
            )}
          </div>

          {/* Kits Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '12px',
            background: 'var(--clr-card)',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid var(--clr-border)',
            marginBottom: '24px',
            maxHeight: '320px',
            overflowY: 'auto'
          }}>
            {Array.from({ length: numKits }).map((_, i) => {
              const nutsInKit = Math.floor(36 / numKits);
              const boltsInKit = Math.floor(24 / numKits);

              const renderIcons = (emoji, count) => {
                if (count <= 0) return <span style={{ color: 'var(--clr-text-soft)', fontStyle: 'italic', fontSize: '0.8rem' }}>None</span>;
                if (count > 6) return <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{emoji} × {count}</span>;
                return (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', justifyContent: 'center' }}>
                    {Array.from({ length: count }).map((_, idx) => (
                      <span key={idx} style={{ fontSize: '1rem' }}>{emoji}</span>
                    ))}
                  </div>
                );
              };

              return (
                <div key={i} style={{
                  padding: '10px',
                  background: 'var(--clr-surface)',
                  border: '1.5px solid var(--clr-border)',
                  borderRadius: '6px',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-btn)'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-soft)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Kit #{i + 1}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minHeight: '20px' }}>
                      {renderIcons('🔩', nutsInKit)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minHeight: '20px' }}>
                      {renderIcons('⚙️', boltsInKit)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={handleCheckHcf} style={{ padding: '12px 28px', fontSize: '1.05rem' }}>Check Kit Packing</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(235, 94, 85, 0.1)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '5px solid var(--clr-wrong)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--clr-wrong)' }}>Not quite</strong>
              <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{
              padding: '20px',
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--clr-border)',
              borderLeft: '5px solid var(--clr-correct)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--clr-correct)', fontSize: '1.2rem' }}>
                ✅ Correct! HCF Discovered
              </strong>
              <p style={{ margin: '0 0 16px 0', fontSize: '1rem', lineHeight: '1.5' }}>{feedbackText}</p>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Continue to Review →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison */}
      {subStep === 'comparison' && (
        <div>
          {/* Side-by-side Cards */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* HCF Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                HCF (Highest Common Factor)
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>What it is:</strong> The largest number that divides into both values without remainder.
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Best used for:</strong> <strong>Dividing</strong> or splitting things into equal groups.
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Clue Words:</strong> Largest, greatest, maximum, split evenly, identical kits.
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Real-life Examples:</strong> Cutting lengths of rope into equal pieces, organizing fruit into boxes.
              </p>
            </div>

            {/* LCM Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                LCM (Least Common Multiple)
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>What it is:</strong> The smallest number that is a common multiple of both values.
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Best used for:</strong> <strong>Synchronizing</strong> repeating events that happen over time.
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Clue Words:</strong> Smallest, least, minimum, repeat, together next time, synchronize.
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Real-life Examples:</strong> Traffic lights flashing together, alarms ringing, runners meeting at a start line.
              </p>
            </div>
          </div>

          {/* Common Mistake Alert */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Mistake
            </h4>
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>
              Students often rush to calculate the LCM whenever they see two numbers in a word problem. Remember: stop and ask <strong>"Am I dividing something into groups, or waiting for repeating events to meet together?"</strong>
            </p>
          </div>

          {/* Decision Rule */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '500' }}>
              Before picking a formula, ask:
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '220px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Need to divide or split?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-accent)' }}>HCF</strong>
              </div>
              <div style={{ background: 'var(--clr-card)', padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '220px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Need things to meet together?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)' }}>LCM</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Recognition</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--clr-text)', marginBottom: '20px', lineHeight: '1.6' }}>
              <strong>Scenario:</strong> 18 apples and 24 oranges need to be packed into the largest possible identical boxes with no leftovers.
              <br /><br />
              What concept should you use to find the box size?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['HCF', 'LCM'].map(opt => {
                const isSelected = selectedQOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleQ1Select(opt)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Recognition</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--clr-text)', marginBottom: '20px', lineHeight: '1.6' }}>
              <strong>Scenario:</strong> One alarm rings every 10 minutes. Another alarm rings every 15 minutes. When will they ring together next?
              <br /><br />
              What concept should you use to find the time?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['HCF', 'LCM'].map(opt => {
                const isSelected = selectedQOption === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleQ2Select(opt)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q2Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FactorsMultiplesChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, discovery, comparison, q1, q2
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // R1: Factors
  const [factorsFound, setFactorsFound] = useState([]);
  const [machineShake, setMachineShake] = useState(false);
  const [show5Option, setShow5Option] = useState(true);

  // R2: Multiples
  const [multiplesFound, setMultiplesFound] = useState([]);
  const [isGeneratingMultiples, setIsGeneratingMultiples] = useState(false);

  // Discovery
  const [discoverySelection, setDiscoverySelection] = useState(null);

  // Layer 3
  const [q1Answer, setQ1Answer] = useState(null);
  const [selectedQ1Option, setSelectedQ1Option] = useState(null);

  // Q2: Sorting Game checkboxes for number 10
  const [studentSelections, setStudentSelections] = useState({
    2: { factor: false, multiple: false },
    5: { factor: false, multiple: false },
    10: { factor: false, multiple: false },
    20: { factor: false, multiple: false },
    25: { factor: false, multiple: false },
    50: { factor: false, multiple: false }
  });
  const [q2Answer, setQ2Answer] = useState(null);

  // Trigger machine shake on wrong input
  const triggerShake = () => {
    setMachineShake(true);
    setTimeout(() => setMachineShake(false), 450);
  };

  // Round 1 Factors generator
  const runFindFactors = () => {
    setAnswerState('unanswered');
    setFactorsFound([]);
    const factorsList = [1, 2, 3, 4, 6, 12];
    factorsList.forEach((fact, idx) => {
      setTimeout(() => {
        setFactorsFound(prev => [...prev, fact]);
      }, (idx + 1) * 350);
    });
  };

  // Try to add 5
  const handleTry5 = () => {
    triggerShake();
    setAnswerState('wrong');
    setHintText("5 cannot divide 12 exactly (12 ÷ 5 = 2 with a remainder of 2!). Only numbers that divide 12 with 0 leftovers can enter the machine.");
  };

  // Round 2 Multiples generator
  useEffect(() => {
    let interval = null;
    if (isGeneratingMultiples) {
      interval = setInterval(() => {
        setMultiplesFound((prev) => {
          const nextVal = (prev.length + 1) * 12;
          if (prev.length >= 10) {
            // Keep looping but slow down, or keep spawning up to a limit
            return prev;
          }
          return [...prev, nextVal];
        });
      }, 750);
    }
    return () => clearInterval(interval);
  }, [isGeneratingMultiples]);

  // Reset states between subSteps
  useEffect(() => {
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setFactorsFound([]);
    setMultiplesFound([]);
    setIsGeneratingMultiples(false);
    setShow5Option(true);
    setDiscoverySelection(null);
    setQ1Answer(null);
    setSelectedQ1Option(null);
    setQ2Answer(null);
    setStudentSelections({
      2: { factor: false, multiple: false },
      5: { factor: false, multiple: false },
      10: { factor: false, multiple: false },
      20: { factor: false, multiple: false },
      25: { factor: false, multiple: false },
      50: { factor: false, multiple: false }
    });
  }, [subStep]);

  const handleNext = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('discovery');
    else if (subStep === 'discovery') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleDiscoverySubmit = (val) => {
    setDiscoverySelection(val);
    if (val === 'correct') {
      setAnswerState('correct');
      setFeedbackText("Spot on! Factors are a finite set of divisors that fit inside the number. Multiples are generated by multiplying the number, extending infinitely.");
    } else {
      setAnswerState('wrong');
      setHintText("Not quite! Remember that we kept spawning multiples indefinitely, while factors fits exactly into 12.");
    }
  };

  const handleQ1Select = (option) => {
    if (q1Answer !== null) return;
    setSelectedQ1Option(option);
    if (option === 6) {
      setQ1Answer('correct');
      setFeedbackText("Correct! 6 is a factor of 18 because 18 ÷ 6 = 3 (it divides exactly). 36 is a multiple of 18, and 4 and 20 are neither.");
    } else {
      setQ1Answer('wrong');
      if (option === 36) {
        setFeedbackText("Not quite. 36 is a MULTIPLE of 18 (18 × 2 = 36). The question asks for a FACTOR (a number that divides 18 exactly).");
      } else {
        setFeedbackText("Not quite. A factor must divide 18 exactly. Try checking which option divides 18 without any remainder.");
      }
    }
  };

  const toggleSelection = (num, type) => {
    if (q2Answer !== null) return;
    setStudentSelections(prev => ({
      ...prev,
      [num]: {
        ...prev[num],
        [type]: !prev[num][type]
      }
    }));
  };

  const checkSelections = () => {
    // Correct answers mapping
    const correctMap = {
      2: { factor: true, multiple: false },
      5: { factor: true, multiple: false },
      10: { factor: true, multiple: true },
      20: { factor: false, multiple: true },
      25: { factor: false, multiple: false },
      50: { factor: false, multiple: true }
    };

    let isCorrect = true;
    for (const key of Object.keys(correctMap)) {
      const student = studentSelections[key];
      const correct = correctMap[key];
      if (student.factor !== correct.factor || student.multiple !== correct.multiple) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      setQ2Answer('correct');
      setFeedbackText("Magnificent! You sorted them perfectly. Notice that 10 is both a factor of itself (10 ÷ 10 = 1) and the first multiple of itself (10 × 1 = 10)!");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Not quite! Remember that 10 divides itself exactly (making it a factor) AND you obtain it by multiplying 10 by 1 (making it a multiple). Double check your selections.");
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '10px' }}>
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
          100% { transform: translateX(0); }
        }
        .shake-machine {
          animation: shake 0.45s ease-in-out;
        }
        .factor-card {
          padding: 10px 16px;
          background: #4ba3e3;
          color: white;
          font-weight: bold;
          border-radius: 6px;
          box-shadow: var(--shadow-btn);
          animation: pop 0.3s ease-out;
        }
        .multiple-card {
          padding: 10px 16px;
          background: var(--clr-correct);
          color: white;
          font-weight: bold;
          border-radius: 6px;
          box-shadow: var(--shadow-btn);
          animation: pop 0.35s ease-out;
        }
      `}</style>

      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Factors vs Multiples
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Factor or Multiple Machine
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div style={{ background: 'var(--clr-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '200px' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔢</span>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: '#4ba3e3' }}>Factors</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-soft)', margin: '6px 0 0 0' }}>Numbers that divide a value exactly.</p>
            </div>
            <div style={{ background: 'var(--clr-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '200px' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>✖️</span>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--clr-correct)' }}>Multiples</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-soft)', margin: '6px 0 0 0' }}>Numbers obtained by multiplying.</p>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Let's interact with a math machine to see the difference between factors and multiples!
          </p>
          <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Machine</button>
        </div>
      )}

      {/* R1: Factors */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>
            Find the Factors of 12
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div
              className={machineShake ? 'shake-machine' : ''}
              style={{
                width: '100%',
                maxWidth: '400px',
                background: 'var(--clr-surface)',
                border: '2.5px solid var(--clr-border)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: 'var(--shadow-btn)',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--clr-text-soft)', marginBottom: '6px' }}>Target Number</span>
              <div style={{
                background: 'var(--clr-card)',
                border: '1.5px solid var(--clr-border)',
                borderRadius: '8px',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                padding: '16px',
                marginBottom: '20px',
                color: 'var(--clr-accent)',
                letterSpacing: '1px'
              }}>
                12
              </div>

              {/* Factors list */}
              <div style={{ minHeight: '60px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                {factorsFound.map(fact => (
                  <div key={fact} className="factor-card">
                    {fact}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button
              onClick={runFindFactors}
              disabled={factorsFound.length > 0}
              style={{ padding: '12px 24px', fontSize: '1.05rem' }}
            >
              🔍 Find Factors
            </button>
          </div>

          {factorsFound.length > 0 && show5Option && (
            <div style={{
              background: 'var(--clr-surface)',
              border: '1px solid var(--clr-border)',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              margin: '0 auto 20px auto'
            }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>Can we add 5 to the factors?</p>
              <button
                className="secondary"
                onClick={handleTry5}
                style={{ padding: '10px 20px', fontSize: '1rem', border: '1.5px dashed var(--clr-accent)', background: 'var(--clr-card)' }}
              >
                Insert 5 into Machine
              </button>
            </div>
          )}

          {answerState === 'wrong' && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(235, 94, 85, 0.1)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '5px solid var(--clr-wrong)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--clr-wrong)' }}>Incorrect entry!</strong>
              <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{hintText}</p>
              <button
                onClick={() => { setShow5Option(false); setAnswerState('unanswered'); }}
                style={{ padding: '8px 16px', fontSize: '0.9rem', marginTop: '12px' }}
              >
                Continue
              </button>
            </div>
          )}

          {factorsFound.length > 0 && !show5Option && (
            <div>
              <p style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '1.15rem', marginBottom: '16px' }}>
                All factors (1, 2, 3, 4, 6, 12) have been collected!
              </p>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next: Generate Multiples →</button>
            </div>
          )}
        </div>
      )}

      {/* R2: Multiples */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>
            Generate Multiples of 12
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '100%',
              maxWidth: '400px',
              background: 'var(--clr-surface)',
              border: '2.5px solid var(--clr-border)',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: 'var(--shadow-btn)'
            }}>
              <span style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--clr-text-soft)', marginBottom: '6px' }}>Target Number</span>
              <div style={{
                background: 'var(--clr-card)',
                border: '1.5px solid var(--clr-border)',
                borderRadius: '8px',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                padding: '16px',
                marginBottom: '20px',
                color: 'var(--clr-correct)'
              }}>
                12
              </div>

              {/* Multiples list */}
              <div style={{ minHeight: '60px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxHeight: '120px', overflowY: 'auto', padding: '8px' }}>
                {multiplesFound.map(mult => (
                  <div key={mult} className="multiple-card">
                    {mult}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button
              onClick={() => setIsGeneratingMultiples(true)}
              disabled={isGeneratingMultiples}
              style={{ padding: '12px 24px', fontSize: '1.05rem' }}
            >
              ✨ Generate Multiples
            </button>
          </div>

          {isGeneratingMultiples && (
            <div style={{
              padding: '16px',
              background: 'var(--clr-surface)',
              borderRadius: '6px',
              border: '1px solid var(--clr-border)',
              maxWidth: '400px',
              margin: '0 auto 20px auto'
            }}>
              <p style={{ margin: 0, fontSize: '1.05rem', color: 'var(--clr-text-soft)' }}>
                {multiplesFound.length >= 8
                  ? "They keep generating indefinitely! Multiples never stop."
                  : "Watch the multiples pop out of the machine..."}
              </p>
            </div>
          )}

          {multiplesFound.length >= 5 && (
            <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next: Discovery →</button>
          )}
        </div>
      )}

      {/* SubStep: Discovery */}
      {subStep === 'discovery' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>What did you notice?</h3>
          <p style={{ fontSize: '1.15rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>
            Think about the Factor or Multiple Machine activities we just ran.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto 24px auto' }}>
            <button
              onClick={() => handleDiscoverySubmit('correct')}
              className="option-card"
              style={{ padding: '20px', fontSize: '1.05rem', textAlign: 'left' }}
            >
              <strong>A.</strong> Factors fit exactly inside the number and are limited. Multiples are generated by multiplying and go on forever.
            </button>
            <button
              onClick={() => handleDiscoverySubmit('wrong')}
              className="option-card"
              style={{ padding: '20px', fontSize: '1.05rem', textAlign: 'left' }}
            >
              <strong>B.</strong> Factors are infinite, while multiples are a limited set.
            </button>
          </div>

          {answerState === 'wrong' && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(235, 94, 85, 0.1)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '5px solid var(--clr-wrong)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', color: 'var(--clr-wrong)' }}>Not quite!</strong>
              <p style={{ margin: 0 }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{
              padding: '20px',
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--clr-border)',
              borderLeft: '5px solid var(--clr-correct)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--clr-correct)', fontSize: '1.2rem' }}>
                Great Discovery!
              </strong>
              <p style={{ margin: '0 0 16px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                {feedbackText}
                <br /><br />
                Remember this metaphor:
                <br />
                ⬢ <strong>Factors:</strong> Go <strong>INTO</strong> the number (divide exactly).
                <br />
                ⬢ <strong>Multiples:</strong> Come <strong>OUT</strong> of the number (multiply forward).
              </p>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Continue to Review →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison */}
      {subStep === 'comparison' && (
        <div>
          {/* Side-by-side Cards */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Factors Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid #4ba3e3',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: '#4ba3e3' }}>
                FACTORS
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>What they do:</strong> Divide the number exactly with no leftovers or remainders.
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Quantity:</strong> Limited in number (finite).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Size:</strong> Smaller than or equal to the number (usually smaller, max is the number itself).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Direction:</strong> Go <strong>INTO</strong> the target number.
              </p>
            </div>

            {/* Multiples Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                MULTIPLES
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>What they are:</strong> Obtained by multiplying the target number by a whole number.
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Quantity:</strong> Unlimited (continue forever).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Size:</strong> Equal to or greater than the number (starts at the number itself).
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                <strong>Direction:</strong> Come <strong>OUT</strong> of the target number.
              </p>
            </div>
          </div>

          {/* Common Mistake Card */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Mistake
            </h4>
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>
              Students often reverse the factor vs multiple relationships.
              <br /><br />
              ⬢ <strong>12 is a multiple of 3</strong> (because 3 × 4 = 12) ✓
              <br />
              ⬢ <strong>3 is a factor of 12</strong> (because 12 ÷ 3 = 4 exactly) ✓
              <br /><br />
              But <strong>12 is NOT a factor of 3</strong> (because 3 ÷ 12 does not divide into a whole number) ✓
            </p>
          </div>

          {/* Decision Rule */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 14px 0', fontSize: '1.05rem', fontWeight: '500' }}>
              Before solving, ask yourself:
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '220px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Can it divide exactly?</span>
                <strong style={{ fontSize: '1.25rem', color: '#4ba3e3' }}>FACTOR</strong>
              </div>
              <div style={{ background: 'var(--clr-card)', padding: '12px 24px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '220px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Do I get it by multiplying?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)' }}>MULTIPLE</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Calculation</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.25rem', color: 'var(--clr-text)', marginBottom: '20px', fontWeight: '500' }}>
              Which of these is a <strong>factor</strong> of 18?
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[4, 6, 20, 36].map(opt => {
                const isSelected = selectedQ1Option === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleQ1Select(opt)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNext} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Sorting Challenge</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '8px', fontWeight: '500' }}>
              Target Number: <strong style={{ color: 'var(--clr-accent)', fontSize: '1.35rem' }}>10</strong>
            </p>
            <p style={{ color: 'var(--clr-text-soft)', fontSize: '0.98rem', marginBottom: '20px' }}>
              For each card below, select whether it is a <strong>Factor of 10</strong>, a <strong>Multiple of 10</strong>, or <strong>neither</strong> (leave unchecked).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[2, 5, 10, 20, 25, 50].map((num) => {
                const isFactor = studentSelections[num]?.factor;
                const isMultiple = studentSelections[num]?.multiple;

                // Define visual styles based on correct mapping after submission
                const getBtnStyle = (type, isSelected) => {
                  const correctMap = {
                    2: { factor: true, multiple: false },
                    5: { factor: true, multiple: false },
                    10: { factor: true, multiple: true },
                    20: { factor: false, multiple: true },
                    25: { factor: false, multiple: false },
                    50: { factor: false, multiple: true }
                  };
                  const isCorrect = correctMap[num][type];

                  if (q2Answer !== null) {
                    if (isSelected && isCorrect) {
                      return {
                        background: 'rgba(92, 184, 122, 0.15)',
                        color: 'var(--clr-correct)',
                        border: '2px solid var(--clr-correct)',
                        fontWeight: '600'
                      };
                    } else if (isSelected && !isCorrect) {
                      return {
                        background: 'rgba(235, 94, 85, 0.15)',
                        color: 'var(--clr-wrong)',
                        border: '2px solid var(--clr-wrong)',
                        fontWeight: '600'
                      };
                    } else if (!isSelected && isCorrect) {
                      return {
                        background: 'var(--clr-surface)',
                        color: 'var(--clr-correct)',
                        border: '2px dashed var(--clr-correct)',
                        opacity: 0.85
                      };
                    } else {
                      return {
                        background: 'var(--clr-surface)',
                        color: 'var(--clr-text-soft)',
                        border: '1.5px solid var(--clr-border)',
                        opacity: 0.5
                      };
                    }
                  } else {
                    if (isSelected) {
                      return {
                        background: type === 'factor' ? '#4ba3e3' : 'var(--clr-correct)',
                        color: '#fff',
                        border: `1.5px solid ${type === 'factor' ? '#4ba3e3' : 'var(--clr-correct)'}`
                      };
                    }
                    return {
                      background: 'var(--clr-surface)',
                      color: 'var(--clr-text)',
                      border: '1.5px solid var(--clr-border)',
                      cursor: 'pointer'
                    };
                  }
                };

                return (
                  <div
                    key={num}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--clr-card)',
                      border: '1px solid var(--clr-border)',
                      padding: '12px 20px',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ fontSize: '1.35rem', fontWeight: 'bold', color: 'var(--clr-text)' }}>
                      {num}
                    </span>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => toggleSelection(num, 'factor')}
                        disabled={q2Answer !== null}
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.9rem',
                          borderRadius: 'var(--radius-sm)',
                          ...getBtnStyle('factor', isFactor)
                        }}
                      >
                        {isFactor ? '✓ Factor' : 'Factor'}
                      </button>
                      <button
                        onClick={() => toggleSelection(num, 'multiple')}
                        disabled={q2Answer !== null}
                        style={{
                          padding: '8px 14px',
                          fontSize: '0.9rem',
                          borderRadius: 'var(--radius-sm)',
                          ...getBtnStyle('multiple', isMultiple)
                        }}
                      >
                        {isMultiple ? '✓ Multiple' : 'Multiple'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {q2Answer === null && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <button
                  onClick={checkSelections}
                  style={{ padding: '12px 32px', fontSize: '1.05rem' }}
                >
                  Submit Sorting
                </button>
              </div>
            )}
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CongruenceSimilarityChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, r3, comparison, q1, q2
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Interactive Inspector States
  const [rotateAngle, setRotateAngle] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [inspectorSolved, setInspectorSolved] = useState(false);
  const [discoverQAnswered, setDiscoverQAnswered] = useState(false);
  const [selectedDiscoveryOption, setSelectedDiscoveryOption] = useState(null);

  // Layer 3
  const [q1Answer, setQ1Answer] = useState(null);
  const [selectedQ1Option, setSelectedQ1Option] = useState(null);

  // Classification Grid Game
  const [classifications, setClassifications] = useState({
    'Rotated square': null,
    'Enlarged triangle': null,
    'Mirror-image rectangle': null,
    'Rectangle vs square': null,
    'Enlarged pentagon': null,
    'Triangle with different angles': null
  });
  const [q2Answer, setQ2Answer] = useState(null);

  // Reset states between subSteps
  useEffect(() => {
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setShowOverlay(false);
    setInspectorSolved(false);
    setDiscoverQAnswered(false);
    setSelectedDiscoveryOption(null);
    setQ1Answer(null);
    setSelectedQ1Option(null);
    setQ2Answer(null);
    setClassifications({
      'Rotated square': null,
      'Enlarged triangle': null,
      'Mirror-image rectangle': null,
      'Rectangle vs square': null,
      'Enlarged pentagon': null,
      'Triangle with different angles': null
    });

    // Set initial offsets for candidate shape to rotate/resize
    if (subStep === 'r1') {
      setRotateAngle(90);
      setIsFlipped(false);
      setScale(1.0);
    } else if (subStep === 'r2') {
      setRotateAngle(180);
      setIsFlipped(false);
      setScale(1.4);
    } else if (subStep === 'r3') {
      setRotateAngle(90);
      setIsFlipped(true);
      setScale(1.0);
    }
  }, [subStep]);

  const handleNext = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('r3');
    else if (subStep === 'r3') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleRotate = () => {
    if (showOverlay || inspectorSolved) return;
    setRotateAngle(prev => (prev + 90) % 360);
  };

  const handleFlip = () => {
    if (showOverlay || inspectorSolved) return;
    setIsFlipped(prev => !prev);
  };

  const handleResize = () => {
    if (showOverlay || inspectorSolved) return;
    if (subStep === 'r1') {
      // Cycle scales
      setScale(prev => prev === 1.0 ? 1.3 : prev === 1.3 ? 0.7 : 1.0);
    } else if (subStep === 'r2') {
      // Cycle scales
      setScale(prev => prev === 1.4 ? 1.0 : prev === 1.0 ? 0.7 : 1.4);
    } else if (subStep === 'r3') {
      setScale(prev => prev === 1.0 ? 1.4 : prev === 1.4 ? 0.7 : 1.0);
    }
  };

  const handleOverlayToggle = () => {
    if (inspectorSolved) return;
    const nextOverlay = !showOverlay;
    setShowOverlay(nextOverlay);

    if (nextOverlay) {
      // Evaluate matching condition
      if (subStep === 'r1') {
        const isMatch = (rotateAngle % 360 === 0) && scale === 1.0;
        if (isMatch) {
          setInspectorSolved(true);
          setAnswerState('correct');
        } else {
          setAnswerState('wrong');
          setHintText("Shapes do not overlap. Try rotating the candidate shape to match the vertical reference triangle!");
        }
      } else if (subStep === 'r2') {
        const isMatch = (rotateAngle % 360 === 0) && scale === 1.0;
        if (isMatch) {
          setInspectorSolved(true);
          setAnswerState('correct');
        } else {
          setAnswerState('wrong');
          setHintText("Shapes do not overlap. Adjust both the rotation and scale factor (size) of the candidate shape!");
        }
      } else if (subStep === 'r3') {
        // Different shapes, will never overlap
        setInspectorSolved(true);
        setAnswerState('correct');
      }
    } else {
      setAnswerState('unanswered');
      setHintText('');
    }
  };

  const handleDiscoverySubmit = (option) => {
    setSelectedDiscoveryOption(option);
    let isCorrect = false;
    if (subStep === 'r1') {
      isCorrect = (option === 'both');
      if (isCorrect) {
        setFeedbackText("Excellent! These congruent figures overlap perfectly without changing their size. They have both the same shape and size.");
      } else {
        setHintText("Not quite. Notice that the size and shape of both triangles are completely identical, not just the shape.");
      }
    } else if (subStep === 'r2') {
      isCorrect = (option === 'size');
      if (isCorrect) {
        setFeedbackText("Great! The shape stayed the same, but the size changed. These figures are similar but not congruent.");
      } else {
        setHintText("Not quite. Resizing the candidate shape changed its size scale factor, not just the orientation.");
      }
    } else if (subStep === 'r3') {
      isCorrect = (option === 'shape');
      if (isCorrect) {
        setFeedbackText("Correct! They cannot overlap because they are completely different shapes (a rectangle vs a trapezium). They are neither congruent nor similar.");
      } else {
        setHintText("Not quite. Flipping and resizing didn't help because they have entirely different shapes.");
      }
    }

    if (isCorrect) {
      setAnswerState('correct');
      setDiscoverQAnswered(true);
    } else {
      setAnswerState('wrong');
      setDiscoverQAnswered(true);
    }
  };

  const handleQ1Select = (option) => {
    if (q1Answer !== null) return;
    setSelectedQ1Option(option);
    if (option === 'similar') {
      setQ1Answer('correct');
      setFeedbackText("Correct! The sides of Triangle B are exactly twice the size of Triangle A (scale factor = 2). Since they have the same shape but different sizes, they are Similar Only.");
    } else {
      setQ1Answer('wrong');
      if (option === 'congruent') {
        setFeedbackText("Not quite. Congruent shapes must have the exact same size. Triangle B is twice as large as Triangle A!");
      } else {
        setFeedbackText("Not quite. They have the exact same right-angle shape, and their sides are proportional (3:6, 4:8, 5:10), so they are similar!");
      }
    }
  };

  const handleSelectClass = (item, category) => {
    if (q2Answer !== null) return;
    setClassifications(prev => ({
      ...prev,
      [item]: category
    }));
  };

  const checkClassification = () => {
    const correctMap = {
      'Rotated square': 'congruent',
      'Enlarged triangle': 'similar',
      'Mirror-image rectangle': 'congruent',
      'Rectangle vs square': 'neither',
      'Enlarged pentagon': 'similar',
      'Triangle with different angles': 'neither'
    };

    let isCorrect = true;
    for (const key of Object.keys(correctMap)) {
      if (classifications[key] !== correctMap[key]) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      setQ2Answer('correct');
      setFeedbackText("Magnificent! You classified all pairs perfectly! Rotating and mirroring keep shapes congruent, enlarging makes them similar, and changing shapes or angles makes them neither.");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Not quite! Some shapes are classified incorrectly. Check which transformations preserve size (congruent) and which only preserve shape (similar).");
    }
  };

  // Helper to draw SVGs side-by-side
  const renderShapeCanvas = () => {
    // Reference points relative to (100, 90)
    // Candidate points relative to (300, 90)
    let refPath = "";
    let candidatePath = "";

    if (subStep === 'r1' || subStep === 'r2') {
      // Triangles
      refPath = "M 60,50 L 140,130 L 60,130 Z";
      candidatePath = "M 260,50 L 340,130 L 260,130 Z";
    } else {
      // Rectangle vs Trapezium
      refPath = "M 60,60 L 140,60 L 140,120 L 60,120 Z"; // Rectangle
      candidatePath = "M 270,55 L 330,55 L 345,125 L 255,125 Z"; // Trapezium
    }

    return (
      <svg
        width="100%"
        height="180"
        viewBox="0 0 400 180"
        style={{
          background: 'var(--clr-card)',
          borderRadius: '8px',
          border: '1px solid var(--clr-border)',
          overflow: 'hidden'
        }}
      >
        {/* Left Reference Area Grid */}
        <rect x="5" y="5" width="190" height="170" fill="none" stroke="var(--clr-border)" strokeWidth="1" strokeDasharray="3,3" rx="4" />
        <text x="100" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--clr-text-soft)">Reference Shape</text>

        {/* Right Candidate Area Grid */}
        {!showOverlay && (
          <>
            <rect x="205" y="5" width="190" height="170" fill="none" stroke="var(--clr-border)" strokeWidth="1" strokeDasharray="3,3" rx="4" />
            <text x="300" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--clr-text-soft)">Candidate Shape</text>
          </>
        )}

        {/* Draw Reference Shape */}
        <path d={refPath} fill="none" stroke="var(--clr-text-soft)" strokeWidth="2.5" strokeDasharray="4,4" />

        {/* Draw Candidate Shape Group with transformations */}
        <g
          style={{
            transform: `translate(${showOverlay ? -200 : 0}px, 0px) rotate(${rotateAngle}deg) scale(${scale}) scaleX(${isFlipped ? -1 : 1})`,
            transformOrigin: '300px 90px',
            transition: 'transform 0.45s ease-in-out'
          }}
        >
          <path d={candidatePath} fill="rgba(232, 134, 74, 0.6)" stroke="var(--clr-accent)" strokeWidth="2.5" />
        </g>
      </svg>
    );
  };

  const handleNextStep = () => {
    handleNext();
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Congruence vs Similarity
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Shape Inspector
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div style={{ background: 'var(--clr-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '200px' }}>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--clr-accent)', marginTop: '8px' }}>Congruence</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-soft)', margin: '6px 0 0 0' }}>Same Shape + Same Size. Perfect overlap.</p>
            </div>
            <div style={{ background: 'var(--clr-surface)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', minWidth: '200px' }}>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--clr-correct)', marginTop: '8px' }}>Similarity</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-soft)', margin: '6px 0 0 0' }}>Same Shape. Size can change proportionally.</p>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Can shapes look similar without being congruent? Let's inspect them interactively!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Inspection</button>
        </div>
      )}

      {/* R1, R2, R3 Inspector loops */}
      {(subStep === 'r1' || subStep === 'r2' || subStep === 'r3') && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '500px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Shape Inspector Mission
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              {subStep === 'r1' && "The candidate triangle (orange) has been rotated. Rotate it to see if it can align and overlap the reference outline (dashed) perfectly without changing its size."}
              {subStep === 'r2' && "This candidate triangle is larger and rotated. Rotate it and adjust its size (Resize) to see if you can make it match the reference outline perfectly."}
              {subStep === 'r3' && "Here is a rectangle and a trapezium. Rotate, flip, and resize the trapezium. Can you make it match and overlap the rectangle perfectly?"}
            </p>
          </div>

          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '16px' }}>
            {subStep === 'r1' && 'Round 1: Overlap the rotated shape'}
            {subStep === 'r2' && 'Round 2: Overlap the larger shape'}
            {subStep === 'r3' && 'Round 3: Overlap the different shape'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
              {renderShapeCanvas()}
            </div>
          </div>

          {/* Tool Guide Box */}
          <div style={{
            background: 'var(--clr-surface)',
            border: '1px solid var(--clr-border)',
            borderRadius: '6px',
            padding: '12px 16px',
            maxWidth: '440px',
            margin: '0 auto 16px auto',
            textAlign: 'left',
            fontSize: '0.88rem',
            lineHeight: '1.4',
            color: 'var(--clr-text-soft)',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--clr-text)' }}>Tool Guide:</strong>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              <li>🔄 <strong>Rotate:</strong> Turns the candidate shape by 90° clockwise.</li>
              <li>🪞 <strong>Flip:</strong> Mirrors the candidate shape horizontally.</li>
              <li>↔️ <strong>Resize:</strong> Cycles the size scale (0.7x, 1.0x, 1.3x/1.4x).</li>
              <li>📋 <strong>Overlay:</strong> Slides the candidate shape on top of the reference to check if they match.</li>
            </ul>
          </div>

          {/* Transformation Controls */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button
              className="secondary"
              onClick={handleRotate}
              disabled={showOverlay || inspectorSolved}
              style={{ padding: '8px 16px', fontSize: '0.95rem' }}
            >
              🔄 Rotate
            </button>
            <button
              className="secondary"
              onClick={handleFlip}
              disabled={showOverlay || inspectorSolved}
              style={{ padding: '8px 16px', fontSize: '0.95rem' }}
            >
              🪞 Flip
            </button>
            <button
              className="secondary"
              onClick={handleResize}
              disabled={showOverlay || inspectorSolved}
              style={{ padding: '8px 16px', fontSize: '0.95rem' }}
            >
              ↔️ Resize ({scale.toFixed(1)}x)
            </button>
            <button
              className={showOverlay ? 'primary' : 'secondary'}
              onClick={handleOverlayToggle}
              disabled={inspectorSolved}
              style={{ padding: '8px 20px', fontSize: '0.95rem', fontWeight: '600' }}
            >
              {showOverlay ? '◀ Separate' : '📋 Overlay'}
            </button>
          </div>

          {answerState === 'wrong' && !discoverQAnswered && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(235, 94, 85, 0.1)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '5px solid var(--clr-wrong)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', color: 'var(--clr-wrong)', marginBottom: '4px' }}>No overlap</strong>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {/* Solver Discovery Question */}
          {inspectorSolved && !discoverQAnswered && (
            <div style={{
              background: 'var(--clr-surface)',
              border: '1.5px solid var(--clr-border)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              margin: '0 auto 20px auto',
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)' }}>
                {subStep === 'r1' && 'Overlay Achieved! What did you discover?'}
                {subStep === 'r2' && 'Overlay Achieved! What changed?'}
                {subStep === 'r3' && 'Overlay Complete! What do you notice?'}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {subStep === 'r1' && (
                  <>
                    <button onClick={() => handleDiscoverySubmit('shape')} className="option-card" style={{ padding: '12px 18px', textAlign: 'left' }}>
                      Same Shape Only
                    </button>
                    <button onClick={() => handleDiscoverySubmit('both')} className="option-card" style={{ padding: '12px 18px', textAlign: 'left' }}>
                      Same Shape & Same Size
                    </button>
                  </>
                )}
                {subStep === 'r2' && (
                  <>
                    <button onClick={() => handleDiscoverySubmit('orient')} className="option-card" style={{ padding: '12px 18px', textAlign: 'left' }}>
                      Only the orientation
                    </button>
                    <button onClick={() => handleDiscoverySubmit('size')} className="option-card" style={{ padding: '12px 18px', textAlign: 'left' }}>
                      The size
                    </button>
                  </>
                )}
                {subStep === 'r3' && (
                  <>
                    <button onClick={() => handleDiscoverySubmit('angle')} className="option-card" style={{ padding: '12px 18px', textAlign: 'left' }}>
                      Same shape
                    </button>
                    <button onClick={() => handleDiscoverySubmit('shape')} className="option-card" style={{ padding: '12px 18px', textAlign: 'left' }}>
                      Different shape
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {discoverQAnswered && (
            <div style={{
              padding: '20px',
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--clr-border)',
              borderLeft: `5px solid ${answerState === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', marginBottom: '8px', color: answerState === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)', fontSize: '1.25rem' }}>
                {answerState === 'correct' ? 'Correct Discovery!' : 'Not Quite'}
              </strong>
              <p style={{ margin: '0 0 16px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                {answerState === 'correct' ? feedbackText : hintText}
              </p>

              {answerState === 'correct' ? (
                <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>
                  {subStep === 'r3' ? 'Continue to Review →' : 'Next Round'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setDiscoverQAnswered(false);
                    setSelectedDiscoveryOption(null);
                    setAnswerState('unanswered');
                  }}
                  className="secondary"
                  style={{ padding: '10px 20px', fontSize: '1rem' }}
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison */}
      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  CONGRUENT
                </h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                  <strong>Constraint:</strong> Same shape AND same size.
                </p>
                <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                  <strong>Verification:</strong> Overlap perfectly without resizing.
                </p>
              </div>

              <div style={{
                background: 'rgba(92, 184, 122, 0.1)',
                padding: '8px 12px',
                borderRadius: '6px',
                borderLeft: '4px solid var(--clr-correct)',
                marginTop: '16px',
                fontSize: '0.95rem',
                lineHeight: '1.4'
              }}>
                <strong>Key Rule:</strong> Congruent figures are always similar.
              </div>
            </div>

            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid #4ba3e3',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: '#4ba3e3' }}>
                  SIMILAR
                </h3>
                <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                  <strong>Constraint:</strong> Same shape, but size can differ.
                </p>
                <p style={{ margin: '0 0 10px 0', fontSize: '1rem', lineHeight: '1.5' }}>
                  <strong>Verification:</strong> Proportional sides, equal angles.
                </p>
              </div>

              <div style={{
                background: 'rgba(235, 94, 85, 0.08)',
                padding: '8px 12px',
                borderRadius: '6px',
                borderLeft: '4px solid var(--clr-wrong)',
                marginTop: '16px',
                fontSize: '0.95rem',
                lineHeight: '1.4'
              }}>
                <strong>Key Rule:</strong> Similar figures are not always congruent.
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>
              Congruent shapes are **always** similar (scale factor = 1). Similarity doesn't mean the sizes *must* be different.
            </p>
          </div>

          {/* Decision Rule - Flowchart Cards */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
              <div style={{ background: 'var(--clr-card)', padding: '14px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', minWidth: '180px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-soft)' }}>YES, without resizing</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--clr-correct)', display: 'block', margin: '4px 0' }}>CONGRUENT</strong>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>(And Also Similar)</span>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '14px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', minWidth: '180px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-soft)' }}>YES, after proportional resizing</span>
                <strong style={{ fontSize: '1.2rem', color: '#4ba3e3', display: 'block', margin: '4px 0' }}>SIMILAR ONLY</strong>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>(Not Congruent)</span>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '14px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', minWidth: '180px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--clr-text-soft)' }}>NO, shapes differ</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--clr-wrong)', display: 'block', margin: '4px 0' }}>NEITHER</strong>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>(Shapes mismatch)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Recognition</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.25rem', color: 'var(--clr-text)', marginBottom: '8px', fontWeight: '500' }}>
              Compare two triangles:
            </p>
            <ul style={{ fontSize: '1.1rem', margin: '0 0 20px 20px', padding: 0 }}>
              <li><strong>Triangle A:</strong> sides measuring 3 cm, 4 cm, 5 cm</li>
              <li><strong>Triangle B:</strong> sides measuring 6 cm, 8 cm, 10 cm</li>
            </ul>
            <p style={{ fontSize: '1.15rem', fontWeight: '500', marginBottom: '16px' }}>
              Choose the correct statement:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'congruent', label: 'Congruent (And Similar)' },
                { id: 'similar', label: 'Similar Only' },
                { id: 'neither', label: 'Neither Congruent nor Similar' }
              ].map(opt => {
                const isSelected = selectedQ1Option === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleQ1Select(opt.id)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 Classification Grid */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Classification Challenge</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ color: 'var(--clr-text-soft)', fontSize: '0.98rem', marginBottom: '20px' }}>
              Classify each shape transformation pair into their correct category:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Rotated square',
                'Enlarged triangle',
                'Mirror-image rectangle',
                'Rectangle vs square',
                'Enlarged pentagon',
                'Triangle with different angles'
              ].map((item) => {
                const selectedCat = classifications[item];

                const getBtnStyle = (cat) => {
                  const correctMap = {
                    'Rotated square': 'congruent',
                    'Enlarged triangle': 'similar',
                    'Mirror-image rectangle': 'congruent',
                    'Rectangle vs square': 'neither',
                    'Enlarged pentagon': 'similar',
                    'Triangle with different angles': 'neither'
                  };
                  const isCorrect = correctMap[item] === cat;
                  const isSelected = selectedCat === cat;

                  if (q2Answer !== null) {
                    if (isSelected && isCorrect) {
                      return {
                        background: 'rgba(92, 184, 122, 0.15)',
                        color: 'var(--clr-correct)',
                        border: '2px solid var(--clr-correct)',
                        fontWeight: '600'
                      };
                    } else if (isSelected && !isCorrect) {
                      return {
                        background: 'rgba(235, 94, 85, 0.15)',
                        color: 'var(--clr-wrong)',
                        border: '2px solid var(--clr-wrong)',
                        fontWeight: '600'
                      };
                    } else if (!isSelected && isCorrect) {
                      return {
                        background: 'var(--clr-surface)',
                        color: 'var(--clr-correct)',
                        border: '2px dashed var(--clr-correct)',
                        opacity: 0.85
                      };
                    } else {
                      return {
                        background: 'var(--clr-surface)',
                        color: 'var(--clr-text-soft)',
                        border: '1.5px solid var(--clr-border)',
                        opacity: 0.5
                      };
                    }
                  } else {
                    if (isSelected) {
                      return {
                        background: 'var(--clr-accent)',
                        color: '#fff',
                        border: '1.5px solid var(--clr-accent)'
                      };
                    }
                    return {
                      background: 'var(--clr-surface)',
                      color: 'var(--clr-text)',
                      border: '1.5px solid var(--clr-border)',
                      cursor: 'pointer'
                    };
                  }
                };

                return (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      background: 'var(--clr-card)',
                      border: '1px solid var(--clr-border)',
                      padding: '16px',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--clr-text)' }}>
                      {item}
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <button
                        onClick={() => handleSelectClass(item, 'congruent')}
                        disabled={q2Answer !== null}
                        style={{
                          padding: '8px 6px',
                          fontSize: '0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          ...getBtnStyle('congruent')
                        }}
                      >
                        Congruent
                      </button>
                      <button
                        onClick={() => handleSelectClass(item, 'similar')}
                        disabled={q2Answer !== null}
                        style={{
                          padding: '8px 6px',
                          fontSize: '0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          ...getBtnStyle('similar')
                        }}
                      >
                        Similar Only
                      </button>
                      <button
                        onClick={() => handleSelectClass(item, 'neither')}
                        disabled={q2Answer !== null}
                        style={{
                          padding: '8px 6px',
                          fontSize: '0.8rem',
                          borderRadius: 'var(--radius-sm)',
                          ...getBtnStyle('neither')
                        }}
                      >
                        Neither
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {q2Answer === null && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <button
                  onClick={checkClassification}
                  style={{ padding: '12px 32px', fontSize: '1.05rem' }}
                >
                  Submit Classification
                </button>
              </div>
            )}
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatricesDeterminantsChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, detective, comparison, q1, q2
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Detective States
  const [selectedCard, setSelectedCard] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [inspectedStatus, setInspectedStatus] = useState({
    A: null, // null, correct, incorrect
    B: null,
    C: null,
    '12': null
  });

  // Layer 3
  const [q1Answer, setQ1Answer] = useState(null);
  const [selectedQ1Option, setSelectedQ1Option] = useState(null);

  // Q2 dimensions tapping challenge
  const [tappedDimensions, setTappedDimensions] = useState({
    '2x2': false,
    '3x2': false,
    '4x4': false,
    '1x3': false
  });
  const [q2Answer, setQ2Answer] = useState(null);

  // Reset states between subSteps
  useEffect(() => {
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setSelectedCard(null);
    setIsScanning(false);
    setInspectedStatus({
      A: null,
      B: null,
      C: null,
      '12': null
    });
    setQ1Answer(null);
    setSelectedQ1Option(null);
    setQ2Answer(null);
    setTappedDimensions({
      '2x2': false,
      '3x2': false,
      '4x4': false,
      '1x3': false
    });
  }, [subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('detective');
    else if (subStep === 'detective') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleInspectCard = (cardId) => {
    if (isScanning) return;
    setSelectedCard(cardId);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
  };

  const handleDetectiveSubmit = (canHaveDeterminant) => {
    if (isScanning || !selectedCard) return;

    const cardsConfig = {
      A: { isSquare: true, name: "Matrix A (2x2)", desc: "Square matrix of dimensions 2x2. It has determinant value = 5.", val: 5 },
      B: { isSquare: false, name: "Matrix B (3x2)", desc: "Rectangle matrix of dimensions 3x2. It is not square, so it has no determinant." },
      C: { isSquare: true, name: "Matrix C (3x3)", desc: "Square matrix of dimensions 3x3. It has determinant value = -10.", val: -10 },
      '12': { isSquare: false, name: "Number 12", desc: "Single scalar number. It is not a matrix, so it has no determinant." }
    };

    const config = cardsConfig[selectedCard];
    const isCorrectChoice = (canHaveDeterminant === config.isSquare);

    if (isCorrectChoice) {
      if (config.isSquare) {
        setIsScanning(true);
        setTimeout(() => {
          setIsScanning(false);
          setAnswerState('correct');
          setFeedbackText(`Determinant Found! det(${selectedCard}) = ${config.val}. calculated from the square coefficients.`);
          setInspectedStatus(prev => ({ ...prev, [selectedCard]: 'correct' }));
        }, 1300);
      } else {
        setAnswerState('correct');
        setFeedbackText(`Correct! ${config.name} does not have a determinant because it is not square.`);
        setInspectedStatus(prev => ({ ...prev, [selectedCard]: 'correct' }));
      }
    } else {
      setAnswerState('wrong');
      setHintText(`Incorrect. ${config.desc}`);
      setInspectedStatus(prev => ({ ...prev, [selectedCard]: 'incorrect' }));
    }
  };

  const allInspectedCorrectly =
    inspectedStatus.A === 'correct' &&
    inspectedStatus.B === 'correct' &&
    inspectedStatus.C === 'correct' &&
    inspectedStatus['12'] === 'correct';

  const handleQ1Select = (option) => {
    if (q1Answer !== null) return;
    setSelectedQ1Option(option);
    if (option === 'matrix') {
      setQ1Answer('correct');
      setFeedbackText("Correct! Brackets indicate a grid configuration of values, representing a Matrix.");
    } else {
      setQ1Answer('wrong');
      setFeedbackText("Incorrect. Vertical bar lines denote a determinant value calculation, whereas standard brackets indicate the matrix grid structure itself.");
    }
  };

  const toggleDimension = (dim) => {
    if (q2Answer !== null) return;
    setTappedDimensions(prev => ({
      ...prev,
      [dim]: !prev[dim]
    }));
  };

  const checkQ2Selection = () => {
    const isCorrect =
      tappedDimensions['2x2'] === true &&
      tappedDimensions['3x2'] === false &&
      tappedDimensions['4x4'] === true &&
      tappedDimensions['1x3'] === false;

    if (isCorrect) {
      setQ2Answer('correct');
      setFeedbackText("Correct! Only square matrices (same row and column count, like 2x2 and 4x4) can have determinants computed.");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Not quite. Remember that determinants are only defined for square dimensions where number of rows equals the number of columns.");
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0; }
        }
        .scan-bar {
          position: absolute;
          left: 0;
          width: 100%;
          height: 4px;
          background: var(--clr-correct);
          box-shadow: 0 0 10px var(--clr-correct);
          animation: scan 1.2s infinite linear;
        }
        .matrix-bracket {
          border-left: 2px solid var(--clr-text);
          border-right: 2px solid var(--clr-text);
          border-radius: 4px;
          padding: 4px 8px;
          font-family: monospace;
          font-size: 1.1rem;
          line-height: 1.4;
          display: inline-block;
          text-align: center;
        }
        .determinant-bars {
          border-left: 2px solid var(--clr-text);
          border-right: 2px solid var(--clr-text);
          padding: 4px 8px;
          font-family: monospace;
          font-size: 1.1rem;
          line-height: 1.4;
          display: inline-block;
          text-align: center;
        }
      `}</style>

      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Matrices vs Determinants
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Matrix Detective
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '480px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Matrix</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>An arrangement grid of numbers inside brackets.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '480px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Determinant</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>A single numeric value computed from a square matrix.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Only specific matrices have determinants. Let's start the scanner and detect determinants!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Detection</button>
        </div>
      )}

      {/* Layer 1: Detective Scanner */}
      {subStep === 'detective' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '520px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Detective Mission Instructions
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Select each of the cards below to test if we can extract a determinant from it. Verify all 4 objects to move to the comparison card review.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {/* Card A (2x2) */}
            <div
              onClick={() => handleInspectCard('A')}
              className={`option-card ${selectedCard === 'A' ? 'selected' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '16px 12px',
                border: inspectedStatus.A === 'correct' ? '2.5px solid var(--clr-correct)' : '1px solid var(--clr-border)',
                opacity: selectedCard === 'A' ? 1 : 0.85
              }}
            >
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--clr-text)', display: 'block', fontWeight: '500' }}>Matrix A</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', display: 'block' }}>(2×2)</span>
                {inspectedStatus.A === 'correct' && <span style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>✓ Verified</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'monospace', fontSize: '1.1rem', position: 'relative' }}>
                {isScanning && selectedCard === 'A' && <div className="scan-bar" />}
                <span style={{ fontSize: '3rem', fontWeight: '100', marginRight: '6px', color: 'var(--clr-text)', opacity: 0.85 }}>[</span>
                <div style={{ display: 'inline-block', textAlign: 'center', lineHeight: '1.4', whiteSpace: 'nowrap' }}>
                  2&nbsp;3<br />1&nbsp;4
                </div>
                <span style={{ fontSize: '3rem', fontWeight: '100', marginLeft: '6px', color: 'var(--clr-text)', opacity: 0.85 }}>]</span>
              </div>
            </div>

            {/* Card B (3x2) */}
            <div
              onClick={() => handleInspectCard('B')}
              className={`option-card ${selectedCard === 'B' ? 'selected' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '16px 12px',
                border: inspectedStatus.B === 'correct' ? '2.5px solid var(--clr-correct)' : '1px solid var(--clr-border)',
                opacity: selectedCard === 'B' ? 1 : 0.85
              }}
            >
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--clr-text)', display: 'block', fontWeight: '500' }}>Matrix B</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', display: 'block' }}>(3×2)</span>
                {inspectedStatus.B === 'correct' && <span style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>✓ Verified</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'monospace', fontSize: '1.1rem', position: 'relative' }}>
                <span style={{ fontSize: '4.2rem', fontWeight: '100', marginRight: '6px', color: 'var(--clr-text)', opacity: 0.85 }}>[</span>
                <div style={{ display: 'inline-block', textAlign: 'center', lineHeight: '1.4', whiteSpace: 'nowrap' }}>
                  5&nbsp;1<br />-2&nbsp;3<br />0&nbsp;7
                </div>
                <span style={{ fontSize: '4.2rem', fontWeight: '100', marginLeft: '6px', color: 'var(--clr-text)', opacity: 0.85 }}>]</span>
              </div>
            </div>

            {/* Card C (3x3) */}
            <div
              onClick={() => handleInspectCard('C')}
              className={`option-card ${selectedCard === 'C' ? 'selected' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '16px 12px',
                border: inspectedStatus.C === 'correct' ? '2.5px solid var(--clr-correct)' : '1px solid var(--clr-border)',
                opacity: selectedCard === 'C' ? 1 : 0.85
              }}
            >
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--clr-text)', display: 'block', fontWeight: '500' }}>Matrix C</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', display: 'block' }}>(3×3)</span>
                {inspectedStatus.C === 'correct' && <span style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>✓ Verified</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'monospace', fontSize: '1.1rem', position: 'relative' }}>
                {isScanning && selectedCard === 'C' && <div className="scan-bar" />}
                <span style={{ fontSize: '4.2rem', fontWeight: '100', marginRight: '6px', color: 'var(--clr-text)', opacity: 0.85 }}>[</span>
                <div style={{ display: 'inline-block', textAlign: 'center', lineHeight: '1.4', whiteSpace: 'nowrap' }}>
                  1&nbsp;0&nbsp;2<br />3&nbsp;-1&nbsp;4<br />2&nbsp;1&nbsp;0
                </div>
                <span style={{ fontSize: '4.2rem', fontWeight: '100', marginLeft: '6px', color: 'var(--clr-text)', opacity: 0.85 }}>]</span>
              </div>
            </div>

            {/* Card Scalar */}
            <div
              onClick={() => handleInspectCard('12')}
              className={`option-card ${selectedCard === '12' ? 'selected' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '16px 12px',
                border: inspectedStatus['12'] === 'correct' ? '2.5px solid var(--clr-correct)' : '1px solid var(--clr-border)',
                opacity: selectedCard === '12' ? 1 : 0.85
              }}
            >
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--clr-text)', display: 'block', fontWeight: '500' }}>Object D</span>
                {inspectedStatus['12'] === 'correct' && <span style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>✓ Verified</span>}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--clr-accent)', fontFamily: 'monospace', paddingRight: '8px' }}>
                12
              </div>
            </div>
          </div>

          {/* Prompt options */}
          {selectedCard && (
            <div style={{
              background: 'var(--clr-surface)',
              border: '1.5px solid var(--clr-border)',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '480px',
              margin: '0 auto 20px auto'
            }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: '500' }}>
                Can we extract a determinant from this selection?
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => handleDetectiveSubmit(true)} disabled={isScanning} style={{ padding: '10px 24px', fontSize: '1rem' }}>
                  Yes, it has a determinant
                </button>
                <button onClick={() => handleDetectiveSubmit(false)} disabled={isScanning} className="secondary" style={{ padding: '10px 24px', fontSize: '1rem' }}>
                  No determinant
                </button>
              </div>
            </div>
          )}

          {isScanning && (
            <div style={{ margin: '20px auto', maxWidth: '300px' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-soft)', marginBottom: '8px' }}>Scanning matrix coefficients...</div>
              <div style={{ background: 'var(--clr-card)', height: '8px', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--clr-correct)', transition: 'width 1.2s ease-out' }} />
              </div>
            </div>
          )}

          {answerState === 'wrong' && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(235, 94, 85, 0.1)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '5px solid var(--clr-wrong)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', color: 'var(--clr-wrong)', marginBottom: '4px' }}>No determinant found</strong>
              <p style={{ margin: 0, fontSize: '0.98rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && !isScanning && (
            <div style={{
              padding: '16px 20px',
              background: 'rgba(92, 184, 122, 0.1)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: '5px solid var(--clr-correct)',
              textAlign: 'left',
              maxWidth: '500px',
              margin: '0 auto 20px auto'
            }}>
              <strong style={{ display: 'block', color: 'var(--clr-correct)', marginBottom: '4px' }}>Success</strong>
              <p style={{ margin: 0, fontSize: '0.98rem' }}>{feedbackText}</p>
            </div>
          )}

          {allInspectedCorrectly && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ color: 'var(--clr-correct)', fontWeight: 'bold', marginBottom: '12px' }}>
                Excellent detective work! All objects have been verified.
              </p>
              <button onClick={handleNextStep} style={{ padding: '12px 32px', fontSize: '1.05rem' }}>
                Next: Comparison →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison */}
      {subStep === 'comparison' && (
        <div>
          {/* Side-by-side Cards */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Matrix Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  MATRIX
                </h3>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
                  <div className="matrix-bracket">
                    2 &nbsp; 3<br />1 &nbsp; 4
                  </div>
                </div>

                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.98rem', lineHeight: '1.6' }}>
                  <li>Arrangement of numbers in rows and columns.</li>
                  <li>Can be square ($2 \times 2$) or rectangular ($3 \times 2$).</li>
                  <li>Written inside square brackets $[ ]$ or parentheses $( )$.</li>
                </ul>
              </div>

              <div style={{
                background: 'rgba(232, 134, 74, 0.08)',
                padding: '8px 12px',
                borderRadius: '6px',
                borderLeft: '4px solid var(--clr-accent)',
                marginTop: '16px',
                fontSize: '0.95rem',
                lineHeight: '1.4'
              }}>
                <strong>Key Rule:</strong> A matrix is a grid; it has no single value.
              </div>
            </div>

            {/* Determinant Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 300px',
              maxWidth: '340px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  DETERMINANT
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', margin: '14px 0' }}>
                  <div className="determinant-bars">
                    2 &nbsp; 3<br />1 &nbsp; 4
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>→</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--clr-correct)' }}>5</span>
                </div>

                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.98rem', lineHeight: '1.6' }}>
                  <li>A single scalar value calculated from a matrix.</li>
                  <li>Exists only for square matrices.</li>
                  <li>Written inside straight vertical bars $| |$.</li>
                </ul>
              </div>

              <div style={{
                background: 'rgba(92, 184, 122, 0.1)',
                padding: '8px 12px',
                borderRadius: '6px',
                borderLeft: '4px solid var(--clr-correct)',
                marginTop: '16px',
                fontSize: '0.95rem',
                lineHeight: '1.4'
              }}>
                <strong>Key Rule:</strong> Only square matrices have determinants.
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>
              A determinant is not a matrix. It is a single calculated number.
            </p>
          </div>

          {/* Decision Rule Flowchart Cards */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Am I looking at...</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
              <div style={{ background: 'var(--clr-card)', padding: '14px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', minWidth: '220px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>The arrangement of numbers?</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--clr-accent)', display: 'block', margin: '6px 0' }}>MATRIX</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '14px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', minWidth: '220px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>The value obtained after calculation?</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--clr-correct)', display: 'block', margin: '6px 0' }}>DETERMINANT</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Recognition</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.25rem', color: 'var(--clr-text)', marginBottom: '16px', fontWeight: '500' }}>
              What is shown here?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div className="matrix-bracket" style={{ fontSize: '1.3rem', padding: '8px 16px' }}>
                3 &nbsp; 2<br />1 &nbsp; 4
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'matrix', label: 'Matrix' },
                { id: 'determinant', label: 'Determinant' }
              ].map(opt => {
                const isSelected = selectedQ1Option === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleQ1Select(opt.id)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 Square Matrix Challenge */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Square Matrix Challenge</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '8px', fontWeight: '500' }}>
              Tap every matrix dimension size that can have a determinant:
            </p>
            <p style={{ color: 'var(--clr-text-soft)', fontSize: '0.95rem', marginBottom: '20px' }}>
              You may select multiple cards before submitting your selection.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {['2x2', '3x2', '4x4', '1x3'].map((dim) => {
                const isSelected = tappedDimensions[dim];

                const getCardStyle = () => {
                  const correctMap = {
                    '2x2': true,
                    '3x2': false,
                    '4x4': true,
                    '1x3': false
                  };
                  const isCorrect = correctMap[dim];

                  if (q2Answer !== null) {
                    if (isSelected && isCorrect) {
                      return {
                        background: 'rgba(92, 184, 122, 0.15)',
                        color: 'var(--clr-correct)',
                        border: '2px solid var(--clr-correct)',
                        fontWeight: '600'
                      };
                    } else if (isSelected && !isCorrect) {
                      return {
                        background: 'rgba(235, 94, 85, 0.15)',
                        color: 'var(--clr-wrong)',
                        border: '2px solid var(--clr-wrong)',
                        fontWeight: '600'
                      };
                    } else if (!isSelected && isCorrect) {
                      return {
                        background: 'var(--clr-surface)',
                        color: 'var(--clr-correct)',
                        border: '2px dashed var(--clr-correct)',
                        opacity: 0.85
                      };
                    } else {
                      return {
                        background: 'var(--clr-surface)',
                        color: 'var(--clr-text-soft)',
                        border: '1.5px solid var(--clr-border)',
                        opacity: 0.5
                      };
                    }
                  } else {
                    return {
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      border: isSelected ? '1.5px solid var(--clr-accent)' : '1.5px solid var(--clr-border)',
                      cursor: 'pointer'
                    };
                  }
                };

                return (
                  <div
                    key={dim}
                    onClick={() => toggleDimension(dim)}
                    style={{
                      padding: '20px',
                      borderRadius: '8px',
                      textAlign: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                      ...getCardStyle()
                    }}
                  >
                    {dim.replace('x', ' × ')}
                  </div>
                );
              })}
            </div>

            {q2Answer === null && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                <button
                  onClick={checkQ2Selection}
                  style={{ padding: '12px 32px', fontSize: '1.05rem' }}
                >
                  Submit Selection
                </button>
              </div>
            )}
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MeanMedianModeChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, r3, comparison, q1, q2
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Round 2 Outlier transition state
  const [r2Transitioned, setR2Transitioned] = useState(false);

  // Layer 3
  const [q1Answer, setQ1Answer] = useState(null);
  const [q2Answer, setQ2Answer] = useState(null);

  // Trigger outlier slide transition in Round 2
  useEffect(() => {
    if (subStep === 'r2') {
      const timer = setTimeout(() => {
        setR2Transitioned(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setR2Transitioned(false);
    }
  }, [subStep]);

  // Reset answer states on substep changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setQ1Answer(null);
    setQ2Answer(null);
  }, [subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('r3');
    else if (subStep === 'r3') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleR1Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'mean') {
      setAnswerState('correct');
      setFeedbackText("Correct! Since the scores are balanced with no extreme values (outliers), the Mean (74) provides the best overall representative average of the class.");
    } else {
      setAnswerState('wrong');
      setHintText("While Median (75) is also close, Mean is the most mathematically standard representative for symmetrical data without outliers.");
    }
  };

  const handleR2Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'median') {
      setAnswerState('correct');
      setFeedbackText("Correct! The outlier (100) pulls the Mean up to 78.6 (higher than 4 out of 5 students!). The Median stays at 75, which is far more representative of the typical score.");
    } else {
      setAnswerState('wrong');
      setHintText("Notice how the single outlier (100) drags the Mean up to 78.6, which is higher than almost the entire class. The Mean is distorted by outliers!");
    }
  };

  const handleR3Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'mode') {
      setAnswerState('correct');
      setFeedbackText("Correct! The Mode (size 7) represents the most common size sold. A store needs to stock what sells most frequently.");
    } else {
      setAnswerState('wrong');
      setHintText("The shop cannot restock a decimal size (like Mean = 7.4). For inventory and categories, the Mode is the only logical choice.");
    }
  };

  const handleQ1Select = (opt) => {
    if (q1Answer !== null) return;
    if (opt === 'mean') {
      setQ1Answer('correct');
      setFeedbackText("Correct! Since the values 12, 14, 15, 17, 18 are closely clustered with no extreme values, the Mean represents the center of the dataset best.");
    } else {
      setQ1Answer('wrong');
      setFeedbackText("Incorrect. For balanced datasets without outliers, the Mean is the standard statistical average.");
    }
  };

  const handleQ2Select = (opt) => {
    if (q2Answer !== null) return;
    if (opt === 'median') {
      setQ2Answer('correct');
      setFeedbackText("Correct! The extreme outlier (90) pulls the Mean up significantly, but the Median remains completely unaffected at 15.");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Incorrect. The Mean is heavily affected by the outlier 90 (it increases the sum of all values significantly). The Median remains resistant because it only depends on the middle position.");
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <style>{`
        .balance-beam {
          height: 14px;
          background: #9ca3af;
          border-radius: 8px;
          position: relative;
          width: 88%;
          margin: 50px auto 10px auto;
          transition: transform 0.4s ease;
        }
        .pivot {
          width: 0;
          height: 0;
          border-left: 26px solid transparent;
          border-right: 26px solid transparent;
          border-bottom: 36px solid var(--clr-accent);
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }
        .score-weight {
          position: absolute;
          width: 36px;
          height: 36px;
          background: var(--clr-accent);
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 700;
          bottom: 14px;
          transform: translateX(-50%);
          box-shadow: var(--shadow-btn);
          transition: left 0.8s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .indicator-line {
          position: absolute;
          width: 4px;
          height: 40px;
          bottom: 0px;
          transform: translateX(-50%);
        }
      `}</style>

      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Mean vs Median vs Mode
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Representative Detective
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '480px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Mean</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>The mathematical balance point. The sum of all values divided by count.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '480px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Median</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>The middle position. Arranges scores in order and finds the exact center.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '480px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: '#4ba3e3', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Mode</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>The popularity winner. The value that appears most frequently.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Outliers change the metrics dramatically. Let's start the detective rounds and see them in action!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Discovery</button>
        </div>
      )}

      {/* Round 1: Balanced Scores */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '520px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 1: The Typical Student
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Five student scores: <strong>68, 72, 75, 77, 78</strong>.
              <br />
              If you had to describe a "typical" student's score, which representative would you choose?
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', position: 'relative', marginBottom: '24px', minHeight: '160px', overflow: 'hidden' }}>
            <div className="balance-beam" style={{
              transform: selectedOption === 'mean' ? 'rotate(0deg)' : selectedOption === 'median' ? 'rotate(-2deg)' : 'rotate(0deg)'
            }}>
              {/* Plotting points (percentages map values from 60 to 90) */}
              <div className="score-weight" style={{ left: '26%' }}>68</div>
              <div className="score-weight" style={{ left: '40%' }}>72</div>
              <div className="score-weight" style={{ left: '50%' }}>75</div>
              <div className="score-weight" style={{ left: '56%' }}>77</div>
              <div className="score-weight" style={{ left: '60%' }}>78</div>

              {/* Mean marker line (74 -> 46%) */}
              {selectedOption === 'mean' && (
                <div className="indicator-line" style={{ background: 'var(--clr-correct)', left: '46%', width: '4px', height: '65px', bottom: '-10px' }}>
                  <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--clr-correct)', background: 'var(--clr-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--clr-correct)' }}>
                    Mean (74.8)
                  </span>
                </div>
              )}
              {/* Median marker line (75 -> 50%) */}
              {selectedOption === 'median' && (
                <div className="indicator-line" style={{ background: 'var(--clr-accent)', left: '50%', width: '4px', height: '65px', bottom: '-10px' }}>
                  <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--clr-accent)', background: 'var(--clr-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--clr-accent)' }}>
                    Median (75)
                  </span>
                </div>
              )}
            </div>
            <div className="pivot" style={{
              left: selectedOption === 'median' ? '4%' : '0%'
            }} />
            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--clr-text-soft)' }}>
              Scores balance beam (pivot placed at balance point)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR1Submit('mean')} className={selectedOption === 'mean' ? 'primary' : 'secondary'} style={{ padding: '10px 20px' }}>Mean (74.8)</button>
            <button onClick={() => handleR1Submit('median')} className={selectedOption === 'median' ? 'primary' : 'secondary'} style={{ padding: '10px 20px' }}>Median (75)</button>
            <button onClick={() => handleR1Submit('mode')} className={selectedOption === 'mode' ? 'primary' : 'secondary'} style={{ padding: '10px 20px' }}>Mode (None)</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next Round</button>
            </div>
          )}
        </div>
      )}

      {/* Round 2: Outlier Animation */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '520px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 2: The Outlier
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              One student scored 100! The scores are now: <strong>68, 72, 75, 78, 100</strong>.
              <br />
              Has the class suddenly become much better? Which representative is now more reliable?
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', position: 'relative', marginBottom: '24px', minHeight: '160px', overflow: 'hidden' }}>
            <div className="balance-beam" style={{
              transform: selectedOption === 'mean' ? 'rotate(5deg)' : selectedOption === 'median' ? 'rotate(0deg)' : 'rotate(2deg)'
            }}>
              {/* Static weights */}
              <div className="score-weight" style={{ left: '26%' }}>68</div>
              <div className="score-weight" style={{ left: '40%' }}>72</div>
              <div className="score-weight" style={{ left: '50%' }}>75</div>
              <div className="score-weight" style={{ left: '60%' }}>78</div>

              {/* Outlier slides from original 77 (56%) to 100 (90%) */}
              <div className="score-weight" style={{
                left: r2Transitioned ? '90%' : '56%',
                background: 'var(--clr-wrong)',
                transition: 'left 1.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}>100</div>

              {/* Mean marker line (78.6 -> 61%) */}
              <div className="indicator-line" style={{
                background: 'var(--clr-wrong)',
                left: '61%',
                width: '4px',
                height: '65px',
                bottom: '-10px',
                opacity: selectedOption === 'mean' ? 1 : 0.45
              }}>
                <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--clr-wrong)', background: 'var(--clr-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--clr-wrong)', opacity: selectedOption === 'mean' ? 1 : 0.7 }}>
                  Mean (78.6)
                </span>
              </div>

              {/* Median marker line (75 -> 50%) */}
              <div className="indicator-line" style={{
                background: 'var(--clr-correct)',
                left: '50%',
                width: '4px',
                height: '65px',
                bottom: '-10px',
                opacity: selectedOption === 'median' ? 1 : 0.45
              }}>
                <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--clr-correct)', background: 'var(--clr-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--clr-correct)', opacity: selectedOption === 'median' ? 1 : 0.7 }}>
                  Median (75)
                </span>
              </div>
            </div>
            <div className="pivot" style={{
              left: selectedOption === 'mean' ? '11%' : '0%'
            }} />
            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--clr-text-soft)' }}>
              Blue marker = Median (75), Red marker = Mean (78.6). The Mean was pulled far to the right!
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR2Submit('mean')} className={selectedOption === 'mean' ? 'primary' : 'secondary'} style={{ padding: '10px 20px' }}>Mean (78.6)</button>
            <button onClick={() => handleR2Submit('median')} className={selectedOption === 'median' ? 'primary' : 'secondary'} style={{ padding: '10px 20px' }}>Median (75)</button>
            <button onClick={() => handleR2Submit('mode')} className={selectedOption === 'mode' ? 'primary' : 'secondary'} style={{ padding: '10px 20px' }}>Mode (None)</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next Round</button>
            </div>
          )}
        </div>
      )}

      {/* Round 3: Category / Mode Popularity */}
      {subStep === 'r3' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '520px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 3: Most Popular
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              A shoe shop sold sizes: <strong>6, 7, 7, 7, 8, 8, 9</strong>.
              <br />
              Which size should the shop restock?
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', height: '140px' }}>
              {/* Size 6: 1 unit */}
              <div style={{ width: '60px', textAlign: 'center' }}>
                <div style={{ background: 'var(--clr-border)', height: '30px', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-soft)', fontSize: '0.9rem' }}>1</div>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>Size 6</div>
              </div>
              {/* Size 7: 3 units */}
              <div style={{ width: '60px', textAlign: 'center' }}>
                <div style={{
                  background: selectedOption === 'mode' ? 'var(--clr-correct)' : 'var(--clr-accent)',
                  height: '90px',
                  borderRadius: '4px 4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  boxShadow: selectedOption === 'mode' ? '0 0 10px var(--clr-correct)' : 'none',
                  transition: 'all 0.3s ease'
                }}>3</div>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>Size 7</div>
              </div>
              {/* Size 8: 2 units */}
              <div style={{ width: '60px', textAlign: 'center' }}>
                <div style={{ background: 'var(--clr-border)', height: '60px', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-soft)', fontSize: '0.9rem' }}>2</div>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>Size 8</div>
              </div>
              {/* Size 9: 1 unit */}
              <div style={{ width: '60px', textAlign: 'center' }}>
                <div style={{ background: 'var(--clr-border)', height: '30px', borderRadius: '4px 4px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-soft)', fontSize: '0.9rem' }}>1</div>
                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>Size 9</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR3Submit('mean')} className={selectedOption === 'mean' ? 'primary' : 'secondary'} style={{ padding: '10px 20px' }}>Mean (7.4)</button>
            <button onClick={() => handleR3Submit('median')} className={selectedOption === 'median' ? 'primary' : 'secondary'} style={{ padding: '10px 20px' }}>Median (7)</button>
            <button onClick={() => handleR3Submit('mode')} className={selectedOption === 'mode' ? 'primary' : 'secondary'} style={{ padding: '10px 20px' }}>Mode (7)</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Comparison →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison Cards */}
      {subStep === 'comparison' && (
        <div>
          {/* 3-Column Comparison Layout */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Mean Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 260px',
              maxWidth: '280px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  MEAN
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  <li>Mathematical average (Sum / Count).</li>
                  <li>Uses every data point.</li>
                  <li>Easily skewed by extreme values (outliers).</li>
                </ul>
              </div>
            </div>

            {/* Median Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 260px',
              maxWidth: '280px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  MEDIAN
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  <li>Exact middle value when sorted.</li>
                  <li>Based on order/position only.</li>
                  <li>Highly stable against outliers.</li>
                </ul>
              </div>
            </div>

            {/* Mode Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid #4ba3e3',
              flex: '1 1 260px',
              maxWidth: '280px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: '#4ba3e3' }}>
                  MODE
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  <li>Most frequent value(s).</li>
                  <li>Depends entirely on occurrences.</li>
                  <li>Works for non-numerical categories.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5' }}>
              The Mean is not always the best average. Outliers skew it easily, where the Median remains far more stable and representative.
            </p>
          </div>

          {/* Decision Rule Flowchart Cards */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Am I looking for...</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)', lineHeight: '1.4' }}>The overall mathematical average?</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--clr-accent)', display: 'block', marginTop: '10px' }}>MEAN</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)', lineHeight: '1.4' }}>The exact middle value (resistant to outliers)?</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--clr-correct)', display: 'block', marginTop: '10px' }}>MEDIAN</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--clr-text-soft)', lineHeight: '1.4' }}>The most common popularity selection?</span>
                <strong style={{ fontSize: '1.2rem', color: '#4ba3e3', display: 'block', marginTop: '10px' }}>MODE</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Balanced Dataset</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
              Dataset: <strong>12, 14, 15, 17, 18</strong>
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              Which measure best represents the data?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'mean', label: 'Mean' },
                { id: 'median', label: 'Median' },
                { id: 'mode', label: 'Mode' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ1Select(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Outlier resistance</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
              Dataset: <strong>12, 14, 15, 17, 90</strong>
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              Which measure is least affected by the unusually high value (90)?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'mean', label: 'Mean' },
                { id: 'median', label: 'Median' },
                { id: 'mode', label: 'Mode' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ2Select(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q2Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LimitsDifferentiationChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, r3, comparison, q1, q2
  const [pointX, setPointX] = useState(150);
  const [selectedTool, setSelectedTool] = useState(null); // magnifying, tangent
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Round 3 sub-scenarios
  const [r3Scenario, setR3Scenario] = useState('A'); // A, B
  const [r3AAnswer, setR3AAnswer] = useState(null);
  const [r3BAnswer, setR3BAnswer] = useState(null);

  // Layer 3
  const [q1Answer, setQ1Answer] = useState(null);

  // Sorting game state for Q2
  const [sortDeck, setSortDeck] = useState([
    { id: 'car_speed', text: 'Instantaneous speed of a car', category: 'differentiation' },
    { id: 'curve_slope', text: 'Slope of a curve', category: 'differentiation' },
    { id: 'hole_graph', text: 'Behaviour near a hole in a graph', category: 'limits' },
    { id: 'discontinuity', text: 'Value approached near a discontinuity', category: 'limits' }
  ]);
  const [activeSortIndex, setActiveSortIndex] = useState(0);
  const [sortedItems, setSortedItems] = useState({ limits: [], differentiation: [] });
  const [sortingFinished, setSortingFinished] = useState(false);

  // Math function for the graph: y = 200 - 0.0018 * (x - 250)^2
  const getGraphY = (x) => {
    return 200 - 0.0018 * Math.pow(x - 250, 2);
  };

  const getGraphSlope = (x) => {
    // dy/dx = -0.0036 * (x - 250)
    return -0.0036 * (x - 250);
  };

  // Reset states on subStep changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setQ1Answer(null);
    if (subStep === 'r1') {
      setSelectedTool('magnifying');
      setPointX(150);
    } else if (subStep === 'r2') {
      setSelectedTool('tangent');
      setPointX(150);
    }
  }, [subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('r3');
    else if (subStep === 'r3') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleR1Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'value') {
      setAnswerState('correct');
      setFeedbackText("Great job! Even though there is a hole at x = 250, as you move point P closer to 250, you are investigating what height (y-value) the curve approaches. This is a Limit!");
    } else {
      setAnswerState('wrong');
      setHintText("Notice how the graph zooms in on the height. We want to know where the point is heading, not how steep it is.");
    }
  };

  const handleR2Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'slope') {
      setAnswerState('correct');
      setFeedbackText("Correct! The Tangent Ruler measures the exact steepness or slope at that specific point. This is Differentiation!");
    } else {
      setAnswerState('wrong');
      setHintText("The tangent line tilts to match the steepness of the curve at that instant, which shows the rate of change.");
    }
  };

  const handleR3ASubmit = (tool) => {
    if (tool === 'magnifying') {
      setR3AAnswer('correct');
    } else {
      setR3AAnswer('wrong');
    }
  };

  const handleR3BSubmit = (tool) => {
    if (tool === 'tangent') {
      setR3BAnswer('correct');
    } else {
      setR3BAnswer('wrong');
    }
  };

  const handleQ1Submit = (opt) => {
    if (q1Answer !== null) return;
    if (opt === 'differentiation') {
      setQ1Answer('correct');
      setFeedbackText("Correct! Instantaneous velocity represents the rate of change of distance with respect to time at one single instant, which is found using Differentiation.");
    } else {
      setQ1Answer('wrong');
      setFeedbackText("Incorrect. Velocity is a rate of change, which is the definition of Differentiation.");
    }
  };

  const handleSortItem = (bucket) => {
    const activeCard = sortDeck[activeSortIndex];
    const isCorrect = activeCard.category === bucket;

    if (bucket === 'limits') {
      setSortedItems(prev => ({
        ...prev,
        limits: [...prev.limits, { ...activeCard, status: isCorrect ? 'correct' : 'wrong' }]
      }));
    } else {
      setSortedItems(prev => ({
        ...prev,
        differentiation: [...prev.differentiation, { ...activeCard, status: isCorrect ? 'correct' : 'wrong' }]
      }));
    }

    if (activeSortIndex < sortDeck.length - 1) {
      setActiveSortIndex(activeSortIndex + 1);
    } else {
      setSortingFinished(true);
    }
  };

  // Calculate dynamic camera viewBox zoom near the hole at x = 250, y = 200
  const dist = Math.abs(pointX - 250);
  let viewBoxVal = "0 0 500 300";
  if (subStep === 'r1' && dist < 80) {
    const ratio = (80 - dist) / 80; // 0 to 1
    const minX = 0 + ratio * 180;
    const minY = 0 + ratio * 130;
    const w = 500 - ratio * 360;
    const h = 300 - ratio * 210;
    viewBoxVal = `${minX} ${minY} ${w} ${h}`;
  }

  const currentY = getGraphY(pointX);
  const currentSlope = getGraphSlope(pointX);

  // Tangent line values
  const tLength = 50;
  const tx1 = pointX - tLength;
  const ty1 = currentY - tLength * currentSlope;
  const tx2 = pointX + tLength;
  const ty2 = currentY + tLength * currentSlope;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Limits vs Differentiation
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Explore the Curve
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Limits</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>"Where is the function heading?" Investigates the height a curve approaches near a point, even if the point is missing.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Differentiation</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>"How fast is it changing right now?" Measures the exact instantaneous slope or rate of change at a specific point.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Let's interact with a live calculus curve to discover the difference visually!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Discovery</button>
        </div>
      )}

      {/* Round 1: Magnifying Glass (Limits) */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 1: Magnifying Glass
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Drag point <strong>P</strong> closer to <strong>x = 250</strong> using the slider.
              Observe how the magnifying lens automatically zooms in on the discontinuous gap (hole) as you approach.
            </p>
          </div>

          {/* Interactive Graph Box */}
          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg
              width="100%"
              height="280"
              viewBox="0 0 500 300"
              style={{
                maxWidth: '500px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: '8px',
                background: 'var(--clr-card)'
              }}
            >
              <defs>
                <clipPath id="lens-clip">
                  <circle cx="250" cy="200" r="42" />
                </clipPath>
              </defs>

              {/* Grid Lines */}
              <line x1="50" y1="0" x2="50" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="150" y1="0" x2="150" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="250" y1="0" x2="250" y2="300" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <line x1="350" y1="0" x2="350" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="450" y1="0" x2="450" y2="300" stroke="rgba(255,255,255,0.05)" />

              <line x1="0" y1="200" x2="500" y2="200" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />

              {/* Curve path with a visual hole at x = 250 */}
              <path
                d={`M 100,${getGraphY(100)} Q 250,240.5 400,${getGraphY(400)}`}
                fill="none"
                stroke="var(--clr-text-soft)"
                strokeWidth="4"
              />

              {/* Target Hole at x=250 */}
              <circle cx="250" cy="200" r="6" fill="var(--clr-card)" stroke="var(--clr-wrong)" strokeWidth="3" />

              {/* Dynamic Magnifying Lens Zoom Overlay (Fades in and scales as P approaches) */}
              {dist < 80 && (
                <g style={{ opacity: (80 - dist) / 80 }}>
                  <g clipPath="url(#lens-clip)">
                    {/* Background rectangle inside lens */}
                    <rect x="200" y="150" width="100" height="100" fill="var(--clr-card)" opacity="0.95" />
                    {/* Zoomed curve path */}
                    <path
                      d={`M 100,${getGraphY(100)} Q 250,240.5 400,${getGraphY(400)}`}
                      fill="none"
                      stroke="var(--clr-accent)"
                      strokeWidth={4 + ((80 - dist) / 80) * 3}
                      transform={`translate(250, 200) scale(${1.0 + ((80 - dist) / 80) * 1.2}) translate(-250, -200)`}
                    />
                    {/* Zoomed hole */}
                    <circle
                      cx="250"
                      cy="200"
                      r={6}
                      fill="var(--clr-card)"
                      stroke="var(--clr-wrong)"
                      strokeWidth={3 + ((80 - dist) / 80) * 2}
                      transform={`translate(250, 200) scale(${1.0 + ((80 - dist) / 80) * 1.2}) translate(-250, -200)`}
                    />
                  </g>
                  {/* Lens Frame & Handle */}
                  <circle cx="250" cy="200" r="42" fill="none" stroke="var(--clr-accent)" strokeWidth="3.5" />
                  <line x1="280" y1="230" x2="305" y2="255" stroke="var(--clr-accent)" strokeWidth="6" strokeLinecap="round" />
                </g>
              )}

              {/* Label drawn below the curve to prevent overlapping with point label */}
              <text x="250" y="260" fill="var(--clr-wrong)" fontSize="12" fontWeight="bold" textAnchor="middle">Discontinuity (Hole)</text>

              {/* Normal Point P drawn on top of the lens so it stays crisp */}
              <circle cx={pointX} cy={currentY} r="8" fill="var(--clr-accent)" />
              <text x={pointX} y={currentY - 16} fill="var(--clr-accent)" fontSize="13" fontWeight="bold" textAnchor="middle">P</text>
            </svg>

            {/* Slider */}
            <div style={{ width: '100%', maxWidth: '400px', marginTop: '20px', position: 'relative' }}>
              <div style={{ position: 'relative', height: '20px', marginBottom: '4px' }}>
                <span style={{
                  position: 'absolute',
                  left: `${((pointX - 100) / 300) * 100}%`,
                  transform: 'translateX(-50%)',
                  fontWeight: 'bold',
                  color: 'var(--clr-accent)',
                  fontSize: '0.9rem'
                }}>
                  x = {pointX}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                value={pointX}
                onChange={(e) => setPointX(parseInt(e.target.value))}
                style={{ width: '100%', margin: 0 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.8rem', color: 'var(--clr-text-soft)' }}>
                <span>x = 100</span>
                <span>x = 400</span>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', marginTop: '12px' }}>
              Point position: ({pointX}, {currentY.toFixed(0)}) | Distance to hole: {dist.toFixed(0)}px
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            What is the Magnifying Glass investigating as you approach the hole?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR1Submit('value')} className={selectedOption === 'value' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>The height value the function approaches</button>
            <button onClick={() => handleR1Submit('slope')} className={selectedOption === 'slope' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>How steep the graph is at that point</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Tangent Ruler →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 2: Tangent Ruler (Differentiation) */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 2: Tangent Ruler
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Drag point <strong>P</strong> along the curve. Observe how the tangent ruler tilts to match the slope at each instant.
            </p>
          </div>

          {/* Interactive Graph Box */}
          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg
              width="100%"
              height="280"
              viewBox="0 0 500 300"
              style={{
                maxWidth: '500px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: '8px',
                background: 'var(--clr-card)'
              }}
            >
              {/* Grid Lines */}
              <line x1="50" y1="0" x2="50" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="150" y1="0" x2="150" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="250" y1="0" x2="250" y2="300" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <line x1="350" y1="0" x2="350" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="450" y1="0" x2="450" y2="300" stroke="rgba(255,255,255,0.05)" />

              {/* Continuous curve path (no hole) */}
              <path
                d={`M 100,${getGraphY(100)} Q 250,240.5 400,${getGraphY(400)}`}
                fill="none"
                stroke="var(--clr-text-soft)"
                strokeWidth="4"
              />

              {/* Tangent Line - drawn on top of the curve for perfect visibility */}
              <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />

              {/* Current Point P */}
              <circle cx={pointX} cy={currentY} r="8" fill="var(--clr-accent)" />
              <text x={pointX} y={currentY - 16} fill="var(--clr-accent)" fontSize="14" fontWeight="bold" textAnchor="middle">P</text>
            </svg>

            {/* Slider */}
            <div style={{ width: '100%', maxWidth: '400px', marginTop: '20px', position: 'relative' }}>
              <div style={{ position: 'relative', height: '20px', marginBottom: '4px' }}>
                <span style={{
                  position: 'absolute',
                  left: `${((pointX - 100) / 300) * 100}%`,
                  transform: 'translateX(-50%)',
                  fontWeight: 'bold',
                  color: 'var(--clr-accent)',
                  fontSize: '0.9rem'
                }}>
                  x = {pointX}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                value={pointX}
                onChange={(e) => setPointX(parseInt(e.target.value))}
                style={{ width: '100%', margin: 0 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.8rem', color: 'var(--clr-text-soft)' }}>
                <span>x = 100</span>
                <span>x = 400</span>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--clr-correct)', fontWeight: 'bold', marginTop: '12px' }}>
              Slope (dy/dx) = {currentSlope.toFixed(2)} | Steepness: {Math.abs(currentSlope) < 0.1 ? 'Flat (0)' : currentSlope > 0 ? 'Rising (+)' : 'Falling (-)'}
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            What is the Tangent Ruler investigating as you drag it along the curve?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR2Submit('value')} className={selectedOption === 'value' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>The height value the function approaches</button>
            <button onClick={() => handleR2Submit('slope')} className={selectedOption === 'slope' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>The steepness (instant rate of change)</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Scenarios →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 3: Mini Scenarios */}
      {subStep === 'r3' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 24px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 3: Which Tool Would You Use?
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Select the correct tool (Magnifying Glass = Limit, Tangent Ruler = Differentiation) for each situation below.
            </p>
          </div>

          {/* Scenario A */}
          <div style={{ background: 'var(--clr-surface)', border: '1.5px solid var(--clr-border)', borderRadius: '12px', padding: '24px', marginBottom: '20px', textAlign: 'left', maxWidth: '560px', margin: '0 auto 20px auto' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scenario A</span>
            <h4 style={{ margin: '4px 0 12px 0', fontSize: '1.15rem' }}>A graph has a hole. You want to know what value the graph approaches near the hole.</h4>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                onClick={() => handleR3ASubmit('magnifying')}
                className={r3AAnswer === 'correct' ? 'primary' : 'secondary'}
                disabled={r3AAnswer === 'correct'}
                style={{ padding: '10px 16px', fontSize: '0.95rem' }}
              >
                🔍 Magnifying Glass (Limit)
              </button>
              <button
                onClick={() => handleR3ASubmit('tangent')}
                className={r3AAnswer === 'wrong' ? 'wrong' : 'secondary'}
                disabled={r3AAnswer === 'correct'}
                style={{ padding: '10px 16px', fontSize: '0.95rem' }}
              >
                📐 Tangent Ruler (Differentiation)
              </button>
            </div>
            {r3AAnswer === 'correct' && (
              <span style={{ color: 'var(--clr-correct)', fontWeight: 'bold', display: 'block', marginTop: '12px', fontSize: '0.9rem' }}>✓ Correct! We look near the hole to find the limit.</span>
            )}
            {r3AAnswer === 'wrong' && (
              <span style={{ color: 'var(--clr-wrong)', fontWeight: 'bold', display: 'block', marginTop: '12px', fontSize: '0.9rem' }}>Incorrect. Try again! Limits find values near discontinuities.</span>
            )}
          </div>

          {/* Scenario B */}
          {r3AAnswer === 'correct' && (
            <div style={{ background: 'var(--clr-surface)', border: '1.5px solid var(--clr-border)', borderRadius: '12px', padding: '24px', marginBottom: '20px', textAlign: 'left', maxWidth: '560px', margin: '20px auto' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scenario B</span>
              <h4 style={{ margin: '4px 0 12px 0', fontSize: '1.15rem' }}>A cyclist's distance-time graph is shown. You want to know how fast the cyclist is moving at one instant.</h4>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => handleR3BSubmit('magnifying')}
                  className={r3BAnswer === 'wrong' ? 'wrong' : 'secondary'}
                  disabled={r3BAnswer === 'correct'}
                  style={{ padding: '10px 16px', fontSize: '0.95rem' }}
                >
                  🔍 Magnifying Glass (Limit)
                </button>
                <button
                  onClick={() => handleR3BSubmit('tangent')}
                  className={r3BAnswer === 'correct' ? 'primary' : 'secondary'}
                  disabled={r3BAnswer === 'correct'}
                  style={{ padding: '10px 16px', fontSize: '0.95rem' }}
                >
                  📐 Tangent Ruler (Differentiation)
                </button>
              </div>
              {r3BAnswer === 'correct' && (
                <span style={{ color: 'var(--clr-correct)', fontWeight: 'bold', display: 'block', marginTop: '12px', fontSize: '0.9rem' }}>✓ Correct! Instantaneous rate of speed is found via differentiation.</span>
              )}
              {r3BAnswer === 'wrong' && (
                <span style={{ color: 'var(--clr-wrong)', fontWeight: 'bold', display: 'block', marginTop: '12px', fontSize: '0.9rem' }}>Incorrect. Try again! Tangents measure instant speed rate.</span>
              )}
            </div>
          )}

          {r3AAnswer === 'correct' && r3BAnswer === 'correct' && (
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem', marginTop: '12px' }}>Next: Comparison →</button>
          )}
        </div>
      )}

      {/* Layer 2: Comparison Cards */}
      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Limits Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  🔍 LIMITS
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Value a function approaches near a target input.</li>
                  <li>Ignores the value exactly at the point.</li>
                  <li>Inquiry: "Where is this curve heading?"</li>
                </ul>
              </div>
            </div>

            {/* Differentiation Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  📐 DIFFERENTIATION
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Rate of change / tangent slope of a curve.</li>
                  <li>Focuses exactly at a specific point.</li>
                  <li>Inquiry: "How fast is this curve changing?"</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
              A Limit finds the curve's target height destination. A Derivative calculates the slope (steepness) at that height.
            </p>
          </div>

          {/* Decision Rule Flowchart Cards */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '1.05rem' }}>Am I trying to investigate...</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '16px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', lineHeight: '1.4' }}>Where the graph height is heading?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-accent)', display: 'block', marginTop: '12px' }}>🔍 LIMIT</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', lineHeight: '1.4' }}>How fast the graph is changing (steepness)?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)', display: 'block', marginTop: '12px' }}>📐 DIFFERENTIATION</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Instantaneous Rates</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
              A ball is thrown upward. You want to know its instantaneous velocity after 2 seconds.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              Which concept should you choose?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'limit', label: 'Limit' },
                { id: 'differentiation', label: 'Differentiation' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ1Submit(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 Sorter */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Situation Matcher</p>

          <div style={{
            background: 'var(--clr-surface)',
            border: '1.5px solid var(--clr-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            {!sortingFinished ? (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Situation Card ({activeSortIndex + 1} / {sortDeck.length})
                </span>
                <div style={{
                  background: 'var(--clr-card)',
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--clr-border)',
                  fontSize: '1.15rem',
                  fontWeight: '500',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-btn)',
                  maxWidth: '440px',
                  width: '100%',
                  marginBottom: '20px',
                  color: 'var(--clr-accent)'
                }}>
                  {sortDeck[activeSortIndex].text}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => handleSortItem('limits')} style={{ padding: '10px 20px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-accent)' }}>
                    Sort to: 🔍 Limit
                  </button>
                  <button onClick={() => handleSortItem('differentiation')} style={{ padding: '10px 20px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-correct)' }}>
                    Sort to: 📐 Differentiation
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                🎉 Matcher sorting complete! Review your placements below.
              </div>
            )}
          </div>

          {/* Sorted columns */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '24px', justifyContent: 'center' }}>
            {/* Limit Zone */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              border: '1.5px dashed var(--clr-accent)',
              flex: '1 1 260px',
              maxWidth: '340px',
              minHeight: '180px'
            }}>
              <strong style={{ display: 'block', color: 'var(--clr-accent)', fontSize: '1.1rem', marginBottom: '12px' }}>🔍 Limit Zone</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sortedItems.limits.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)',
                      borderRadius: '4px',
                      fontSize: '0.88rem',
                      borderLeft: `4px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                      textAlign: 'left'
                    }}
                  >
                    {item.text} {item.status === 'correct' ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>

            {/* Differentiation Zone */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              border: '1.5px dashed var(--clr-correct)',
              flex: '1 1 260px',
              maxWidth: '340px',
              minHeight: '180px'
            }}>
              <strong style={{ display: 'block', color: 'var(--clr-correct)', fontSize: '1.1rem', marginBottom: '12px' }}>📐 Differentiation Zone</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sortedItems.differentiation.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)',
                      borderRadius: '4px',
                      fontSize: '0.88rem',
                      borderLeft: `4px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                      textAlign: 'left'
                    }}
                  >
                    {item.text} {item.status === 'correct' ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {sortingFinished && (
            <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem', marginTop: '32px' }}>Finish Challenge</button>
          )}
        </div>
      )}
    </div>
  );
}

function DifferentiationIntegrationChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, comparison, q1, q2, q3
  const [pointX, setPointX] = useState(150);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Layer 3 MCQs
  const [q1Answer, setQ1Answer] = useState(null);
  const [q2Answer, setQ2Answer] = useState(null);

  // Sorting game state for Q3
  const [sortDeck, setSortDeck] = useState([
    { id: 'car_speed', text: 'Instantaneous speed of a car', category: 'differentiation' },
    { id: 'total_rain', text: 'Total rainfall over 24 hours', category: 'integration' },
    { id: 'curve_slope', text: 'Slope of a graph', category: 'differentiation' },
    { id: 'area_under', text: 'Total area under a curve', category: 'integration' }
  ]);
  const [activeSortIndex, setActiveSortIndex] = useState(0);
  const [sortedItems, setSortedItems] = useState({ differentiation: [], integration: [] });
  const [sortingFinished, setSortingFinished] = useState(false);

  // Math curve: y = 230 - 0.0018 * (x - 100)^2 (rising from x=100 to x=400)
  const getGraphY = (x) => {
    return 230 - 0.0018 * Math.pow(x - 100, 2);
  };

  const getGraphSlope = (x) => {
    // dy/dx = -0.0036 * (x - 100) (SVG coordinates: Y goes down, so negative slope goes visually up)
    return -0.0036 * (x - 100);
  };

  const getAreaPath = () => {
    let path = 'M 100,260'; // Baseline start
    for (let x = 100; x <= pointX; x += 5) {
      path += ` L ${x},${getGraphY(x)}`;
    }
    path += ` L ${pointX},${getGraphY(pointX)}`;
    path += ` L ${pointX},260 Z`; // Close baseline
    return path;
  };

  // Reset states on subStep changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setQ1Answer(null);
    setQ2Answer(null);
    setPointX(150);
  }, [subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
    else if (subStep === 'q2') setSubStep('q3');
  };

  const handleR1Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'slope') {
      setAnswerState('correct');
      setFeedbackText("Correct! The Slope Tool measures how steep the graph is at that point. This is Differentiation!");
    } else {
      setAnswerState('wrong');
      setHintText("The tangent line tilts to match the steepness of the curve at that specific point. It represents the rate of change.");
    }
  };

  const handleR2Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'area') {
      setAnswerState('correct');
      setFeedbackText("Correct! The Area Collector sums up all the region beneath the curve, which is the definition of Integration!");
    } else {
      setAnswerState('wrong');
      setHintText("The colored overlay spans the entire interval below the curve. It represents the accumulated sum, not the steepness.");
    }
  };

  const handleQ1Submit = (opt) => {
    if (q1Answer !== null) return;
    if (opt === 'differentiation') {
      setQ1Answer('correct');
      setFeedbackText("Correct! Speed at exactly 5 seconds represents the rate of change of position at one single instant, which is Differentiation.");
    } else {
      setQ1Answer('wrong');
      setFeedbackText("Incorrect. Velocity is a rate of change, which is found via Differentiation.");
    }
  };

  const handleQ2Submit = (opt) => {
    if (q2Answer !== null) return;
    if (opt === 'integration') {
      setQ2Answer('correct');
      setFeedbackText("Correct! Finding the total amount of water accumulated during an hour-long interval is an Integration calculation.");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Incorrect. We want the total accumulated sum of water over a period of time, which requires Integration.");
    }
  };

  const handleSortItem = (bucket) => {
    const activeCard = sortDeck[activeSortIndex];
    const isCorrect = activeCard.category === bucket;

    if (bucket === 'differentiation') {
      setSortedItems(prev => ({
        ...prev,
        differentiation: [...prev.differentiation, { ...activeCard, status: isCorrect ? 'correct' : 'wrong' }]
      }));
    } else {
      setSortedItems(prev => ({
        ...prev,
        integration: [...prev.integration, { ...activeCard, status: isCorrect ? 'correct' : 'wrong' }]
      }));
    }

    if (activeSortIndex < sortDeck.length - 1) {
      setActiveSortIndex(activeSortIndex + 1);
    } else {
      setSortingFinished(true);
    }
  };

  const currentY = getGraphY(pointX);
  const currentSlope = getGraphSlope(pointX);

  // Tangent coordinates
  const tLen = 60;
  const tx1 = pointX - tLen;
  const ty1 = currentY - tLen * currentSlope;
  const tx2 = pointX + tLen;
  const ty2 = currentY + tLen * currentSlope;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Differentiation vs Integration
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Measure or Collect?
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Differentiation</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Measures the steepness (rate of change) exactly at one specific point. Tells us "how fast" a function changes.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Integration</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Collects and accumulates the total value under a curve over an interval. Tells us "how much" has accumulated.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Let's explore the graph using both tools to see the concepts in action!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Discovery</button>
        </div>
      )}

      {/* Round 1: Slope Tool */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 1: Slope Tool (📐)
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Drag point <strong>P</strong> along the curve. Observe how the tangent ruler tilts to match the slope at each instant.
            </p>
          </div>

          {/* Interactive Graph Box */}
          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg
              width="100%"
              height="280"
              viewBox="0 0 500 300"
              style={{
                maxWidth: '500px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: '8px',
                background: 'var(--clr-card)'
              }}
            >
              {/* Grid Lines */}
              <line x1="50" y1="0" x2="50" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="150" y1="0" x2="150" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="250" y1="0" x2="250" y2="300" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <line x1="350" y1="0" x2="350" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="450" y1="0" x2="450" y2="300" stroke="rgba(255,255,255,0.05)" />

              <line x1="100" y1="260" x2="400" y2="260" stroke="var(--clr-border)" strokeWidth="2" />

              {/* Curve path */}
              <path
                d={`M 100,${getGraphY(100)} Q 250,240.5 400,${getGraphY(400)}`}
                fill="none"
                stroke="var(--clr-text-soft)"
                strokeWidth="4"
              />

              {/* Tangent Line */}
              <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="#10b981" strokeWidth="4.5" strokeLinecap="round" />

              {/* Current Point P */}
              <circle cx={pointX} cy={currentY} r="8" fill="var(--clr-accent)" />
              <text x={pointX} y={currentY - 16} fill="var(--clr-accent)" fontSize="13" fontWeight="bold" textAnchor="middle">P</text>
            </svg>

            {/* Slider */}
            <div style={{ width: '100%', maxWidth: '400px', marginTop: '20px', position: 'relative' }}>
              <div style={{ position: 'relative', height: '20px', marginBottom: '4px' }}>
                <span style={{
                  position: 'absolute',
                  left: `${((pointX - 100) / 300) * 100}%`,
                  transform: 'translateX(-50%)',
                  fontWeight: 'bold',
                  color: 'var(--clr-accent)',
                  fontSize: '0.9rem'
                }}>
                  x = {pointX}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                value={pointX}
                onChange={(e) => setPointX(parseInt(e.target.value))}
                style={{ width: '100%', margin: 0 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.8rem', color: 'var(--clr-text-soft)' }}>
                <span>x = 100</span>
                <span>x = 400</span>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--clr-correct)', fontWeight: 'bold', marginTop: '12px' }}>
              Slope (dy/dx) = {currentSlope.toFixed(2)}
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            What are you measuring using the Slope Tool?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR1Submit('slope')} className={selectedOption === 'slope' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>How steep the graph is at that point</button>
            <button onClick={() => handleR1Submit('area')} className={selectedOption === 'area' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>The total accumulated area below the graph</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Area Collector →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 2: Area Collector */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 2: Area Collector (📦)
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Drag the slider to sweep point <strong>P</strong> from left to right.
              Watch the region below the curve fill with color as the total value accumulates.
            </p>
          </div>

          {/* Interactive Graph Box */}
          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg
              width="100%"
              height="280"
              viewBox="0 0 500 300"
              style={{
                maxWidth: '500px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: '8px',
                background: 'var(--clr-card)'
              }}
            >
              {/* Grid Lines */}
              <line x1="50" y1="0" x2="50" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="150" y1="0" x2="150" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="250" y1="0" x2="250" y2="300" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
              <line x1="350" y1="0" x2="350" y2="300" stroke="rgba(255,255,255,0.05)" />
              <line x1="450" y1="0" x2="450" y2="300" stroke="rgba(255,255,255,0.05)" />

              {/* Accumulated Filled Area */}
              <path d={getAreaPath()} fill="rgba(16, 185, 129, 0.25)" />

              <line x1="100" y1="260" x2="400" y2="260" stroke="var(--clr-border)" strokeWidth="2" />

              {/* Curve path */}
              <path
                d={`M 100,${getGraphY(100)} Q 250,240.5 400,${getGraphY(400)}`}
                fill="none"
                stroke="var(--clr-text-soft)"
                strokeWidth="4"
              />

              {/* Current Point P */}
              <circle cx={pointX} cy={currentY} r="8" fill="var(--clr-accent)" />
              <text x={pointX} y={currentY - 16} fill="var(--clr-accent)" fontSize="13" fontWeight="bold" textAnchor="middle">P</text>
            </svg>

            {/* Slider */}
            <div style={{ width: '100%', maxWidth: '400px', marginTop: '20px', position: 'relative' }}>
              <div style={{ position: 'relative', height: '20px', marginBottom: '4px' }}>
                <span style={{
                  position: 'absolute',
                  left: `${((pointX - 100) / 300) * 100}%`,
                  transform: 'translateX(-50%)',
                  fontWeight: 'bold',
                  color: 'var(--clr-accent)',
                  fontSize: '0.9rem'
                }}>
                  x = {pointX}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                value={pointX}
                onChange={(e) => setPointX(parseInt(e.target.value))}
                style={{ width: '100%', margin: 0 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.8rem', color: 'var(--clr-text-soft)' }}>
                <span>x = 100</span>
                <span>x = 400</span>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--clr-correct)', fontWeight: 'bold', marginTop: '12px' }}>
              Accumulated Area under Curve = {((pointX - 100) * 0.45).toFixed(0)} units²
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            What is increasing as you sweep the point P and color the region?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR2Submit('area')} className={selectedOption === 'area' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Total accumulated area below the curve</button>
            <button onClick={() => handleR2Submit('slope')} className={selectedOption === 'slope' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>The steepness (instant rate of change)</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Comparison →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison Cards */}
      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Differentiation Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  📐 DIFFERENTIATION
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Rate of change / tangent slope of a curve.</li>
                  <li>Focuses exactly at a specific point.</li>
                  <li>Tells us "how fast" a quantity is changing.</li>
                </ul>
              </div>
            </div>

            {/* Integration Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  ∫ INTEGRATION
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Accumulated quantity / area under curve.</li>
                  <li>Focuses on behavior accumulated over an interval.</li>
                  <li>Tells us "how much" total sum has accumulated.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
              They are opposite properties: Differentiation is local (rate at one instant); Integration is cumulative (total sum over a period).
            </p>
          </div>

          {/* Decision Rule Flowchart Cards */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '1.05rem' }}>Am I trying to find...</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '16px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', lineHeight: '1.4' }}>How fast a quantity is changing right now?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-accent)', display: 'block', marginTop: '12px' }}>📐 Differentiation</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', lineHeight: '1.4' }}>How much total volume has accumulated over time?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)', display: 'block', marginTop: '12px' }}> ∫  Integration</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 3: Instantaneous Speed</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
              A car's position graph is given. You want to know its speed at exactly 5 seconds.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              Which calculus branch do you use?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'differentiation', label: 'Differentiation' },
                { id: 'integration', label: 'Integration' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ1Submit(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 3: Volume Accumulation</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
              Water flows into a tank. You want to know how much water entered during the last hour.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              Which calculus branch do you use?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'differentiation', label: 'Differentiation' },
                { id: 'integration', label: 'Integration' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ2Submit(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q2Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q3 Sorter */}
      {subStep === 'q3' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 3 of 3: Situation Matcher</p>

          <div style={{
            background: 'var(--clr-surface)',
            border: '1.5px solid var(--clr-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            {!sortingFinished ? (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Situation Card ({activeSortIndex + 1} / {sortDeck.length})
                </span>
                <div style={{
                  background: 'var(--clr-card)',
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--clr-border)',
                  fontSize: '1.15rem',
                  fontWeight: '500',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-btn)',
                  maxWidth: '440px',
                  width: '100%',
                  marginBottom: '20px',
                  color: 'var(--clr-accent)'
                }}>
                  {sortDeck[activeSortIndex].text}
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button onClick={() => handleSortItem('differentiation')} style={{ padding: '10px 20px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-accent)' }}>
                    Sort to: 📐 Differentiation
                  </button>
                  <button onClick={() => handleSortItem('integration')} style={{ padding: '10px 20px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-correct)' }}>
                    Sort to: 🪣 Integration
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                🎉 Placements complete! Review your matched situations below.
              </div>
            )}
          </div>

          {/* Sorted columns */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '24px', justifyContent: 'center' }}>
            {/* Differentiation Zone */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              border: '1.5px dashed var(--clr-accent)',
              flex: '1 1 260px',
              maxWidth: '340px',
              minHeight: '180px'
            }}>
              <strong style={{ display: 'block', color: 'var(--clr-accent)', fontSize: '1.1rem', marginBottom: '12px' }}>📐 Differentiation Zone</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sortedItems.differentiation.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)',
                      borderRadius: '4px',
                      fontSize: '0.88rem',
                      borderLeft: `4px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                      textAlign: 'left'
                    }}
                  >
                    {item.text} {item.status === 'correct' ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>

            {/* Integration Zone */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              border: '1.5px dashed var(--clr-correct)',
              flex: '1 1 260px',
              maxWidth: '340px',
              minHeight: '180px'
            }}>
              <strong style={{ display: 'block', color: 'var(--clr-correct)', fontSize: '1.1rem', marginBottom: '12px' }}>🪣 Integration Zone</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sortedItems.integration.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)',
                      borderRadius: '4px',
                      fontSize: '0.88rem',
                      borderLeft: `4px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                      textAlign: 'left'
                    }}
                  >
                    {item.text} {item.status === 'correct' ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {sortingFinished && (
            <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem', marginTop: '32px' }}>Finish Challenge</button>
          )}
        </div>
      )}
    </div>
  );
}

function DecimalsFractionsChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, r3, comparison, q1, q2
  const [activeMode, setActiveMode] = useState('fraction'); // fraction, decimal
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Layer 3 Q1 Connections Game
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]); // Array of strings like '1/2-0.5'
  const [q1Finished, setQ1Finished] = useState(false);

  // Layer 3 Q2 MCQ
  const [q2Answer, setQ2Answer] = useState(null);

  const leftOptions = ['1/2', '3/4', '1/5'];
  const rightOptions = ['0.75', '0.2', '0.5'];

  const matches = {
    '1/2': '0.5',
    '3/4': '0.75',
    '1/5': '0.2'
  };

  // Reset states on subStep changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setActiveMode('fraction');
    setSelectedLeft(null);
    setMatchedPairs([]);
    setQ1Finished(false);
    setQ2Answer(null);
  }, [subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('r3');
    else if (subStep === 'r3') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleR1Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'no') {
      setAnswerState('correct');
      setFeedbackText("Correct! The shaded portion remained exactly half of the bar. Only the notation changed from 1/2 to 0.5!");
    } else {
      setAnswerState('wrong');
      setHintText("Look closely at the chocolate bar. Did the physical quantity of chocolate change, or just the labels?");
    }
  };

  const handleR2Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'representation') {
      setAnswerState('correct');
      setFeedbackText("Correct! The amount of pie remains three-quarters. Only the mathematical representation changed from 3/4 to 0.75.");
    } else {
      setAnswerState('wrong');
      setHintText("The circular pie has the exact same shaded area in both views. What changed is how we write it.");
    }
  };

  const handleR3Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'same') {
      setAnswerState('correct');
      setFeedbackText("Correct! 1/4 and 0.25 represent the exact same mathematical value, so they describe the same point on the number line.");
    } else {
      setAnswerState('wrong');
      setHintText("A number line point represents a unique quantity. If it doesn't move, what does that say about the two values?");
    }
  };

  const handleLeftSelect = (leftVal) => {
    if (q1Finished) return;
    setSelectedLeft(leftVal);
  };

  const handleRightSelect = (rightVal) => {
    if (!selectedLeft || q1Finished) return;

    // Check match
    if (matches[selectedLeft] === rightVal) {
      const newMatched = [...matchedPairs, `${selectedLeft}-${rightVal}`];
      setMatchedPairs(newMatched);
      setSelectedLeft(null);

      if (newMatched.length === 3) {
        setQ1Finished(true);
        setAnswerState('correct');
        setFeedbackText("Excellent! All equivalent fractions and decimals matched perfectly!");
      }
    } else {
      // Incorrect match flash
      setSelectedLeft(null);
    }
  };

  const handleQ2Submit = (opt) => {
    if (q2Answer !== null) return;
    if (opt === '4/5') {
      setQ2Answer('correct');
      setFeedbackText("Correct! 0.8 represents 8/10, which simplifies to 4/5.");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Incorrect. 0.8 is equal to 8/10. Simplify this fraction to find the correct answer.");
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Decimals vs Fractions
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Representation Switch
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>🍰 Fractions</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Represent parts of a whole using a numerator and denominator (e.g., 3/4). Show divisions visually.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>🔍 Decimals</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Represent parts of a whole using place value base-10 and a decimal point (e.g., 0.75). Easy for calculations.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Let's interact with equivalent shapes and number lines to discover the difference!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Discovery</button>
        </div>
      )}

      {/* Round 1: Chocolate Bar */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 1: Chocolate Bar
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Switch between <strong>Fraction</strong> and <strong>Decimal</strong> representation views.
              Observe if the physical shaded quantity changes.
            </p>
          </div>

          {/* Interactive Representation Block */}
          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Chocolate Bar SVG */}
            <svg
              width="100%"
              height="100"
              viewBox="0 0 400 100"
              style={{
                maxWidth: '400px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: '8px',
                background: 'var(--clr-card)',
                marginBottom: '20px'
              }}
            >
              {/* Shaded side */}
              <rect x="0" y="0" width="200" height="100" fill="var(--clr-accent)" opacity="0.85" />
              {/* Grid partition lines */}
              <line x1="100" y1="0" x2="100" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
              <line x1="200" y1="0" x2="200" y2="100" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
              <line x1="300" y1="0" x2="300" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            </svg>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setActiveMode('fraction')}
                className={activeMode === 'fraction' ? 'primary' : 'secondary'}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                🍰 Fraction
              </button>
              <button
                onClick={() => setActiveMode('decimal')}
                className={activeMode === 'decimal' ? 'primary' : 'secondary'}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                🔍 Decimal
              </button>
            </div>

            {/* Active Display Label */}
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'var(--clr-accent)',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {activeMode === 'fraction' ? '1/2' : '0.5'}
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            Did the shaded amount of chocolate change when switching representations?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR1Submit('yes')} className={selectedOption === 'yes' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Yes</button>
            <button onClick={() => handleR1Submit('no')} className={selectedOption === 'no' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>No</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next Round →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 2: Circle */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 2: Circle Pie Slice
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Switch notations and watch the circular graph representation.
            </p>
          </div>

          {/* Interactive Representation Block */}
          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg
              width="100%"
              height="200"
              viewBox="0 0 300 200"
              style={{
                maxWidth: '300px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: '8px',
                background: 'var(--clr-card)',
                marginBottom: '20px'
              }}
            >
              {/* Circular Pie background */}
              <circle cx="150" cy="100" r="60" fill="none" stroke="var(--clr-border)" strokeWidth="2" />
              {/* Shaded 3/4 quadrant pie slice */}
              <path d="M 150,100 L 150,40 A 60,60 0 1,1 90,100 Z" fill="var(--clr-accent)" opacity="0.85" />
            </svg>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setActiveMode('fraction')}
                className={activeMode === 'fraction' ? 'primary' : 'secondary'}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                🍰 Fraction
              </button>
              <button
                onClick={() => setActiveMode('decimal')}
                className={activeMode === 'decimal' ? 'primary' : 'secondary'}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                🔍 Decimal
              </button>
            </div>

            {/* Active Display Label */}
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: 'var(--clr-accent)',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {activeMode === 'fraction' ? '3/4' : '0.75'}
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            What changed when you toggled the button?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR2Submit('amount')} className={selectedOption === 'amount' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>The amount of shaded area</button>
            <button onClick={() => handleR2Submit('representation')} className={selectedOption === 'representation' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>The representation format</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next Round →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 3: Number Line */}
      {subStep === 'r3' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 3: Number Line Plot
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Observe the point plotted on the number line as you switch between forms.
            </p>
          </div>

          {/* Interactive Representation Block */}
          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg
              width="100%"
              height="100"
              viewBox="0 0 500 100"
              style={{
                maxWidth: '500px',
                border: '1.5px solid var(--clr-border)',
                borderRadius: '8px',
                background: 'var(--clr-card)',
                marginBottom: '20px'
              }}
            >
              {/* Number Line Baseline */}
              <line x1="100" y1="50" x2="400" y2="50" stroke="var(--clr-text-soft)" strokeWidth="3" />
              {/* Left boundary tick */}
              <line x1="100" y1="40" x2="100" y2="60" stroke="var(--clr-text-soft)" strokeWidth="3" />
              <text x="100" y="80" fill="var(--clr-text-soft)" fontSize="14" textAnchor="middle">0</text>

              {/* Right boundary tick */}
              <line x1="400" y1="40" x2="400" y2="60" stroke="var(--clr-text-soft)" strokeWidth="3" />
              <text x="400" y="80" fill="var(--clr-text-soft)" fontSize="14" textAnchor="middle">1</text>

              {/* Middle boundary tick (0.5 / 1/2) */}
              <line x1="250" y1="45" x2="250" y2="55" stroke="var(--clr-text-soft)" strokeWidth="2" strokeDasharray="2 2" />

              {/* Plotted Point (representing 0.25 or 1/4) */}
              <circle cx="175" cy="50" r="8" fill="var(--clr-accent)" />
              <text x="175" y="32" fill="var(--clr-accent)" fontSize="15" fontWeight="bold" textAnchor="middle">
                {activeMode === 'fraction' ? '1/4' : '0.25'}
              </text>
            </svg>

            {/* Mode Switcher */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setActiveMode('fraction')}
                className={activeMode === 'fraction' ? 'primary' : 'secondary'}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                🍰 Fraction
              </button>
              <button
                onClick={() => setActiveMode('decimal')}
                className={activeMode === 'decimal' ? 'primary' : 'secondary'}
                style={{ padding: '8px 16px', fontSize: '0.9rem' }}
              >
                🔍 Decimal
              </button>
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            Why didn't the point move along the number line when switching views?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR3Submit('different')} className={selectedOption === 'different' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Because they represent different values</button>
            <button onClick={() => handleR3Submit('same')} className={selectedOption === 'same' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Because they represent the same value</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Comparison →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison Cards */}
      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Fractions Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  FRACTIONS
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Numerator / denominator notation (e.g., $3/4$).</li>
                  <li>Focuses on parts-of-a-whole segmentations.</li>
                  <li>Exact for division (e.g. $1/3$ doesn't repeat infinitely).</li>
                </ul>
              </div>
            </div>

            {/* Decimals Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  DECIMALS
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Place value notation (e.g., $0.75$).</li>
                  <li>Focuses on base-10 metrics (money, measurements).</li>
                  <li>Easier to compute, compare, and code.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Interactive Equal quantities arrow */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--clr-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <div>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Fraction Representation</strong>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--clr-accent)' }}>3/4</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem', color: 'var(--clr-correct)' }}>⇄</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Same Quantity</span>
            </div>

            <div>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Decimal Representation</strong>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--clr-correct)' }}>0.75</div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
              Fractions and decimals are not different numbers; they are just different representations of the same quantity.
            </p>
          </div>

          {/* Decision Rule */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '12px 0 0 0', fontSize: '1.1rem', lineHeight: '1.5' }}>
              Ask yourself: <strong>"Did the physical quantity change?"</strong>
              <br />
              If <strong>No</strong>, then <strong>only the representation changed</strong>. They are equal!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 Connections */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Final Challenge</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Match Equivalent Pairs</p>
          <p style={{ fontSize: '1.05rem', marginBottom: '20px' }}>Tap a fraction, then tap its equivalent decimal to link them together.</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '28px',
            borderRadius: '12px',
            border: '1.5px solid var(--clr-border)',
            maxWidth: '560px',
            margin: '0 auto 24px auto',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '40px'
          }}>
            {/* Fractions Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--clr-accent)', marginBottom: '8px', display: 'block' }}>Fractions</span>
              {leftOptions.map(leftVal => {
                const isMatched = matchedPairs.some(p => p.startsWith(leftVal));
                const isSelected = selectedLeft === leftVal;

                return (
                  <button
                    key={leftVal}
                    onClick={() => handleLeftSelect(leftVal)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{
                      padding: '16px',
                      fontSize: '1.15rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      opacity: isMatched ? 0.4 : 1,
                      border: isSelected ? '2px solid var(--clr-accent)' : '1px solid var(--clr-border)',
                      cursor: isMatched ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isMatched}
                  >
                    {leftVal}
                  </button>
                );
              })}
            </div>

            {/* Decimals Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--clr-correct)', marginBottom: '8px', display: 'block' }}>Decimals</span>
              {rightOptions.map(rightVal => {
                const isMatched = matchedPairs.some(p => p.endsWith(rightVal));
                const isActiveOption = selectedLeft !== null;

                return (
                  <button
                    key={rightVal}
                    onClick={() => handleRightSelect(rightVal)}
                    className="option-card"
                    style={{
                      padding: '16px',
                      fontSize: '1.15rem',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      opacity: isMatched ? 0.4 : 1,
                      border: '1px solid var(--clr-border)',
                      cursor: (!isActiveOption || isMatched) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={!isActiveOption || isMatched}
                  >
                    {rightVal}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matching Status */}
          <div style={{ marginBottom: '24px', minHeight: '60px' }}>
            {matchedPairs.length > 0 && matchedPairs.length < 3 && (
              <div style={{ fontSize: '1rem', color: 'var(--clr-accent)', fontWeight: '500' }}>
                Matched {matchedPairs.length} of 3 pairs... Keep matching!
              </div>
            )}
            {q1Finished && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  padding: '16px 20px',
                  background: 'rgba(92, 184, 122, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '5px solid var(--clr-correct)',
                  textAlign: 'left',
                  maxWidth: '500px',
                  margin: '0 auto 16px auto'
                }}>
                  <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--clr-correct)' }}>Matched!</strong>
                  <p style={{ margin: 0, fontSize: '0.98rem' }}>{feedbackText}</p>
                </div>
                <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Final Challenge</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Switch the Representation</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.9rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Given Decimal</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--clr-correct)' }}>0.8</div>
              </div>
              <div style={{ border: '1px dashed var(--clr-accent)', padding: '10px 16px', borderRadius: '8px', background: 'var(--clr-card)' }}>
                <strong>Goal:</strong> Switch to equivalent fraction
              </div>
            </div>

            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px', fontWeight: '500' }}>
              Choose the correct fraction form representing 0.8:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {[
                { id: '4/5', label: '4/5' },
                { id: '3/5', label: '3/5' },
                { id: '2/5', label: '2/5' },
                { id: '5/4', label: '5/4' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ2Submit(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'center', padding: '16px', fontSize: '1.1rem', fontWeight: 'bold' }}
                    disabled={q2Answer !== null}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                maxWidth: '560px',
                margin: '0 auto 20px auto'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PermutationCombinationChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, comparison, q1, q2
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Round 1 state
  const [podiumOrder, setPodiumOrder] = useState([]); // Array of runner names: 'A', 'B', 'C'
  const [podiumSwapped, setPodiumSwapped] = useState(false);

  // Round 2 state
  const [selectedToppings, setSelectedToppings] = useState([]); // Array of strings: 'mushroom', 'pepper', 'cheese'
  const [toppingsSwapped, setToppingsSwapped] = useState(false);

  // Layer 3 state
  const [q1Answer, setQ1Answer] = useState(null);
  const [q2Answer, setQ2Answer] = useState(null);

  // Reset states on subStep changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setPodiumOrder([]);
    setPodiumSwapped(false);
    setSelectedToppings([]);
    setToppingsSwapped(false);
    setQ1Answer(null);
    setQ2Answer(null);
  }, [subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handlePlacePodium = (runner) => {
    if (podiumOrder.includes(runner) || podiumSwapped) return;
    const newOrder = [...podiumOrder, runner];
    setPodiumOrder(newOrder);

    if (newOrder.length === 3) {
      // Auto trigger swap after 1s
      setTimeout(() => {
        setPodiumSwapped(true);
      }, 1000);
    }
  };

  const handleSelectTopping = (topping) => {
    if (toppingsSwapped) return;
    let newToppings = [...selectedToppings];
    if (newToppings.includes(topping)) {
      newToppings = newToppings.filter(t => t !== topping);
    } else {
      if (newToppings.length < 2) {
        newToppings.push(topping);
      }
    }
    setSelectedToppings(newToppings);

    if (newToppings.length === 2) {
      setTimeout(() => {
        setToppingsSwapped(true);
      }, 1000);
    }
  };

  const handleR1Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'yes') {
      setAnswerState('correct');
      setFeedbackText("Correct! Swapping first and second place winners changes who gets the gold and silver. Order matters, so this is a Permutation!");
    } else {
      setAnswerState('wrong');
      setHintText("Wait, did the specific medals change hands? If runner A had gold and now runner B has gold, is that a different race outcome?");
    }
  };

  const handleR2Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'no') {
      setAnswerState('correct');
      setFeedbackText("Correct! Adding Cheese then Mushroom makes the exact same pizza recipe as Mushroom then Cheese. Order doesn't matter, so this is a Combination!");
    } else {
      setAnswerState('wrong');
      setHintText("Look at the pizza. Does it have the exact same two ingredients on it, regardless of which one was chosen first?");
    }
  };

  const handleQ1Submit = (opt) => {
    if (q1Answer !== null) return;
    if (opt === 'permutation') {
      setQ1Answer('correct');
      setFeedbackText("Correct! Swapping Captain and Vice-Captain creates a different leadership structure. Order matters, so this is a Permutation.");
    } else {
      setQ1Answer('wrong');
      setFeedbackText("Incorrect. If Student A is Captain and Student B is Vice-Captain, that is a different outcome than Student B as Captain. Since order matters, it is a Permutation.");
    }
  };

  const handleQ2Submit = (opt) => {
    if (q2Answer !== null) return;
    if (opt === 'combination') {
      setQ2Answer('correct');
      setFeedbackText("Correct! In a project team, every student has the same rank. Selecting Student A then B is the same team as B then A. Order doesn't matter, so this is a Combination.");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Incorrect. A project team has no distinct rankings or roles. Swapping selection order does not change the group of people, so it is a Combination.");
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Permutation vs Combination
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Order Matters?
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>🏆  Permutation</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Arrangements where <strong>order matters</strong>. Changing the sequence of items creates a completely different outcome.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>🤝 Combination</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Selections where <strong>order doesn't matter</strong>. The final group is identical regardless of the selection sequence.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Let's play through real-life scenarios to see how order changes the mathematical results!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Discovery</button>
        </div>
      )}

      {/* Round 1: Podium Winners */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 1: Podium Winners (🏆)
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Tap runners <strong>A</strong>, <strong>B</strong>, and <strong>C</strong> in sequence to place them onto the podium (1st, 2nd, 3rd).
              Then watch Tenali swap them.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Runner Selection buttons */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              {['A', 'B', 'C'].map(runner => {
                const isPlaced = podiumOrder.includes(runner);
                return (
                  <button
                    key={runner}
                    onClick={() => handlePlacePodium(runner)}
                    className="option-card"
                    style={{
                      width: '60px',
                      height: '60px',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isPlaced ? 'var(--clr-card)' : 'var(--clr-surface)',
                      opacity: isPlaced ? 0.4 : 1,
                      cursor: (isPlaced || podiumSwapped) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isPlaced || podiumSwapped}
                  >
                    {runner}
                  </button>
                );
              })}
            </div>

            {/* Podium Visual */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '12px',
              height: '160px',
              width: '100%',
              maxWidth: '360px',
              borderBottom: '4px solid var(--clr-text-soft)',
              paddingBottom: '8px',
              marginBottom: '20px'
            }}>
              {/* 2nd Place */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--clr-accent)', marginBottom: '8px' }}>
                  {podiumSwapped ? (podiumOrder[1] === 'A' ? 'B' : 'A') : (podiumOrder[1] || '')}
                </span>
                <div style={{ background: 'rgba(255,255,255,0.08)', height: '60px', width: '100%', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--clr-border)', borderBottom: 'none' }}>
                  🥈 2nd
                </div>
              </div>

              {/* 1st Place */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '85px' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--clr-accent)', marginBottom: '8px' }}>
                  {podiumSwapped ? (podiumOrder[0] === 'A' ? 'B' : 'A') : (podiumOrder[0] || '')}
                </span>
                <div style={{ background: 'rgba(255,255,255,0.12)', height: '90px', width: '100%', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--clr-border)', borderBottom: 'none' }}>
                  🥇 1st
                </div>
              </div>

              {/* 3rd Place */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--clr-accent)', marginBottom: '8px' }}>
                  {podiumOrder[2] || ''}
                </span>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: '40px', width: '100%', borderRadius: '6px 6px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--clr-border)', borderBottom: 'none' }}>
                  🥉 3rd
                </div>
              </div>
            </div>

            {/* Swapped Text Indicator */}
            {podiumSwapped && (
              <div style={{ color: 'var(--clr-accent)', fontWeight: '500', fontSize: '1rem', marginTop: '10px' }}>
                🔄 Tenali swapped first and second place winners!
              </div>
            )}
          </div>

          {podiumSwapped && (
            <>
              <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
                Did this swap create a different outcome for the race winners?
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                <button onClick={() => handleR1Submit('yes')} className={selectedOption === 'yes' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Yes, gold and silver swapped</button>
                <button onClick={() => handleR1Submit('no')} className={selectedOption === 'no' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>No, same runners are on podium</button>
              </div>
            </>
          )}

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Pizza Toppings →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 2: Pizza Toppings */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 2: Pizza Toppings (🍕)
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Choose two toppings to add to the pizza recipe. Then see how selection order affects the result.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Topping selectors */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              {[
                { id: 'mushroom', label: 'Mushroom 🍄' },
                { id: 'pepper', label: 'Pepper 🌶️' },
                { id: 'cheese', label: 'Cheese 🧀' }
              ].map(topping => {
                const isSelected = selectedToppings.includes(topping.id);
                return (
                  <button
                    key={topping.id}
                    onClick={() => handleSelectTopping(topping.id)}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{
                      padding: '10px 16px',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      cursor: toppingsSwapped ? 'not-allowed' : 'pointer'
                    }}
                    disabled={toppingsSwapped}
                  >
                    {topping.label}
                  </button>
                );
              })}
            </div>

            {/* Pizza Visual */}
            {selectedToppings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                <svg width="140" height="140" viewBox="0 0 140 140" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>
                  {/* Pizza Crust */}
                  <circle cx="70" cy="70" r="65" fill="#f4c430" stroke="#d49b25" strokeWidth="4" />
                  {/* Pizza Cheese base */}
                  <circle cx="70" cy="70" r="55" fill="#ffef96" />

                  {/* Render scattered toppings */}
                  {selectedToppings.includes('mushroom') && (
                    <>
                      <text x="45" y="55" fontSize="16">🍄</text>
                      <text x="85" y="85" fontSize="16">🍄</text>
                    </>
                  )}
                  {selectedToppings.includes('pepper') && (
                    <>
                      <text x="85" y="55" fontSize="16">🌶️</text>
                      <text x="45" y="85" fontSize="16">🌶️</text>
                    </>
                  )}
                  {selectedToppings.includes('cheese') && (
                    <>
                      <text x="65" y="45" fontSize="16">🧀</text>
                      <text x="65" y="95" fontSize="16">🧀</text>
                    </>
                  )}
                </svg>
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>
                  Ingredients: {selectedToppings.map(t => t.toUpperCase()).join(' + ')}
                </div>
              </div>
            )}

            {/* Swapped order indicator */}
            {toppingsSwapped && (
              <div style={{ color: 'var(--clr-correct)', fontWeight: '500', fontSize: '1rem', marginTop: '10px' }}>
                🔄 Tenali swaps the choice order: {selectedToppings[1]?.toUpperCase()} first, then {selectedToppings[0]?.toUpperCase()}.
              </div>
            )}
          </div>

          {toppingsSwapped && (
            <>
              <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
                Did changing the selection order change the final pizza recipe outcome?
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                <button onClick={() => handleR2Submit('yes')} className={selectedOption === 'yes' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Yes, different pizza</button>
                <button onClick={() => handleR2Submit('no')} className={selectedOption === 'no' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>No, it has the same ingredients</button>
              </div>
            </>
          )}

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Comparison →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison Cards */}
      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Permutation Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  PERMUTATION
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li><strong>Order matters</strong>—swapping elements creates a new outcome.</li>
                  <li>Focuses on arrangements, sequences, or rankings.</li>
                  <li>Example: Gold, Silver, and Bronze medal positions.</li>
                </ul>
              </div>
            </div>

            {/* Combination Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  COMBINATION
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li><strong>Order does NOT matter</strong>—swapping yields the same outcome.</li>
                  <li>Focuses on selections, groups, or ingredient mixes.</li>
                  <li>Example: Selecting pizza toppings.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
              Swapping order matters if roles are ranked (Permutation, e.g. Captain and Vice-Captain), but not if they are joint members of a group (Combination).
            </p>
          </div>

          {/* Decision Rule */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '1.05rem' }}>If I swap the selection order...</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '16px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', lineHeight: '1.4' }}>Does the result change? <strong>YES</strong></span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-accent)', display: 'block', marginTop: '12px' }}>🏆  Permutation</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)', lineHeight: '1.4' }}>Does the result change? <strong>NO</strong></span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)', display: 'block', marginTop: '12px' }}>🤝 Combination</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Team Leadership Roles</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
              Choosing a Captain and a Vice-Captain from a team of 10 students.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              Which concept does this selection represent?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'permutation', label: 'Permutation' },
                { id: 'combination', label: 'Combination' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ1Submit(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Group Selections</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
              Choosing 5 students to form a project team from a class of 20.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              Which concept does this selection represent?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'permutation', label: 'Permutation' },
                { id: 'combination', label: 'Combination' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ2Submit(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q2Answer !== null}
                  >
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: isSelected ? 'var(--clr-accent)' : 'var(--clr-surface)',
                      color: isSelected ? '#fff' : 'var(--clr-text)',
                      borderRadius: '50%',
                      marginRight: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                maxWidth: '560px',
                margin: '0 auto 20px auto'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrimeCompositeChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, r3, comparison, q1, q2
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Factor detector states
  const [tappedKeys, setTappedKeys] = useState([]);
  const [shakingKey, setShakingKey] = useState(null);

  // Layer 3 Sorter
  const [sortDeck, setSortDeck] = useState([
    { id: 'num_2', val: '2', category: 'prime' },
    { id: 'num_9', val: '9', category: 'composite' },
    { id: 'num_13', val: '13', category: 'prime' },
    { id: 'num_18', val: '18', category: 'composite' },
    { id: 'num_1', val: '1', category: 'neither' },
    { id: 'num_25', val: '25', category: 'composite' }
  ]);
  const [activeSortIndex, setActiveSortIndex] = useState(0);
  const [sortedItems, setSortedItems] = useState({ prime: [], composite: [], neither: [] });
  const [sortingFinished, setSortingFinished] = useState(false);

  // Layer 3 Q2 MCQ State
  const [q2Part, setQ2Part] = useState('p1'); // p1 (15), p2 (29), finished
  const [q2Answer, setQ2Answer] = useState(null);

  // Reset states on subStep changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setTappedKeys([]);
    setShakingKey(null);
    setActiveSortIndex(0);
    setSortedItems({ prime: [], composite: [], neither: [] });
    setSortingFinished(false);
    setQ2Part('p1');
    setQ2Answer(null);
  }, [subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('r3');
    else if (subStep === 'r3') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleTapKey = (key, target, divisors) => {
    if (tappedKeys.includes(key) || answerState === 'correct') return;

    if (divisors.includes(key)) {
      setTappedKeys([...tappedKeys, key]);
    } else {
      setShakingKey(key);
      setTimeout(() => {
        setShakingKey(null);
      }, 400);
    }
  };

  const handleR1Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'more') {
      setAnswerState('correct');
      setFeedbackText("Correct! 12 has 6 factors: 1, 2, 3, 4, 6, and 12. Since it has more than two factors, it is a Composite Number!");
    } else {
      setAnswerState('wrong');
      setHintText("Count the unlocked factor boxes below. Are there only two factors (1 and 12), or did you find others like 2, 3, 4, and 6?");
    }
  };

  const handleR2Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'two') {
      setAnswerState('correct');
      setFeedbackText("Correct! 13 has exactly two factors: 1 and itself (13). This makes it a Prime Number!");
    } else {
      setAnswerState('wrong');
      setHintText("Only 1 and 13 divided the number exactly. Count how many boxes were unlocked.");
    }
  };

  const handleR3Submit = () => {
    setAnswerState('correct');
    setFeedbackText("Correct! 1 is neither prime nor composite because it has only one factor (itself). Prime numbers must have exactly 2 factors, and composite numbers must have more than 2.");
  };

  const handleSortItem = (bucket) => {
    const activeCard = sortDeck[activeSortIndex];
    const isCorrect = activeCard.category === bucket;

    setSortedItems(prev => ({
      ...prev,
      [bucket]: [...prev[bucket], { ...activeCard, status: isCorrect ? 'correct' : 'wrong' }]
    }));

    if (activeSortIndex < sortDeck.length - 1) {
      setActiveSortIndex(activeSortIndex + 1);
    } else {
      setSortingFinished(true);
    }
  };

  const handleQ2Submit = (opt) => {
    if (q2Answer !== null) return;

    if (q2Part === 'p1') {
      if (opt === 'composite') {
        setQ2Answer('correct');
        setFeedbackText("Correct! 15 has factors 1, 3, 5, 15 (more than 2), which makes it a Composite Number.");
      } else {
        setQ2Answer('wrong');
        setFeedbackText("Incorrect. 15 can be divided by 3 and 5 in addition to 1 and 15, so it has more than 2 factors.");
      }
    } else if (q2Part === 'p2') {
      if (opt === 'prime') {
        setQ2Answer('correct');
        setFeedbackText("Correct! 29 has factors 1 and 29 (exactly 2), which makes it a Prime Number.");
      } else {
        setQ2Answer('wrong');
        setFeedbackText("Incorrect. 29 has no other divisors besides 1 and 29, so it is a Prime Number.");
      }
    }
  };

  const handleQ2Next = () => {
    setQ2Answer(null);
    setSelectedOption(null);
    if (q2Part === 'p1') {
      setQ2Part('p2');
    } else {
      setQ2Part('finished');
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake-btn {
          animation: shake 0.3s ease-in-out;
          border-color: var(--clr-wrong) !important;
          background: rgba(235, 94, 85, 0.1) !important;
        }
      `}</style>

      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Prime vs Composite
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Factor Explorer
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Prime Numbers</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Numbers that have <strong>exactly 2 factors</strong>: 1 and themselves (e.g. 2, 3, 5, 7, 13).</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Composite Numbers</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Numbers that have <strong>more than 2 factors</strong> (e.g. 4, 6, 8, 9, 12). Can be split in multiple ways.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--clr-text)', marginBottom: '4px' }}>The Number 1</strong>
              <span style={{ fontSize: '0.9rem', color: 'var(--clr-text-soft)' }}>Has <strong>only 1 factor</strong> (itself). Therefore, it is neither prime nor composite.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Let's become factor detectives and search for divisors to see the rules in action!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Discovery</button>
        </div>
      )}

      {/* Round 1: Number 12 */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 1: Find the Factors of 12
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Tap every key below that divides <strong>12</strong> exactly (no remainder).
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Number</span>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--clr-accent)', marginBottom: '20px' }}>12</div>

            {/* Keys */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '440px', marginBottom: '24px' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(num => {
                const isTapped = tappedKeys.includes(num);
                const isShaking = shakingKey === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleTapKey(num, 12, [1, 2, 3, 4, 6, 12])}
                    className={`option-card ${isShaking ? 'shake-btn' : ''}`}
                    style={{
                      width: '46px',
                      height: '46px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      background: isTapped ? 'var(--clr-correct-bg)' : 'var(--clr-surface)',
                      borderColor: isTapped ? 'var(--clr-correct)' : 'var(--clr-border)',
                      color: isTapped ? 'var(--clr-correct)' : 'var(--clr-text)',
                      cursor: (isTapped || answerState === 'correct') ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isTapped || answerState === 'correct'}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Unlocked factor boxes */}
            <div style={{ width: '100%', maxWidth: '460px', borderTop: '1px solid var(--clr-border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', display: 'block', marginBottom: '10px' }}>
                Factors Found ({tappedKeys.length} / 6)
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[1, 2, 3, 4, 6, 12].map(f => {
                  const found = tappedKeys.includes(f);
                  return (
                    <div
                      key={f}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: found ? 'var(--clr-card)' : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${found ? 'var(--clr-accent)' : 'var(--clr-border)'}`,
                        fontSize: '1.05rem',
                        fontWeight: 'bold',
                        color: found ? 'var(--clr-text)' : 'rgba(255,255,255,0.1)',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}
                    >
                      {found ? f : '?'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {tappedKeys.length === 6 && (
            <>
              <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
                What did you discover about the factors of 12?
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                <button onClick={() => handleR1Submit('two')} className={selectedOption === 'two' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>It has only two factors (1 and itself)</button>
                <button onClick={() => handleR1Submit('more')} className={selectedOption === 'more' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>It has more than two factors</button>
              </div>
            </>
          )}

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next Mystery Number →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 2: Number 13 */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 2: Find the Factors of 13
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Tap every key below that divides <strong>13</strong> exactly. Tapping incorrect values will shake.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Number</span>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--clr-accent)', marginBottom: '20px' }}>13</div>

            {/* Keys */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '440px', marginBottom: '24px' }}>
              {Array.from({ length: 13 }, (_, i) => i + 1).map(num => {
                const isTapped = tappedKeys.includes(num);
                const isShaking = shakingKey === num;
                return (
                  <button
                    key={num}
                    onClick={() => handleTapKey(num, 13, [1, 13])}
                    className={`option-card ${isShaking ? 'shake-btn' : ''}`}
                    style={{
                      width: '42px',
                      height: '42px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.05rem',
                      fontWeight: 'bold',
                      background: isTapped ? 'var(--clr-correct-bg)' : 'var(--clr-surface)',
                      borderColor: isTapped ? 'var(--clr-correct)' : 'var(--clr-border)',
                      color: isTapped ? 'var(--clr-correct)' : 'var(--clr-text)',
                      cursor: (isTapped || answerState === 'correct') ? 'not-allowed' : 'pointer'
                    }}
                    disabled={isTapped || answerState === 'correct'}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {/* Unlocked factor boxes */}
            <div style={{ width: '100%', maxWidth: '460px', borderTop: '1px solid var(--clr-border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', display: 'block', marginBottom: '10px' }}>
                Factors Found ({tappedKeys.length} / 2)
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[1, 13].map(f => {
                  const found = tappedKeys.includes(f);
                  return (
                    <div
                      key={f}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        background: found ? 'var(--clr-card)' : 'rgba(255,255,255,0.02)',
                        border: `1.5px solid ${found ? 'var(--clr-accent)' : 'var(--clr-border)'}`,
                        fontSize: '1.05rem',
                        fontWeight: 'bold',
                        color: found ? 'var(--clr-text)' : 'rgba(255,255,255,0.1)',
                        minWidth: '50px',
                        textAlign: 'center'
                      }}
                    >
                      {found ? f : '?'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {tappedKeys.length === 2 && (
            <>
              <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
                How many factors did you find for 13?
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                <button onClick={() => handleR2Submit('two')} className={selectedOption === 'two' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Exactly two factors</button>
                <button onClick={() => handleR2Submit('more')} className={selectedOption === 'more' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>More than two factors</button>
              </div>
            </>
          )}

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Special Number →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 3: Number 1 */}
      {subStep === 'r3' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 3: Find the Factors of 1
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Tap the keys that divide <strong>1</strong> exactly.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Special Number</span>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--clr-accent)', marginBottom: '20px' }}>1</div>

            {/* Keys */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
              <button
                onClick={() => handleTapKey(1, 1, [1])}
                className="option-card"
                style={{
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  background: tappedKeys.includes(1) ? 'var(--clr-correct-bg)' : 'var(--clr-surface)',
                  borderColor: tappedKeys.includes(1) ? 'var(--clr-correct)' : 'var(--clr-border)',
                  color: tappedKeys.includes(1) ? 'var(--clr-correct)' : 'var(--clr-text)',
                  cursor: (tappedKeys.includes(1) || answerState === 'correct') ? 'not-allowed' : 'pointer'
                }}
                disabled={tappedKeys.includes(1) || answerState === 'correct'}
              >
                1
              </button>
            </div>

            {/* Unlocked factor boxes */}
            <div style={{ width: '100%', maxWidth: '460px', borderTop: '1px solid var(--clr-border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', display: 'block', marginBottom: '10px' }}>
                Factors Found ({tappedKeys.length} / 1)
              </span>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <div
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: tappedKeys.includes(1) ? 'var(--clr-card)' : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${tappedKeys.includes(1) ? 'var(--clr-accent)' : 'var(--clr-border)'}`,
                    fontSize: '1.05rem',
                    fontWeight: 'bold',
                    color: tappedKeys.includes(1) ? 'var(--clr-text)' : 'rgba(255,255,255,0.1)',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}
                >
                  {tappedKeys.includes(1) ? '1' : '?'}
                </div>
              </div>
            </div>
          </div>

          {tappedKeys.length === 1 && answerState === 'unanswered' && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
                Number 1 has only <strong>one</strong> factor. Let's reveal where it fits:
              </p>
              <button onClick={handleR3Submit} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Reveal Classification</button>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '520px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Comparison →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison Cards */}
      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Prime Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 240px',
              maxWidth: '280px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  🔑 PRIME
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.92rem', lineHeight: '1.5' }}>
                  <li>Exactly **two factors** (1 and itself).</li>
                  <li>Cannot be grouped into smaller equal sizes.</li>
                  <li>Examples: 2, 3, 5, 7, 11, 13.</li>
                </ul>
              </div>
            </div>

            {/* Composite Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 240px',
              maxWidth: '280px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  🔢 COMPOSITE
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.92rem', lineHeight: '1.5' }}>
                  <li>More than **two factors**.</li>
                  <li>Can be split into multiple equal grid layouts.</li>
                  <li>Examples: 4, 6, 8, 9, 10, 12.</li>
                </ul>
              </div>
            </div>

            {/* Neither Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-text-soft)',
              flex: '1 1 240px',
              maxWidth: '280px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: '0 0 12px 0', color: 'var(--clr-text-soft)' }}>
                  ⭐ NEITHER
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.92rem', lineHeight: '1.5' }}>
                  <li>Exactly **one factor** (1).</li>
                  <li>Does not meet Prime (needs 2) or Composite (needs &gt;2) requirements.</li>
                  <li>Example: 1.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
              1 is not prime. Prime numbers must have **exactly two distinct factors**. 1 only has itself.
            </p>
          </div>

          {/* Decision Rule */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '1.05rem' }}>Count the factors of the number:</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Exactly 2 factors?</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--clr-accent)', display: 'block', marginTop: '8px' }}>Prime</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>More than 2 factors?</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--clr-correct)', display: 'block', marginTop: '8px' }}>Composite</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>Only 1 factor?</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--clr-text-soft)', display: 'block', marginTop: '8px' }}>Neither</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 Sorter */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Classification Deck Matcher</p>

          <div style={{
            background: 'var(--clr-surface)',
            border: '1.5px solid var(--clr-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            {!sortingFinished ? (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Number Card ({activeSortIndex + 1} / {sortDeck.length})
                </span>
                <div style={{
                  background: 'var(--clr-card)',
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--clr-border)',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-btn)',
                  maxWidth: '200px',
                  width: '100%',
                  marginBottom: '20px',
                  color: 'var(--clr-accent)'
                }}>
                  {sortDeck[activeSortIndex].val}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={() => handleSortItem('prime')} style={{ padding: '10px 16px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-accent)' }}>
                    Prime
                  </button>
                  <button onClick={() => handleSortItem('composite')} style={{ padding: '10px 16px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-correct)' }}>
                    Composite
                  </button>
                  <button onClick={() => handleSortItem('neither')} style={{ padding: '10px 16px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-text-soft)' }}>
                    Neither
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                🎉 Placements complete! Review matched numbers below.
              </div>
            )}
          </div>

          {/* Columns */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '24px' }}>
            {/* Prime bucket */}
            <div style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1.5px dashed var(--clr-accent)', flex: '1 1 200px', maxWidth: '250px', minHeight: '160px' }}>
              <strong style={{ display: 'block', color: 'var(--clr-accent)', fontSize: '1rem', marginBottom: '12px' }}> Prime</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                {sortedItems.prime.map((item, idx) => (
                  <span key={idx} style={{ padding: '4px 8px', background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)', border: `1px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`, borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {item.val}
                  </span>
                ))}
              </div>
            </div>

            {/* Composite bucket */}
            <div style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1.5px dashed var(--clr-correct)', flex: '1 1 200px', maxWidth: '250px', minHeight: '160px' }}>
              <strong style={{ display: 'block', color: 'var(--clr-correct)', fontSize: '1rem', marginBottom: '12px' }}> Composite</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                {sortedItems.composite.map((item, idx) => (
                  <span key={idx} style={{ padding: '4px 8px', background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)', border: `1px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`, borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {item.val}
                  </span>
                ))}
              </div>
            </div>

            {/* Neither bucket */}
            <div style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1.5px dashed var(--clr-text-soft)', flex: '1 1 200px', maxWidth: '250px', minHeight: '160px' }}>
              <strong style={{ display: 'block', color: 'var(--clr-text-soft)', fontSize: '1rem', marginBottom: '12px' }}> Neither</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                {sortedItems.neither.map((item, idx) => (
                  <span key={idx} style={{ padding: '4px 8px', background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)', border: `1px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`, borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    {item.val}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {sortingFinished && (
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem', marginTop: '32px' }}>Next Question →</button>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Factor Count Verification</p>

          {q2Part === 'p1' && (
            <div style={{
              background: 'var(--clr-surface)',
              padding: '24px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--clr-border)',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
                The number <strong>15</strong> has factors: <strong>1, 3, 5, 15</strong>.
              </p>
              <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
                What type of number is 15?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'prime', label: 'Prime Number' },
                  { id: 'composite', label: 'Composite Number' }
                ].map(opt => {
                  const isSelected = selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { setSelectedOption(opt.id); handleQ2Submit(opt.id); }}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                      disabled={q2Answer !== null}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {q2Part === 'p2' && (
            <div style={{
              background: 'var(--clr-surface)',
              padding: '24px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--clr-border)',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
                The number <strong>29</strong> has factors: <strong>1, 29</strong>.
              </p>
              <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
                What type of number is 29?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { id: 'prime', label: 'Prime Number' },
                  { id: 'composite', label: 'Composite Number' }
                ].map(opt => {
                  const isSelected = selectedOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { setSelectedOption(opt.id); handleQ2Submit(opt.id); }}
                      className={`option-card ${isSelected ? 'selected' : ''}`}
                      style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                      disabled={q2Answer !== null}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                maxWidth: '560px',
                margin: '0 auto 20px auto'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button
                onClick={q2Part === 'p1' ? handleQ2Next : onComplete}
                style={{ padding: '12px 24px', fontSize: '1.05rem' }}
              >
                {q2Part === 'p1' ? 'Next Part →' : 'Finish Challenge'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrigInverseTrigChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, comparison, q1, q2
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Layer 3 Sorter
  const [sortDeck, setSortDeck] = useState([
    { id: 'tree', val: '📐 Height of a tree from angle of elevation', category: 'trig' },
    { id: 'roof', val: '📐 Find the angle of a roof when two sides are known', category: 'invtrig' },
    { id: 'shadow', val: '📐 Find the shadow length using a known angle', category: 'trig' },
    { id: 'incline', val: '📐 Find the angle of inclination from side lengths', category: 'invtrig' }
  ]);
  const [activeSortIndex, setActiveSortIndex] = useState(0);
  const [sortedItems, setSortedItems] = useState({ trig: [], invtrig: [] });
  const [sortingFinished, setSortingFinished] = useState(false);

  // Layer 3 Q2
  const [q2Answer, setQ2Answer] = useState(null);

  // Reset states on subStep changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setActiveSortIndex(0);
    setSortedItems({ trig: [], invtrig: [] });
    setSortingFinished(false);
    setQ2Answer(null);
  }, [subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleR1Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'side') {
      setAnswerState('correct');
      setFeedbackText("Correct! Since you know the angle (30°), you are using trigonometry to calculate the missing side length.");
    } else {
      setAnswerState('wrong');
      setHintText("Look at the diagram. The angle is already given as 30°. The question mark is on the vertical side.");
    }
  };

  const handleR2Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'angle') {
      setAnswerState('correct');
      setFeedbackText("Correct! Since you know the side lengths (5 and 10), you use inverse trigonometry to calculate the missing angle.");
    } else {
      setAnswerState('wrong');
      setHintText("Look at the diagram. The sides are labeled 5 and 10. The question mark is on the angle θ.");
    }
  };

  const handleSortItem = (bucket) => {
    const activeCard = sortDeck[activeSortIndex];
    const isCorrect = activeCard.category === bucket;

    setSortedItems(prev => ({
      ...prev,
      [bucket]: [...prev[bucket], { ...activeCard, status: isCorrect ? 'correct' : 'wrong' }]
    }));

    if (activeSortIndex < sortDeck.length - 1) {
      setActiveSortIndex(activeSortIndex + 1);
    } else {
      setSortingFinished(true);
    }
  };

  const handleQ2Submit = (opt) => {
    if (q2Answer !== null) return;
    if (opt === 'inv') {
      setQ2Answer('correct');
      setFeedbackText("Correct! To find the angle, you use the inverse sine function: sin⁻¹(4/8) which evaluates to 30°. Recall that sin⁻¹(x) is NOT 1/sin(x).");
    } else if (opt === 'recip') {
      setQ2Answer('wrong');
      setFeedbackText("Incorrect. sin⁻¹(x) represents the inverse function (finding the angle), NOT the reciprocal 1/sin(x) (which is cosecant).");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Incorrect. sin(30°) is equal to 4/8, but to represent the process of finding the angle from sides, we write θ = sin⁻¹(4/8).");
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Trigonometry vs Inverse Trig
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Missing Piece Mystery
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Trigonometry</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Takes an <strong>angle</strong> and outputs a <strong>ratio</strong> of side lengths. Used to find missing sides.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Inverse Trigonometry</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Takes a <strong>ratio</strong> of side lengths and outputs the corresponding <strong>angle</strong>. Used to find missing angles.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Let's examine right triangles to identify which tool solves the mystery!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Discovery</button>
        </div>
      )}

      {/* Round 1: Trigonometry */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 1: Missing Side
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Study the right triangle below. The angle is 30° and the hypotenuse is 10 cm.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Triangle SVG */}
            <svg width="240" height="160" viewBox="0 0 240 160" style={{ marginBottom: '16px' }}>
              {/* Triangle path */}
              <path d="M 40 130 L 200 130 L 200 30 Z" fill="none" stroke="var(--clr-text)" strokeWidth="3" />
              {/* Right angle marker */}
              <path d="M 190 130 L 190 120 L 200 120" fill="none" stroke="var(--clr-text-soft)" strokeWidth="1.5" />

              {/* Labels */}
              <text x="32" y="146" fill="var(--clr-accent)" fontSize="0.9rem" fontWeight="bold">θ = 30°</text>
              <text x="100" y="70" fill="var(--clr-text-soft)" fontSize="0.9rem" fontWeight="500">10 cm</text>
              <text x="215" y="85" fill="var(--clr-accent)" fontSize="1.2rem" fontWeight="bold">?</text>
            </svg>

            <div style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>
              Known: <strong>Angle = 30°</strong>, <strong>Hypotenuse = 10 cm</strong>
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            What are you trying to find in this scenario?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR1Submit('side')} className={selectedOption === 'side' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Side Length</button>
            <button onClick={() => handleR1Submit('angle')} className={selectedOption === 'angle' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Angle</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Missing Angle →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 2: Inverse Trigonometry */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 2: Missing Angle
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Study the triangle. The opposite side is 5 and the hypotenuse is 10.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Triangle SVG */}
            <svg width="240" height="160" viewBox="0 0 240 160" style={{ marginBottom: '16px' }}>
              {/* Triangle path */}
              <path d="M 40 130 L 200 130 L 200 30 Z" fill="none" stroke="var(--clr-text)" strokeWidth="3" />
              {/* Right angle marker */}
              <path d="M 190 130 L 190 120 L 200 120" fill="none" stroke="var(--clr-text-soft)" strokeWidth="1.5" />

              {/* Labels */}
              <text x="32" y="146" fill="var(--clr-accent)" fontSize="1.2rem" fontWeight="bold">?</text>
              <text x="100" y="70" fill="var(--clr-text-soft)" fontSize="0.9rem" fontWeight="500">10</text>
              <text x="215" y="85" fill="var(--clr-accent)" fontSize="0.9rem" fontWeight="bold">5</text>
            </svg>

            <div style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>
              Known: <strong>Opposite = 5</strong>, <strong>Hypotenuse = 10</strong>
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            What are you trying to find in this scenario?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR2Submit('side')} className={selectedOption === 'side' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Side Length</button>
            <button onClick={() => handleR2Submit('angle')} className={selectedOption === 'angle' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Angle</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Comparison →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison Cards */}
      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Trigonometry Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  📐 TRIGONOMETRY
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Angle is known; side length or ratio is missing.</li>
                  <li>Input: angle (e.g., $30^\circ$). Output: ratio (e.g., $1/2$).</li>
                  <li>Example: $\sin(30^\circ) = 1/2$.</li>
                </ul>
              </div>
            </div>

            {/* Inverse Trigonometry Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  📐 INVERSE TRIGONOMETRY
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Ratio is known; angle is missing.</li>
                  <li>Input: ratio (e.g., $1/2$). Output: angle (e.g., $30^\circ$).</li>
                  <li>Example: $\sin^{-1}(1/2) = 30^\circ$.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
              $\sin^{-1}(x)$ is the inverse function ("the angle whose sine is $x$"), NOT the reciprocal $1 / \sin(x)$ (which is $\csc(x)$).
            </p>
          </div>

          {/* Decision Rule */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '1.05rem' }}>Ask yourself: What do I already know?</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '16px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)' }}>Know angle, need side?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-accent)', display: 'block', marginTop: '12px' }}>📐 Trigonometry</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)' }}>Know sides, need angle?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)', display: 'block', marginTop: '12px' }}>📐 Inverse Trig</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Situation Matcher</p>

          <div style={{
            background: 'var(--clr-surface)',
            border: '1.5px solid var(--clr-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {!sortingFinished ? (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Situation ({activeSortIndex + 1} / {sortDeck.length})
                </span>
                <div style={{
                  background: 'var(--clr-card)',
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--clr-border)',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-btn)',
                  maxWidth: '480px',
                  width: '100%',
                  marginBottom: '20px'
                }}>
                  {sortDeck[activeSortIndex].val}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={() => handleSortItem('trig')} style={{ padding: '10px 16px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-accent)' }}>
                    📐 Trigonometry
                  </button>
                  <button onClick={() => handleSortItem('invtrig')} style={{ padding: '10px 16px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-correct)' }}>
                    📐 Inverse Trig
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                🎉 Placements complete! Review matches below.
              </div>
            )}
          </div>

          {/* Columns */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '24px' }}>
            <div style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1.5px dashed var(--clr-accent)', flex: '1 1 240px', maxWidth: '300px', minHeight: '160px' }}>
              <strong style={{ display: 'block', color: 'var(--clr-accent)', fontSize: '1rem', marginBottom: '12px' }}>📐 Trigonometry</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                {sortedItems.trig.map((item, idx) => (
                  <div key={idx} style={{ padding: '6px 10px', background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)', border: `1px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`, borderRadius: '4px', fontSize: '0.85rem' }}>
                    {item.val}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1.5px dashed var(--clr-correct)', flex: '1 1 240px', maxWidth: '300px', minHeight: '160px' }}>
              <strong style={{ display: 'block', color: 'var(--clr-correct)', fontSize: '1rem', marginBottom: '12px' }}>📐 Inverse Trig</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                {sortedItems.invtrig.map((item, idx) => (
                  <div key={idx} style={{ padding: '6px 10px', background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)', border: `1px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`, borderRadius: '4px', fontSize: '0.85rem' }}>
                    {item.val}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {sortingFinished && (
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem', marginTop: '32px' }}>Next Question →</button>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Spot the Correct Expression</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
              You know the opposite side is <strong>4</strong>, the hypotenuse is <strong>8</strong>, and you need the angle.
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              Choose the mathematically correct expression to represent the missing angle.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'ratio', label: 'sin 30°' },
                { id: 'inv', label: 'sin⁻¹(4/8)' },
                { id: 'recip', label: '1/sin(4/8)' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ2Submit(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q2Answer !== null}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                maxWidth: '560px',
                margin: '0 auto 20px auto'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LinearSimultaneousChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, comparison, q1, q2
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Round 1 state
  const [r1X, setR1X] = useState(80); // Slider controls X coordinate

  // Round 2 state
  const [r2X, setR2X] = useState(140); // Slider controls X coordinate
  const [r2Glow, setR2Glow] = useState(false);

  // Layer 3 state
  const [q1Answer, setQ1Answer] = useState(null);
  const [q2Answer, setQ2Answer] = useState(null);

  // Reset states on subStep changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setR1X(80);
    setR2X(140);
    setR2Glow(false);
    setQ1Answer(null);
    setQ2Answer(null);
  }, [subStep]);

  // Check intersection glow in Round 2
  useEffect(() => {
    if (subStep === 'r2' && Math.abs(r2X - 80) < 5) {
      setR2Glow(true);
    } else {
      setR2Glow(false);
    }
  }, [r2X, subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleR1Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'one') {
      setAnswerState('correct');
      setFeedbackText("Correct! One line represents one linear equation. Moving the point anywhere on the line shows the infinite valid coordinates that satisfy this equation.");
    } else {
      setAnswerState('wrong');
      setHintText("Look at the graph. How many independent lines are drawn on it?");
    }
  };

  const handleR2Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'intersection') {
      setAnswerState('correct');
      setFeedbackText("Correct! The intersection point satisfies both linear equations simultaneously. This is the single solution to the system.");
    } else {
      setAnswerState('wrong');
      setHintText("Move the slider so the point rests exactly on the intersection of the two lines.");
    }
  };

  const handleQ1Submit = (opt) => {
    if (q1Answer !== null) return;
    if (opt === 'linear') {
      setQ1Answer('correct');
      setFeedbackText("Correct! This is a single equation with one variable (x) representing a single linear statement.");
    } else {
      setQ1Answer('wrong');
      setFeedbackText("Incorrect. This is a single equation. Simultaneous equations consist of two or more equations solved together.");
    }
  };

  const handleQ2Submit = (opt) => {
    if (q2Answer !== null) return;
    if (opt === 'simultaneous') {
      setQ2Answer('correct');
      setFeedbackText("Correct! These are two equations with two variables (x and y) that must be solved together to find a common solution.");
    } else {
      setQ2Answer('wrong');
      setFeedbackText("Incorrect. These are two distinct equations containing two variables, which together form a system of simultaneous equations.");
    }
  };

  // Line formulas
  // Line 1: y = -0.5 * x + 130
  // Line 2: y = 0.5 * x + 50
  // Intersection is at x = 80, y = 90
  const r1Y = -0.5 * r1X + 130;
  const r2Y = -0.5 * r2X + 130;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Linear vs Simultaneous Equations
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Find the Meeting Point
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Linear Equation</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>A single equation representing a single straight line. Has <strong>infinite solution points</strong> along the line.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Simultaneous Equations</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>Two or more equations solved together. Represents multiple lines with a <strong>common solution</strong> where they intersect.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Let's interact with straight lines on a graph grid to visualize their solutions!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Discovery</button>
        </div>
      )}

      {/* Round 1: One Line */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 1: One Line
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Drag the slider to move the point along the line. Watch its coordinate values change.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Grid SVG */}
            <svg width="240" height="180" viewBox="0 0 240 180" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1.5px solid var(--clr-border)', marginBottom: '16px' }}>
              {/* Grid lines */}
              <line x1="0" y1="45" x2="240" y2="45" stroke="rgba(255,255,255,0.05)" />
              <line x1="0" y1="90" x2="240" y2="90" stroke="rgba(255,255,255,0.05)" />
              <line x1="0" y1="135" x2="240" y2="135" stroke="rgba(255,255,255,0.05)" />
              <line x1="60" y1="0" x2="60" y2="180" stroke="rgba(255,255,255,0.05)" />
              <line x1="120" y1="0" x2="120" y2="180" stroke="rgba(255,255,255,0.05)" />
              <line x1="180" y1="0" x2="180" y2="180" stroke="rgba(255,255,255,0.05)" />

              {/* Line 1 */}
              <line x1="20" y1="120" x2="220" y2="20" stroke="var(--clr-accent)" strokeWidth="3" />

              {/* Draggable point */}
              <circle cx={r1X} cy={r1Y} r="8" fill="var(--clr-accent)" style={{ transition: 'cx 0.1s, cy 0.1s' }} />
            </svg>

            {/* Slider */}
            <div style={{ width: '100%', maxWidth: '240px', marginBottom: '16px' }}>
              <input
                type="range"
                min="20"
                max="220"
                value={r1X}
                onChange={(e) => setR1X(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={answerState === 'correct'}
              />
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>
                Point Coordinate: ({r1X.toFixed(0)}, {(180 - r1Y).toFixed(0)})
              </div>
            </div>
          </div>

          <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
            How many linear equations are represented by this single straight line?
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
            <button onClick={() => handleR1Submit('one')} className={selectedOption === 'one' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>One Equation</button>
            <button onClick={() => handleR1Submit('two')} className={selectedOption === 'two' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Two Equations</button>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Two Lines →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 2: Two Lines */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 2: Intersection Solution
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Drag the point using the slider to locate the exact intersection where both lines meet.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Grid SVG */}
            <svg width="240" height="180" viewBox="0 0 240 180" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1.5px solid var(--clr-border)', marginBottom: '16px' }}>
              {/* Grid lines */}
              <line x1="0" y1="45" x2="240" y2="45" stroke="rgba(255,255,255,0.05)" />
              <line x1="0" y1="90" x2="240" y2="90" stroke="rgba(255,255,255,0.05)" />
              <line x1="0" y1="135" x2="240" y2="135" stroke="rgba(255,255,255,0.05)" />
              <line x1="60" y1="0" x2="60" y2="180" stroke="rgba(255,255,255,0.05)" />
              <line x1="120" y1="0" x2="120" y2="180" stroke="rgba(255,255,255,0.05)" />
              <line x1="180" y1="0" x2="180" y2="180" stroke="rgba(255,255,255,0.05)" />

              {/* Line 1 */}
              <line x1="20" y1="120" x2="220" y2="20" stroke="var(--clr-accent)" strokeWidth="3" />

              {/* Line 2 */}
              <line x1="20" y1="60" x2="220" y2="160" stroke="var(--clr-text-soft)" strokeWidth="3" />

              {/* Intersection glow */}
              {r2Glow && (
                <circle cx="80" cy="90" r="16" fill="rgba(92, 184, 122, 0.3)" style={{ transformOrigin: '80px 90px', animation: 'pulse 1.2s infinite' }} />
              )}

              {/* Draggable point */}
              <circle cx={r2X} cy={r2Y} r="8" fill={r2Glow ? 'var(--clr-correct)' : 'var(--clr-accent)'} style={{ transition: 'cx 0.1s, cy 0.1s' }} />
            </svg>

            {/* Slider */}
            <div style={{ width: '100%', maxWidth: '240px', marginBottom: '16px' }}>
              <input
                type="range"
                min="20"
                max="220"
                value={r2X}
                onChange={(e) => setR2X(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={answerState === 'correct'}
              />
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>
                {r2Glow ? (
                  <strong style={{ color: 'var(--clr-correct)' }}>✅ Intersection Located: (80, 90)!</strong>
                ) : (
                  <span>Searching for intersection... ({r2X.toFixed(0)}, {(180 - r2Y).toFixed(0)})</span>
                )}
              </div>
            </div>
          </div>

          {r2Glow && answerState === 'unanswered' && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
                Which coordinates satisfy BOTH equations represented by the two lines?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button onClick={() => handleR2Submit('any')} className="secondary" style={{ padding: '12px 20px' }}>Any point on either line</button>
                <button onClick={() => handleR2Submit('intersection')} className="primary" style={{ padding: '12px 20px' }}>Only the intersection point</button>
              </div>
            </div>
          )}

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Comparison →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison Cards */}
      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Linear Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  = LINEAR EQUATION
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>One equation representing a single straight line.</li>
                  <li>Has infinite solutions (every point on the line).</li>
                  <li>Example: $2x + y = 6$.</li>
                </ul>
              </div>
            </div>

            {/* Simultaneous Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  = SIMULTANEOUS EQUATIONS
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Two or more equations solved together.</li>
                  <li>Finds the single common solution where lines intersect.</li>
                  <li>Example: $2x + y = 6$ and $x - y = 3$.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
              Multiple linear equations solved simultaneously represent a coordinated system, yielding a single common coordinate point rather than infinite lines.
            </p>
          </div>

          {/* Decision Rule */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '1.05rem' }}>Am I solving...</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '16px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)' }}>One individual equation?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-accent)', display: 'block', marginTop: '12px' }}>= Linear Equation</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)' }}>More than one equation together?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)', display: 'block', marginTop: '12px' }}>= Simultaneous</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Statement Type</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.3rem', color: 'var(--clr-accent)', marginBottom: '16px', fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center' }}>
              2x + 3 = 11
            </p>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              What type of mathematical statement is this?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'linear', label: 'Linear Equation' },
                { id: 'simultaneous', label: 'Simultaneous Equations' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ1Submit(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q1Answer !== null}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q1Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q1Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                marginBottom: '20px'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q1Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q1Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Next Question →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Statement Type</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
              <code style={{ fontSize: '1.3rem', color: 'var(--clr-accent)', fontWeight: 'bold' }}>x + y = 6</code>
              <code style={{ fontSize: '1.3rem', color: 'var(--clr-accent)', fontWeight: 'bold' }}>2x - y = 3</code>
            </div>
            <p style={{ fontSize: '1.05rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              What type of mathematical statement system is this?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { id: 'linear', label: 'Linear Equation' },
                { id: 'simultaneous', label: 'Simultaneous Equations' }
              ].map(opt => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedOption(opt.id); handleQ2Submit(opt.id); }}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: '1.05rem' }}
                    disabled={q2Answer !== null}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {q2Answer !== null && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: q2Answer === 'correct' ? 'rgba(92, 184, 122, 0.1)' : 'rgba(235, 94, 85, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `5px solid ${q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`,
                textAlign: 'left',
                maxWidth: '560px',
                margin: '0 auto 20px auto'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: q2Answer === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)' }}>
                  {q2Answer === 'correct' ? 'Correct!' : 'Incorrect'}
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>{feedbackText}</p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InteriorExteriorChallenge({ onBack, onComplete }) {
  const [subStep, setSubStep] = useState('intro'); // intro, r1, r2, comparison, q1, q2
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerState, setAnswerState] = useState('unanswered'); // unanswered, correct, wrong
  const [feedbackText, setFeedbackText] = useState('');
  const [hintText, setHintText] = useState('');

  // Round 1 state
  const [r1Filled, setR1Filled] = useState(false);

  // Round 2 state
  const [extensionLength, setExtensionLength] = useState(0); // 0 to 60

  // Layer 3 state
  const [sortDeck, setSortDeck] = useState([
    { id: 'room', val: '🏠 Angle inside a room', category: 'interior' },
    { id: 'door', val: '🚪 Door opened outward', category: 'exterior' },
    { id: 'poly', val: '∠ Angle inside a polygon', category: 'interior' },
    { id: 'extend', val: '📐 Angle formed after extending a side', category: 'exterior' }
  ]);
  const [activeSortIndex, setActiveSortIndex] = useState(0);
  const [sortedItems, setSortedItems] = useState({ interior: [], exterior: [] });
  const [sortingFinished, setSortingFinished] = useState(false);

  // Q2 state
  const [q2Extension, setQ2Extension] = useState(0); // 0 to 60
  const [q2Finished, setQ2Finished] = useState(false);

  // Reset states on subStep changes
  useEffect(() => {
    setSelectedOption(null);
    setAnswerState('unanswered');
    setFeedbackText('');
    setHintText('');
    setR1Filled(false);
    setExtensionLength(0);
    setActiveSortIndex(0);
    setSortedItems({ interior: [], exterior: [] });
    setSortingFinished(false);
    setQ2Extension(0);
    setQ2Finished(false);
  }, [subStep]);

  useEffect(() => {
    if (subStep === 'q2' && q2Extension >= 50) {
      setQ2Finished(true);
    }
  }, [q2Extension, subStep]);

  const handleNextStep = () => {
    if (subStep === 'intro') setSubStep('r1');
    else if (subStep === 'r1') setSubStep('r2');
    else if (subStep === 'r2') setSubStep('comparison');
    else if (subStep === 'comparison') setSubStep('q1');
    else if (subStep === 'q1') setSubStep('q2');
  };

  const handleTapAngle = (type) => {
    if (type === 'interior') {
      setR1Filled(true);
      setAnswerState('correct');
      setFeedbackText("Great! Interior angles are always inside the polygon.");
    } else {
      setAnswerState('wrong');
      setHintText("That is the angle on the outside of the shape. Tap the angle located within the polygon boundaries.");
    }
  };

  const handleR2Submit = (opt) => {
    setSelectedOption(opt);
    if (opt === 'exterior') {
      setAnswerState('correct');
      setFeedbackText("Excellent! Exterior angles are formed by extending a side of the polygon.");
    } else {
      setAnswerState('wrong');
      setHintText("This angle is located outside the shape and was formed by extending the side line.");
    }
  };

  const handleSortItem = (bucket) => {
    const activeCard = sortDeck[activeSortIndex];
    const isCorrect = activeCard.category === bucket;

    setSortedItems(prev => ({
      ...prev,
      [bucket]: [...prev[bucket], { ...activeCard, status: isCorrect ? 'correct' : 'wrong' }]
    }));

    if (activeSortIndex < sortDeck.length - 1) {
      setActiveSortIndex(activeSortIndex + 1);
    } else {
      setSortingFinished(true);
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', padding: '10px' }}>
      <div className="header-row">
        <button className="back-button" onClick={onBack}>← Back</button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--clr-accent)' }}>
        Contrast Challenge: Interior vs Exterior Angles
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--clr-text-soft)', fontSize: '1.05rem', margin: '0 0 28px 0' }}>
        Inside or Outside?
      </p>

      {/* Intro SubStep */}
      {subStep === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-accent)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Interior Angle</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>An angle formed inside a polygon between two adjacent side lines.</span>
            </div>
            <div style={{
              background: 'var(--clr-surface)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--clr-border)',
              width: '100%',
              maxWidth: '520px',
              boxShadow: 'var(--shadow-btn)',
              textAlign: 'center'
            }}>
              <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--clr-correct)', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Exterior Angle</strong>
              <span style={{ fontSize: '0.95rem', color: 'var(--clr-text-soft)' }}>An angle formed outside a polygon when one of its side lines is extended outward.</span>
            </div>
          </div>
          <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--clr-text)', marginBottom: '24px' }}>
            Let's explore a polygon vertex to find these angles visually!
          </p>
          <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Start Discovery</button>
        </div>
      )}

      {/* Round 1: Find the Interior */}
      {subStep === 'r1' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 1: Find the Interior Angle
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              A vertex of the pentagon is highlighted. Tap the angle that is situated inside the shape boundary.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Pentagon SVG */}
            <svg width="300" height="200" viewBox="0 0 300 200" style={{ marginBottom: '16px' }}>
              {/* Pentagon shape */}
              <polygon points="120,40 177,81.5 155,148.5 85,148.5 63,81.5" fill={r1Filled ? 'rgba(92,184,122,0.15)' : 'none'} stroke="var(--clr-text)" strokeWidth="3" />

              {/* Extended line for exterior angle */}
              <line x1="63" y1="81.5" x2="120" y2="40" stroke="var(--clr-text-soft)" strokeDasharray="4 4" strokeWidth="2" />
              <line x1="120" y1="40" x2="177" y2="-1.5" stroke="var(--clr-text-soft)" strokeDasharray="4 4" strokeWidth="2" />

              {/* Glowing vertex */}
              <circle cx="120" cy="40" r="6" fill="var(--clr-accent)" />

              {/* Clickable angle regions */}
              {/* Interior arc */}
              <path
                d="M 105 50 A 25 25 0 0 0 135 50 Z"
                fill={r1Filled ? 'var(--clr-correct)' : 'rgba(255,255,255,0.08)'}
                stroke="var(--clr-text-soft)"
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onClick={() => handleTapAngle('interior')}
              />
              <text x="120" y="70" fill="var(--clr-text)" fontSize="0.75rem" textAnchor="middle" style={{ pointerEvents: 'none' }}>Inside</text>

              {/* Exterior arc */}
              <path
                d="M 135 50 A 25 25 0 0 0 135 25 Z"
                fill="rgba(255,255,255,0.08)"
                stroke="var(--clr-text-soft)"
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onClick={() => handleTapAngle('exterior')}
              />
              <text x="145" y="32" fill="var(--clr-text-soft)" fontSize="0.75rem" style={{ pointerEvents: 'none' }}>Outside</text>
            </svg>
          </div>

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Extend Side →</button>
            </div>
          )}
        </div>
      )}

      {/* Round 2: Extend the Side */}
      {subStep === 'r2' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            background: 'var(--clr-surface)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '5px solid var(--clr-accent)',
            textAlign: 'left',
            maxWidth: '560px',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-btn)'
          }}>
            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--clr-accent)', fontSize: '1.05rem' }}>
              Round 2: Extend the Side
            </strong>
            <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
              Use the slider to extend the bottom edge of the pentagon to the right. Observe what angle forms outside.
            </p>
          </div>

          <div style={{ background: 'var(--clr-surface)', borderRadius: '12px', padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Pentagon SVG */}
            <svg width="300" height="200" viewBox="0 0 300 200" style={{ marginBottom: '16px' }}>
              {/* Pentagon shape */}
              <polygon points="120,40 177,81.5 155,148.5 85,148.5 63,81.5" fill="none" stroke="var(--clr-text)" strokeWidth="3" />

              {/* Extended base line */}
              {extensionLength > 0 && (
                <line x1="155" y1="148.5" x2={155 + extensionLength} y2="148.5" stroke="var(--clr-correct)" strokeWidth="3" strokeDasharray="4 3" />
              )}

              {/* Exterior Angle Arc */}
              {extensionLength >= 40 && (
                <>
                  <path d="M 175 148.5 A 20 20 0 0 0 162 127" fill="none" stroke="var(--clr-correct)" strokeWidth="2.5" />
                  <text x="180" y="122" fill="var(--clr-correct)" fontSize="0.8rem" fontWeight="bold">Created Angle</text>
                </>
              )}
            </svg>

            {/* Slider */}
            <div style={{ width: '100%', maxWidth: '240px', marginBottom: '16px' }}>
              <input
                type="range"
                min="0"
                max="60"
                value={extensionLength}
                onChange={(e) => setExtensionLength(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={answerState === 'correct'}
              />
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--clr-text-soft)' }}>
                {extensionLength >= 40 ? "Side fully extended!" : "Drag slider to extend the side line"}
              </div>
            </div>
          </div>

          {extensionLength >= 40 && (
            <>
              <p style={{ fontSize: '1.05rem', color: 'var(--clr-text)', marginBottom: '16px' }}>
                Which angle is created outside the shape by extending the side?
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                <button onClick={() => handleR2Submit('interior')} className={selectedOption === 'interior' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Interior Angle</button>
                <button onClick={() => handleR2Submit('exterior')} className={selectedOption === 'exterior' ? 'primary' : 'secondary'} style={{ padding: '12px 20px' }}>Exterior Angle</button>
              </div>
            </>
          )}

          {answerState === 'wrong' && (
            <div style={{ padding: '16px 20px', background: 'rgba(235, 94, 85, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-wrong)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{hintText}</p>
            </div>
          )}

          {answerState === 'correct' && (
            <div style={{ padding: '16px 20px', background: 'rgba(92, 184, 122, 0.1)', borderRadius: 'var(--radius-sm)', borderLeft: '5px solid var(--clr-correct)', textAlign: 'left', maxWidth: '500px', margin: '0 auto 20px auto' }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
              <button onClick={handleNextStep} style={{ marginTop: '12px', padding: '8px 20px' }}>Next: Comparison →</button>
            </div>
          )}
        </div>
      )}

      {/* Layer 2: Comparison Cards */}
      {subStep === 'comparison' && (
        <div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            {/* Interior Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-accent)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-accent)' }}>
                  INTERIOR ANGLE
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Formed inside the boundaries of the polygon.</li>
                  <li>Sits between two adjacent sides.</li>
                  <li>Example: Inner corners of a square ($90^\circ$).</li>
                </ul>
              </div>
            </div>

            {/* Exterior Card */}
            <div style={{
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              borderTop: '6px solid var(--clr-correct)',
              flex: '1 1 340px',
              maxWidth: '380px',
              boxShadow: 'var(--shadow-btn)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 12px 0', color: 'var(--clr-correct)' }}>
                  EXTERIOR ANGLE
                </h3>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  <li>Formed outside the polygon boundaries.</li>
                  <li>Sits between one side and the extension of the adjacent side.</li>
                  <li>Forms a straight $180^\circ$ line with the interior angle.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Common Misconception */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-wrong)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--clr-wrong)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Common Misconception
            </h4>
            <p style={{ margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
              Not any angle outside a polygon is an exterior angle. It must specifically form a straight $180^\circ$ line with the interior angle.
            </p>
          </div>

          {/* Decision Rule */}
          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '6px solid var(--clr-accent)',
            boxShadow: 'var(--shadow-btn)',
            marginBottom: '32px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--clr-accent)', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Decision Rule
            </h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '1.05rem' }}>Ask yourself: Is the angle...</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '16px' }}>
              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)' }}>Inside the polygon?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-accent)', display: 'block', marginTop: '12px' }}> Interior Angle</strong>
              </div>

              <div style={{ background: 'var(--clr-card)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--clr-border)', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--clr-text-soft)' }}>Outside after extending a side?</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--clr-correct)', display: 'block', marginTop: '12px' }}> Exterior Angle</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="secondary" onClick={() => setSubStep('intro')} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Try Again</button>
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Practice Rule ▶</button>
          </div>
        </div>
      )}

      {/* Layer 3: Practice Q1 */}
      {subStep === 'q1' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 1 of 2: Situation Matcher</p>

          <div style={{
            background: 'var(--clr-surface)',
            border: '1.5px solid var(--clr-border)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {!sortingFinished ? (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-soft)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Card ({activeSortIndex + 1} / {sortDeck.length})
                </span>
                <div style={{
                  background: 'var(--clr-card)',
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1.5px solid var(--clr-border)',
                  fontSize: '1.15rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-btn)',
                  maxWidth: '480px',
                  width: '100%',
                  marginBottom: '20px'
                }}>
                  {sortDeck[activeSortIndex].val}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button onClick={() => handleSortItem('interior')} style={{ padding: '10px 16px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-accent)' }}>
                    Interior
                  </button>
                  <button onClick={() => handleSortItem('exterior')} style={{ padding: '10px 16px', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-correct)' }}>
                    Exterior
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--clr-correct)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                🎉 Match complete! Review categorized cards below.
              </div>
            )}
          </div>

          {/* Columns */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '24px' }}>
            <div style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1.5px dashed var(--clr-accent)', flex: '1 1 240px', maxWidth: '300px', minHeight: '160px' }}>
              <strong style={{ display: 'block', color: 'var(--clr-accent)', fontSize: '1rem', marginBottom: '12px' }}> Interior</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                {sortedItems.interior.map((item, idx) => (
                  <div key={idx} style={{ padding: '6px 10px', background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)', border: `1px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`, borderRadius: '4px', fontSize: '0.85rem' }}>
                    {item.val}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', padding: '14px', border: '1.5px dashed var(--clr-correct)', flex: '1 1 240px', maxWidth: '300px', minHeight: '160px' }}>
              <strong style={{ display: 'block', color: 'var(--clr-correct)', fontSize: '1rem', marginBottom: '12px' }}> Exterior</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                {sortedItems.exterior.map((item, idx) => (
                  <div key={idx} style={{ padding: '6px 10px', background: item.status === 'correct' ? 'rgba(92,184,122,0.1)' : 'rgba(235,94,85,0.1)', border: `1px solid ${item.status === 'correct' ? 'var(--clr-correct)' : 'var(--clr-wrong)'}`, borderRadius: '4px', fontSize: '0.85rem' }}>
                    {item.val}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {sortingFinished && (
            <button onClick={handleNextStep} style={{ padding: '12px 24px', fontSize: '1.05rem', marginTop: '32px' }}>Next Question →</button>
          )}
        </div>
      )}

      {/* Layer 3: Practice Q2 */}
      {subStep === 'q2' && (
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--clr-accent)', marginBottom: '16px' }}>Apply the Concept</h3>
          <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '24px' }}>Question 2 of 2: Build It</p>

          <div style={{
            background: 'var(--clr-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--clr-border)',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--clr-text)', marginBottom: '12px', fontWeight: '500' }}>
              Drag the slider below to extend the bottom edge of the triangle outward.
            </p>
            <p style={{ fontSize: '1rem', color: 'var(--clr-text-soft)', marginBottom: '20px' }}>
              Goal: Create an exterior angle.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              {/* Triangle SVG */}
              <svg width="240" height="160" viewBox="0 0 240 160" style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--clr-border)', marginBottom: '16px' }}>
                {/* Triangle shape */}
                <polygon points="120,30 160,110 80,110" fill="none" stroke="var(--clr-text)" strokeWidth="3" />

                {/* Base extension line */}
                {q2Extension > 0 && (
                  <line x1="160" y1="110" x2={160 + q2Extension} y2="110" stroke="var(--clr-correct)" strokeWidth="3" strokeDasharray="4 3" />
                )}

                {/* Exterior Angle Arc */}
                {q2Extension >= 45 && (
                  <>
                    <path d="M 180 110 A 20 20 0 0 0 170 92" fill="none" stroke="var(--clr-correct)" strokeWidth="2.5" />
                    <circle cx="173" cy="100" r="4" fill="var(--clr-correct)" />
                  </>
                )}
              </svg>

              {/* Slider */}
              <div style={{ width: '100%', maxWidth: '240px' }}>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={q2Extension}
                  onChange={(e) => setQ2Extension(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                  disabled={q2Finished}
                />
              </div>
            </div>
          </div>

          {q2Finished && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '16px 20px',
                background: 'rgba(92, 184, 122, 0.1)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '5px solid var(--clr-correct)',
                textAlign: 'left',
                maxWidth: '560px',
                margin: '0 auto 20px auto'
              }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--clr-correct)' }}>
                  Success!
                </strong>
                <p style={{ margin: 0, fontSize: '0.98rem', lineHeight: '1.5' }}>
                  Great! You created an exterior angle by extending one side.
                </p>
              </div>
              <button onClick={onComplete} style={{ padding: '12px 24px', fontSize: '1.05rem' }}>Finish Challenge</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
