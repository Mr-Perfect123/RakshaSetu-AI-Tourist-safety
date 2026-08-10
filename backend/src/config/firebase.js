const admin = require('firebase-admin');
require('dotenv').config();

let firebaseApp = null;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID !== 'mock') {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
      })
    });
    console.log('[Firebase FCM] Initialized Firebase Admin SDK successfully.');
  } else {
    console.log('[Firebase FCM] Firebase in mock mode.');
  }
} catch (err) {
  console.warn(`[Firebase FCM Warning] Could not initialize Firebase Admin: ${err.message}`);
}

module.exports = firebaseApp;
