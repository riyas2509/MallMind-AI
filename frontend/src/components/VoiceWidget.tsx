import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { ProductResponse } from '../api/types';
import { Link } from 'react-router-dom';
import { getProductImage } from '../utils/images';
import { useCart } from '../auth/CartContext';
import {
  FALLBACK_SHOPS,
  FALLBACK_FACILITIES,
  FALLBACK_PRODUCTS,
  getFallbackRoute,
} from '../data/fallbackData';
import {
  Mic,
  MicOff,
  X,
  Send,
  Volume2,
  VolumeX,
  Navigation,
  Languages,
  Database,
  ArrowRight,
  Headphones,
  ShoppingBag,
  Scale,
  CheckCircle,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Loader2,
  Keyboard,
} from 'lucide-react';

export type VoiceState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'recording'
  | 'processing_speech'
  | 'understanding_request'
  | 'retrieving_information'
  | 'calculating_route'
  | 'speaking_response'
  | 'completed'
  | 'error';

interface DestinationInfo {
  id: string | number;
  name: string;
  category: string;
  floor: number;
  floor_name: string;
  node_id: number;
  score?: number;
}

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  intent?: string;
  action?: string;
  detectedLanguage?: string;
  confidence?: number;
  ragContext?: string;
  destination?: DestinationInfo;
  products?: ProductResponse[];
  audioBase64?: string;
  languageCode?: string;
}

interface RAGQueryResponse {
  query: string;
  detected_language: string;
  language_code: string;
  confidence: number;
  layman_text: string;
  action: string;
  destination?: DestinationInfo;
  retrieved_context?: Array<{ name: string; floor: string; category: string; score: number }>;
  audio_base64?: string;
}

// Map Web Speech API voices
function getBestVoiceForLang(langCode: string): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const targetTag = langCode === 'gu' ? 'gu' : langCode === 'hi' ? 'hi' : 'en';
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(targetTag)) ||
    voices.find((v) => v.lang.toLowerCase().includes('in')) ||
    null
  );
}

function speakTextWithWebSpeech(
  text: string,
  langCode: string,
  onEnd?: () => void,
): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return null;
  }
  try {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const tag = langCode === 'gu' ? 'gu-IN' : langCode === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.lang = tag;

    const matchedVoice = getBestVoiceForLang(langCode);
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.rate = langCode === 'en' ? 1.0 : 0.92;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch {
    if (onEnd) onEnd();
    return null;
  }
}

