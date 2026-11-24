package com.mallmind.backend.service.voice;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory conversational session store (Part 15). Deliberately not
 * persisted: a session only ever holds search filters the visitor already
 * spoke out loud (category/brand/color/budget/shop/facility), never audio
 * or a transcript, and losing it on restart is an acceptable trade-off for
 * not retaining voice-derived data by default (Part 17 privacy rule).
 */
@Service
public class VoiceSessionService {

    private final Map<String, VoiceSlots> sessions = new ConcurrentHashMap<>();

    public String newSessionId() {
        return UUID.randomUUID().toString();
    }

    public VoiceSlots slotsFor(String sessionId) {
        return sessions.computeIfAbsent(sessionId, id -> new VoiceSlots());
    }
}
