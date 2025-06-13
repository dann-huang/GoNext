export const RECONNECT_INITIAL_DELAY = 5000;
export const RECONNECT_MAX_DELAY = 10000;
export const RECONNECT_MAX_ATTEMPTS = 10;

export const REFRESH_BEFORE = 60000;

export const WS_URL = typeof window === 'undefined' 
  ? 'ws://localhost:3000/api/live'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/live`;

export const DRAW_STROKE_INTERVAL = 100;