// Client-side Trilingual Knowledge & Nearest Amenity Intelligence
function processClientFallbackQuery(query: string, currentStartKioskNodeId = 21): {
  reply: string;
  lang: string;
  langCode: string;
  intent: string;
  action?: string;
  destination?: DestinationInfo;
  products?: ProductResponse[];
} {
  const qLower = query.toLowerCase().trim();

  // Detect Gujarati script / common keywords
  const isGujarati =
    /[\u0A80-\u0AFF]/.test(query) ||
    /\b(kya|chhe|shoo|nathi|malashe|rasto|shauchalay|dosa|bhojan|ketla|levu)\b/i.test(qLower);

  // Detect Devanagari / Hindi keywords
  const isHindi =
    /[\u0900-\u097F]/.test(query) ||
    /\b(kahan|kidhar|hai|kaise|chahiye|shauchalay|kitna|batao|milega)\b/i.test(qLower);

  const langCode = isGujarati ? 'gu' : isHindi ? 'hi' : 'en';
  const langName = isGujarati ? 'Gujarati' : isHindi ? 'Hindi' : 'English';

  // 1. Washroom / Toilet intent (Nearest Facility via shortest graph distance)
  if (
    /washroom|toilet|restroom|bathroom|loo|lavatory|શૌચાલય|ટોઇલેટ|વોશરૂમ|शौचालय|टॉयलेट|बाथरूम/i.test(
      qLower,
    )
  ) {
    const washrooms = FALLBACK_FACILITIES.filter((f) => f.type === 'WASHROOM');
    let bestDist = Infinity;
    let bestFac = washrooms[0];

    washrooms.forEach((fac) => {
      const r = getFallbackRoute(currentStartKioskNodeId, fac.navigationNodeId);
      const dist = r.estimatedDistanceMeters ?? r.totalDistance;
      if (dist < bestDist) {
        bestDist = dist;
        bestFac = fac;
      }
    });

    const floorLabel =
      bestFac.floorNumber === -1 ? 'LG' : bestFac.floorNumber === 0 ? 'Ground Floor (G)' : `Floor ${bestFac.floorNumber}`;
    let reply = `The nearest washroom is located on ${floorLabel}, approximately ${bestDist} meters away from your current location. Follow the directional signage along the corridor.`;
    if (isGujarati) {
      reply = `સૌથી નજીકનું શૌચાલય ${floorLabel} પર આવેલું છે (લગભગ ${bestDist} મીટર દૂર). કોરિડોરના સંકેતો અનુસરો.`;
    } else if (isHindi) {
      reply = `निकटतम शौचालय ${floorLabel} पर स्थित है (लगभग ${bestDist} मीटर दूर)। कृपया मुख्य गलियारे के संकेतों का पालन करें।`;
    }

    return {
      reply,
      lang: langName,
      langCode,
      intent: 'RESTROOM_LOCATION',
      destination: {
        id: bestFac.id,
        name: bestFac.label,
        category: 'Facility',
        floor: bestFac.floorNumber,
        floor_name: floorLabel,
        node_id: bestFac.navigationNodeId,
      },
    };
  }

  // 2. ATM / Cash intent (Nearest ATM)
  if (/atm|cash|money|withdraw|bank|પૈસા|એટીએમ|રોકડ|एटीएम|पैसे|कैश|बैंक/i.test(qLower)) {
    const atms = FALLBACK_FACILITIES.filter((f) => f.type === 'ATM');
    let bestDist = Infinity;
    let bestAtm = atms[0];

    atms.forEach((fac) => {
      const r = getFallbackRoute(currentStartKioskNodeId, fac.navigationNodeId);
      const dist = r.estimatedDistanceMeters ?? r.totalDistance;
      if (dist < bestDist) {
        bestDist = dist;
        bestAtm = fac;
      }
    });

    const floorLabel =
      bestAtm.floorNumber === -1 ? 'LG' : bestAtm.floorNumber === 0 ? 'Ground Floor (G)' : `Floor ${bestAtm.floorNumber}`;
    let reply = `The nearest ATM is the ${bestAtm.label} on ${floorLabel} (about ${bestDist}m away).`;
    if (isGujarati) {
      reply = `નજીકનું એટીએમ ${bestAtm.label} ${floorLabel} પર ઉપલબ્ધ છે (આશરે ${bestDist} મીટર).`;
    } else if (isHindi) {
      reply = `निकटतम एटीएम ${bestAtm.label} ${floorLabel} पर स्थित है (लगभग ${bestDist} मीटर)।`;
    }

    return {
      reply,
      lang: langName,
      langCode,
      intent: 'ATM_LOCATION',
      destination: {
        id: bestAtm.id,
        name: bestAtm.label,
        category: 'ATM',
        floor: bestAtm.floorNumber,
        floor_name: floorLabel,
        node_id: bestAtm.navigationNodeId,
      },
    };
  }

  // 3. Elevator / Escalator / Accessible routes
  if (
    /elevator|escalator|lift|wheelchair|accessible|ramp|સીડી|લિફ્ટ|વ્હીલચેર|लिफ्ट|एस्केलेटर|व्हीलचेयर|सुलभ/i.test(
      qLower,
    )
  ) {
    let reply =
      'Nexus Ahmedabad One features wide central glass elevators and escalators in the Central Atrium, with step-free wheelchair access on every floor.';
    if (isGujarati) {
      reply =
        'નેક્સસ અમદાવાદ વનમાં સેન્ટ્રલ એટ્રીયમમાં વિશાળ લિફ્ટ અને એસ્કેલેટર છે, જે દરેક ફ્લોર પર વ્હીલચેર સુલભ માર્ગ પ્રદાન કરે છે.';
    } else if (isHindi) {
      reply =
        'नेक्सस अहमदाबाद वन के सेंट्रल एट्रियम में लिफ्ट और एस्केलेटर दोनों उपलब्ध हैं, जो सभी मंजिलों पर व्हीलचेयर सुलभ मार्ग प्रदान करते हैं।';
    }
    return {
      reply,
      lang: langName,
      langCode,
      intent: 'ACCESSIBLE_ROUTE',
      destination: {
        id: 'central_lift',
        name: 'Central Atrium Glass Elevator',
        category: 'Vertical Transition',
        floor: 0,
        floor_name: 'Ground Floor (G)',
        node_id: 25,
      },
    };
  }

  // 4. Food Court / Dining / Restaurants
  if (
    /food|dining|eat|hungry|lunch|dinner|mcdonald|kfc|subway|dosa|restaurant|ખાવાનું|ભોજન|જમવાનું|નાસ્તો|ફૂડ|કોર્ટ|खाना|भोजन|रेस्तरां|रेस्टोरेंट|फ़ूड|फूड/i.test(
      qLower,
    )
  ) {
    const foodCourtFac = FALLBACK_FACILITIES.find((f) => f.type === 'FOOD_COURT') || {
      id: 11,
      label: 'Nexus Central Food Court',
      floorNumber: 3,
      navigationNodeId: 93,
    };
    let reply =
      'The Nexus Central Food Court is located on the Third Floor (3F), featuring McDonalds, KFC, Subway, and Dosa Plaza with over 400 dining seats.';
    if (isGujarati) {
      reply =
        'નેક્સસ સેન્ટ્રલ ફૂડ કોર્ટ ત્રીજા માળે (Floor 3F) આવેલું છે, જ્યાં મેકડોનાલ્ડ્સ, કેએફસી, સબવે અને ઢોસા પ્લાઝા ઉપલબ્ધ છે.';
    } else if (isHindi) {
      reply =
        'नेक्सस सेंट्रल फूड कोर्ट तीसरी मंजिल (Floor 3F) पर स्थित है, जहाँ मैकडॉनल्ड्स, केएफसी, सबवे और डोसा प्लाजा उपलब्ध हैं।';
    }
    return {
      reply,
      lang: langName,
      langCode,
      intent: 'FOOD_COURT_LOCATION',
      destination: {
        id: foodCourtFac.id,
        name: foodCourtFac.label,
        category: 'Dining',
        floor: 3,
        floor_name: 'Third Floor (3F)',
        node_id: foodCourtFac.navigationNodeId,
      },
    };
  }

  // 5. Customer Service / Help Desk / Information
  if (
    /help|guest service|customer care|information desk|lost and found|સહાય|પૂછપરછ|સહાયતા|पूछताछ|सहायता केंद्र/i.test(
      qLower,
    )
  ) {
    const helpdesk = FALLBACK_FACILITIES.find((f) => f.type === 'CUSTOMER_SERVICE') || {
      id: 6,
      label: 'Nexus Guest Services Desk',
      floorNumber: 0,
      navigationNodeId: 34,
    };
    let reply =
      'The Guest Services & Information Desk is right at the Main Grand Entrance (Vastrapur Gate) on the Ground Floor.';
    if (isGujarati) {
      reply =
        'માહિતી અને સહાયતા કેન્દ્ર ગ્રાઉન્ડ ફ્લોર પર મુખ્ય વસ્ત્રાપુર પ્રવેશદ્વાર પાસે ઉપલબ્ધ છે.';
    } else if (isHindi) {
      reply =
        'सूचना एवं ग्राहक सेवा केंद्र ग्राउंड फ्लोर पर मुख्य वस्त्रापुर गेट के पास स्थित है।';
    }
    return {
      reply,
      lang: langName,
      langCode,
      intent: 'AMENITY_DISCOVERY',
      destination: {
        id: helpdesk.id,
        name: helpdesk.label,
        category: 'Customer Service',
        floor: 0,
        floor_name: 'Ground Floor (G)',
        node_id: helpdesk.navigationNodeId,
      },
    };
  }

  // 6. Mall Timings / General FAQs
  if (/timing|hour|open|close|park|valet|સમય|પાર્કિંગ|समय|पार्किंग|खुलने का समय/i.test(qLower)) {
    let reply =
      'Nexus Ahmedabad One is open daily from 10:00 AM to 10:00 PM. Two-level basement parking with valet services is accessible via the Lower Ground (LG) entrance.';
    if (isGujarati) {
      reply =
        'નેક્સસ અમદાવાદ વન દરરોજ સવારે ૧૦:૦૦ થી રાત્રે ૧૦:૦૦ વાગ્યા સુધી ખુલ્લું રહે છે. બે માળનું બેસમેન્ટ પાર્કિંગ લોઅર ગ્રાઉન્ડ (LG) થી ઉપલબ્ધ છે.';
    } else if (isHindi) {
      reply =
        'नेक्सस अहमदाबाद वन प्रतिदिन सुबह 10:00 बजे से रात 10:00 बजे तक खुला रहता है। दो-स्तरीय बेसमेंट पार्किंग लोअर ग्राउंड (LG) से उपलब्ध है।';
    }
    return {
      reply,
      lang: langName,
      langCode,
      intent: 'GENERAL_MALL_FAQ',
    };
  }

  // 7. Store Search (Matching 30 stores)
  const matchedShop = FALLBACK_SHOPS.find((s) => {
    const nameMatch = s.name.toLowerCase().includes(qLower) || qLower.includes(s.name.toLowerCase().split(' ')[0]);
    const catMatch = s.category.toLowerCase().includes(qLower);
    return nameMatch || catMatch;
  });

  if (matchedShop) {
    const floorLabel =
      matchedShop.floorNumber === -1
        ? 'Lower Ground (LG)'
        : matchedShop.floorNumber === 0
        ? 'Ground Floor (G)'
        : `Floor ${matchedShop.floorNumber}F`;
    const r = getFallbackRoute(currentStartKioskNodeId, matchedShop.navigationNodeId);
    const dist = r.estimatedDistanceMeters ?? r.totalDistance;

    let reply = `${matchedShop.name} (${matchedShop.category}) is located on ${floorLabel}, approximately ${dist} meters from your starting kiosk. ${matchedShop.description ?? ''}`;
    if (isGujarati) {
      reply = `${matchedShop.name} (${matchedShop.category}) ${floorLabel} પર આવેલી છે (આશરે ${dist} મીટર).`;
    } else if (isHindi) {
      reply = `${matchedShop.name} (${matchedShop.category}) ${floorLabel} पर स्थित है (लगभग ${dist} मीटर दूर)।`;
    }

    const relatedProducts = FALLBACK_PRODUCTS.filter((p) => p.shopId === matchedShop.id);

    return {
      reply,
      lang: langName,
      langCode,
      intent: 'STORE_DISCOVERY',
      destination: {
        id: matchedShop.id,
        name: matchedShop.name,
        category: matchedShop.category,
        floor: matchedShop.floorNumber,
        floor_name: floorLabel,
        node_id: matchedShop.navigationNodeId,
      },
      products: relatedProducts.length > 0 ? relatedProducts : undefined,
    };
  }

  // 8. Product Discovery (Shoes, Apparel, Toys, Electronics, Groceries)
  const matchedProd = FALLBACK_PRODUCTS.find((p) => {
    return (
      qLower.includes(p.name.toLowerCase()) ||
      qLower.includes(p.category.toLowerCase()) ||
      (p.brand && qLower.includes(p.brand.toLowerCase())) ||
      (qLower.includes('shoe') && p.category.includes('Sportswear')) ||
      (qLower.includes('blazer') && p.category.includes('Apparel')) ||
      (qLower.includes('toy') && p.category.includes('Toys'))
    );
  });

  if (matchedProd) {
    const shop = FALLBACK_SHOPS.find((s) => s.id === matchedProd.shopId);
    const floorLabel = matchedProd.shopFloorNumber === 0 ? 'Ground Floor (G)' : `Floor ${matchedProd.shopFloorNumber}F`;
    let reply = `We found "${matchedProd.name}" at ${matchedProd.shopName} (${floorLabel}) for ₹${matchedProd.effectivePrice}.`;
    if (isGujarati) {
      reply = `"${matchedProd.name}" ${matchedProd.shopName} (${floorLabel}) પર ₹${matchedProd.effectivePrice} માં ઉપલબ્ધ છે.`;
    } else if (isHindi) {
      reply = `"${matchedProd.name}" ${matchedProd.shopName} (${floorLabel}) पर ₹${matchedProd.effectivePrice} में उपलब्ध है।`;
    }

    return {
      reply,
      lang: langName,
      langCode,
      intent: 'PRODUCT_DISCOVERY',
      destination: shop
        ? {
            id: shop.id,
            name: shop.name,
            category: shop.category,
            floor: shop.floorNumber,
            floor_name: floorLabel,
            node_id: shop.navigationNodeId,
          }
        : undefined,
      products: [matchedProd],
    };
  }

  // Default fallback guidance
  let defaultReply =
    "I'm your Nexus Ahmedabad One concierge. You can ask for any store (Zara, Nike, Hamleys), amenities (washrooms, ATMs), food court, or products in English, Hindi, or Gujarati.";
  if (isGujarati) {
    defaultReply =
      "નેક્સસ અમદાવાદ વન કન્સિયર્જમાં સ્વાગત છે. તમે સ્ટોર, શૌચાલય, એટીએમ, ફૂડ કોર્ટ અથવા વસ્તુઓ વિશે પૂછી શકો છો.";
  } else if (isHindi) {
    defaultReply =
      "नेक्सस अहमदाबाद वन कंसीयर्ज में आपका स्वागत है। आप स्टोर, शौचालय, एटीएम, फ़ूड कोर्ट या उत्पादों के बारे में पूछ सकते हैं।";
  }

  return {
    reply: defaultReply,
    lang: langName,
    langCode,
    intent: 'GENERAL_ASSISTANCE',
  };
}

