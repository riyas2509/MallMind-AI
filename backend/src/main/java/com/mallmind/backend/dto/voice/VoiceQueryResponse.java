package com.mallmind.backend.dto.voice;

/** API-facing shape returned by VoiceController. audioBase64 is the
 * assistant's spoken reply (WAV, base64-encoded) -- null when text-to-speech
 * wasn't requested or the model-service's TTS is unavailable (Part 10:
 * graceful degradation, not a hard failure of the whole response). */
public record VoiceQueryResponse(
        String sessionId,
        String transcript,
        String intent,
        double confidence,
        boolean lowConfidence,
        NluEntities entities,
        String responseText,
        Object data,
        String audioBase64) {
}
