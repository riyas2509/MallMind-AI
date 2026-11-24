package com.mallmind.backend.dto.voice;

/**
 * Result of one conversational turn (Part 15). {@code data} carries
 * whatever real DTOs the dispatched handler fetched (a list of
 * ProductResponse, ShopResponse, or a RouteResponse) so a future frontend
 * can render structured results, not just read the spoken sentence aloud.
 */
public record VoiceQueryResult(
        String sessionId,
        String transcript,
        String intent,
        double confidence,
        boolean lowConfidence,
        NluEntities entities,
        String responseText,
        Object data) {
}
