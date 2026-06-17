/**
 * SockJS + STOMP：连接 GET /ws?token=…，订阅 /user/queue/chat。
 * 多页面通过 addChatRealtimeListener 订阅；全部卸载且无会话时断开。
 */
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { getBackendOrigin } from '@/utils/url';
import type { ChatRealtimeEvent } from '@/types';

let stomp: Client | null = null;
let refCount = 0;
const listeners = new Set<(e: ChatRealtimeEvent) => void>();

function wsUrl(): string {
  const t = localStorage.getItem('token');
  if (!t) throw new Error('no token');
  return `${getBackendOrigin()}/ws?token=${encodeURIComponent(t)}`;
}

function connect() {
  if (stomp?.active) return;
  const token = localStorage.getItem('token');
  if (!token) return;

  const c = new Client({
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    webSocketFactory: () => new SockJS(wsUrl()) as unknown as WebSocket,
    onConnect: () => {
      c.subscribe('/user/queue/chat', (frame) => {
        try {
          const ev = JSON.parse(frame.body) as ChatRealtimeEvent;
          listeners.forEach((fn) => {
            try {
              fn(ev);
            } catch {
              /* ignore */
            }
          });
        } catch {
          /* ignore */
        }
      });
    },
    onStompError: (frame) => {
      console.warn('[chat STOMP]', frame.headers['message'] ?? frame.body);
    },
  });
  c.activate();
  stomp = c;
}

/** 订阅实时事件；返回取消函数 */
export function addChatRealtimeListener(fn: (e: ChatRealtimeEvent) => void): () => void {
  listeners.add(fn);
  refCount++;
  try {
    connect();
  } catch (e) {
    console.warn('[chat] connect', e);
  }
  return () => {
    listeners.delete(fn);
    refCount--;
    if (refCount <= 0) {
      stomp?.deactivate();
      stomp = null;
    }
  };
}

/** 登出时断开并清空监听 */
export function disconnectChatStomp(): void {
  listeners.clear();
  refCount = 0;
  stomp?.deactivate();
  stomp = null;
}
