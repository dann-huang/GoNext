export const RECONNECT_INITIAL_DELAY = 500;
export const RECONNECT_MAX_DELAY = 10000;
export const RECONNECT_MAX_ATTEMPTS = 10;

// Since we're using Nginx, we can use relative URLs
export const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/live`;

export const DRAW_STROKE_INTERVAL = 50; // ms between stroke points