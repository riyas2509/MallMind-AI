"""
Rule-based entity extraction (Part 4, Module 5: "Use a separate entity
extraction mechanism for product names, budgets, brands, categories and
destinations"). Deliberately NOT a neural model: budgets, categories,
brands and known shop/facility names are closed or semi-closed vocabularies
that a dictionary/regex match handles more reliably and more cheaply than
training a sequence-labeling model would, on a dataset this small. The
intent classifier (intent_classifier.py) is the actual Deep Learning
component this module complements.

Vocabularies are loaded from the real catalogue (data/catalog.csv) when
available, so extraction stays in sync with whatever is actually seeded,
rather than a hardcoded list that drifts from the real data (Part 17 rule #6).
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass

import pandas as pd

CURRENCY_PATTERN = re.compile(r"(?:₹|rs\.?|inr)\s?([\d,]+)|([\d,]+)\s?(?:rupees|rs\.?)", re.IGNORECASE)

FACILITIES = ["washroom", "atm", "food court", "parking", "customer service desk", "elevator", "escalator", "staircase"]
SHOPS = [
    "Urban Threads", "StepRight Footwear", "TechNova Electronics", "Carry Co. Bags",
    "Page Turner Books", "Sweet Nook Confectionery", "Trendline Fashion", "SoleMate Shoes",
    "GadgetHub Mobiles", "Glow Cosmetics", "TimeKeeper Watches", "PlayZone Toys",
    "Elegance Jewelry", "ClearView Opticals", "HomeStyle Decor", "SportFlex Activewear",
    "GiftBox Boutique", "WellCare Pharmacy",
]


@dataclass
class ExtractedEntities:
    max_budget: float | None = None
    category: str | None = None
    brand: str | None = None
    color: str | None = None
    shop: str | None = None
    facility: str | None = None
    destination: str | None = None


def _load_vocab():
    categories, brands, colors = [], [], []
    catalog_path = os.path.join(os.path.dirname(__file__), "..", "data", "catalog.csv")
    if os.path.exists(catalog_path):
        df = pd.read_csv(catalog_path)
        categories = sorted(df["category"].dropna().unique().tolist())
        brands = sorted(df["brand"].dropna().unique().tolist())
        colors = sorted(df["color"].dropna().unique().tolist())
    return categories, brands, colors


_CATEGORIES, _BRANDS, _COLORS = _load_vocab()


def extract(text: str) -> ExtractedEntities:
    lower = text.lower()
    result = ExtractedEntities()

    money_match = CURRENCY_PATTERN.search(text)
    if money_match:
        raw = (money_match.group(1) or money_match.group(2) or "").replace(",", "")
        if raw.isdigit():
            result.max_budget = float(raw)

    for category in _CATEGORIES:
        if category.lower() in lower:
            result.category = category
            break

    for brand in _BRANDS:
        if brand.lower() in lower:
            result.brand = brand
            break

    for color in _COLORS:
        if re.search(rf"\b{re.escape(color.lower())}\b", lower):
            result.color = color
            break

    for shop in SHOPS:
        if shop.lower() in lower:
            result.shop = shop
            result.destination = result.destination or shop
            break

    for facility in FACILITIES:
        if facility in lower:
            result.facility = facility
            result.destination = result.destination or facility
            break

    return result
