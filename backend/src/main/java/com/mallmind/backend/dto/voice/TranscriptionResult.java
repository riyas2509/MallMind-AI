package com.mallmind.backend.dto.voice;

/** Mirrors the model-service's TranscriptionResponse, POST /voice/transcribe. */
public record TranscriptionResult(String transcript) {
}
