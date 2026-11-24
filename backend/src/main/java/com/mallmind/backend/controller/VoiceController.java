package com.mallmind.backend.controller;

import com.mallmind.backend.dto.voice.VoiceQueryResponse;
import com.mallmind.backend.dto.voice.VoiceQueryResult;
import com.mallmind.backend.dto.voice.VoiceTextRequest;
import com.mallmind.backend.exception.ModelServiceUnavailableException;
import com.mallmind.backend.service.voice.VoiceAssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

/**
 * Voice assistant endpoints (Part 15). Public/anonymous, same as plain
 * product/shop search -- a voice query carries no more identity than a
 * typed search box would.
 */
@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
@Slf4j
public class VoiceController {

    private final VoiceAssistantService voiceAssistantService;

    /** Text-only conversational turn -- useful for testing or a typed chat
     * fallback without a microphone. No speech synthesis unless requested. */
    @PostMapping("/text")
    public ResponseEntity<VoiceQueryResponse> text(
            @Valid @RequestBody VoiceTextRequest request,
            @RequestParam(defaultValue = "false") boolean speak) {
        VoiceQueryResult result = voiceAssistantService.handleText(request.sessionId(), request.text());
        return ResponseEntity.ok(toResponse(result, speak));
    }

    /** Full voice turn: audio in, transcript + understanding + real data +
     * (by default) spoken audio reply out. */
    @PostMapping(value = "/query", consumes = "multipart/form-data")
    public ResponseEntity<VoiceQueryResponse> query(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam(required = false) String sessionId,
            @RequestParam(defaultValue = "true") boolean speak) throws IOException {
        VoiceQueryResult result = voiceAssistantService.handleAudio(sessionId, audio.getBytes(), audio.getOriginalFilename());
        return ResponseEntity.ok(toResponse(result, speak));
    }

    private VoiceQueryResponse toResponse(VoiceQueryResult result, boolean speak) {
        String audioBase64 = null;
        if (speak && result.responseText() != null) {
            audioBase64 = trySynthesize(result.responseText());
        }
        return new VoiceQueryResponse(result.sessionId(), result.transcript(), result.intent(), result.confidence(),
                result.lowConfidence(), result.entities(), result.responseText(), result.data(), audioBase64);
    }

    /** Speech synthesis is a nice-to-have on top of an already-useful text
     * response -- if the model-service's TTS is down, degrade to text-only
     * instead of failing the whole voice query (Part 10). */
    private String trySynthesize(String text) {
        try {
            byte[] audio = voiceAssistantService.synthesize(text);
            return Base64.getEncoder().encodeToString(audio);
        } catch (ModelServiceUnavailableException ex) {
            log.warn("Text-to-speech unavailable, returning text-only voice response: {}", ex.getMessage());
            return null;
        }
    }
}
