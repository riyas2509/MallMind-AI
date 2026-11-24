import { useCallback, useRef, useState } from 'react';
import { api } from '../api/client';
import type { ProductResponse, VoiceQueryResponse } from '../api/types';
import { Link } from 'react-router-dom';
import { getProductImage } from '../utils/images';
import { useCart } from '../auth/CartContext';
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
} from 'lucide-react';

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
  role: 'user' | 'assistant';
  text: string;
  intent?: string;
  action?: string;
  detectedLanguage?: string;
  confidence?: number;
  ragContext?: string;
  destination?: DestinationInfo;
  products?: ProductResponse[];
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

function speakTextWithWebSpeech(text: string, langCode: string) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[^\w\s\u0900-\u097F\u0A80-\u0AFF]/gi, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (langCode === 'gu') {
      utterance.lang = 'gu-IN';
    } else if (langCode === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch {
    // fallback
  }
}

function playBase64Wav(base64: string, fallbackText?: string, langCode?: string) {
  try {
    const bytes = atob(base64);
    const buf = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
    const blob = new Blob([buf], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(() => {
      if (fallbackText && langCode) speakTextWithWebSpeech(fallbackText, langCode);
    });
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {
    if (fallbackText && langCode) speakTextWithWebSpeech(fallbackText, langCode);
  }
}

export default function VoiceWidget() {
  const { addToCart } = useCart();
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<Turn[]>([
    {
      role: 'assistant',
      text: "Welcome to Nexus Ahmedabad One. I can assist you with store locations, floor directions, and product availability. Speak in Gujarati, Hindi, or English.",
      detectedLanguage: "Multilingual ASR Active",
    },
  ]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Send Text Query to RAG & AI Pipeline
  const sendTextQuery = async (queryText: string) => {
    if (!queryText.trim() || sending) return;
    const q = queryText.trim();
    setText('');
    setError(null);
    setSending(true);

    setLog((prev) => [...prev, { role: 'user', text: q }]);

    try {
      const ragRes = await api.post<RAGQueryResponse>('/ai/rag/query', { text: q, speak: voiceEnabled });
      const topContext = ragRes.retrieved_context && ragRes.retrieved_context[0];

      if (ragRes.action === 'ADD_TO_CART' && ragRes.destination?.id) {
        try {
          await addToCart(Number(ragRes.destination.id));
        } catch {
          // fallback if guest/error
        }
      }

      setLog((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: ragRes.layman_text,
          action: ragRes.action,
          detectedLanguage: `${ragRes.detected_language} (${Math.round((ragRes.confidence || 1) * 100)}%)`,
          ragContext: topContext ? `${topContext.name} • ${topContext.floor} (${Math.round(topContext.score * 100)}% match)` : undefined,
          destination: ragRes.destination,
        },
      ]);

      if (voiceEnabled) {
        if (ragRes.audio_base64) {
          playBase64Wav(ragRes.audio_base64, ragRes.layman_text, ragRes.language_code);
        } else {
          speakTextWithWebSpeech(ragRes.layman_text, ragRes.language_code);
        }
      }
    } catch {
      try {
        const body: Record<string, string> = { text: q };
        if (sessionIdRef.current) body.sessionId = sessionIdRef.current;
        const res = await api.post<VoiceQueryResponse>(`/api/voice/text?speak=${voiceEnabled}`, body);
        sessionIdRef.current = res.sessionId;

        setLog((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: res.responseText,
            intent: res.intent,
            products: Array.isArray(res.data) ? (res.data as ProductResponse[]) : undefined,
          },
        ]);

        if (voiceEnabled && res.audioBase64) {
          playBase64Wav(res.audioBase64);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Connection failed';
        setError(`Could not connect to AI service: ${message}. Ensure model-service (8001) or backend (8085) is running.`);
      }
    } finally {
      setSending(false);
    }
  };

  // Start Multilingual Microphone Recording
  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 1000) {
          setError('Recording too short. Please speak again.');
          return;
        }

        setSending(true);
        try {
          const form = new FormData();
          form.append('file', blob, 'speech.webm');
          form.append('audio', blob, 'speech.webm');
          const whisperRes = await fetch('/ai/voice/transcribe', {
            method: 'POST',
            body: form,
          });

          if (!whisperRes.ok) throw new Error(`Whisper ASR failed (HTTP ${whisperRes.status})`);
          const { transcript } = await whisperRes.json();
          if (!transcript || !transcript.trim()) {
            setError('Could not recognize speech. Please speak clearly into your microphone.');
            setSending(false);
            return;
          }

          setLog((prev) => [...prev, { role: 'user', text: `🗣️ "${transcript}"` }]);

          const ragRes = await api.post<RAGQueryResponse>('/ai/rag/query', { text: transcript, speak: voiceEnabled });
          const topContext = ragRes.retrieved_context && ragRes.retrieved_context[0];

          if (ragRes.action === 'ADD_TO_CART' && ragRes.destination?.id) {
            try {
              await addToCart(Number(ragRes.destination.id));
            } catch {
              // fallback if guest
            }
          }

          setLog((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: ragRes.layman_text,
              action: ragRes.action,
              detectedLanguage: `${ragRes.detected_language} (${Math.round((ragRes.confidence || 1) * 100)}%)`,
              ragContext: topContext ? `${topContext.name} • ${topContext.floor} (${Math.round(topContext.score * 100)}% match)` : undefined,
              destination: ragRes.destination,
            },
          ]);

          if (voiceEnabled) {
            if (ragRes.audio_base64) {
              playBase64Wav(ragRes.audio_base64, ragRes.layman_text, ragRes.language_code);
            } else {
              speakTextWithWebSpeech(ragRes.layman_text, ragRes.language_code);
            }
          }
        } catch {
          try {
            const fbForm = new FormData();
            fbForm.append('audio', blob, 'query.webm');
            if (sessionIdRef.current) fbForm.append('sessionId', sessionIdRef.current);
            const res = await api.postForm<VoiceQueryResponse>(`/api/voice/query?speak=${voiceEnabled}`, fbForm);
            sessionIdRef.current = res.sessionId;
            setLog((prev) => [
              ...prev,
              { role: 'user', text: res.transcript || '🎤 [Spoken Voice Query]' },
              {
                role: 'assistant',
                text: res.responseText,
                intent: res.intent,
              },
            ]);
            if (voiceEnabled && res.audioBase64) {
              playBase64Wav(res.audioBase64);
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Processing failed';
            setError(`Could not process voice recording (${message}). Please check microphone and service connection.`);
          }
        } finally {
          setSending(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError('Microphone access denied or unavailable in this browser.');
      setRecording(false);
    }
  }, [voiceEnabled]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const samplePrompts = [
    'Take me to Zara',
    'મને શૂઝ ક્યાંથી મળશે?',
    'Cinepolis Multiplex rasta',
    'Where is the ATM?',
    'Food Court diners',
    'Hamleys toys store',
  ];

  return (
    <>
      {/* Discreet, Professional Trigger Button */}
      {!open && (
        <button
          className="voice-float-btn"
          onClick={() => setOpen(true)}
          aria-label="Open Voice Concierge"
        >
          <Mic size={15} />
          <span>Voice Concierge</span>
        </button>
      )}

      {/* Floating Concierge Window */}
      {open && (
        <div className="voice-modal" style={{ width: 400, maxHeight: 580 }}>
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
                  width: 30,
                  height: 30,
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Headphones size={16} />
              </div>
              <div>
                <strong style={{ fontSize: 14, display: 'block', fontWeight: 700, fontFamily: 'var(--font-headings)' }}>
                  Mall Concierge
                </strong>
                <span style={{ fontSize: 11, color: 'var(--bg-brand-light)', opacity: 0.9 }}>
                  Nexus Ahmedabad One · Multilingual
                </span>
              </div>
            </div>

            <div className="row" style={{ gap: 4 }}>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? 'Mute Audio' : 'Enable Audio'}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '5px 7px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: voiceEnabled ? 1 : 0.6,
                }}
              >
                {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  borderRadius: 'var(--radius-xs)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '5px 7px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              maxHeight: 360,
              background: 'var(--bg-primary)',
            }}
          >
            {log.map((turn, i) => (
              <div
                key={i}
                style={{
                  alignSelf: turn.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                }}
              >
                {/* Assistant metadata */}
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
                  }}
                >
                  {turn.text}

                  {/* Navigation Route Action */}
                  {turn.destination && (
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-color)' }}>
                      <Link
                        to={`/map?toNodeId=${turn.destination.node_id}&toLabel=${encodeURIComponent(
                          turn.destination.name
                        )}&floor=${turn.destination.floor}&autoStart=true`}
                        onClick={() => setOpen(false)}
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
                        <span>Navigate in Mall Map</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}

                  {/* E-Commerce Action Buttons */}
                  {turn.action === 'ADD_TO_CART' && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#D1FAE5', color: '#065F46', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        <CheckCircle size={12} /> Added to Cart
                      </span>
                      <Link
                        to="/cart"
                        onClick={() => setOpen(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--brand-primary)', color: '#fff', borderRadius: 4, fontSize: 11, textDecoration: 'none', fontWeight: 600 }}
                      >
                        <ShoppingBag size={12} /> View Cart & Checkout <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}

                  {turn.action === 'CART_TOTAL' && (
                    <div style={{ marginTop: 10 }}>
                      <Link
                        to="/cart"
                        onClick={() => setOpen(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--brand-primary)', color: '#fff', borderRadius: 4, fontSize: 11, textDecoration: 'none', fontWeight: 600 }}
                      >
                        <ShoppingBag size={12} /> Open Shopping Bag <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}

                  {turn.action === 'COMPARE_PRODUCTS' && (
                    <div style={{ marginTop: 10 }}>
                      <Link
                        to="/compare"
                        onClick={() => setOpen(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#3B82F6', color: '#fff', borderRadius: 4, fontSize: 11, textDecoration: 'none', fontWeight: 600 }}
                      >
                        <Scale size={12} /> Open Comparison Matrix <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}

                  {turn.action === 'REQUIRE_CONFIRMATION' && (
                    <div style={{ marginTop: 10 }}>
                      <Link
                        to="/checkout"
                        onClick={() => setOpen(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#D97706', color: '#fff', borderRadius: 4, fontSize: 11, textDecoration: 'none', fontWeight: 600 }}
                      >
                        Review on Checkout Screen <ArrowRight size={11} />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Products Preview */}
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
                        onClick={() => setOpen(false)}
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
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </div>
                        <div style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>₹{p.effectivePrice}</div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {sending && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>Processing multilingual query...</span>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--brand-accent-light)',
                  color: 'var(--color-error)',
                  fontSize: 12,
                  border: '1px solid rgba(199, 71, 71, 0.2)',
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Quick Prompts */}
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
                onClick={() => sendTextQuery(p)}
                disabled={sending}
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

          {/* Input & Microphone Bar */}
          <div
            style={{
              padding: '10px 14px',
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={sending}
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: recording ? 'var(--color-error)' : 'var(--brand-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title={recording ? 'Stop Speaking' : 'Click to Speak'}
            >
              {recording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              type="text"
              placeholder={recording ? 'Listening... Speak in Guj, Hin or Eng' : 'Ask in any language...'}
              value={text}
              disabled={recording || sending}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendTextQuery(text);
              }}
              style={{ fontSize: 12, padding: '8px 12px' }}
            />

            <button
              className="btn btn-primary btn-sm"
              disabled={!text.trim() || sending || recording}
              onClick={() => sendTextQuery(text)}
              style={{ padding: '8px 12px', flexShrink: 0 }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
