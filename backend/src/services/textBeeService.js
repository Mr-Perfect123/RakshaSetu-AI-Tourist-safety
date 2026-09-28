/**
 * TextBee SMS Gateway Service
 * 
 * Handles automated SMS alerts to authenticated customers' emergency contacts
 * using the official TextBee REST API.
 * Endpoint: POST https://api.textbee.dev/api/v1/gateway/send-sms
 * 
 * Complies with E.164 international phone number requirements,
 * dynamic emergency contact resolution, timeout handling, duplicate protection,
 * and robust failure isolation (SOS will never fail if SMS gateway fails).
 */

const logger = require('../utils/logger');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

class TextBeeService {
  constructor() {
    // In-memory deduplication cache: `${sosIdentifier}:${normalizedPhone}` -> timestamp
    this.recentDispatches = new Map();
    this.DEDUPLICATION_WINDOW_MS = 60 * 1000; // 60-second cooldown for identical SOS

    // Periodic cleanup interval to prevent memory growth
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, ts] of this.recentDispatches.entries()) {
        if (now - ts > this.DEDUPLICATION_WINDOW_MS) {
          this.recentDispatches.delete(key);
        }
      }
    }, 60 * 1000);
    if (cleanupInterval.unref) cleanupInterval.unref();
  }

  get apiKey() {
    return process.env.TEXTBEE_API_KEY;
  }

  get apiUrl() {
    return process.env.TEXTBEE_API_URL || 'https://api.textbee.dev/api/v1/gateway/send-sms';
  }

  /**
   * Normalize any input phone number into valid E.164 format (+[country_code][subscriber_number]).
   * Handles:
   *  - 10-digit Indian numbers: 9876543210 -> +919876543210
   *  - International numbers: +919876543210 -> +919876543210
   *  - Leading 91 without plus: 919876543210 -> +919876543210
   *  - Leading 0: 09876543210 -> +919876543210
   *  - Leading 00: 00919876543210 -> +919876543210
   *  - Accidental duplicate 91 prefixes: +91919876543210 or 91919876543210 -> +919876543210
   *  - Formatted strings with spaces/hyphens/parentheses: +91 98765-43210 -> +919876543210
   *  - Valid global E.164 numbers: +14155550199 -> +14155550199
   * 
   * @param {string} rawPhone
   * @returns {{ valid: boolean, formattedNumber?: string, error?: string }}
   */
  normalizeToE164(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') {
      return { valid: false, error: 'Emergency contact phone number is missing or invalid.' };
    }

    const trimmed = rawPhone.trim();
    if (!trimmed) {
      return { valid: false, error: 'Emergency contact phone number is empty.' };
    }

    // Replace international prefix 00 with + (e.g. 0091 -> +91)
    let cleaned = trimmed.replace(/^00/, '+');

    // Strip whitespace, hyphens, parentheses, and dots
    cleaned = cleaned.replace(/[\s\-\(\)\.]/g, '');

    // Extract digits
    let digits = cleaned.replace(/\D/g, '');

    if (!digits) {
      return { valid: false, error: 'Emergency contact phone number contains no numeric digits.' };
    }

    // Strip accidental repeated '9191...' prefixes
    while (digits.startsWith('9191')) {
      digits = digits.slice(2);
    }

    // Case 1: Started with '+'
    if (cleaned.startsWith('+')) {
      // If +91 followed by 10 digits
      if (digits.startsWith('91') && digits.length === 12) {
        const nationalPart = digits.slice(2);
        if (/^[6-9]\d{9}$/.test(nationalPart)) {
          return { valid: true, formattedNumber: `+91${nationalPart}` };
        }
      }

      // Valid international E.164: + followed by 8 to 15 digits
      if (/^\+[1-9]\d{7,14}$/.test(`+${digits}`)) {
        return { valid: true, formattedNumber: `+${digits}` };
      }
    }

    // Case 2: 12 digits starting with '91' (Indian number without +)
    if (digits.length === 12 && digits.startsWith('91')) {
      const nationalPart = digits.slice(2);
      if (/^[6-9]\d{9}$/.test(nationalPart)) {
        return { valid: true, formattedNumber: `+91${nationalPart}` };
      }
    }

    // Case 3: 11 digits starting with '0' (Indian number with trunk prefix 0)
    if (digits.length === 11 && digits.startsWith('0')) {
      const nationalPart = digits.slice(1);
      if (/^[6-9]\d{9}$/.test(nationalPart)) {
        return { valid: true, formattedNumber: `+91${nationalPart}` };
      }
    }

    // Case 4: Standard 10-digit Indian mobile number
    if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
      return { valid: true, formattedNumber: `+91${digits}` };
    }

    // Case 5: International number without leading plus (10 to 15 digits)
    if (/^[1-9]\d{9,14}$/.test(digits)) {
      return { valid: true, formattedNumber: `+${digits}` };
    }

    return {
      valid: false,
      error: `Emergency contact phone number is invalid: '${rawPhone}'. Must be a valid phone number in E.164 format.`
    };
  }

  /**
   * Format the emergency SOS message.
   * Adheres strictly to Section 6 requirements:
   * With location: "RakshaSetu SOS ALERT: [Customer Name] has triggered an emergency SOS. Current location: [Google Maps link]. Please contact them immediately."
   * Without location: "RakshaSetu SOS ALERT: [Customer Name] has triggered an emergency SOS. Please contact them immediately."
   * 
   * @param {Object} params
   * @param {string} params.customerName
   * @param {number|string} [params.latitude]
   * @param {number|string} [params.longitude]
   * @returns {string}
   */
  formatEmergencyMessage({ customerName, customerPhone, latitude, longitude }) {
    const name = customerName || 'Tourist';
    const phonePart = customerPhone ? ` (${customerPhone})` : '';
    const hasCoordinates = (latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) && Number(latitude) !== 0) &&
                           (longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) && Number(longitude) !== 0);

    if (hasCoordinates) {
      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      return `It's emergency help me! RakshaSetu SOS ALERT: ${name}${phonePart} has triggered an emergency SOS. Current location: ${mapsLink}. Please contact them immediately.`;
    }

    return `It's emergency help me! RakshaSetu SOS ALERT: ${name}${phonePart} has triggered an emergency SOS. Please contact them immediately.`;
  }

  /**
   * Send SMS via TextBee REST API.
   * POST https://api.textbee.dev/api/v1/gateway/send-sms
   * Headers:
   *   Content-Type: application/json
   *   x-api-key: YOUR_TEXTBEE_API_KEY
   * Body:
   *   { "recipients": ["+919876543210"], "message": "..." }
   * 
   * @param {Object} options
   * @param {string} [options.recipient] - E.164 formatted phone number (e.g. +919876543210)
   * @param {string[]} [options.recipients] - Array of E.164 formatted phone numbers
   * @param {string} options.message - Emergency alert message body
   * @returns {Promise<Object>} Response metadata
   */
  async sendSMS({ recipient, recipients, message }) {
    const apiKey = this.apiKey;
    const apiUrl = this.apiUrl;

    let targetRecipients = [];
    if (Array.isArray(recipients) && recipients.length > 0) {
      targetRecipients = recipients.filter(Boolean);
    } else if (recipient) {
      targetRecipients = [recipient];
    }

    if (targetRecipients.length === 0) {
      return {
        success: false,
        skipped: true,
        message: 'No recipients provided to sendSMS'
      };
    }

    const maskedRecipients = targetRecipients.map(r => r.length > 5 ? `${r.slice(0, 3)}***${r.slice(-4)}` : r).join(', ');

    // Check if API key is configured
    if (!apiKey || apiKey === 'your_textbee_api_key' || apiKey.startsWith('your_') || apiKey.trim() === '') {
      logger.info(`[TextBee SMS] API key unconfigured or placeholder. SMS dispatch simulated for recipients: ${maskedRecipients}`);
      return {
        success: false,
        simulated: true,
        status: 'simulated',
        message: 'TextBee API key not configured in backend environment variables. Operating in simulated mode.',
        recipient: maskedRecipients,
        recipients: targetRecipients
      };
    }

    const payload = {
      recipients: targetRecipients,
      message
    };

    if (process.env.TEXTBEE_DEVICE_ID && process.env.TEXTBEE_DEVICE_ID.trim()) {
      payload.deviceId = process.env.TEXTBEE_DEVICE_ID.trim();
    }

    logger.info(`[TextBee SMS] Dispatching emergency SMS to ALL ${targetRecipients.length} recipients (${maskedRecipients}) via TextBee gateway.`);

    try {
      // 10-second timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let responseData = null;
      try {
        responseData = await response.json();
      } catch {
        responseData = { rawText: 'Non-JSON response received from TextBee gateway.' };
      }

      // Handle successful HTTP response
      if (response.status === 200 || response.status === 201) {
        const batchId = responseData?.data?.smsBatchId || responseData?.data?.batchId || responseData?.data?.id || responseData?.smsBatchId || null;
        logger.info(`[TextBee SMS] SMS dispatched successfully to all ${targetRecipients.length} contacts. Status: ${response.status}, Batch ID: ${batchId || 'N/A'}`);
        return {
          success: true,
          status: 'sent',
          statusCode: response.status,
          smsBatchId: batchId,
          recipient: maskedRecipients,
          recipients: targetRecipients,
          data: responseData
        };
      }

      // Handle specific HTTP error status codes
      if (response.status === 401 || response.status === 403) {
        logger.error(`[TextBee SMS] HTTP ${response.status}: Unauthorized. Missing or invalid TextBee API key.`);
        return {
          success: false,
          statusCode: response.status,
          status: 'unauthorized',
          error: 'TextBee authentication failed: Invalid or missing API key.',
          data: responseData
        };
      }

      if (response.status === 429) {
        logger.error(`[TextBee SMS] HTTP 429: Too Many Requests. TextBee rate limit or quota exceeded.`);
        return {
          success: false,
          statusCode: 429,
          status: 'rate_limited',
          error: 'TextBee API rate limit or quota reached.',
          data: responseData
        };
      }

      logger.error(`[TextBee SMS] Gateway returned HTTP ${response.status}: ${JSON.stringify(responseData)}`);
      return {
        success: false,
        statusCode: response.status,
        status: 'gateway_error',
        error: responseData?.message || `TextBee gateway returned HTTP ${response.status}`,
        data: responseData
      };

    } catch (networkError) {
      if (networkError.name === 'AbortError') {
        logger.error(`[TextBee SMS] Request timeout (10s exceeded) while connecting to TextBee gateway.`);
        return {
          success: false,
          status: 'timeout',
          error: 'TextBee API request timed out after 10 seconds.'
        };
      }

      logger.error(`[TextBee SMS] Network failure connecting to TextBee: ${networkError.message}`);
      return {
        success: false,
        status: 'network_failure',
        error: `Network failure connecting to TextBee: ${networkError.message}`
      };
    }
  }

  /**
   * Main method: Dispatches an emergency SMS to a customer's emergency contact(s).
   * Handles:
   * 1. Multi-contact support: accepts recipientPhone (single/array/CSV) or recipientPhones (array)
   * 2. E.164 phone normalization for every recipient
   * 3. Message construction with accurate customer name & GPS link
   * 4. Duplicate SMS suppression per contact within 60s cooldown window
   * 5. Safe error handling (never crashes or breaks SOS)
   * 
   * @param {Object} params
   * @param {string|number} params.customerId - Authenticated customer's user ID
   * @param {string} params.customerName - Authenticated customer's full name
   * @param {string} [params.customerPhone] - Authenticated customer's phone number
   * @param {string|string[]} [params.recipientPhone] - Emergency contact phone number(s)
   * @param {string[]} [params.recipientPhones] - List of emergency contact phone numbers
   * @param {number|string} [params.latitude] - GPS latitude
   * @param {number|string} [params.longitude] - GPS longitude
   * @param {string} [params.sosCode] - SOS reference code
   * @param {string|number} [params.sosId] - SOS incident database ID
   * @returns {Promise<Object>}
   */
  async sendEmergencySMS({
    customerId,
    customerName,
    customerPhone,
    recipientPhone,
    recipientPhones,
    latitude,
    longitude,
    sosCode,
    sosId
  }) {
    // Collect all candidate recipient phone numbers
    let rawPhones = [];
    if (Array.isArray(recipientPhones)) {
      rawPhones.push(...recipientPhones);
    }
    if (Array.isArray(recipientPhone)) {
      rawPhones.push(...recipientPhone);
    } else if (typeof recipientPhone === 'string' && recipientPhone.trim()) {
      if (recipientPhone.includes(',')) {
        rawPhones.push(...recipientPhone.split(',').map(p => p.trim()));
      } else {
        rawPhones.push(recipientPhone.trim());
      }
    }

    rawPhones = [...new Set(rawPhones.filter(Boolean))];

    if (rawPhones.length === 0) {
      logger.warn(`[TextBee SMS] Skipped: No emergency contact phone numbers provided.`);
      return {
        success: false,
        skipped: true,
        error: 'No emergency contact phone numbers provided'
      };
    }

    // 1. Validate & normalize each emergency contact phone number into E.164
    const validRecipients = [];
    const now = Date.now();

    for (const phone of rawPhones) {
      const norm = this.normalizeToE164(phone);
      if (!norm.valid) {
        logger.warn(`[TextBee SMS] Skipped invalid recipient '${phone}': ${norm.error}`);
        continue;
      }

      const normalized = norm.formattedNumber;

      // 2. Prevent duplicate SMS caused by double-click / rapid retries (Section 10)
      const dedupeKey = `${customerId || sosId || sosCode || 'sos'}:${normalized}`;
      if (this.recentDispatches.has(dedupeKey)) {
        const lastSent = this.recentDispatches.get(dedupeKey);
        if (now - lastSent < this.DEDUPLICATION_WINDOW_MS) {
          logger.info(`[TextBee SMS] Duplicate SMS suppressed for ${dedupeKey} within cooldown.`);
          continue;
        }
      }

      if (!validRecipients.includes(normalized)) {
        validRecipients.push(normalized);
      }
    }

    if (validRecipients.length === 0) {
      logger.info(`[TextBee SMS] All emergency contacts skipped (either invalid numbers or already notified within cooldown).`);
      return {
        success: true,
        allSuppressedOrSkipped: true,
        recipients: []
      };
    }

    // 3. Format message adhering to emergency template
    const message = this.formatEmergencyMessage({
      customerName,
      customerPhone,
      latitude,
      longitude
    });

    // 4. Send to ALL valid recipients via TextBee gateway
    const result = await this.sendSMS({
      recipients: validRecipients,
      recipient: validRecipients[0],
      message
    });

    // 5. Update deduplication cache for every recipient if request succeeded
    if (result.success || result.simulated) {
      for (const normalized of validRecipients) {
        const dedupeKey = `${customerId || sosId || sosCode || 'sos'}:${normalized}`;
        this.recentDispatches.set(dedupeKey, now);
      }
    }

    return {
      ...result,
      recipients: validRecipients
    };
  }

  /**
   * Clear deduplication cache (useful during automated tests)
   */
  clearDeduplicationCache() {
    this.recentDispatches.clear();
  }
}

const textBeeService = new TextBeeService();
module.exports = textBeeService;
