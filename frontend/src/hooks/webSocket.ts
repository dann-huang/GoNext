import { useState, useEffect, useCallback, useRef } from 'react';
import {
  IncomingMsg,
  OutgoingMsg,
  WsStatus,
} from '@/types/websocket';

interface UseWebSocketProps {
  url: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  onMessage: (message: IncomingMsg) => void;
  shouldConnect: boolean;
}

export const useWebSocket = ({
  url,
  onOpen,
  onClose,
  onError,
  onMessage,
  shouldConnect
}: UseWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const messageQueue = useRef<string[]>([]);

  const sendMessage = useCallback((message: OutgoingMsg) => {
    const messageString = JSON.stringify(message);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(messageString);
    } else {
      console.warn('WebSocket not open, queuing message:', message);
      messageQueue.current.push(messageString);
    }
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let isMounted = true;

    if (shouldConnect && status === 'disconnected') {
      setStatus('connecting');
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) {
          setStatus('connected');
          onOpen?.();
          while (messageQueue.current.length > 0) {
            const msg = messageQueue.current.shift();
            if (msg) wsRef.current?.send(msg);
          }
        }
      };

      ws.onmessage = (event) => {
        if (isMounted) {
          try {
            const parsedMessage: IncomingMsg = JSON.parse(event.data);
            onMessage(parsedMessage);
          } catch (e) {
            console.error('WebSocket message parsing error:', e, event.data);
          }
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          setStatus('disconnected');
          onClose?.();
          wsRef.current = null;
        }
      };

      ws.onerror = (event) => {
        if (isMounted) {
          setStatus('disconnected');
          onError?.(event);
          wsRef.current?.close(); // Ensure it's closed on error
        }
      };
    } else if (!shouldConnect && wsRef.current && status !== 'disconnected') {
      // Explicitly close if shouldConnect becomes false and it's currently connected/connecting
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
      setStatus('disconnected'); // Ensure status is updated
    }

    // Cleanup function for useEffect
    return () => {
      isMounted = false; // Prevent state updates on unmounted component
      if (wsRef.current) {
        // Check if the WebSocket is still open/connecting before closing
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
    };
  }, [url, shouldConnect, onOpen, onClose, onError, onMessage, status]);

  return { status, sendMessage };
};