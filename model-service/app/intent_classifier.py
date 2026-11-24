"""
Deep Learning Model 1: Multilingual Intent Classification (TextCNN).

Architecture:
  - Subword & N-gram Tokenizer: extracts root words, prefixes, and subword n-grams
    to bridge inflectional morphology across Gujarati, Hindi, and English.
  - Embedding Layer: maps subword vocabulary tokens to dense D=64 vectors.
  - Multi-Scale 1D Convolutions: parallel filter banks with kernel sizes (2, 3, 4, 5)
    and 48 feature maps each to capture short and extended phrases.
  - Global Max-over-Time Pooling: extracts the strongest feature activation per filter.
  - Regularization: Dropout (p=0.35) and Weight Decay (1e-5) to prevent memorization.
  - Output Layer: Linear projection to 8 intent classes with Softmax normalization.

Classes (8 Intents):
  1. FIND_STORE
  2. FIND_PRODUCT
  3. NAVIGATION
  4. FACILITY_SEARCH
  5. PRODUCT_COMPARISON
  6. PRODUCT_REFINEMENT
  7. MALL_INFORMATION
  8. UNKNOWN
"""
from __future__ import annotations

import re
from collections import Counter
import torch
import torch.nn as nn
import torch.nn.functional as F

PAD, UNK = "<pad>", "<unk>"
MAX_LEN = 35


def tokenize(text: str) -> list[str]:
    """Extracts words and character 3/4-grams to handle Indic inflections."""
    text = text.lower()
    text = re.sub(r"[^\w\s\u0900-\u097F\u0A80-\u0AFF₹$]", " ", text)
    words = text.split()
    tokens = list(words)
    for w in words:
        if len(w) >= 3:
            for n in (3, 4):
                if len(w) >= n:
                    for i in range(len(w) - n + 1):
                        tokens.append(w[i:i + n])
    return tokens


class Vocabulary:
    def __init__(self, texts: list[str], min_freq: int = 1):
        counter = Counter()
        for t in texts:
            counter.update(tokenize(t))
        self.itos = [PAD, UNK] + [w for w, c in counter.items() if c >= min_freq]
        self.stoi = {w: i for i, w in enumerate(self.itos)}

    def __len__(self):
        return len(self.itos)

    def encode(self, text: str, max_len: int = MAX_LEN) -> list[int]:
        ids = [self.stoi.get(tok, self.stoi[UNK]) for tok in tokenize(text)][:max_len]
        ids = ids + [self.stoi[PAD]] * (max_len - len(ids))
        return ids


class IntentTextCNN(nn.Module):
    def __init__(self, vocab_size: int, n_classes: int, embed_dim: int = 64, dropout: float = 0.35):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = nn.ModuleList([nn.Conv1d(embed_dim, 48, kernel_size=k) for k in (2, 3, 4, 5)])
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(48 * len(self.convs), n_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        emb = self.embedding(x).transpose(1, 2)  # (batch, embed_dim, seq_len)
        pooled = [torch.max(F.relu(conv(emb)), dim=2).values for conv in self.convs]
        features = torch.cat(pooled, dim=1)
        return self.fc(self.dropout(features))


class IntentPredictor:
    """Inference engine with confidence calibration and UNKNOWN fallback."""

    LOW_CONFIDENCE_THRESHOLD = 0.35

    def __init__(self, checkpoint_path: str):
        bundle = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
        self.vocab: Vocabulary = bundle["vocab"]
        self.labels: list[str] = bundle["labels"]
        self.label_to_idx = {l: i for i, l in enumerate(self.labels)}
        self.idx_to_label = {i: l for i, l in enumerate(self.labels)}

        self.model = IntentTextCNN(vocab_size=len(self.vocab), n_classes=len(self.labels))
        self.model.load_state_dict(bundle["model_state"])
        self.model.eval()

    def predict(self, text: str) -> dict:
        tokens = tokenize(text)
        if not tokens:
            return {
                "intent": "UNKNOWN",
                "confidence": 1.0,
                "low_confidence": False,
                "probabilities": {l: (1.0 if l == "UNKNOWN" else 0.0) for l in self.labels},
            }

        ids = torch.tensor([self.vocab.encode(text)], dtype=torch.long)
        with torch.no_grad():
            logits = self.model(ids)
            probs = F.softmax(logits, dim=1)[0].tolist()

        prob_dict = {self.idx_to_label[i]: float(probs[i]) for i in range(len(self.labels))}
        best_idx = int(torch.tensor(probs).argmax().item())
        best_label = self.idx_to_label[best_idx]
        confidence = float(probs[best_idx])

        # Calibration: if confidence is below threshold, categorize as low_confidence or UNKNOWN
        low_confidence = confidence < self.LOW_CONFIDENCE_THRESHOLD
        predicted_intent = best_label if not low_confidence else "UNKNOWN"

        return {
            "intent": predicted_intent,
            "raw_intent": best_label,
            "confidence": round(confidence, 4),
            "low_confidence": low_confidence,
            "probabilities": {k: round(v, 4) for k, v in prob_dict.items()},
        }
