package com.mallmind.backend.dto.voice;

import jakarta.validation.constraints.NotBlank;

/** sessionId is optional -- the caller gets a fresh one back in the response
 * on the first call and should echo it on later turns to keep context. */
public record VoiceTextRequest(String sessionId, @NotBlank String text) {
}
