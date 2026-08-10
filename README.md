# 🛡️ RAKSHASETU: AI Powered Tourist Protection & Emergency Response System

> **Enterprise-Grade Government Emergency Dispatch & Tourist Safety Ecosystem**

RakshaSetu is a complete, production-ready AI-powered emergency response, spatio-temporal crime prediction, and tourist safety platform. It links tourists in distress directly with emergency dispatch command centers, police headquarters, medical response units, and automated emergency contact networks.

---

## 🌟 Ecosystem Architecture & Tech Stack

```
                              +---------------------------------------+
                              |      RakshaSetu Ecosystem Architecture|
                              +---------------------------------------+
                                                 |
         +---------------------------------------+--------------------------------------+
         |                                       |                                      |
         v                                       v                                      v
+------------------+                   +-------------------+                  +-------------------+
|  Mobile App      |                   |  Admin Dashboard  |                  | Standalone AI     |
|  React Native    |                   | React + Vite +    |                  | Intelligence      |
|  (Expo SDK)      |                   | Material UI +     |                  | Service           |
|                  |                   | Tailwind CSS      |                  | (Gemini Engine)   |
+--------+---------+                   +---------+---------+                  +---------+---------+
         |                                       |                                      |
         +-------------------------------+-------+--------------------------------------+
                                         |  REST / WebSockets (Socket.io)
                                         v
                              +--------------------+
                              | Express.js Backend |
                              |  MVC Architecture  |
                              +---------+----------+
                                        |
    +-----------------------------------+-----------------------------------+
    |                                   |                                   |
    v                                   v                                   v
+---------------+               +---------------+                   +---------------+
| MySQL DB      |               | Google Gemini |                   | Firebase /    |
| (mysql2 ORM)  |               | AI Integration|                   | Twilio SMS    |
+---------------+               +---------------+                   +---------------+
```

---

## 🚀 Key Modules & Features

### 1. 🚨 Emergency Panic SOS Dispatch
- **Multi-Trigger SOS**: 1-Tap UI Panic button, Shake detection (Accelerometer sensor), Voice Command trigger, Crash/Fall sensor trigger, and Offline SMS payload generator.
- **Real-Time WebSockets**: Live broadcast to Police HQ and Admin Dispatch maps with sound and visual alarms.
- **Automated Emergency Contacts Alert**: Dispatches SMS alerts with Google Maps GPS coordinates via Twilio.

### 2. 🧠 AI Safety Engine (Google Gemini 1.5 Flash)
- **AI Tourist Assistant**: Multi-lingual real-time safety chatbot and panic guidance.
- **Spatio-Temporal Crime Risk Prediction**: Evaluates location safety indices (0-100) based on historical crime reports and time of day.
- **Safe Route Evaluator**: Calculates well-lit verified safe corridors while steering tourists away from crime heatmaps.
- **Emergency Translation**: Instant translation of tourist panic messages into local languages for first responders.

### 3. 🖥️ Web Admin Command Center
- **Government Emergency Aesthetics**: High-contrast, executive emergency color palette (`#0D47A1`, `#1565C0`, `#D32F2F`).
- **Interactive Command Map**: Live spatial view built with Leaflet displaying active SOS alerts, dispatch units, and safe locations.
- **Incident & Responder Management**: Real-time triage of crowd-sourced crime, accident, scam, and roadblock reports.

---

## 🗄️ Database Architecture (`rakshasetu_db`)

The system includes a complete DDL schema script (`database/rakshasetu_db.sql`) with 19 normalized relational tables:
- `users`, `admins`, `tourists`, `emergency_contacts`
- `sos_requests`, `incident_reports`, `crime_reports`
- `safe_locations`, `tourist_locations`, `notifications`
- `feedback`, `chat_history`, `ai_logs`, `device_tokens`
- `otp_verification`, `password_reset`, `email_verification`, `audit_logs`

---

## ⚡ Quick Start Guide

### Step 1: Database Setup
Import the complete MySQL DDL script:
```bash
mysql -u root -p < database/rakshasetu_db.sql
```

### Step 2: Backend API Server
```bash
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000/api/v1`*

### Step 3: Admin Command Dashboard
```bash
cd admin-dashboard
npm install
npm run dev
```
*Dashboard opens at `http://localhost:5173`*

### Step 4: Standalone AI Service
```bash
cd ai-service
npm install
npm start
```
*AI service runs on `http://localhost:5001`*

### Step 5: Mobile App
```bash
cd mobile
npm install
npx expo start
```

---

## 🐳 Docker Deployment
To launch the entire production infrastructure in containers:
```bash
docker-compose up --build -d
```

---

## 📄 License & Attribution
RakshaSetu System - Open Emergency Protection Ecosystem under MIT License.
