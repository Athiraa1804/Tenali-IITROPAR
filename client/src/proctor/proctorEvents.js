/**
 * proctorEvents.js — Utility to send proctor events to the server.
 */

const API = import.meta.env?.VITE_API_BASE_URL || '';

function getToken() {
  try { return localStorage.getItem('tenali-auth-token') || null } catch { return null }
}

export async function reportProctorEvent({ sessionId, type, severity = 1, evidence, metadata, sessionStatus }) {
  const token = getToken();
  if (!token || !sessionId) return null;
  try {
    const r = await fetch(`${API}/api/proctor/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ sessionId, type, severity, evidence, metadata, sessionStatus }),
    });
    return r.ok ? await r.json() : null;
  } catch { return null }
}

export async function startProctorSession({ quizType, settings, consentGiven }) {
  const token = getToken();
  if (!token) return null;
  try {
    const r = await fetch(`${API}/api/proctor/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ quizType, settings, consentGiven }),
    });
    return r.ok ? await r.json() : null;
  } catch { return null }
}

export async function endProctorSession(sessionId) {
  const token = getToken();
  if (!token || !sessionId) return null;
  try {
    const r = await fetch(`${API}/api/proctor/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ sessionId }),
    });
    return r.ok ? await r.json() : null;
  } catch { return null }
}

export async function submitEmotion({ quizType, emotion, feedback }) {
  const token = getToken();
  if (!token) return null;
  try {
    const r = await fetch(`${API}/api/emotions/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ quizType, emotion, feedback }),
    });
    return r.ok ? await r.json() : null;
  } catch { return null }
}

export async function captureScreenshot(videoElement) {
  if (!videoElement) return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 320;
    canvas.height = videoElement.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.6);
  } catch { return null }
}
