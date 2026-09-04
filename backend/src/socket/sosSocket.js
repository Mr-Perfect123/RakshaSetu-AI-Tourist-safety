const logger = require('../utils/logger');
const LocationPermissionService = require('../services/locationPermissionService');

let ioInstance = null;

// Track connected tourists' live locations in-memory
const liveTouristLocations = new Map();

const initializeSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    logger.info(`[WebSocket] Client connected: ${socket.id}`);

    // Join room based on user role or custom channel
    socket.on('join_room', async (data = {}) => {
      const room = data.room || 'general';
      const requestingAdminId = data.adminId || socket.userId || data.userId || null;
      socket.join(room);
      logger.info(`[WebSocket] Client ${socket.id} (user #${requestingAdminId || 'guest'}) joined room '${room}'`);

      // When admin joins dispatch room, send ONLY authorized live tourist locations
      if (room === 'admin_dispatch' || room === 'police_dispatch') {
        const allLocations = Array.from(liveTouristLocations.values());
        const authorizedLocations = [];

        if (requestingAdminId) {
          for (const loc of allLocations) {
            const canView = await LocationPermissionService.canAdminViewTouristLocation(requestingAdminId, loc.userId);
            if (canView) {
              authorizedLocations.push(loc);
            }
          }
        }
        socket.emit('all_tourist_locations', authorizedLocations);
      }
    });

    // Real-time GPS Breadcrumb Tracking from Tourist App (Strict Location Consent Enforced)
    socket.on('tourist_location_update', async (data) => {
      const { userId, latitude, longitude, speed, heading, touristName, locationSharingEnabled = true, isSosActive = false } = data;
      if (!userId) return;

      const numericUserId = parseInt(userId, 10);

      // Verify global sharing and SOS status from backend
      const isGlobalOn = await LocationPermissionService.isGlobalSharingActive(numericUserId);
      const isSosActiveBackend = await LocationPermissionService.hasActiveSosEmergency(numericUserId);

      const effectiveSharing = (locationSharingEnabled && isGlobalOn) || isSosActive || isSosActiveBackend;

      // DO NOT broadcast or track if tourist disabled location sharing AND no active SOS emergency
      if (!effectiveSharing) {
        liveTouristLocations.delete(numericUserId);
        io.emit('tourist_location_revoked', { userId: numericUserId, touristName });
        io.emit('tourist_location_sharing_stopped', { userId: numericUserId, touristName });
        return;
      }

      const locationPayload = {
        userId: numericUserId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: parseFloat(speed) || 0,
        heading: parseFloat(heading) || 0,
        touristName: touristName || `Tourist #${numericUserId}`,
        socketId: socket.id,
        locationSharingEnabled: true,
        isSosActive: Boolean(isSosActive || isSosActiveBackend),
        timestamp: new Date().toISOString()
      };

      // Store latest position in-memory
      liveTouristLocations.set(numericUserId, locationPayload);

      // Targeted broadcast to connected sockets based on individual admin authorization
      const sockets = await io.fetchSockets();
      for (const s of sockets) {
        const sAdminId = s.userId || s.handshake?.auth?.userId;
        if (sAdminId) {
          const canView = await LocationPermissionService.canAdminViewTouristLocation(sAdminId, numericUserId);
          if (canView) {
            s.emit('live_tourist_location', locationPayload);
          } else {
            s.emit('tourist_location_revoked', { userId: numericUserId });
          }
        } else {
          // Fallback to room emit for authorized room listeners
          io.to('admin_dispatch').emit('live_tourist_location', locationPayload);
          break;
        }
      }
    });

    // Real-time SOS Trigger Event
    socket.on('trigger_sos_event', (sosPayload) => {
      logger.emergency(`[WebSocket Emergency Broadcast] SOS Triggered: ${sosPayload.sosCode || sosPayload.sos_code}`);
      // High-priority broadcast to all emergency rooms
      io.to('admin_dispatch').to('police_dispatch').to('hospital_dispatch').emit('new_sos_alert', sosPayload);

      // Also emit notification for admin toast/banners
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
      io.emit('receive_chat_message', {
        message,
        user: adminName || 'Admin Dispatcher',
        isFromAdmin: true,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      logger.info(`[WebSocket] Client disconnected: ${socket.id}`);
      for (const [uId, data] of liveTouristLocations.entries()) {
        if (data.socketId === socket.id) {
          liveTouristLocations.delete(uId);
          io.to('admin_dispatch').emit('tourist_disconnected', { userId: uId });
          break;
        }
      }
    });
  });
};

const emitSocketLocationRevoked = (userId) => {
  const numericUserId = parseInt(userId, 10);
  liveTouristLocations.delete(numericUserId);
  if (ioInstance) {
    ioInstance.emit('tourist_location_revoked', { userId: numericUserId });
    ioInstance.emit('tourist_location_sharing_stopped', { userId: numericUserId });
  }
};

const broadcastSosAlert = (sosData) => {
  if (ioInstance) {
    logger.emergency(`[Broadcasting SOS Alert via Socket] Code: ${sosData.sos_code || sosData.id}`);
    ioInstance.to('admin_dispatch').to('police_dispatch').to('hospital_dispatch').emit('new_sos_alert', sosData);

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
      type: activity.type || 'general',
      title: activity.title || 'Tourist Activity',
      description: activity.description || '',
      touristName: activity.touristName || 'Tourist',
      touristPhone: activity.touristPhone || '',
      details: activity.details || {},
      timestamp: new Date().toISOString()
    };

    logger.info(`[WebSocket] Broadcasting tourist activity: ${payload.type} - ${payload.title}`);
    
    ioInstance.to('admin_dispatch').to('police_dispatch').emit('tourist_activity', payload);

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
  emitSocketLocationRevoked,
  broadcastSosAlert,
  broadcastSosStatusChange,
  broadcastTouristActivity
};
