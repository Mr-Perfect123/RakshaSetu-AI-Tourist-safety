import { io } from 'socket.io-client';

/**
 * Resolves the Socket.IO server URL for the Admin Dashboard.
 * 
 * Supports:
 * - Direct VITE_SOCKET_URL (e.g. "https://<render-backend>.onrender.com")
 * - Derivation from VITE_API_URL origin
 * - Local development fallback ("http://localhost:5000")
 */
export const getSocketUrl = () => {
  const rawSocket = import.meta.env.VITE_SOCKET_URL;
  if (rawSocket && typeof rawSocket === 'string' && rawSocket.trim() !== '') {
    return rawSocket.trim().replace(/\/+$/, '');
  }

  const rawApi = import.meta.env.VITE_API_URL;
  if (rawApi && typeof rawApi === 'string' && rawApi.trim() !== '') {
    try {
      const url = new URL(rawApi.trim());
      return url.origin;
    } catch {
      return rawApi.trim().replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
    }
  }

  if (
    import.meta.env.DEV || 
    import.meta.env.MODE === 'development' || 
    (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '3000'))
  ) {
    return 'http://localhost:5000';
  }

  console.error('[RakshaSetu Socket Error] Missing VITE_SOCKET_URL or VITE_API_URL in production environment.');
  return typeof window !== 'undefined' ? window.location.origin : '/';
};

const socket = io(getSocketUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('[Dashboard Socket] Connected to RakshaSetu emergency stream:', socket.id);
  socket.emit('join_room', { room: 'admin_dispatch' });
  socket.emit('join_room', { room: 'police_dispatch' });
});

export default socket;
