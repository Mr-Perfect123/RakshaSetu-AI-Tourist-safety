import { io } from 'socket.io-client';

const SOCKET_URL = (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '3000'))
  ? 'http://localhost:5005'
  : '/';

const socket = io(SOCKET_URL, {
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
