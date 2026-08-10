import { io } from 'socket.io-client';

const socket = io(window.location.origin, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10
});

socket.on('connect', () => {
  console.log('[Dashboard Socket] Connected to RakshaSetu emergency stream:', socket.id);
  socket.emit('join_room', { room: 'admin_dispatch' });
});

export default socket;
