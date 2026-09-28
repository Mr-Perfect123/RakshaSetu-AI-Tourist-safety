const firebaseApp = require('../config/firebase');
const twilioClient = require('../config/twilio');
const textBeeService = require('./textBeeService');
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
   * Dispatch Email via Nodemailer SMTP Transporter
   */
  static async sendEmail(toEmail, subject, textContent, htmlContent = null) {
    logger.info(`[Email Dispatch] Sending email to ${toEmail}: "${subject}"`);
    const nodemailer = require('nodemailer');

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_FROM || 'RakshaSetu Safety Command <no-reply@rakshasetu.gov.in>';

    if (smtpUser && smtpPass && smtpPass !== 'mock' && smtpPass !== 'your_email_app_password') {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: { user: smtpUser, pass: smtpPass }
        });

        const info = await transporter.sendMail({
          from: fromEmail,
          to: toEmail,
          subject,
          text: textContent,
          html: htmlContent || textContent
        });

        logger.info(`[Email Dispatch] Email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        logger.error(`[Email Error] SMTP send failed: ${err.message}`);
      }
    } else {
      logger.info(`[Email Simulation] SMTP credentials unconfigured/mock. Simulated email to ${toEmail}`);
    }

    return { success: true, simulated: true };
  }

  /**
   * Dispatch Email OTP Code
   */
  static async sendEmailOTP(toEmail, otpCode, purpose = 'registration') {
    const subject = `[RakshaSetu] Your Verification OTP Code: ${otpCode}`;
    const textContent = `Namaste! Your RakshaSetu verification OTP code is: ${otpCode}. It is valid for 10 minutes. Do not share this OTP with anyone.`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <h2 style="color: #0D47A1;">🛡️ RakshaSetu Security Verification</h2>
        <p>Namaste! Your verification code for <strong>${purpose}</strong> is:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0D47A1; text-align: center; width: 220px; margin: 16px 0;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #64748b;">This OTP code is valid for 10 minutes. Please enter this code in the RakshaSetu App.</p>
      </div>
    `;

    return await this.sendEmail(toEmail, subject, textContent, htmlContent);
  }

  /**
   * Dispatch SMS OTP Code
   */
  static async sendSMSOTP(toPhone, otpCode, purpose = 'registration') {
    const smsMessage = `[RakshaSetu] Your ${purpose} OTP code is ${otpCode}. Valid for 10 mins. Do not share this code with anyone.`;
    return await this.sendSMS(toPhone, smsMessage);
  }

  /**
   * Dispatch Emergency SOS Alert to All Contacts via TextBee & Fallback
   */
  static async notifyEmergencyContacts(contacts, touristName, latitude, longitude, sosCode, metadata = {}) {
    const mapsLink = (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null)
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : 'Location broadcast unavailable';
    const legacySmsMessage = `🚨 EMERGENCY ALERT: It's emergency help me! ${touristName} triggered RakshaSetu SOS! Code: ${sosCode}. GPS Location: ${mapsLink}. Emergency Responders Notified!`;

    const results = [];

    if (!Array.isArray(contacts) || contacts.length === 0) {
      logger.info(`[NotificationService] No emergency contacts registered for ${touristName}. Emergency SMS skipped.`);
      return results;
    }

    // Collect all valid unique phone numbers across contacts
    const phoneList = [];
    for (const c of contacts) {
      const p = c.contact_phone || c.phone;
      if (p && !phoneList.includes(p)) {
        phoneList.push(p);
      }
    }

    if (phoneList.length === 0) {
      logger.info(`[NotificationService] No phone numbers found in emergency contacts for ${touristName}.`);
      return results;
    }

    logger.info(`[NotificationService] Dispatching emergency SOS alert to all ${phoneList.length} contact numbers: ${phoneList.join(', ')}`);

    // 1. Dispatch via TextBee REST API to all emergency contact numbers
    let textBeeBatchRes = null;
    try {
      textBeeBatchRes = await textBeeService.sendEmergencySMS({
        customerId: metadata.userId || metadata.customerId,
        customerName: touristName,
        customerPhone: metadata.userPhone || metadata.touristPhone,
        recipientPhones: phoneList,
        latitude,
        longitude,
        sosCode,
        sosId: metadata.sosId
      });
    } catch (tbErr) {
      logger.error(`[NotificationService] TextBee batch dispatch exception: ${tbErr.message}`);
      textBeeBatchRes = { success: false, error: tbErr.message };
    }

    // 2. Loop through each contact to record result & legacy fallback
    for (const contact of contacts) {
      const phone = contact.contact_phone || contact.phone;
      const contactName = contact.contact_name || contact.name || 'Emergency Contact';
      if (!phone) continue;

      let legacyRes = null;
      try {
        legacyRes = await this.sendSMS(phone, legacySmsMessage);
      } catch (err) {
        legacyRes = { success: false, error: err.message };
      }

      results.push({
        contact: contactName,
        phone,
        textBee: textBeeBatchRes,
        status: legacyRes
      });
    }

    return results;
  }

  /**
   * Dispatch SOS Notification directly to Admin Command Center
   */
  static async notifyAdminsOfSos(touristName, latitude, longitude, sosCode, address) {
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@rakshasetu.gov.in';
    const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    const subject = `🚨 CRITICAL SOS ALERT: Tourist ${touristName} (Code: ${sosCode})`;
    const textContent = `CRITICAL SOS ALERT: Tourist ${touristName} triggered Emergency SOS!\nCode: ${sosCode}\nLocation: ${address || 'GPS Broadcast'}\nMap: ${mapsLink}`;
    logger.emergency(`[Admin Alert] Dispatching SOS notification email to ${adminEmail}`);
    return await this.sendEmail(adminEmail, subject, textContent);
  }
}

module.exports = NotificationService;
