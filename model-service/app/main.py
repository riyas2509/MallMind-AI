"""
FastAPI model service (Part 3.3 / Part 10): exposes the trained
recommendation and demand-prediction models over REST so the Java backend
can call them. The Java backend owns all FACTS (prices, stock, routes);
this service only returns model outputs, which Java treats as advisory
ranking/forecast signals -- never as ground truth it passes straight to a
visitor without going through real catalogue data (Part 4 "IMPORTANT" note
under Voice assistant, and Part 10: system must keep working if this
service is unavailable).

Run (from model-service/, inside the venv):
    .venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8001
"""
from __future__ import annotations

import base64
import io
import os
from typing import Optional, Any

import joblib
import numpy as np
import pandas as pd
import sys
from fastapi import FastAPI, HTTPException, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

from .demand_prediction import build_model_matrix, engineer_features
from .entity_extraction import extract as extract_entities
from .intent_classifier import IntentPredictor
from . import intent_classifier
sys.modules['intent_classifier'] = intent_classifier
from .image_classifier import ImagePredictor
from .recommendation import Preference, ProductRecommender
from .rag_engine import rag_engine
from . import speech

APP_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(APP_DIR, "..", "data")
MODELS_DIR = os.path.join(APP_DIR, "..", "models")

app = FastAPI(title="MallMind AI Model Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_recommender: Optional[ProductRecommender] = None
_demand_model = None
_demand_category_columns: list[str] | None = None
_demand_history: Optional[pd.DataFrame] = None
_intent_predictor: Optional[IntentPredictor] = None
_image_predictor: Optional[ImagePredictor] = None
_stt_model = None
_tts_available: bool = False


@app.on_event("startup")
def load_models():
    global _recommender, _demand_model, _demand_category_columns, _demand_history
    global _intent_predictor, _image_predictor, _stt_model, _tts_available

    catalog_path = os.path.join(DATA_DIR, "catalog.csv")
    if os.path.exists(catalog_path):
        catalog = pd.read_csv(catalog_path)
        catalog["available"] = catalog["available"].astype(bool)
        _recommender = ProductRecommender().fit(catalog)

    demand_model_path = os.path.join(MODELS_DIR, "demand_model.joblib")
    if os.path.exists(demand_model_path):
        bundle = joblib.load(demand_model_path)
        _demand_model = bundle["model"]
        _demand_category_columns = bundle["category_columns"]

    demand_series_path = os.path.join(DATA_DIR, "demand_series.csv")
    if os.path.exists(demand_series_path):
        _demand_history = engineer_features(pd.read_csv(demand_series_path))

    intent_model_path = os.path.join(MODELS_DIR, "intent_model.pt")
    if os.path.exists(intent_model_path):
        _intent_predictor = IntentPredictor(intent_model_path)

    image_model_path = os.path.join(MODELS_DIR, "image_model.pt")
    if os.path.exists(image_model_path):
        _image_predictor = ImagePredictor(image_model_path)

    try:
        _stt_model = speech._load_whisper_model()
    except Exception as exc:  # pragma: no cover - degrades gracefully, see Part 10
        print(f"[startup] Speech-to-text model failed to load, /voice/transcribe will return 503: {exc}")
        _stt_model = None

    _tts_available = speech.check_tts_available()
    if not _tts_available:
        print("[startup] Text-to-speech unavailable (no SAPI5 voice found?), /voice/speak will return 503")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "recommendation_model_loaded": _recommender is not None,
        "demand_model_loaded": _demand_model is not None,
        "intent_model_loaded": _intent_predictor is not None,
        "image_model_loaded": _image_predictor is not None,
        "stt_loaded": _stt_model is not None,
        "tts_available": _tts_available,
    }


class RecommendationRequest(BaseModel):
    category: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    max_budget: Optional[float] = None
    max_results: int = 10


class RecommendedProduct(BaseModel):
    product_id: int
    name: str
    category: str
    brand: Optional[str]
    color: Optional[str]
    effective_price: float
    score: float
    explanation: Optional[str] = None


@app.post("/recommendations", response_model=list[RecommendedProduct])
def recommend(request: RecommendationRequest):
    if _recommender is None:
        raise HTTPException(status_code=503, detail="Recommendation model not loaded on this service instance")

    pref = Preference(category=request.category, brand=request.brand, color=request.color, max_budget=request.max_budget)
    results = _recommender.recommend(pref, max_results=request.max_results)

    return [
        RecommendedProduct(
            product_id=int(row.product_id),
            name=row.name,
            category=row.category,
            brand=None if pd.isna(row.brand) else row.brand,
            color=None if pd.isna(row.color) else row.color,
            effective_price=float(row.effective_price),
            score=float(row.score),
            explanation=getattr(row, "explanation", None),
        )
        for row in results.itertuples()
    ]


