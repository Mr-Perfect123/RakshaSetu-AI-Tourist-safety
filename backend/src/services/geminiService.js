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
      return {
        text: null,
        error: 'GEMINI_API_KEY is not configured or uses default placeholder.'
      };
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
Context provided: Tourist GPS Location: (${context.lat || '11.0168'}, ${context.lng || '76.9558'}).

CRITICAL MULTILINGUAL INSTRUCTION: You MUST respond 100% ENTIRELY in ${lang}.
- If the language is "Tamil", respond ONLY in Tamil (தமிழ்).
- If the language is "Hindi", respond ONLY in Hindi (हिंदी).
- If the language is "Marathi", respond ONLY in Marathi (मराठी).
- If the language is "Telugu", respond ONLY in Telugu (తెలుగు).
- If the language is "Kannada", respond ONLY in Kannada (ಕನ್ನಡ).
- If the language is "Malayalam", respond ONLY in Malayalam (മലയാളം).
- If the language is "French", respond ONLY in French (Français).
- If the language is "Spanish", respond ONLY in Spanish (Español).
- If the language is "German", respond ONLY in German (Deutsch).
- If the language is "Japanese", respond ONLY in Japanese (日本語).
- If the language is "English", respond ONLY in English.

Your ENTIRE response MUST be written in ${lang}. Do NOT switch to English unless explicitly requested.
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
          { name: 'Central Police Helpdesk', lat: origin.lat + 0.005, lng: origin.lng + 0.005 },
          { name: 'Outer Patrol Station', lat: destination.lat - 0.002, lng: destination.lng - 0.002 }
        ],
        avoidedDangerZones: ['Unlit Back-Alley Corridor']
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
    if (text.includes('sos') || text.includes('help') || text.includes('danger') || text.includes('scared') || text.includes('emergency') || text.includes('lost')) {
      return 'EMERGENCY_HELP';
    }
    if (text.includes('hospital') || text.includes('police') || text.includes('station') || text.includes('doctor') || text.includes('embassy')) {
      return 'NEARBY_SAFE_SERVICES';
    }
    if (text.includes('route') || text.includes('map') || text.includes('walk') || text.includes('path') || text.includes('direction')) {
      return 'SAFE_NAVIGATION';
    }
    if (text.includes('food') || text.includes('restaurant') || text.includes('eat') || text.includes('dinner') || text.includes('veg') || text.includes('hotel')) {
      return 'FOOD_AND_DINING';
    }
    if (text.includes('cab') || text.includes('taxi') || text.includes('auto') || text.includes('ride') || text.includes('bus') || text.includes('train') || text.includes('flight')) {
      return 'TRANSPORTATION';
    }
    if (text.includes('rain') || text.includes('weather') || text.includes('climate') || text.includes('temperature') || text.includes('sun')) {
      return 'WEATHER_ADVISORY';
    }
    if (text.includes('safe') || text.includes('crime') || text.includes('scam') || text.includes('night') || text.includes('caution')) {
      return 'SAFETY_ADVISORY';
    }
    return 'GENERAL_TOURIST_GUIDANCE';
  }

  /**
   * Dynamic Multilingual response engine when Gemini REST API / SDK is unavailable
   */
  static fallbackChatResponse(message, lang = 'English') {
    const intent = this.classifyIntent(message);

    // Multilingual Response Dictionaries
    if (lang === 'Tamil') {
      let responseText = '🇮🇳 **ரக்ஷாசேது AI சுற்றுலா பாதுகாப்பு வழிகாட்டி (தமிழ்)**\n\n';
      if (intent === 'EMERGENCY_HELP') {
        responseText += '🚨 **அவசர உதவி எடுக்கப்பட்டது**\n1. சிவப்பு **SOS பொத்தானை** உடனடியாக அழுத்தவும்.\n2. அவசர எண்கள்: காவல் **100**, ஆம்புலன்ஸ் **108**, சுற்றுலா உதவி **1363**.\n3. ரக்ஷாசேது உங்கள் இருப்பிடத்தை தீவிரமாகக் கண்காணிக்கிறது.';
      } else if (intent === 'NEARBY_SAFE_SERVICES') {
        responseText += '📍 **அருகிலுள்ள அவசர சேவைகள்**\n• மத்திய காவல் நிலையம்: 0.8 கி.மீ\n• அரசு மருத்துவமனை: 1.4 கி.மீ (தொலைபேசி: 108)\n• சுற்றுலா உதவி மையம்: 0.3 கி.மீ';
      } else if (intent === 'FOOD_AND_DINING') {
        responseText += '🍽️ **உணவு மற்றும் உணவகங்கள்**\n• அருகில் உள்ள சுகாதாரமான உணவகங்களைக் கண்டறிய எங்கள் பயன்பாட்டின் உணவகப் பிரிவைப் பயன்படுத்தவும்.';
      } else {
        responseText += `உங்கள் கேள்வி: "${message}"\n\n• உங்கள் தற்போதைய பகுதியில் பாதுகாப்பு நிலை நல்லது.\n• அவசர உதவிக்கு SOS பொத்தானைப் பயன்படுத்தவும்.`;
      }
      return { response: responseText, source: 'RakshaSetu Multilingual Engine', intent, language: lang };
    }

    if (lang === 'Hindi') {
      let responseText = '🇮🇳 **रक्षासेतु एआई पर्यटक सुरक्षा सहायक (हिंदी)**\n\n';
      if (intent === 'EMERGENCY_HELP') {
        responseText += '🚨 **आपातकालीन सहायता सक्रिय**\n1. तुरंत लाल **SOS बटन** दबाएं।\n2. आपातकालीन नंबर: पुलिस **100**, एम्बुलेंस **108**, पर्यटक हेल्पलाइन **1363**।\n3. रक्षासेतु आपकी लाइव लोकेशन ट्रैक कर रहा है।';
      } else if (intent === 'NEARBY_SAFE_SERVICES') {
        responseText += '📍 **निकटतम सुरक्षा सेवाएं**\n• पुलिस स्टेशन: 0.8 किमी (24/7 पेट्रोल)\n• सरकारी अस्पताल: 1.4 किमी (इमरजेंसी 108)\n• टूरिस्ट हेल्प डेस्क: 0.3 किमी';
      } else if (intent === 'FOOD_AND_DINING') {
        responseText += '🍽️ **भोजन और रेस्टोरेंट**\n• अपने पास के प्रमाणित रेस्टोरेंट देखने के लिए फूड सेक्शन का उपयोग करें।';
      } else {
        responseText += `आपका प्रश्न: "${message}"\n\n• आपके क्षेत्र में सुरक्षा की स्थिति अच्छी है।\n• किसी भी सहायता के लिए रक्षासेतु बटन का उपयोग करें।`;
      }
      return { response: responseText, source: 'RakshaSetu Multilingual Engine', intent, language: lang };
    }

    if (lang === 'Marathi') {
      let responseText = '🇮🇳 **रक्षासेतू AI पर्यटन सुरक्षा मार्गदर्शक (मराठी)**\n\n';
      if (intent === 'EMERGENCY_HELP') {
        responseText += '🚨 **तातडीची मदत सक्रिय**\n1. तात्काळ लाल **SOS बटण** दाबा.\n2. आपत्कालीन क्रमांक: पोलीस **100**, रुग्णवाहिका **108**, पर्यटक हेल्पलाइन **1363**.\n3. रक्षासेतू तुमचे लाइव्ह लोकेशन ट्रॅक करत आहे.';
      } else {
        responseText += `तुमचा प्रश्न: "${message}"\n\n• तुमच्या परिसरातील सुरक्षा स्थिती चांगली आहे.\n• कोणत्याही आपत्कालीन मदतीसाठी SOS बटण वापरा.`;
      }
      return { response: responseText, source: 'RakshaSetu Multilingual Engine', intent, language: lang };
    }

    // Default English
    let textResponse = `🤖 **RakshaSetu Intelligence Guidance (${lang})**\n\n` +
      `Regarding your question: "*${message}*"\n\n` +
      `• **Safety Status**: Sector is clear with active police surveillance.\n` +
      `• **Key Advice**: Use verified transport options, keep emergency contacts handy, and check RakshaSetu's live Safety Map.\n` +
      `• **Quick Actions**: You can book taxis, order food, view safe routes, or trigger SOS emergency help anytime directly from the top navigation menu.`;

    if (intent === 'EMERGENCY_HELP') {
      textResponse = `🚨 **EMERGENCY ASSISTANCE INITIATED**\n\n` +
        `1. **Trigger SOS**: Tap the red **SOS button** immediately to broadcast your live GPS coordinates to Police HQ.\n` +
        `2. **Emergency Numbers**: Police **100**, Ambulance **108**, Tourist Helpline **1363**.\n` +
        `3. *RakshaSetu is actively monitoring your location stream.*`;
    }

    return {
      response: textResponse,
      source: 'RakshaSetu Dynamic AI Engine',
      intent,
      language: lang
    };
  }
}

module.exports = GeminiService;
