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

    // Real-time GPS Breadcrumb Tracking from Tourist App (Privacy-Controlled)
    socket.on('tourist_location_update', (data) => {
      const { userId, latitude, longitude, speed, heading, touristName, locationSharingEnabled = true, isSosActive = false } = data;

      // DO NOT broadcast or track if tourist disabled location sharing AND no active SOS emergency
      if (!locationSharingEnabled && !isSosActive) {
        liveTouristLocations.delete(userId);
        io.to('admin_dispatch').emit('tourist_location_sharing_stopped', { userId, touristName });
        return;
      }

      // Store latest position in-memory
      liveTouristLocations.set(userId, {
        userId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        touristName: touristName || `Tourist #${userId}`,
        socketId: socket.id,
        locationSharingEnabled,
        isSosActive,
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
        locationSharingEnabled,
        isSosActive,
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

const broadcastTouristActivity = (activity) => {
  if (ioInstance) {
    const payload = {
      id: activity.id || Date.now(),
      type: activity.type || 'general', // 'vehicle_booking', 'food_booking', 'travel_booking', 'sos_alert', 'incident_report'
      title: activity.title || 'Tourist Activity',
      description: activity.description || '',
      touristName: activity.touristName || 'Tourist',
      touristPhone: activity.touristPhone || '',
      details: activity.details || {},
      timestamp: new Date().toISOString()
    };

    logger.info(`[WebSocket] Broadcasting tourist activity: ${payload.type} - ${payload.title}`);
    
    // Broadcast to all admin and dispatch rooms
    ioInstance.to('admin_dispatch').to('police_dispatch').emit('tourist_activity', payload);

    // Specific event broadcasts for admin sub-dashboards
    if (activity.type === 'vehicle_booking') {
      ioInstance.to('admin_dispatch').emit('new_vehicle_booking', payload);
    } else if (activity.type === 'food_booking') {
      ioInstance.to('admin_dispatch').emit('new_food_order', payload);
    } else if (activity.type === 'travel_booking') {
      ioInstance.to('admin_dispatch').emit('new_travel_booking', payload);
    } else if (activity.type === 'incident_report') {
      ioInstance.to('admin_dispatch').emit('new_incident_report', payload);
    }
  }
};

module.exports = {
  initializeSocket,
  broadcastSosAlert,
  broadcastSosStatusChange,
  broadcastTouristActivity
};
