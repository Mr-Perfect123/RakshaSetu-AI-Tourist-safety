import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.port === '3000' || window.location.port === '5173')
    ? 'http://localhost:5005'
    : '/'
);

const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('[Socket] Connected to RakshaSetu Emergency Dispatch Gateway:', socket.id);
});

export default socket;
