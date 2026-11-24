"""
Voice I/O (Part 15: voice assistant). This module is deliberately limited
to speech-to-text and text-to-speech transformations -- it holds no
business logic and makes no decisions about what the user *meant*; that is
the intent classifier + entity extractor's job (intent_classifier.py,
entity_extraction.py). The Java backend's VoiceAssistantService is the one
that actually decides what to do with a transcript.

Privacy (Part 17): nothing here writes an uploaded recording to disk.
Audio bytes are decoded and transcribed entirely in memory. The one place
a temp file is unavoidable is pyttsx3's synthesis API, which only knows how
to write to a file -- that file holds synthesized (not recorded) speech and
is deleted immediately after being read back into memory.
"""
from __future__ import annotations

import io
import os
import tempfile
from typing import Optional

import numpy as np
import soundfile as sf
from scipy.signal import resample

WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "tiny")
WHISPER_TARGET_SAMPLE_RATE = 16000


class TranscriptionError(Exception):
    """Raised when the uploaded audio can't be decoded or transcribed."""


def _load_whisper_model():
    from faster_whisper import WhisperModel
    return WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")


def _decode_with_soundfile(raw_bytes: bytes) -> tuple[np.ndarray, int]:
    audio, sample_rate = sf.read(io.BytesIO(raw_bytes), dtype="float32", always_2d=False)
    return audio, sample_rate


def _decode_with_av(raw_bytes: bytes) -> tuple[np.ndarray, int]:
    """Browser microphone recordings (MediaRecorder) come as WebM/Opus by
    default, which libsndfile (soundfile) can't read -- PyAV (already a
    faster-whisper dependency) decodes that and most other containers."""
    import av

    container = av.open(io.BytesIO(raw_bytes))
    try:
        stream = container.streams.audio[0]
        resampler = av.AudioResampler(format="flt", layout="mono", rate=WHISPER_TARGET_SAMPLE_RATE)
        chunks = []
        for frame in container.decode(stream):
            for resampled in resampler.resample(frame):
                chunks.append(resampled.to_ndarray())
        for resampled in resampler.resample(None):  # flush
            chunks.append(resampled.to_ndarray())
    finally:
        container.close()

    if not chunks:
        raise TranscriptionError("No audio frames could be decoded")
    audio = np.concatenate(chunks, axis=1).flatten().astype(np.float32)
    return audio, WHISPER_TARGET_SAMPLE_RATE


def _decode_audio(raw_bytes: bytes) -> np.ndarray:
    """Decodes uploaded audio into a mono float32 array at 16kHz, which is
    what faster-whisper expects when given a raw array instead of a file
    path. Tries soundfile first (fast path for WAV, e.g. our own
    TTS-generated test clips), then falls back to PyAV for anything else
    (WebM/Opus from a real browser mic, MP4/AAC, OGG...)."""
    try:
        audio, sample_rate = _decode_with_soundfile(raw_bytes)
    except Exception:
        try:
            audio, sample_rate = _decode_with_av(raw_bytes)
        except Exception as exc:
            raise TranscriptionError(f"Could not decode audio: {exc}") from exc

    if audio.ndim > 1:
        audio = audio.mean(axis=1)

    if sample_rate != WHISPER_TARGET_SAMPLE_RATE:
        n_target = int(round(len(audio) * WHISPER_TARGET_SAMPLE_RATE / sample_rate))
        audio = resample(audio, max(n_target, 1)).astype(np.float32)

    return audio.astype(np.float32)


def transcribe(model, raw_bytes: bytes, language: Optional[str] = None) -> tuple[str, str, float]:
    audio = _decode_audio(raw_bytes)
    if audio.size == 0:
        raise TranscriptionError("Uploaded audio is empty")

    # Auto-detect language through Whisper ASR when language is not explicitly forced
    segments, info = model.transcribe(audio, language=language, beam_size=5, vad_filter=True)
    text = " ".join(segment.text.strip() for segment in segments).strip()
    detected_lang = info.language or "en"
    lang_prob = float(info.language_probability) if hasattr(info, "language_probability") and info.language_probability is not None else 1.0
    return text, detected_lang, lang_prob


GUJARATI_MAP = {
    'અ': 'a', 'આ': 'aa', 'ઇ': 'i', 'ઈ': 'ee', 'ઉ': 'u', 'ઊ': 'oo', 'ઋ': 'ri', 'એ': 'e', 'ઐ': 'ai', 'ઓ': 'o', 'ઔ': 'au',
    'ક': 'k', 'ખ': 'kh', 'ગ': 'g', 'ઘ': 'gh', 'ઙ': 'ng',
    'ચ': 'ch', 'છ': 'chh', 'જ': 'j', 'ઝ': 'z', 'ઞ': 'ny',
    'ટ': 't', 'ઠ': 'th', 'ડ': 'd', 'ઢ': 'dh', 'ણ': 'n',
    'ત': 't', 'થ': 'th', 'દ': 'd', 'ધ': 'dh', 'ન': 'n',
    'પ': 'p', 'ફ': 'f', 'બ': 'b', 'ભ': 'bh', 'મ': 'm',
    'ય': 'y', 'ર': 'r', 'લ': 'l', 'ળ': 'l', 'વ': 'v',
    'શ': 'sh', 'ષ': 'sh', 'સ': 's', 'હ': 'h',
    'ા': 'aa', 'િ': 'i', 'ી': 'ee', 'ુ': 'u', 'ૂ': 'oo', 'ૃ': 'ri',
    'ે': 'e', 'ૈ': 'ai', 'ો': 'o', 'ૌ': 'au', 'ં': 'n', 'ઃ': 'h', '્': ''
}

DEVANAGARI_MAP = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ः': 'h', '्': ''
}

def transliterate_indic_for_sapi5(text: str) -> str:
    """
    Windows SAPI5 fallback: When only US English voices (Microsoft David/Zira)
    are installed, raw Indic Unicode produces 0 audio frames. This maps Indic
    characters to phonetic Latin phonemes so English SAPI5 speaks clear,
    intelligible words while keeping English brand names intact.
    """
    import re
    if not bool(re.search(r"[\u0900-\u097F\u0A80-\u0AFF]", text)):
        return text

    out = []
    for c in text:
        if c in GUJARATI_MAP:
            out.append(GUJARATI_MAP[c])
        elif c in DEVANAGARI_MAP:
            out.append(DEVANAGARI_MAP[c])
        else:
            out.append(c)
    return "".join(out)


def check_tts_available() -> bool:
    try:
        import pyttsx3
        engine = pyttsx3.init()
        engine.stop()
        return True
    except Exception:
        return False


def synthesize(text: str) -> bytes:
    """Synthesizes speech via Windows SAPI5 (through pyttsx3). A fresh
    engine instance is created per call -- reusing one engine across
    repeated save_to_file()/runAndWait() calls is a known pyttsx3/SAPI5
    pitfall on Windows where the second call can silently produce no
    audio or hang."""
    import pyttsx3

    tmp_path: Optional[str] = None
    try:
        fd, tmp_path = tempfile.mkstemp(suffix=".wav")
        os.close(fd)

        # Transliterate for SAPI5 compatibility if only English voices exist
        text_to_speak = transliterate_indic_for_sapi5(text)

        engine = pyttsx3.init()
        engine.setProperty("rate", 170)
        engine.save_to_file(text_to_speak, tmp_path)
        engine.runAndWait()
        engine.stop()

        with open(tmp_path, "rb") as f:
            audio_bytes = f.read()
        if not audio_bytes:
            raise TranscriptionError("Speech synthesis produced no audio")
        return audio_bytes
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