export default function VoiceWidget() {
  const { addToCart } = useCart();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');
  const [preferredLang, setPreferredLang] = useState<'auto' | 'en' | 'hi' | 'gu'>('auto');

  // Strict 11-State Interaction Machine
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to listen. Tap the microphone or type below.');

  const [log, setLog] = useState<Turn[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: 'Welcome to Nexus Ahmedabad One. I can assist you with store locations, floor directions, and product availability. Speak in Gujarati, Hindi, or English.',
      detectedLanguage: 'Multilingual ASR Active (EN • HI • GU)',
    },
  ]);
  const [text, setText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Active audio & stream tracking for guaranteed leak prevention
  const activeStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechRecognitionRef = useRef<unknown>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [log, voiceState]);

  // Guaranteed audio and stream cleanup helper
  const stopAllAudioAndStreams = useCallback(() => {
    // 1. Stop mic tracks
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      activeStreamRef.current = null;
    }
    // 2. Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    // 3. Stop browser speech recognition
    if (speechRecognitionRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (speechRecognitionRef.current as any).abort();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    // 4. Cancel active wav audio
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current.currentTime = 0;
      activeAudioElementRef.current = null;
    }
    // 5. Cancel Web Speech API utterance
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    activeUtteranceRef.current = null;
  }, []);

  // Cleanup on modal close or unmount
  useEffect(() => {
    return () => {
      stopAllAudioAndStreams();
    };
  }, [stopAllAudioAndStreams]);

  // Play audio response with fallback
  const playResponseAudio = useCallback(
    (base64Wav?: string, textToSpeak?: string, langCode = 'en') => {
      if (!voiceEnabled) {
        setVoiceState('completed');
        setStatusMessage('Response ready.');
        return;
      }

      setVoiceState('speaking_response');
      setStatusMessage('Speaking response...');

      if (base64Wav) {
        try {
          const bytes = atob(base64Wav);
          const buf = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
          const blob = new Blob([buf], { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          activeAudioElementRef.current = audio;

          audio.onended = () => {
            URL.revokeObjectURL(url);
            activeAudioElementRef.current = null;
            setVoiceState('completed');
            setStatusMessage('Ready for your next request.');
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            activeAudioElementRef.current = null;
            if (textToSpeak) {
              activeUtteranceRef.current = speakTextWithWebSpeech(textToSpeak, langCode, () => {
                setVoiceState('completed');
                setStatusMessage('Ready for your next request.');
              });
            } else {
              setVoiceState('completed');
            }
          };
          audio.play().catch(() => {
            if (textToSpeak) {
              activeUtteranceRef.current = speakTextWithWebSpeech(textToSpeak, langCode, () => {
                setVoiceState('completed');
                setStatusMessage('Ready for your next request.');
              });
            } else {
              setVoiceState('completed');
            }
          });
          return;
        } catch {
          // fall through to Web Speech API
        }
      }

      if (textToSpeak) {
        activeUtteranceRef.current = speakTextWithWebSpeech(textToSpeak, langCode, () => {
          setVoiceState('completed');
          setStatusMessage('Ready for your next request.');
        });
      } else {
        setVoiceState('completed');
        setStatusMessage('Ready for your next request.');
      }
    },
    [voiceEnabled],
  );

  // Handle Query Execution (Unified pipeline: Language Detection -> Intent -> RAG / Dijkstra -> TTS)
  const executeQuery = useCallback(
    async (userQuery: string, source: 'voice' | 'text' = 'voice') => {
      if (!userQuery.trim()) return;
      const q = userQuery.trim();

      setErrorDetails(null);
      setLog((prev) => [
        ...prev,
        {
          id: `usr_${Date.now()}`,
          role: 'user',
          text: source === 'voice' ? `🗣️ "${q}"` : q,
        },
      ]);

      setVoiceState('understanding_request');
      setStatusMessage('Classifying intent & detecting language...');

      // 1. Try server-side AI / RAG query
      try {
        setVoiceState('retrieving_information');
        setStatusMessage('Searching Nexus Ahmedabad One directory...');

        const ragRes = await api.post<RAGQueryResponse>('/ai/rag/query', {
          text: q,
          speak: voiceEnabled,
        });

        if (ragRes.destination?.node_id) {
          setVoiceState('calculating_route');
          setStatusMessage('Calculating shortest graph route...');
        }

        if (ragRes.action === 'ADD_TO_CART' && ragRes.destination?.id) {
          try {
            await addToCart(Number(ragRes.destination.id));
          } catch {
            // fallback
          }
        }

        const topContext = ragRes.retrieved_context && ragRes.retrieved_context[0];
        const newTurn: Turn = {
          id: `asst_${Date.now()}`,
          role: 'assistant',
          text: ragRes.layman_text,
          action: ragRes.action,
          detectedLanguage: `${ragRes.detected_language} (${Math.round((ragRes.confidence || 1) * 100)}%)`,
          ragContext: topContext
            ? `${topContext.name} • ${topContext.floor} (${Math.round(topContext.score * 100)}% match)`
            : undefined,
          destination: ragRes.destination,
          audioBase64: ragRes.audio_base64,
          languageCode: ragRes.language_code,
        };

        setLog((prev) => [...prev, newTurn]);
        playResponseAudio(ragRes.audio_base64, ragRes.layman_text, ragRes.language_code);
      } catch {
        // 2. High-quality client fallback with Trilingual Intelligence & Shortest Dijkstra Graph
        try {
          setVoiceState('retrieving_information');
          setStatusMessage('Resolving destination via MallMind indoor graph...');

          const fallbackResult = processClientFallbackQuery(q);

          if (fallbackResult.destination) {
            setVoiceState('calculating_route');
            setStatusMessage('Calculating Dijkstra walking route...');
          }

          const fallbackTurn: Turn = {
            id: `asst_fb_${Date.now()}`,
            role: 'assistant',
            text: fallbackResult.reply,
            intent: fallbackResult.intent,
            detectedLanguage: `${fallbackResult.lang} (Client Fallback Engine)`,
            ragContext: fallbackResult.destination
              ? `${fallbackResult.destination.name} • ${fallbackResult.destination.floor_name}`
              : 'Direct Knowledge Base',
            destination: fallbackResult.destination,
            products: fallbackResult.products,
            languageCode: fallbackResult.langCode,
          };

          setLog((prev) => [...prev, fallbackTurn]);
          playResponseAudio(undefined, fallbackResult.reply, fallbackResult.langCode);
        } catch (fbErr: unknown) {
          const msg = fbErr instanceof Error ? fbErr.message : 'Unknown error';
          setVoiceState('error');
          setErrorDetails(`Unable to complete request: ${msg}`);
          setStatusMessage('Error encountered. Please retry.');
        }
      }
    },
    [addToCart, playResponseAudio, voiceEnabled],
  );

  // Web Speech Recognition Fallback for Browser ASR
  const runBrowserSpeechRecognition = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceState('error');
      setErrorDetails('Speech recognition is not supported in this browser. Please use the Text Input tab.');
      setStatusMessage('ASR not supported. Please use text.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      speechRecognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;

      // Set language based on user preference
      if (preferredLang === 'gu') {
        recognition.lang = 'gu-IN';
      } else if (preferredLang === 'hi') {
        recognition.lang = 'hi-IN';
      } else if (preferredLang === 'en') {
        recognition.lang = 'en-IN';
      } else {
        recognition.lang = 'en-IN'; // Multilingual default
      }

      recognition.onstart = () => {
        setVoiceState('recording');
        setStatusMessage('Recording speech... Speak in Gujarati, Hindi or English.');
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript && transcript.trim()) {
          setVoiceState('processing_speech');
          setStatusMessage(`Recognized: "${transcript.trim()}"`);
          void executeQuery(transcript.trim(), 'voice');
        } else {
          setVoiceState('error');
          setErrorDetails('Could not understand speech. Please try speaking again.');
          setStatusMessage('No speech detected.');
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setVoiceState('error');
          setErrorDetails('Microphone access was denied. Please allow microphone permissions in your browser address bar.');
        } else {
          setVoiceState('error');
          setErrorDetails(`Voice input error (${e.error || 'unknown'}). You can use the Text Input tab below.`);
        }
        setStatusMessage('Speech recognition error.');
      };

      recognition.onend = () => {
        speechRecognitionRef.current = null;
      };

      recognition.start();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Speech recognition start error';
      setVoiceState('error');
      setErrorDetails(msg);
      setStatusMessage('Failed to start speech recognition.');
    }
  }, [executeQuery, preferredLang]);

  // Start Multilingual Voice Capture
  const startListening = useCallback(async () => {
    stopAllAudioAndStreams();
    setErrorDetails(null);
    setVoiceState('requesting_permission');
    setStatusMessage('Requesting microphone permission...');

    // Test getUserMedia support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      runBrowserSpeechRecognition();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = stream;
      audioChunksRef.current = [];

      setVoiceState('listening');
      setStatusMessage('Microphone active. Preparing recorder...');

      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Immediately stop tracks to release mic hardware
        stream.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 1200) {
          // Audio too short; fall back to browser Web Speech API
          runBrowserSpeechRecognition();
          return;
        }

        setVoiceState('processing_speech');
        setStatusMessage('Processing audio via Whisper ASR...');

        try {
          const form = new FormData();
          form.append('file', blob, 'speech.webm');
          form.append('audio', blob, 'speech.webm');
          const whisperRes = await fetch('/ai/voice/transcribe', {
            method: 'POST',
            body: form,
          });

          if (!whisperRes.ok) throw new Error(`Whisper HTTP ${whisperRes.status}`);
          const data = await whisperRes.json();
          const transcript = data.transcript;

          if (!transcript || !transcript.trim()) {
            throw new Error('Empty transcript returned');
          }

          void executeQuery(transcript.trim(), 'voice');
        } catch {
          // If server transcribe fails, fall back to browser recognition
          runBrowserSpeechRecognition();
        }
      };

      recorder.start();
      setVoiceState('recording');
      setStatusMessage('Listening... Speak now in Gujarati, Hindi, or English.');
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setVoiceState('error');
        setErrorDetails(
          'Microphone permission was denied. Please allow microphone access in your browser settings (lock icon in address bar) or switch to the Text Input tab.',
        );
        setStatusMessage('Microphone permission blocked.');
      } else {
        // Fallback to Web Speech API
        runBrowserSpeechRecognition();
      }
    }
  }, [runBrowserSpeechRecognition, executeQuery, stopAllAudioAndStreams]);

  // Stop Recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else if (speechRecognitionRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (speechRecognitionRef.current as any).stop();
      } catch {
        // ignore
      }
    }
  }, []);

  // Cancel Current Interaction
  const handleCancel = useCallback(() => {
    stopAllAudioAndStreams();
    setVoiceState('idle');
    setStatusMessage('Interaction cancelled. Ready.');
    setErrorDetails(null);
  }, [stopAllAudioAndStreams]);

  // Replay Last Response Audio
  const handleReplayResponse = useCallback(
    (turn: Turn) => {
      stopAllAudioAndStreams();
      playResponseAudio(turn.audioBase64, turn.text, turn.languageCode || 'en');
    },
    [playResponseAudio, stopAllAudioAndStreams],
  );

  const samplePrompts = [
    'Where is the nearest washroom?',
    'Take me to Zara',
    'મને શૂઝ ક્યાંથી મળશે?',
    'Cinepolis Multiplex rasta',
    'Where is the ATM?',
    'શૌચાલય ક્યાં છે?',
    'Food Court diners',
    'Hamleys toys store',
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <button
          className="voice-float-btn"
          onClick={() => {
            setOpen(true);
            setVoiceState('idle');
          }}
          aria-label="Open Multilingual Voice Concierge"
        >
          <Mic size={15} />
          <span>Voice Concierge</span>
        </button>
      )}

      {/* Floating Concierge Modal */}
      {open && (
        <div
          className="voice-modal"
          style={{
            width: 420,
            maxHeight: 640,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-xl)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'var(--brand-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="row" style={{ gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(255, 255, 255, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Headphones size={17} />
              </div>
              <div>
                <strong
                  style={{
                    fontSize: 14,
                    display: 'block',
                    fontWeight: 700,
                    fontFamily: 'var(--font-headings)',
                    letterSpacing: '0.01em',
                  }}
                >
                  Mall Concierge
                </strong>
                <span style={{ fontSize: 11, color: 'var(--bg-brand-light)', opacity: 0.9 }}>
                  Nexus Ahmedabad One · Multilingual (EN • HI • GU)
                </span>
              </div>
            </div>

            <div className="row" style={{ gap: 6 }}>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? 'Mute Audio Output' : 'Enable Spoken Audio'}
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: voiceEnabled ? 1 : 0.6,
                }}
              >
                {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button
                onClick={() => {
                  stopAllAudioAndStreams();
                  setOpen(false);
                }}
                aria-label="Close assistant"
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Subheader: Mode Tabs & Language Selector */}
          <div
            style={{
              padding: '8px 14px',
              background: '#F9F8F5',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
            }}
          >
            {/* Input Mode Selector */}
            <div style={{ display: 'flex', gap: 4, background: '#EAE8E1', padding: 2, borderRadius: 6 }}>
              <button
                onClick={() => setActiveTab('voice')}
                style={{
                  border: 'none',
                  background: activeTab === 'voice' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'voice' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'voice' ? 700 : 500,
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: activeTab === 'voice' ? 'var(--shadow-xs)' : 'none',
                }}
              >
                <Mic size={12} />
                <span>Voice</span>
              </button>
              <button
                onClick={() => setActiveTab('text')}
                style={{
                  border: 'none',
                  background: activeTab === 'text' ? '#FFFFFF' : 'transparent',
                  color: activeTab === 'text' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'text' ? 700 : 500,
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: activeTab === 'text' ? 'var(--shadow-xs)' : 'none',
                }}
              >
                <Keyboard size={12} />
                <span>Text</span>
              </button>
            </div>

            {/* Language Pin Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Languages size={12} style={{ color: 'var(--text-muted)' }} />
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value as 'auto' | 'en' | 'hi' | 'gu')}
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: '1px solid var(--border-color)',
                  background: '#FFFFFF',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
                title="Select preferred voice recognition language"
              >
                <option value="auto">🌐 Auto Detect</option>
                <option value="en">English (IN)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
              </select>
            </div>
          </div>

          {/* Active 11-State Interaction Status Banner */}
          <div
            style={{
              padding: '6px 14px',
              background:
                voiceState === 'recording'
                  ? '#FEF2F2'
                  : voiceState === 'speaking_response'
                  ? '#EFF6FF'
                  : voiceState === 'error'
                  ? '#FFF1F2'
                  : voiceState === 'completed'
                  ? '#F0FDF4'
                  : '#FAF9F6',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color:
                voiceState === 'recording'
                  ? '#DC2626'
                  : voiceState === 'speaking_response'
                  ? '#1D4ED8'
                  : voiceState === 'error'
                  ? '#BE123C'
                  : 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
              {voiceState === 'recording' && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#DC2626',
                    animation: 'pulse 1s infinite',
                    flexShrink: 0,
                  }}
                />
              )}
              {['processing_speech', 'understanding_request', 'retrieving_information', 'calculating_route'].includes(
                voiceState,
              ) && <Loader2 size={12} className="spin" style={{ flexShrink: 0 }} />}
              {voiceState === 'speaking_response' && <Volume2 size={12} style={{ flexShrink: 0 }} />}
              {voiceState === 'completed' && <CheckCircle size={12} style={{ color: '#16A34A', flexShrink: 0 }} />}
              {voiceState === 'error' && <AlertCircle size={12} style={{ color: '#DC2626', flexShrink: 0 }} />}
              {voiceState === 'idle' && <Sparkles size={12} style={{ color: 'var(--brand-accent)', flexShrink: 0 }} />}

              <span style={{ fontWeight: 600, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {statusMessage}
              </span>
            </div>

            {/* Cancel Interaction Button */}
            {voiceState !== 'idle' && voiceState !== 'completed' && (
              <button
                onClick={handleCancel}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 4px',
                  textDecoration: 'underline',
                  flexShrink: 0,
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {/* Chat Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxHeight: 340,
              background: 'var(--bg-primary)',
            }}
          >
            {log.map((turn) => (
              <div
                key={turn.id}
                style={{
                  alignSelf: turn.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                }}
              >
                {/* Assistant Metadata Badges */}
                {turn.role === 'assistant' && (turn.detectedLanguage || turn.ragContext) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    {turn.detectedLanguage && (
                      <span className="badge" style={{ fontSize: 10, padding: '2px 6px' }}>
                        <Languages size={10} /> {turn.detectedLanguage}
                      </span>
                    )}
                    {turn.ragContext && (
                      <span className="badge badge-gold" style={{ fontSize: 10, padding: '2px 6px' }}>
                        <Database size={10} /> {turn.ragContext}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: turn.role === 'user' ? 'var(--bg-brand-light)' : 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    lineHeight: 1.45,
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-xs)',
                    position: 'relative',
                  }}
                >
                  {turn.text}

                  {/* Navigation Route Action Button */}
                  {turn.destination && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                      <Link
                        to={`/map?toNodeId=${turn.destination.node_id}&toLabel=${encodeURIComponent(
                          turn.destination.name,
                        )}&floor=${turn.destination.floor}&autoStart=true`}
                        onClick={() => {
                          stopAllAudioAndStreams();
                          setOpen(false);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          background: 'var(--route-blue)',
                          color: '#FFFFFF',
                          borderRadius: 'var(--radius-xs)',
                          textDecoration: 'none',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Navigation size={13} />
                        <span>Navigate to {turn.destination.name}</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}

                  {/* E-Commerce Add-to-Cart Action Buttons */}
                  {turn.action === 'ADD_TO_CART' && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: '#D1FAE5',
                          color: '#065F46',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        <CheckCircle size={12} /> Added to Cart
                      </span>
                      <Link
                        to="/cart"
                        onClick={() => {
                          stopAllAudioAndStreams();
                          setOpen(false);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          background: 'var(--brand-primary)',
                          color: '#fff',
                          borderRadius: 4,
                          fontSize: 11,
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        <ShoppingBag size={12} /> View Cart & Checkout <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}

                  {turn.action === 'COMPARE_PRODUCTS' && (
                    <div style={{ marginTop: 10 }}>
                      <Link
                        to="/products"
                        onClick={() => {
                          stopAllAudioAndStreams();
                          setOpen(false);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          background: '#3B82F6',
                          color: '#fff',
                          borderRadius: 4,
                          fontSize: 11,
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                      >
                        <Scale size={12} /> Open Comparison Matrix <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}

                  {/* Assistant Replay Voice Button */}
                  {turn.role === 'assistant' && (
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleReplayResponse(turn)}
                        title="Replay Spoken Response"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        <RotateCcw size={11} />
                        <span>Replay Audio</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Product Card Previews */}
                {turn.products && turn.products.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      overflowX: 'auto',
                      padding: '6px 2px',
                      marginTop: 4,
                    }}
                  >
                    {turn.products.slice(0, 3).map((p) => (
                      <Link
                        key={p.id}
                        to={`/products/${p.id}`}
                        onClick={() => {
                          stopAllAudioAndStreams();
                          setOpen(false);
                        }}
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-xs)',
                          padding: 6,
                          minWidth: 120,
                          fontSize: 11,
                        }}
                      >
                        <img
                          src={getProductImage(p.id, p.category)}
                          alt={p.name}
                          style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 3, marginBottom: 4 }}
                        />
                        <div
                          style={{
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.name}
                        </div>
                        <div style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>₹{p.effectivePrice}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {errorDetails && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  background: '#FEF2F2',
                  color: '#991B1B',
                  fontSize: 12,
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{errorDetails}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Trilingual Prompts */}
          <div
            style={{
              padding: '6px 12px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => void executeQuery(p, 'text')}
                disabled={voiceState === 'recording'}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  padding: '3px 8px',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Voice Input vs Text Input Bar */}
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {activeTab === 'voice' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                {/* Large Voice Recording Trigger Button */}
                <button
                  onClick={voiceState === 'recording' ? stopRecording : startListening}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: voiceState === 'recording' ? '#DC2626' : 'var(--brand-primary)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: voiceState === 'recording' ? '0 0 12px rgba(220, 38, 38, 0.4)' : 'var(--shadow-sm)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {voiceState === 'recording' ? (
                    <>
                      <MicOff size={18} />
                      <span>Stop Speaking (Click when done)</span>
                    </>
                  ) : (
                    <>
                      <Mic size={18} />
                      <span>Start Speaking (EN / HI / GU)</span>
                    </>
                  )}
                </button>

                {voiceState === 'recording' && (
                  <button
                    onClick={handleCancel}
                    style={{
                      height: 42,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: '#FFFFFF',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <input
                  type="text"
                  placeholder="Ask about stores, washrooms, shoes, or food..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && text.trim()) {
                      const val = text.trim();
                      setText('');
                      void executeQuery(val, 'text');
                    }
                  }}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                />

                <button
                  className="btn btn-primary btn-sm"
                  disabled={!text.trim()}
                  onClick={() => {
                    if (text.trim()) {
                      const val = text.trim();
                      setText('');
                      void executeQuery(val, 'text');
                    }
                  }}
                  style={{ padding: '8px 14px', flexShrink: 0 }}
                >
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
