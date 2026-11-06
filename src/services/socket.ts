type SocketEventHandler = (payload: any) => void;

class SocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventHandler>> = new Map();
  private reconnectTimer: number | null = null;
  private currentUserId: string | null = null;

  connect(userId: string) {
    this.currentUserId = userId;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.identify(userId);
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.currentUserId) {
          this.identify(this.currentUserId);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const { event: evtName, payload } = JSON.parse(event.data);
          const handlers = this.listeners.get(evtName);
          if (handlers) {
            handlers.forEach((h) => h(payload));
          }
        } catch (err) {
          console.error('Socket message parse error:', err);
        }
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('Socket connection error, reconnecting soon...', err);
        this.ws?.close();
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (this.currentUserId) {
        this.connect(this.currentUserId);
      }
    }, 2500);
  }

  identify(userId: string) {
    this.send('auth:identify', { userId });
  }

  send(event: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
    }
  }

  on(event: string, handler: SocketEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: SocketEventHandler) {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socket = new SocketClient();
