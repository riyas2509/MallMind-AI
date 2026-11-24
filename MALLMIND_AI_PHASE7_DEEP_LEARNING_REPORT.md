# MallMind AI — Phase 7 Deep Learning Report
## Multilingual Intent Classification & Transfer Learning Visual Recognition

**Target Mall:** Alpha One Mall (Nexus Ahmedabad One), Vastrapur, Ahmedabad, Gujarat, India  
**Date:** November 24, 2026  
**Status:** Completed & Empirically Validated  

---

## 1. Executive Summary

Phase 7 Deep Learning establishes two core neural networks powering MallMind AI's perception capabilities:
1. **Deep Learning Model 1 — Multilingual Intent Classifier (TextCNN):** A 1D convolutional neural network designed to handle English, Gujarati, Hindi, and code-mixed retail text. Incorporates character n-gram subword tokenization, multi-scale parallel 1D convolutions (kernel sizes 2, 3, 4, 5), temporal max-pooling, and dropout regularization. Rigorously evaluated on a strict template-disjoint holdout split (zero template overlap) to ensure genuine out-of-distribution generalization.
2. **Deep Learning Model 2 — Retail Product Image Classifier (ResNet18):** Transfer learning based on torchvision's ImageNet-pretrained ResNet18 backbone, fine-tuning the final residual block (`layer4`) and classification head on product categories (Apparel, Bags & Accessories, Footwear). Features visual explainability via Grad-CAM and production fallback gating for out-of-domain images.

---

## 2. Deep Learning Model 1: Multilingual Intent Classification

### 2.1 The Challenge of Morphological Generalization in Indic Retail Queries
A critical finding of the Phase 7A audit was that standard word-level tokenization failed catastrophically on template-disjoint holdouts (Macro-F1 of only 12.7%). In morphologically rich languages like Gujarati and Hindi, minor inflectional suffixes (`મળશે` vs `મળે`, `દુકાન` vs `દુકાને`, `જવું` vs `જવા`) converted core vocabulary into unknown out-of-vocabulary (`<unk>`) tokens.

### 2.2 Subword TextCNN Architecture
To overcome lexical sparsity, MallMind upgraded the tokenizer to extract subword n-grams (3-grams and 4-grams) alongside word tokens:
- **Vocabulary:** $|V| = 2,048$ subword and word units
- **Embedding Layer:** $d_e = 64$ continuous dense dimensions
- **Multi-Scale Convolutions:** 4 parallel 1D convolution banks with kernel sizes $k \in \{2, 3, 4, 5\}$, each containing $N_f = 64$ filters (total 256 feature maps), activated via $\text{LeakyReLU}(\alpha = 0.01)$.
- **Pooling:** 1-max temporal pooling yielding a fixed 256-dimensional feature vector.
- **Regularization:** Inverted dropout ($p = 0.35$) and Adam optimizer with weight decay ($10^{-5}$).
- **Output:** Linear projection to $K = 8$ retail intents (`FIND_PRODUCT`, `FIND_STORE`, `FACILITY_SEARCH`, `NAVIGATION`, `PRODUCT_COMPARISON`, `PRODUCT_REFINEMENT`, `MALL_INFORMATION`, `UNKNOWN`).

### 2.3 Strict Template-Disjoint Evaluation Results
The dataset (1,780 queries) was split into 88 training templates and 22 strictly held-out test templates (340 queries) that were never seen during training or vocabulary tuning:

| Model Architecture | Test Accuracy | Macro-Precision | Macro-Recall | Macro-F1 | Inference Latency |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Rule-Based Keyword Matcher** | 29.71% | 48.92% | 34.20% | 37.19% | 0.05 ms |
| **Multinomial Naive Bayes (TF-IDF)** | 34.41% | 36.80% | 31.90% | 32.10% | 0.12 ms |
| **Logistic Regression (TF-IDF)** | 39.71% | 42.10% | 37.20% | 38.00% | 0.15 ms |
| **Previous Word-Level TextCNN** | 13.50% | 14.10% | 12.20% | 12.70% | 0.25 ms |
| **Subword TextCNN (Production)** | **44.41%** | **46.80%** | **42.10%** | **43.20%** | **0.27 ms** |

### 2.4 Language-Specific Generalization Breakdown
- **English Queries:** Accuracy **46.2%**, Macro-F1 **45.1%**
- **Hindi Queries:** Accuracy **41.5%**, Macro-F1 **38.4%**
- **Gujarati Queries:** Accuracy **35.8%**, Macro-F1 **32.1%**

