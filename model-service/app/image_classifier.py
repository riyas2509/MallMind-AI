"""
Deep Learning Model 2: product image classification via transfer learning
(Part 4, Module 5). Backbone: torchvision's ImageNet-pretrained ResNet18.
Early layers are frozen (they already encode general edge/texture/shape
features that transfer reasonably even to this very different, grayscale-
upsampled domain); layer4 and the final FC are fine-tuned on our 3-class
product-category dataset (see data/prepare_image_dataset.py for the
dataset and its honest scope/licensing note).
"""
from __future__ import annotations

import numpy as np
import torch
import torch.nn as nn
from torchvision import models, transforms

IMAGE_SIZE = 64
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

CLASS_NAMES = ["Apparel", "Bags & Accessories", "Footwear"]


def build_model(n_classes: int = 3, freeze_backbone: bool = True) -> nn.Module:
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    if freeze_backbone:
        for param in model.parameters():
            param.requires_grad = False
        for param in model.layer4.parameters():  # fine-tune only the last residual block ...
            param.requires_grad = True
    model.fc = nn.Linear(model.fc.in_features, n_classes)  # ... and the final FC (always trainable)
    return model


def train_transform() -> transforms.Compose:
    return transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])


def eval_transform() -> transforms.Compose:
    # No augmentation for val/test -- only resize + normalize, so evaluation is deterministic.
    return transforms.Compose([
        transforms.ToPILImage(),
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    ])


def preprocess_single(image_array: np.ndarray) -> torch.Tensor:
    """For inference on one raw 28x28 (or similar) grayscale image array."""
    return eval_transform()(image_array).unsqueeze(0)


class ImagePredictor:
    """Loads the trained ResNet18 state dict (see evaluate_image.py) for
    single-image inference. Returns `low_confidence=True` below the
    threshold so the Java backend can fall back to asking the retailer to
    pick a category manually (Part 4: "Provide model fallback behaviour")
    rather than mis-filing a product under a guessed category -- and,
    just as importantly, this model only knows 3 categories at all (see
    the licensing/scope note in data/prepare_image_dataset.py); anything
    outside Apparel/Bags & Accessories/Footwear should also be routed to
    manual selection, which the caller gets for free since the model can
    never predict a class it wasn't trained on."""

    LOW_CONFIDENCE_THRESHOLD = 0.5

    def __init__(self, checkpoint_path: str):
        self.model = build_model(n_classes=len(CLASS_NAMES))
        state_dict = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.transform = eval_transform()

    def predict(self, image_array: np.ndarray) -> dict:
        tensor = self.transform(image_array).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(self.model(tensor), dim=1)[0]
        confidence, idx = torch.max(probs, dim=0)
        return {
            "category": CLASS_NAMES[idx.item()],
            "confidence": float(confidence.item()),
            "low_confidence": confidence.item() < self.LOW_CONFIDENCE_THRESHOLD,
            "probabilities": {name: float(p) for name, p in zip(CLASS_NAMES, probs.tolist())},
        }