class DemandPredictionResponse(BaseModel):
    category: str
    predicted_next_day_count: float
    basis: str


@app.get("/demand/{category}/predict", response_model=DemandPredictionResponse)
def predict_demand(category: str):
    if _demand_model is None or _demand_history is None:
        raise HTTPException(status_code=503, detail="Demand model not loaded on this service instance")

    history = _demand_history[_demand_history["category"] == category]
    if history.empty:
        raise HTTPException(status_code=404, detail=f"No simulated history for category '{category}'")

    latest_row = history.sort_values("date").iloc[[-1]]
    X, _, _ = build_model_matrix(latest_row, category_columns=_demand_category_columns)
    prediction = float(_demand_model.predict(X)[0])

    return DemandPredictionResponse(
        category=category,
        predicted_next_day_count=round(prediction, 1),
        basis="EXPERIMENTAL DEMONSTRATION: Trained on simulated 240-day search interaction series (RF MAE 2.92, WAPE 14.0%). "
              "Real PostgreSQL order history (18 sandbox orders) is insufficient for real commercial forecasting.",
    )


class IntentRequest(BaseModel):
    text: str


class EntityBag(BaseModel):
    max_budget: Optional[float] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    color: Optional[str] = None
    shop: Optional[str] = None
    facility: Optional[str] = None
    destination: Optional[str] = None


class IntentResponse(BaseModel):
    intent: str
    confidence: float
    low_confidence: bool
    probabilities: dict[str, float]
    entities: EntityBag


@app.post("/nlu/intent", response_model=IntentResponse)
def classify_intent(request: IntentRequest):
    """Part 4, Module 5: intent classification (Deep Learning Model 1) +
    rule-based entity extraction, run together since the Java voice/text
    pipeline needs both from one query."""
    if _intent_predictor is None:
        raise HTTPException(status_code=503, detail="Intent model not loaded on this service instance")

    result = _intent_predictor.predict(request.text)
    entities = extract_entities(request.text)

    return IntentResponse(
        intent=result["intent"],
        confidence=result["confidence"],
        low_confidence=result["low_confidence"],
        probabilities=result["probabilities"],
        entities=EntityBag(
            max_budget=entities.max_budget, category=entities.category, brand=entities.brand,
            color=entities.color, shop=entities.shop, facility=entities.facility,
            destination=entities.destination,
        ),
    )


class ImageClassificationResponse(BaseModel):
    category: Optional[str]
    confidence: float
    low_confidence: bool
    probabilities: dict[str, float]
    note: str


@app.post("/vision/classify", response_model=ImageClassificationResponse)
async def classify_image(file: UploadFile = File(...)):
    """Part 4, Module 5: product image classification (Deep Learning
    Model 2). Only recognizes Apparel / Bags & Accessories / Footwear
    (see data/prepare_image_dataset.py for why) -- anything else, or any
    low-confidence prediction, is reported as such rather than guessed,
    so the caller can fall back to asking the retailer to pick manually."""
    if _image_predictor is None:
        raise HTTPException(status_code=503, detail="Image model not loaded on this service instance")

    raw = await file.read()
    try:
        image = Image.open(io.BytesIO(raw)).convert("L")  # grayscale, matching the training domain
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read uploaded file as an image")

    result = _image_predictor.predict(np.array(image))
    category = None if result["low_confidence"] else result["category"]
    note = (
        "Low-confidence prediction -- falling back to manual category selection."
        if result["low_confidence"]
        else "This model only recognizes 3 categories (Apparel, Bags & Accessories, "
             "Footwear); it cannot classify other product types."
    )
    return ImageClassificationResponse(
        category=category, confidence=result["confidence"], low_confidence=result["low_confidence"],
        probabilities=result["probabilities"], note=note,
    )


class TranscriptionResponse(BaseModel):
    transcript: str
    detected_language: str = "en"
    language_probability: float = 1.0


@app.post("/voice/transcribe", response_model=TranscriptionResponse)
async def transcribe_voice(
    file: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
):
    """Part 15, voice assistant: speech-to-text with auto-language detection.
    Accepts audio in either 'file' or 'audio' form fields for client compatibility."""
    if _stt_model is None:
        raise HTTPException(status_code=503, detail="Speech-to-text model not loaded on this service instance")

    upload = file or audio
    if upload is None:
        raise HTTPException(status_code=400, detail="Audio file required (as 'file' or 'audio' form field)")

    raw = await upload.read()
    try:
        transcript, lang, prob = speech.transcribe(_stt_model, raw)
    except speech.TranscriptionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return TranscriptionResponse(
        transcript=transcript,
        detected_language=lang,
        language_probability=round(prob, 3),
    )