**Finding:** Subword tokenization boosted template-disjoint generalization from **12.7%** to **43.2%** Macro-F1 (a **3.4x improvement**), decisively outperforming Logistic Regression (38.0%) and Naive Bayes (32.1%). On queries from seen template distributions, the model achieves $> 98\%$ accuracy.

---

## 3. Deep Learning Model 2: Retail Product Image Classification

### 3.1 Domain Gap Audit & Provenance Qualification
- **Dataset Provenance:** Fashion-MNIST (Zalando Research, MIT License, Xiao et al. 2017), mapped to 3 platform categories:
  - `Footwear` $\leftarrow$ Sandal, Sneaker, Ankle boot
  - `Apparel` $\leftarrow$ T-shirt/top, Trouser, Pullover, Dress, Coat, Shirt
  - `Bags & Accessories` $\leftarrow$ Bag
- **Empirical Domain Gap:** While achieving 99.17% accuracy on benchmark crops, real commercial product photography (1080p color images with complex retail backgrounds, lighting, and packaging) historically caused 3 out of 4 real product images to be misclassified (75% error rate).
- **Production Guardrail:** MallMind mandates confidence-threshold fallback (`threshold = 0.50`). Out-of-domain images (e.g. electronics, home goods) and low-confidence predictions automatically return `low_confidence = true`, safely prompting the retailer for manual verification.

### 3.2 Transfer Learning Architecture
- **Backbone:** Torchvision's ImageNet-pretrained ResNet18.
- **Freeze Strategy:** Early convolutional layers (`conv1`, `bn1`, `layer1`, `layer2`, `layer3`) are frozen to retain universal low-level edge, contour, and texture filters.
- **Fine-Tuning:** The final residual block (`layer4`) and the custom fully connected classification head (`fc: 512 -> 3`) are fine-tuned using Adam ($\text{lr} = 10^{-4}$, weight decay $10^{-5}$).
- **Data Augmentation:** Input images are resized to $64 \times 64$, normalized with ImageNet mean/std, and augmented with random horizontal flips ($\pm 50\%$) and rotations ($\pm 10^\circ$).

### 3.3 Benchmark Evaluation Results
Evaluated on 720 held-out test images (240 per class) with deterministic preprocessing:

| Category | Precision | Recall | $F_1$-Score | Test Support |
| :--- | :---: | :---: | :---: | :---: |
| **Apparel** | 0.9876 (98.8%) | 0.9958 (99.6%) | 0.9917 (99.2%) | 240 |
| **Bags & Accessories** | 0.9958 (99.6%) | 0.9792 (97.9%) | 0.9874 (98.7%) | 240 |
| **Footwear** | 0.9917 (99.2%) | 1.0000 (100.0%) | 0.9959 (99.6%) | 240 |
| **Overall Macro Average** | **0.9917 (99.2%)** | **0.9917 (99.2%)** | **0.9916 (99.2%)** | **720** |

#### Comparison against Baseline:
- **ResNet18 Transfer Learning:** Top-1 Accuracy: **99.17%**, Macro-F1: **99.16%**
- **Flattened Pixel Logistic Regression Baseline:** Accuracy: **97.22%**, Macro-F1: **97.21%**
- **Empirical Advantage:** ResNet18 outperforms the baseline by **+1.94% accuracy** and **+1.95% Macro-F1**, eliminating half of all residual classification errors.
- **Inference Latency:** Mean: **14.85 ms**, 95th Percentile: **16.53 ms** per image on standard CPU.

### 3.4 Grad-CAM Visual Explainability
Grad-CAM was implemented on the final convolutional layer of `layer4`. Computing gradients $\alpha_k^c = \frac{1}{Z} \sum_{i, j} \frac{\partial y^c}{\partial A_{i, j}^k}$ generated activation heatmaps that confirmed:
1. **Footwear:** Strong localized activations on the sole contour, toe cap, and heel collar.
2. **Bags & Accessories:** Strong activations on the handle straps, buckle closures, and central compartment body.
3. **Apparel:** Broad semantic activation across torso fabric drape, neckline, and sleeves.
4. **Artifact Suppression:** Background pixels produced zero activation after ReLU rectification, confirming the model does not exploit spurious edge artifacts.

All Grad-CAM sample arrays are exported to `models/gradcam_examples.npz`.
