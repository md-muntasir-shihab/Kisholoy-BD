/**
 * KISHOLOY Telemetry & User Authentication Logging Utility
 * Tracks user login, logout, session events, and page activities
 * with local persistence and server-synchronization capabilities.
 */

export interface TelemetryAuthEvent {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  role: string;
  eventType: 'LOGIN_SUCCESS' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_RESET' | 'CART_CHECKOUT' | 'SESSION_TIMEOUT';
  ip: string;
  district: string;
  division?: string;
  city?: string;
  device: string;
  browser?: string;
  os?: string;
  timestamp: string;
  sessionDurationSecs?: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  meta?: Record<string, any>;
}

export interface ActivityTrace {
  id: string;
  sessionId: string;
  ip: string;
  district: string;
  page: string;
  action: string;
  device: 'Mobile' | 'Desktop' | 'Tablet';
  durationSeconds: number;
  timestamp: string;
}

const STORAGE_KEY_AUTH_EVENTS = 'kisholoy_telemetry_auth_logs';
const STORAGE_KEY_USER_SESSION = 'kisholoy_telemetry_current_session';

/**
 * Capture and record a user login/logout or authentication security event
 */
export function logAuthEvent(event: Omit<TelemetryAuthEvent, 'id' | 'timestamp' | 'ip'> & { ip?: string; timestamp?: string }): TelemetryAuthEvent {
  const generatedIp = event.ip || getClientIpGuess();
  const newEvent: TelemetryAuthEvent = {
    ...event,
    id: `auth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ip: generatedIp,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  try {
    const existing = getStoredAuthEvents();
    const updated = [newEvent, ...existing.slice(0, 99)]; // Keep latest 100
    localStorage.setItem(STORAGE_KEY_AUTH_EVENTS, JSON.stringify(updated));

    // Handle session timing
    if (event.eventType === 'LOGIN_SUCCESS') {
      localStorage.setItem(STORAGE_KEY_USER_SESSION, JSON.stringify({
        userId: event.userId,
        userName: event.userName,
        loginTime: Date.now(),
        ip: generatedIp,
        district: event.district
      }));
    } else if (event.eventType === 'LOGOUT') {
      localStorage.removeItem(STORAGE_KEY_USER_SESSION);
    }
  } catch (err) {
    console.error('Failed to persist auth log event', err);
  }

  // Attempt server-side sync in background (non-blocking)
  try {
    fetch('/api/analytics/log-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    }).catch(() => {});
  } catch {}

  return newEvent;
}

/**
 * Retrieve stored authentication events from local storage
 */
export function getStoredAuthEvents(): TelemetryAuthEvent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_AUTH_EVENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading auth logs', err);
  }
  return [];
}

/**
 * Clear stored auth logs
 */
export function clearStoredAuthEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH_EVENTS);
  } catch {}
}

/**
 * Guess client device and IP for logging simulation
 */
function getClientIpGuess(): string {
  const octet1 = 103;
  const octet2 = Math.floor(Math.random() * 80) + 120;
  const octet3 = Math.floor(Math.random() * 250) + 1;
  const octet4 = Math.floor(Math.random() * 250) + 1;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}
