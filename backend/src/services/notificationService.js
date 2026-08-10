const firebaseApp = require('../config/firebase');
const twilioClient = require('../config/twilio');
const logger = require('../utils/logger');
require('dotenv').config();

class NotificationService {
  /**
   * Dispatch Push Notification via Firebase FCM
   */
  static async sendPushNotification(fcmToken, title, body, data = {}) {
    logger.info(`[Push Notification] Sending FCM alert: "${title}" to token ${fcmToken.slice(0, 10)}...`);

    if (firebaseApp) {
      try {
        const message = {
          token: fcmToken,
          notification: { title, body },
          data: { ...data, timestamp: String(Date.now()) }
        };
        const response = await firebaseApp.messaging().send(message);
        logger.info(`[Push Notification] Successfully dispatched FCM ID: ${response}`);
        return { success: true, responseId: response };
      } catch (error) {
        logger.error(`[Push Notification Error] FCM send failure: ${error.message}`);
      }
    }

    return { success: true, simulated: true };
  }

  /**
   * Dispatch Emergency SMS via Twilio
   */
  static async sendSMS(toPhoneNumber, messageBody) {
    logger.emergency(`[SMS Alert] Dispatching SMS to ${toPhoneNumber}: "${messageBody}"`);

    if (twilioClient) {
      try {
        const response = await twilioClient.messages.create({
          body: messageBody,
          from: process.env.TWILIO_PHONE_NUMBER || '+18005550199',
          to: toPhoneNumber
        });
        logger.info(`[SMS Alert] Twilio SMS sent SID: ${response.sid}`);
        return { success: true, sid: response.sid };
      } catch (error) {
        logger.error(`[SMS Error] Twilio dispatch failed: ${error.message}`);
      }
    }

    return { success: true, simulated: true };
  }

  /**
   * Dispatch Emergency SOS Alert to All Contacts
   */
  static async notifyEmergencyContacts(contacts, touristName, latitude, longitude, sosCode) {
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const smsMessage = `🚨 EMERGENCY ALERT: ${touristName} triggered RakshaSetu SOS! Code: ${sosCode}. GPS Location: ${mapsLink}. Emergency Responders Notified!`;

    const results = [];
    for (const contact of contacts) {
      if (contact.contact_phone) {
        const res = await this.sendSMS(contact.contact_phone, smsMessage);
        results.push({ contact: contact.contact_name, phone: contact.contact_phone, status: res });
      }
    }
    return results;
  }
}

module.exports = NotificationService;
