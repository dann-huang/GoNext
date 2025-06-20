import { GameName } from '@/types/wsTypes';

export const RECONNECT_INITIAL_DELAY = 5000;
export const RECONNECT_MAX_DELAY = 10000;
export const RECONNECT_MAX_ATTEMPTS = 10;

export const REFRESH_BEFORE = 60000;

export const WS_URL = typeof window === 'undefined'
  ? 'ws://localhost:3000/api/live'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/live`;

  
  export const GAME_DISPLAY_NAMES: Record<GameName | '', string> = {
    '': 'Nothing',
    tictactoe: 'Tic Tac Toe',
    connect4: 'Connect 4',
  };
  
  export const DRAW_CANVAS_WIDTH = 1600;
  export const DRAW_CANVAS_HEIGHT = 900;
  export const DRAW_START_COLOR = '#777777';
  export const DRAW_START_WIDTH = 2;
  export const DRAW_STROKE_INTERVAL = 100;