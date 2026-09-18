import { PromptResponse, LiveStateSnapshot } from './types';

const host = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';
const API_BASE = `http://${host}:8000`;
const WS_BASE = `ws://${host}:8000`;

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchContext() {
  const res = await fetch(`${API_BASE}/context`);
  return res.json();
}

export async function fetchContextSummary() {
  const res = await fetch(`${API_BASE}/context/summary`);
  return res.json();
}

export async function fetchLiveState(): Promise<LiveStateSnapshot> {
  const res = await fetch(`${API_BASE}/live`);
  return res.json();
}

export async function sendPrompt(prompt: string): Promise<PromptResponse> {
  const res = await fetch(`${API_BASE}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to process prompt');
  }
  return res.json();
}

export async function sendMachineChange(action: string) {
  const res = await fetch(`${API_BASE}/machine/change`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  return res.json();
}

export async function triggerTempSpike() {
  const res = await fetch(`${API_BASE}/trigger_spike`, { method: 'POST' });
  return res.json();
}

export async function sendCommand(tag: string, value: any = true) {
  const res = await fetch(`${API_BASE}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag, value }),
  });
  return res.json();
}

export function connectLiveWebSocket(onUpdate: (snapshot: LiveStateSnapshot) => void): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/live`);
  
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'LIVE_UPDATE' || msg.type === 'INITIAL_STATE') {
        onUpdate(msg.data);
      }
    } catch (err) {
      console.error('[WS Parse Error]', err);
    }
  };

  ws.onerror = (err) => {
    console.warn('[WS Error]', err);
  };

  return ws;
}
