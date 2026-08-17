import React from 'react';

const LearningVisual = ({ visual }) => {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1.5rem',
    background: 'var(--clr-card, #f9f9f9)',
    borderRadius: '12px',
    marginBottom: '1rem',
    border: '1px solid var(--clr-border, #eee)',
    width: '100%',
    overflowX: 'auto'
  };

  const svgBaseStyle = {
    overflow: 'visible',
    fontFamily: 'inherit',
    fontWeight: '600',
    fill: 'var(--clr-text, #333)'
  };

  const strokeColor = 'var(--clr-text, #333)';
  const highlightColor = 'var(--clr-accent, #2ea043)';
  const secondaryColor = '#0275d8';

  if (visual === 'angle-concept') {
    return null; // Will be handled by DragAngle instead
  }

  if (visual === 'angle-types') {
    return null; // Handled by our new interactive step
  }

  if (visual === 'straight-line') {
    return (
      <div style={containerStyle}>
        <svg width="260" height="145" viewBox="0 0 260 145" style={svgBaseStyle}>
          {/* Straight line */}
          <line x1="20" y1="115" x2="240" y2="115" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          {/* Intersecting line */}
          <line x1="130" y1="115" x2="195" y2="35" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="130" cy="115" r="5" fill={strokeColor} />
          
          {/* 110 deg Arc */}
          <path d="M 90 115 A 40 40 0 0 1 157 84" fill="none" stroke={secondaryColor} strokeWidth="3" />
          <text x="65" y="55" fontSize="16" fill={secondaryColor}>110°</text>
          
          {/* 70 deg Arc */}
          <path d="M 157 84 A 40 40 0 0 1 170 115" fill="none" stroke={highlightColor} strokeWidth="3" />
          <text x="178" y="90" fontSize="16" fill={highlightColor}>70°</text>

          <text x="130" y="140" fontSize="14" textAnchor="middle" fill={strokeColor}>110° + 70° = 180°</text>
        </svg>
      </div>
    );
  }

  if (visual === 'worked-example') {
    return (
      <div style={containerStyle}>
        <svg width="260" height="140" viewBox="0 0 260 140" style={svgBaseStyle}>
          {/* Straight line */}
          <line x1="20" y1="115" x2="240" y2="115" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          {/* Intersecting line */}
          <line x1="130" y1="115" x2="200" y2="30" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="130" cy="115" r="5" fill={strokeColor} />
          
          {/* 135 deg Arc */}
          <path d="M 80 115 A 50 50 0 0 1 162 76" fill="none" stroke={secondaryColor} strokeWidth="3" />
          <text x="55" y="48" fontSize="16" fill={secondaryColor}>135°</text>
          
          {/* 45 deg Arc */}
          <path d="M 162 76 A 50 50 0 0 1 180 115" fill="none" stroke={highlightColor} strokeWidth="3" />
          <text x="190" y="88" fontSize="16" fill={highlightColor}>45°</text>
        </svg>
      </div>
    );
  }

  if (visual === 'pitfall') {
    return (
      <div style={{ ...containerStyle, gap: '3rem', flexWrap: 'wrap' }}>
        {/* Straight line = 180 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg width="130" height="110" viewBox="0 0 130 110" style={svgBaseStyle}>
            {/* Degree label — above the arc */}
            <text x="65" y="18" fontSize="16" fontWeight="700" textAnchor="middle" fill={highlightColor}>180°</text>
            {/* Baseline */}
            <line x1="10" y1="90" x2="120" y2="90" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
            {/* Center dot */}
            <circle cx="65" cy="90" r="4" fill={strokeColor} />
            {/* Semicircle arc */}
            <path d="M 20 90 A 45 45 0 0 1 110 90" fill="none" stroke={highlightColor} strokeWidth="3" />
          </svg>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '4px' }}>Straight Line</span>
        </div>
        
        {/* Full circle = 360 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg width="130" height="110" viewBox="0 0 130 110" style={svgBaseStyle}>
            {/* Degree label — above the circle */}
            <text x="65" y="18" fontSize="16" fontWeight="700" textAnchor="middle" fill={secondaryColor}>360°</text>
            {/* Circle */}
            <path d="M 65 35 A 32 32 0 1 1 64.9 35" fill="none" stroke={secondaryColor} strokeWidth="3" />
            {/* Dashed diameter */}
            <line x1="33" y1="67" x2="97" y2="67" stroke={strokeColor} strokeWidth="2" strokeDasharray="4" />
            {/* Center dot */}
            <circle cx="65" cy="67" r="4" fill={strokeColor} />
          </svg>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '4px' }}>Full Circle</span>
        </div>
      </div>
    );
  }

  return null;
};

export default LearningVisual;