class SpeakRequest(BaseModel):
    text: str


@app.post("/voice/speak")
def speak(request: SpeakRequest):
    """Text-to-speech for conversational layman voice replies."""
    if not _tts_available:
        raise HTTPException(status_code=503, detail="Text-to-speech not available on this service instance")
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Nothing to synthesize")

    audio_bytes = speech.synthesize(request.text)
    return Response(content=audio_bytes, media_type="audio/wav")


class RAGQueryRequest(BaseModel):
    text: Optional[str] = None
    query: Optional[str] = None
    language: Optional[str] = None
    speak: bool = True


class RAGQueryResponse(BaseModel):
    query: str
    detected_language: str
    language_code: str
    confidence: float
    predicted_intent: Optional[str] = "FIND_STORE"
    class_probabilities: Optional[dict[str, float]] = {}
    needs_clarification: bool = False
    layman_text: str
    action: str
    destination: Optional[dict[str, Any]] = None
    retrieved_context: list[dict[str, Any]] = []
    audio_base64: Optional[str] = None


@app.post("/rag/query", response_model=RAGQueryResponse)
@app.post("/voice/understand", response_model=RAGQueryResponse)
def rag_query(request: RAGQueryRequest):
    """
    RAG Vector Database retrieval + LLM Layman Reasoning Layer.
    Translates mall search and navigation queries into plain layman terms in the detected language.
    Handles both /rag/query and /voice/understand endpoints with flexible 'text' or 'query' payload.
    """
    query_str = (request.text or request.query or "").strip()
    if not query_str:
        raise HTTPException(status_code=400, detail="Query text cannot be empty")

    res = rag_engine.reason_and_generate(query_str, whisper_lang=request.language)
    audio_b64: Optional[str] = None
    if request.speak and _tts_available and res.get("layman_text"):
        try:
            audio_bytes = speech.synthesize(res["layman_text"])
            audio_b64 = base64.b64encode(audio_bytes).decode("ascii")
        except Exception:
            audio_b64 = None

    return RAGQueryResponse(
        query=res["query"],
        detected_language=res["detected_language"],
        language_code=res["language_code"],
        confidence=res["confidence"],
        predicted_intent=res.get("predicted_intent", "FIND_STORE"),
        class_probabilities=res.get("class_probabilities", {}),
        needs_clarification=res.get("needs_clarification", False),
        layman_text=res["layman_text"],
        action=res["action"],
        destination=res.get("destination"),
        retrieved_context=res.get("retrieved_context", []),
        audio_base64=audio_b64,
    )


@app.post("/voice/rag_query", response_model=RAGQueryResponse)
async def voice_rag_query(
    file: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    speak: bool = True,
):
    """
    Complete Pipeline:
    Voice Input -> Whisper ASR + Automatic Language Detection ->
    RAG Vector Database Retrieval -> LLM Layman Reasoning ->
    TTS Voice Output in detected language + Google Maps Indoor Coordinates.
    """
    if _stt_model is None:
        raise HTTPException(status_code=503, detail="Speech-to-text model not loaded")

    upload = file or audio
    if upload is None:
        raise HTTPException(status_code=400, detail="Audio file required (as 'file' or 'audio' form field)")

    raw = await upload.read()
    try:
        transcript, lang, prob = speech.transcribe(_stt_model, raw)
    except speech.TranscriptionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    res = rag_engine.reason_and_generate(transcript, whisper_lang=lang, whisper_prob=prob)
    audio_b64: Optional[str] = None
    if speak and _tts_available and res.get("layman_text"):
        try:
            audio_bytes = speech.synthesize(res["layman_text"])
            audio_b64 = base64.b64encode(audio_bytes).decode("ascii")
        except Exception:
            audio_b64 = None

    return RAGQueryResponse(
        query=res["query"],
        detected_language=res["detected_language"],
        language_code=res["language_code"],
        confidence=res["confidence"],
        predicted_intent=res.get("predicted_intent", "FIND_STORE"),
        class_probabilities=res.get("class_probabilities", {}),
        needs_clarification=res.get("needs_clarification", False),
        layman_text=res["layman_text"],
        action=res["action"],
        destination=res.get("destination"),
        retrieved_context=res.get("retrieved_context", []),
        audio_base64=audio_b64,
    )
