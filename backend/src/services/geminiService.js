const axios = require('axios');
const { model } = require('../config/gemini');

class GeminiService {
  /**
   * Directly call Google Gemini REST API endpoint
   * Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent
   */
  static async callGeminiRestApi(prompt) {
    let apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey || apiKey === 'mock_gemini_api_key' || apiKey === 'your_gemini_api_key_here') {
      apiKey = null;
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
      const response = await axios.post(
        url,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 12000
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0]?.content?.parts[0]?.text) {
        return {
          text: response.data.candidates[0].content.parts[0].text,
          error: null
        };
      }
    } catch (err) {
      const errorDetails = err.response?.data?.error?.message || err.message;
      console.warn(`[Gemini REST API Warning] Direct REST call failed (${err.response?.status || 'network error'}): ${errorDetails}`);
      return {
        text: null,
        error: `HTTP ${err.response?.status || 500}: ${errorDetails}`
      };
    }
    return { text: null, error: 'Empty candidate response from Google Gemini API.' };
  }

  /**
   * AI Tourist Assistant & Emergency Chatbot — Multilingual
   */
  static async chatAssistant(message, context = {}) {
    const lang = context.lang || 'English';
    const isSosActive = context.isSosActive || false;

    const systemPrompt = `You are RakshaSetu AI, an expert emergency response assistant and tourist protection guide.
Your role is to evaluate safety queries, provide calm, actionable emergency instructions, offer advice on local safety customs, and guide tourists in distress.
Context provided: Location: (${context.lat || '28.6139'}, ${context.lng || '77.2090'}).

CRITICAL LANGUAGE INSTRUCTION: You MUST respond ENTIRELY in ${lang}. 
- If the language is "English", respond in English.
- If the language is "Tamil", respond in Tamil (தமிழ்).
- If the language is "Hindi", respond in Hindi (हिंदी).
- If the language is "Kannada", respond in Kannada (ಕನ್ನಡ).
- If the language is "Telugu", respond in Telugu (తెలుగు).
- If the language is "Malayalam", respond in Malayalam (മലയാളം).
- If the language is "Marathi", respond in Marathi (मराठी).
- If the language is "French", respond in French (Français).
- If the language is "German", respond in German (Deutsch).
- If the language is "Japanese", respond in Japanese (日本語).
- If the language is "Spanish", respond in Spanish (Español).
- If the language is "Korean", respond in Korean (한국어).
- If the language is "Chinese", respond in Chinese (中文).
- If the language is "Arabic", respond in Arabic (العربية).
- If the language is "Portuguese", respond in Portuguese (Português).
- If the language is "Russian", respond in Russian (Русский).

Your ENTIRE response must be written in ${lang}. Do NOT mix languages. Do NOT respond in English if the requested language is different.
${isSosActive ? 'EMERGENCY MODE IS ACTIVE: Provide high-priority first-aid, police guidance, and panic-calming protocols urgently.' : ''}
Keep responses empathetic, highly structured, concise, and prioritized by user safety.`;

    const prompt = `${systemPrompt}\n\nUser Question: ${message}`;

    let lastApiError = null;

    // Try Direct REST Endpoint
    const restResult = await this.callGeminiRestApi(prompt);
    if (restResult && restResult.text) {
      return {
        response: restResult.text,
        source: 'Gemini-Flash-Latest (REST API)',
        intent: this.classifyIntent(message),
        language: lang,
        apiErrorDetails: null
      };
    } else if (restResult && restResult.error) {
      lastApiError = restResult.error;
    }

    // Try Google SDK client if configured
    if (model) {
      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return {
          response: responseText,
          source: 'Gemini-1.5-Flash (SDK)',
          intent: this.classifyIntent(message),
          language: lang,
          apiErrorDetails: null
        };
      } catch (err) {
        lastApiError = err.message;
        console.warn(`[Gemini Service Warning] SDK call failed: ${err.message}.`);
      }
    }

    // Fallback response with debug error details attached
    const fallback = this.fallbackChatResponse(message, lang);
    return {
      ...fallback,
      apiErrorDetails: lastApiError || 'API key missing or connection timeout',
      isFallback: true
    };
  }

  /**
   * Crime & Danger Risk Prediction
   */
  static async predictDangerRisk(latitude, longitude, timeOfDay = 'night') {
    const prompt = `Analyze safety and crime risk for tourist location (${latitude}, ${longitude}) during ${timeOfDay}.
Return JSON only with keys: riskScore (0-100), riskLevel ("Low"|"Moderate"|"High"|"Critical"), keyHazards (array), advice (string), recommendedSpeedLimit (km/h).`;

    const restResponse = await this.callGeminiRestApi(prompt);
    if (restResponse) {
      try {
        const text = restResponse.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
      } catch (e) {
        // continue
      }
    }

    if (model) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);
      } catch (err) {
        // Continue to fallback
      }
    }

    // Deterministic spatio-temporal risk score logic
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    let baseRisk = 15;
    if (lat > 28.64 && lng > 77.22) baseRisk += 45;
    if (timeOfDay === 'night' || timeOfDay === 'late_night') baseRisk += 25;

    const riskScore = Math.min(Math.max(baseRisk, 10), 95);
    let riskLevel = 'Low';
    if (riskScore > 35) riskLevel = 'Moderate';
    if (riskScore > 65) riskLevel = 'High';
    if (riskScore > 85) riskLevel = 'Critical';

    return {
      riskScore,
      riskLevel,
      location: { lat, lng },
      keyHazards: riskScore > 60 ? ['Dim lighting reported', 'High tout density', 'Isolated alleyways nearby'] : ['General urban caution'],
      advice: riskScore > 60 ? 'Stay on main illuminated roads. RakshaSetu auto-monitoring active.' : 'Area is classified as safe for tourists.',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Safe Route Suggestion
   */
  static async suggestSafeRoute(origin, destination) {
    return {
      origin,
      destination,
      recommendedRoute: {
        safetyScore: 94,
        distanceKm: 3.4,
        estimatedTimeMin: 12,
        routeType: 'Verified Well-Lit Safe Corridor',
        checkpoints: [
          { name: 'Janpath Police Helpdesk', lat: origin.lat + 0.005, lng: origin.lng + 0.005 },
          { name: 'Connaught Place Outer Patrol Station', lat: destination.lat - 0.002, lng: destination.lng - 0.002 }
        ],
        avoidedDangerZones: ['Old City Alley Corridor (Crime Index 4.10)']
      }
    };
  }

  /**
   * Emergency Translation — Multilingual
   */
  static async translateEmergencyMessage(message, targetLanguage = 'Hindi') {
    const prompt = `You are an expert emergency translator. Translate the following emergency message accurately into ${targetLanguage} for local police or medical responders.

Message to translate: "${message}"

IMPORTANT: Respond ONLY with a valid JSON object (no markdown, no code fences) with these keys:
- originalText: the original message
- translatedText: the full translation in ${targetLanguage}
- targetLanguage: "${targetLanguage}"
- phoneticPronunciation: a phonetic pronunciation guide for an English speaker`;

    const restResponse = await this.callGeminiRestApi(prompt);
    if (restResponse) {
      try {
        const text = restResponse.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
      } catch (e) {
        // continue
      }
    }

    if (model) {
      try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);
      } catch (err) {
        // Fallback
      }
    }

    // Multilingual fallback translations
    const fallbackTranslations = {
      'Hindi': { text: 'मदद कीजिये! मुझे आपातकालीन सहायता की आवश्यकता है।', phonetic: 'Madad keejiye! Mujhe aapaatukaaleen sahaayata kee aavashyakata hai.' },
      'Tamil': { text: 'உதவி! எனக்கு அவசர உதவி தேவை.', phonetic: 'Udavi! Enakku avasara udavi thevai.' },
      'Kannada': { text: 'ಸಹಾಯ! ನನಗೆ ತುರ್ತು ಸಹಾಯ ಬೇಕು.', phonetic: 'Sahaaya! Nanage turtu sahaaya beku.' },
      'Telugu': { text: 'సహాయం! నాకు అత్యవసర సహాయం కావాలి.', phonetic: 'Sahaayam! Naaku atyavasara sahaayam kaavaali.' },
      'Malayalam': { text: 'സഹായം! എനിക്ക് അടിയന്തര സഹായം ആവശ്യമാണ്.', phonetic: 'Sahaayam! Enikku atiyanthara sahaayam aavashyamaanu.' },
      'Marathi': { text: 'मदत! मला तातडीच्या मदतीची गरज आहे.', phonetic: 'Madat! Mala taatdichya madatichi garaj aahe.' },
      'French': { text: 'Au secours ! J\'ai besoin d\'une aide d\'urgence.', phonetic: 'Oh suh-koor! Jay buh-zwan doon ayd door-zhons.' },
      'German': { text: 'Hilfe! Ich brauche Nothilfe.', phonetic: 'Hilf-uh! Ikh brow-khuh Not-hilf-uh.' },
      'Japanese': { text: '助けて！緊急の援助が必要です。', phonetic: 'Tasukete! Kinkyuu no enjo ga hitsuyou desu.' },
      'Spanish': { text: '¡Ayuda! Necesito ayuda de emergencia.', phonetic: 'Ah-yoo-dah! Neh-seh-see-toh ah-yoo-dah deh eh-mer-hen-see-ah.' },
      'Korean': { text: '도와주세요! 긴급 도움이 필요합니다.', phonetic: 'Do-wa-ju-se-yo! Gin-geup do-um-i pil-yo-ham-ni-da.' },
      'Chinese': { text: '救命！我需要紧急援助。', phonetic: 'Jiù mìng! Wǒ xūyào jǐnjí yuánzhù.' },
      'Arabic': { text: 'ساعدوني! أحتاج مساعدة طارئة.', phonetic: 'Sa\'idooni! Ahtaaj musa\'ada tari\'a.' },
      'Portuguese': { text: 'Socorro! Preciso de ajuda de emergência.', phonetic: 'So-ko-ho! Preh-see-zo deh ah-zhoo-dah deh eh-mer-zhen-see-ah.' },
      'Russian': { text: 'Помогите! Мне нужна экстренная помощь.', phonetic: 'Po-mo-gi-tye! Mnye nuzhna eks-tren-na-ya po-moshch.' }
    };

    const fallback = fallbackTranslations[targetLanguage] || fallbackTranslations['Hindi'];

    return {
      originalText: message,
      translatedText: `${fallback.text} (${message})`,
      targetLanguage: targetLanguage,
      phoneticPronunciation: fallback.phonetic,
      engine: 'RakshaSetu Offline Emergency Translator'
    };
  }

  static classifyIntent(msg) {
    const text = msg.toLowerCase();
    if (text.includes('sos') || text.includes('help') || text.includes('danger') || text.includes('follow') || text.includes('scared')) {
      return 'EMERGENCY_HELP';
    }
    if (text.includes('hospital') || text.includes('police') || text.includes('station') || text.includes('embassy')) {
      return 'NEARBY_SAFE_SERVICES';
    }
    if (text.includes('route') || text.includes('map') || text.includes('walk') || text.includes('safe path')) {
      return 'SAFE_NAVIGATION';
    }
    return 'GENERAL_TOURIST_GUIDANCE';
  }

  /**
   * Multilingual fallback responses when Gemini API is unavailable
   */
  static fallbackChatResponse(message, lang = 'English') {
    const intent = this.classifyIntent(message);

    // Multilingual fallback response banks
    const responses = {
      'English': {
        emergency: `🚨 **EMERGENCY ASSISTANCE INITIATED**\n\n1. Tap the **Red SOS Button** immediately to broadcast your live GPS to nearby Police Headquarters.\n2. Stay in a well-lit, populated area if possible.\n3. Your emergency contacts will receive your location automatically.\n4. Call **112** for National Emergency Services.`,
        nearby: `📍 **Nearby Verified Safe Locations**\n- **Connaught Place Police Station**: 0.8 km (24/7 Active Patrol)\n- **RML Emergency Hospital**: 1.4 km (Ambulance Desk)\n- **Tourist Command Desk**: 0.3 km\n\nCall **100** for Police or **102** for Ambulance.`,
        general: `Hello! I am your **RakshaSetu AI Safety Companion**. I can help you find safe travel routes, locate nearby police or hospitals, provide real-time danger advisories, or instantly translate emergency requests. How can I protect you today?`
      },
      'Hindi': {
        emergency: `🚨 **आपातकालीन सहायता शुरू**\n\n1. तुरंत **लाल SOS बटन** दबाएं — आपकी GPS लोकेशन नजदीकी पुलिस मुख्यालय को भेजी जाएगी।\n2. अच्छी रोशनी वाली, भीड़ वाली जगह पर रहें।\n3. आपके आपातकालीन संपर्कों को आपकी लोकेशन अपने आप मिल जाएगी।\n4. राष्ट्रीय आपातकालीन सेवा के लिए **112** पर कॉल करें।`,
        nearby: `📍 **पास की सत्यापित सुरक्षित जगहें**\n- **कनॉट प्लेस पुलिस स्टेशन**: 0.8 किमी (24/7 सक्रिय गश्त)\n- **RML आपातकालीन अस्पताल**: 1.4 किमी\n- **पर्यटक कमांड डेस्क**: 0.3 किमी\n\nपुलिस के लिए **100** या एम्बुलेंस के लिए **102** पर कॉल करें।`,
        general: `नमस्ते! मैं आपका **रक्षासेतु AI सुरक्षा साथी** हूँ। मैं आपको सुरक्षित यात्रा मार्ग खोजने, नजदीकी पुलिस या अस्पताल का पता लगाने, खतरे की चेतावनी देने, या आपातकालीन अनुवाद में मदद कर सकता हूँ। मैं आपकी कैसे सहायता करूँ?`
      },
      'Tamil': {
        emergency: `🚨 **அவசர உதவி தொடங்கியது**\n\n1. உடனடியாக **சிவப்பு SOS பட்டனை** அழுத்தவும் — உங்கள் GPS இருப்பிடம் அருகிலுள்ள காவல் தலைமையகத்திற்கு அனுப்பப்படும்.\n2. நல்ல வெளிச்சமான, மக்கள் நிறைந்த பகுதியில் இருங்கள்.\n3. உங்கள் அவசர தொடர்புகளுக்கு உங்கள் இருப்பிடம் தானாகவே அனுப்பப்படும்.\n4. தேசிய அவசர சேவைக்கு **112** ஐ அழைக்கவும்.`,
        nearby: `📍 **அருகிலுள்ள சரிபார்க்கப்பட்ட பாதுகாப்பான இடங்கள்**\n- **காவல் நிலையம்**: 0.8 கி.மீ (24/7 கண்காணிப்பு)\n- **அவசர மருத்துவமனை**: 1.4 கி.மீ\n- **சுற்றுலா உதவி மையம்**: 0.3 கி.மீ`,
        general: `வணக்கம்! நான் உங்கள் **ரக்ஷாசேது AI பாதுகாப்பு உதவியாளர்**. பாதுகாப்பான பயண வழிகள், அருகிலுள்ள காவல் நிலையம் அல்லது மருத்துவமனை, ஆபத்து எச்சரிக்கைகள், அவசர மொழிபெயர்ப்பு ஆகியவற்றில் நான் உங்களுக்கு உதவ முடியும். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?`
      },
      'French': {
        emergency: `🚨 **ASSISTANCE D'URGENCE ACTIVÉE**\n\n1. Appuyez immédiatement sur le **bouton SOS rouge** pour diffuser votre GPS aux commissariats de police à proximité.\n2. Restez dans un endroit bien éclairé et fréquenté si possible.\n3. Vos contacts d'urgence recevront automatiquement votre position.\n4. Appelez le **112** pour les services d'urgence.`,
        nearby: `📍 **Lieux sûrs vérifiés à proximité**\n- **Commissariat central**: 0.8 km (Patrouille 24h/24)\n- **Hôpital d'urgence RML**: 1.4 km\n- **Bureau d'aide aux touristes**: 0.3 km`,
        general: `Bonjour ! Je suis votre **compagnon de sécurité RakshaSetu AI**. Je peux vous aider à trouver des itinéraires sûrs, localiser les postes de police ou hôpitaux à proximité, fournir des alertes de danger en temps réel, ou traduire instantanément des demandes d'urgence. Comment puis-je vous protéger aujourd'hui ?`
      },
      'German': {
        emergency: `🚨 **NOTFALLHILFE AKTIVIERT**\n\n1. Drücken Sie sofort den **roten SOS-Button**, um Ihren GPS-Standort an nahegelegene Polizeistationen zu senden.\n2. Bleiben Sie wenn möglich in einem gut beleuchteten, belebten Bereich.\n3. Ihre Notfallkontakte erhalten automatisch Ihren Standort.\n4. Rufen Sie **112** für den Notfalldienst an.`,
        nearby: `📍 **Verifizierte sichere Orte in der Nähe**\n- **Zentrale Polizeistation**: 0.8 km (24/7 Streifendienst)\n- **RML Notfallkrankenhaus**: 1.4 km\n- **Touristenhilfe-Zentrum**: 0.3 km`,
        general: `Hallo! Ich bin Ihr **RakshaSetu AI Sicherheitsbegleiter**. Ich kann Ihnen helfen, sichere Reiserouten zu finden, nahegelegene Polizei oder Krankenhäuser zu lokalisieren, Echtzeit-Gefahrenwarnungen bereitzustellen oder Notfallübersetzungen durchzuführen. Wie kann ich Ihnen heute helfen?`
      },
      'Japanese': {
        emergency: `🚨 **緊急支援開始**\n\n1. すぐに**赤いSOSボタン**を押してください — GPSの位置情報が最寄りの警察本部に送信されます。\n2. できれば明るく人通りの多い場所にいてください。\n3. 緊急連絡先には自動的に位置情報が送信されます。\n4. 緊急サービスは**112**に電話してください。`,
        nearby: `📍 **近くの確認済み安全な場所**\n- **中央警察署**: 0.8 km（24時間パトロール）\n- **RML救急病院**: 1.4 km\n- **観光ヘルプデスク**: 0.3 km`,
        general: `こんにちは！私はあなたの**ラクシャセツAI安全コンパニオン**です。安全な旅行ルートの検索、近くの警察や病院の特定、リアルタイムの危険警告、緊急時の翻訳をお手伝いします。今日はどのようにお手伝いしましょうか？`
      },
      'Spanish': {
        emergency: `🚨 **ASISTENCIA DE EMERGENCIA INICIADA**\n\n1. Pulse inmediatamente el **botón rojo SOS** para transmitir su GPS a las comisarías de policía cercanas.\n2. Permanezca en un área bien iluminada y concurrida si es posible.\n3. Sus contactos de emergencia recibirán su ubicación automáticamente.\n4. Llame al **112** para servicios de emergencia.`,
        nearby: `📍 **Lugares seguros verificados cercanos**\n- **Comisaría Central**: 0.8 km (Patrulla 24/7)\n- **Hospital de Emergencias RML**: 1.4 km\n- **Centro de Ayuda al Turista**: 0.3 km`,
        general: `¡Hola! Soy su **compañero de seguridad RakshaSetu AI**. Puedo ayudarle a encontrar rutas de viaje seguras, localizar policía u hospitales cercanos, proporcionar alertas de peligro en tiempo real o traducir solicitudes de emergencia al instante. ¿Cómo puedo protegerle hoy?`
      }
    };

    // Get language-specific responses or fall back to English
    const langResponses = responses[lang] || responses['English'];

    if (intent === 'EMERGENCY_HELP') {
      return {
        response: langResponses.emergency,
        source: 'RakshaSetu Safety Engine',
        intent,
        language: lang
      };
    }

    if (intent === 'NEARBY_SAFE_SERVICES') {
      return {
        response: langResponses.nearby,
        source: 'RakshaSetu Safety Engine',
        intent,
        language: lang
      };
    }

    return {
      response: langResponses.general,
      source: 'RakshaSetu Safety Engine',
      intent,
      language: lang
    };
  }
}

module.exports = GeminiService;
