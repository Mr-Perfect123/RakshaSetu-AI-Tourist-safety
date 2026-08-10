const logger = require('../utils/logger');

let ioInstance = null;

// Track connected tourists' live locations in-memory
const liveTouristLocations = new Map();

const initializeSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    logger.info(`[WebSocket] Client connected: ${socket.id}`);

    // Join room based on user role or custom channel
    socket.on('join_room', (data) => {
      const room = data.room || 'general';
      socket.join(room);
      logger.info(`[WebSocket] Client ${socket.id} joined room '${room}'`);

      // When admin joins, send them current live tourist locations
      if (room === 'admin_dispatch') {
        const allLocations = Array.from(liveTouristLocations.values());
        socket.emit('all_tourist_locations', allLocations);
      }
    });

    // Real-time GPS Breadcrumb Tracking from Tourist App
    socket.on('tourist_location_update', (data) => {
      const { userId, latitude, longitude, speed, heading, touristName } = data;

      // Store latest position in-memory
      liveTouristLocations.set(userId, {
        userId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        touristName: touristName || `Tourist #${userId}`,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Broadcast location update to Admin & Police Dispatch rooms
      io.to('admin_dispatch').to('police_dispatch').emit('live_tourist_location', {
        userId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        touristName: touristName || `Tourist #${userId}`,
        timestamp: new Date().toISOString()
      });
    });

    // Real-time SOS Trigger Event
    socket.on('trigger_sos_event', (sosPayload) => {
      logger.emergency(`[WebSocket Emergency Broadcast] SOS Triggered: ${sosPayload.sosCode || sosPayload.sos_code}`);
      // High-priority broadcast to all emergency rooms
      io.to('admin_dispatch').to('police_dispatch').to('hospital_dispatch').emit('new_sos_alert', sosPayload);

      // Also emit a human-readable notification for admin toast/banners
      io.to('admin_dispatch').emit('sos_notification', {
        type: 'SOS_TRIGGERED',
        title: '🚨 EMERGENCY SOS ALERT',
        message: `${sosPayload.touristName || 'A tourist'} has triggered an SOS emergency! Code: ${sosPayload.sos_code || sosPayload.sosCode || 'UNKNOWN'}. Location: ${sosPayload.address || 'GPS Broadcasted'}.`,
        sosData: sosPayload,
        timestamp: new Date().toISOString()
      });
    });

    // Tourist-to-Admin live chat message relay
    socket.on('send_chat_message', (data) => {
      const { message, user, userId } = data;
      logger.info(`[WebSocket Chat] Message from ${user || 'Tourist'}: ${message?.substring(0, 50)}...`);

      // Relay to admin dispatch room
      io.to('admin_dispatch').emit('receive_chat_message', {
        message,
        user: user || 'Tourist',
        userId: userId || null,
        timestamp: new Date().toISOString(),
        isFromTourist: true
      });
    });

    // Admin-to-Tourist chat message reply
    socket.on('admin_chat_reply', (data) => {
      const { message, targetUserId, adminName } = data;
      // Broadcast to all tourist clients (they filter by userId)
      io.emit('receive_chat_message', {
        message,
        user: adminName || 'Admin Dispatcher',
        isFromAdmin: true,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      logger.info(`[WebSocket] Client disconnected: ${socket.id}`);
      // Remove tourist from live tracking on disconnect
      for (const [userId, data] of liveTouristLocations.entries()) {
        if (data.socketId === socket.id) {
          liveTouristLocations.delete(userId);
          io.to('admin_dispatch').emit('tourist_disconnected', { userId });
          break;
        }
      }
    });
  });
};

const broadcastSosAlert = (sosData) => {
  if (ioInstance) {
    logger.emergency(`[Broadcasting SOS Alert via Socket] Code: ${sosData.sos_code || sosData.id}`);
    ioInstance.to('admin_dispatch').to('police_dispatch').to('hospital_dispatch').emit('new_sos_alert', sosData);

    // Also emit notification event for admin UI
    ioInstance.to('admin_dispatch').emit('sos_notification', {
      type: 'SOS_TRIGGERED',
      title: '🚨 EMERGENCY SOS ALERT',
      message: `${sosData.touristName || 'A tourist'} triggered SOS! Code: ${sosData.sos_code || sosData.id}. Responders notified.`,
      sosData,
      timestamp: new Date().toISOString()
    });
  }
};

const broadcastSosStatusChange = (sosId, status, details = {}) => {
  if (ioInstance) {
    ioInstance.emit('sos_status_updated', { sosId, status, ...details, timestamp: new Date().toISOString() });
  }
};

module.exports = {
  initializeSocket,
  broadcastSosAlert,
  broadcastSosStatusChange
};
