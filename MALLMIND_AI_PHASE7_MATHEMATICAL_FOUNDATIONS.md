# MallMind AI — Phase 7 Mathematical Foundations Report
## Theoretical Formulations, Loss Functions, Optimization & Evaluation Algebra

**Target Mall:** Alpha One Mall (Nexus Ahmedabad One), Vastrapur, Ahmedabad, Gujarat, India  
**Date:** November 24, 2026  
**Status:** Completed & Empirically Verified  

---

## 1. Vector Space Models & Similarity Geometry

### 1.1 Vector Space Representation
In MallMind's content-based recommendation engine (`recommendation.py`), each catalogue product $p_i$ is mapped to a composite feature vector $\mathbf{v}_i \in \mathbb{R}^D$:

$$\mathbf{v}_i = \left[ w_{\text{text}} \cdot \mathbf{t}_i^\top, \; w_{\text{cat}} \cdot \mathbf{c}_i^\top, \; w_{\text{brand}} \cdot \mathbf{b}_i^\top, \; w_{\text{price}} \cdot \tilde{p}_i \right]^\top$$

Where:
- $\mathbf{t}_i \in \mathbb{R}^{V}$: Subword and word TF-IDF vector representing product title, description, and keywords ($V = 500$ vocabulary terms).
- $\mathbf{c}_i \in \{0, 1\}^{C}$: One-hot or multi-hot category indicator vector ($C = 15$ categories).
- $\mathbf{b}_i \in \{0, 1\}^{B}$: One-hot brand indicator vector ($B = 30$ brands).
- $\tilde{p}_i \in [0, 1]$: Min-max normalized effective price $\tilde{p}_i = \frac{p_i - p_{\min}}{p_{\max} - p_{\min}}$.
- Weights: $w_{\text{text}} = 0.50$, $w_{\text{cat}} = 0.30$, $w_{\text{brand}} = 0.15$, $w_{\text{price}} = 0.05$.

### 1.2 TF-IDF Weighting Formulation
The Term Frequency-Inverse Document Frequency (TF-IDF) weight for term $t$ in document $d$ within catalogue corpus $D$ is defined as:

$$\text{tf-idf}(t, d, D) = \text{tf}(t, d) \times \text{idf}(t, D)$$

$$\text{tf}(t, d) = \frac{f_{t, d}}{\sum_{t' \in d} f_{t', d}}$$

$$\text{idf}(t, D) = \ln \left( \frac{1 + |D|}{1 + |\{d \in D : t \in d\}|} \right) + 1$$

Each document vector is $L_2$-normalized:

$$\hat{\mathbf{t}}_i = \frac{\mathbf{t}_i}{\|\mathbf{t}_i\|_2} = \frac{\mathbf{t}_i}{\sqrt{\sum_{k=1}^V t_{i, k}^2}}$$

### 1.3 Cosine Similarity Geometry
The similarity between candidate item vector $\mathbf{u}$ and catalogue target item vector $\mathbf{v}$ is the cosine of the angle $\theta$ between them in $\mathbb{R}^D$:

$$\cos(\theta) = S_C(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \frac{\sum_{j=1}^D u_j v_j}{\sqrt{\sum_{j=1}^D u_j^2} \sqrt{\sum_{j=1}^D v_j^2}}$$

When vectors are pre-$L_2$-normalized ($\|\mathbf{u}\|_2 = 1, \|\mathbf{v}\|_2 = 1$), cosine similarity simplifies to the Euclidean dot product:

$$S_C(\mathbf{u}, \mathbf{v}) = \mathbf{u}^\top \mathbf{v} = \sum_{j=1}^D u_j v_j$$

### 1.4 Price Distance Decay Function
To penalize candidate items that deviate significantly in budget from target product price $p_0$, MallMind applies an asymmetric exponential penalty function:

$$\phi(p, p_0) = \exp \left( -\lambda \frac{|p - p_0|}{p_0} \right), \quad \lambda = 0.5$$

The final ranking score $R(p, p_0)$ is computed as:

$$R(p, p_0) = S_C(\mathbf{u}_{p_0}, \mathbf{v}_p) \cdot \phi(p, p_0) \cdot \mathbb{I}(\text{available}(p)) \cdot \mathbb{I}(\text{brand\_match}(p, p_0))$$

---

## 2. Deep Learning 1: 1D Convolutional Neural Networks for Multilingual Intent Classification

### 2.1 Embedding Representation
Given a tokenized multilingual text query $T = [w_1, w_2, \dots, w_L]$ of padded length $L = 32$, each token $w_t$ is mapped to a dense continuous vector via an embedding lookup matrix $\mathbf{E} \in \mathbb{R}^{|V| \times d_e}$ where vocabulary $|V| = 2048$ and embedding dimension $d_e = 64$:

$$\mathbf{x}_t = \mathbf{E}[w_t] \in \mathbb{R}^{d_e}$$

The query sequence is represented as an input tensor $\mathbf{X} \in \mathbb{R}^{d_e \times L}$:

$$\mathbf{X} = [\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_L]$$

### 2.2 1D Multi-Scale Temporal Convolutions
MallMind employs parallel 1D convolutional feature extractors with filter kernel sizes $k \in \{2, 3, 4, 5\}$ and $N_f = 64$ filters per size (total 256 filters).

For a convolution kernel $\mathbf{W}^{(k)} \in \mathbb{R}^{d_e \times k}$ and bias $b \in \mathbb{R}$, the temporal convolution over window $[t : t+k-1]$ generates feature map $c_t^{(k)}$:

$$c_t^{(k)} = \text{LeakyReLU} \left( \sum_{m=1}^{d_e} \sum_{n=1}^k W_{m, n}^{(k)} X_{m, t+n-1} + b \right)$$

Where $\text{LeakyReLU}(z) = \max(\alpha z, z)$ with negative slope $\alpha = 0.01$.

### 2.3 1-Max Temporal Pooling
To obtain a fixed-size representation invariant to query length and word position, 1-max pooling is applied across the temporal dimension of each filter's feature map:

$$\hat{h}_j^{(k)} = \max_{1 \le t \le L - k + 1} c_{j, t}^{(k)}, \quad j \in \{1, 2, \dots, N_f\}$$

The pooled outputs from all kernel sizes are concatenated into a unified latent feature vector $\mathbf{h} \in \mathbb{R}^{4 \cdot N_f} = \mathbb{R}^{256}$:

$$\mathbf{h} = \left[ \hat{\mathbf{h}}^{(2)}, \; \hat{\mathbf{h}}^{(3)}, \; \hat{\mathbf{h}}^{(4)}, \; \hat{\mathbf{h}}^{(5)} \right]^\top$$

### 2.4 Dropout Regularization & Softmax Classification
During training, inverted dropout with probability $p = 0.35$ prevents co-adaptation of features:

$$\tilde{\mathbf{h}} = \frac{\mathbf{r} \odot \mathbf{h}}{1 - p}, \quad r_i \sim \text{Bernoulli}(1 - p)$$

Logits $\mathbf{z} \in \mathbb{R}^{K}$ ($K = 8$ retail intents) are computed via linear projection:

$$\mathbf{z} = \mathbf{W}_c \tilde{\mathbf{h}} + \mathbf{b}_c, \quad \mathbf{W}_c \in \mathbb{R}^{K \times 256}, \; \mathbf{b}_c \in \mathbb{R}^K$$

The class probability vector $\hat{\mathbf{y}} = \sigma(\mathbf{z})$ is obtained via the Softmax function:

$$\hat{y}_c = P(y = c \mid \mathbf{X}) = \frac{\exp(z_c)}{\sum_{j=1}^K \exp(z_j)}, \quad c \in \{1, \dots, K\}$$

### 2.5 Cross-Entropy Loss & Backpropagation
For ground truth one-hot label $\mathbf{y} \in \{0, 1\}^K$, multi-class cross-entropy loss with $L_2$ weight decay is:

$$\mathcal{L}_{\text{CE}}(\theta) = -\sum_{c=1}^K y_c \ln(\hat{y}_c) + \frac{\lambda_{\text{reg}}}{2} \|\mathbf{W}\|_2^2$$

The gradient with respect to pre-softmax logit $z_c$ is:

$$\frac{\partial \mathcal{L}}{\partial z_c} = \hat{y}_c - y_c$$

Backpropagating to the convolutional kernel weights $\mathbf{W}^{(k)}$ via the chain rule:

$$\frac{\partial \mathcal{L}}{\partial W_{m, n}^{(k)}} = \sum_{j=1}^{N_f} \frac{\partial \mathcal{L}}{\partial \hat{h}_j^{(k)}} \cdot \frac{\partial \hat{h}_j^{(k)}}{\partial c_{j, t^*}^{(k)}} \cdot \frac{\partial c_{j, t^*}^{(k)}}{\partial W_{m, n}^{(k)}} = \sum_{j=1}^{N_f} \delta_j \cdot X_{m, t^* + n - 1}$$

Where $t^* = \arg\max_t c_{j, t}^{(k)}$ is the winning temporal index from max-pooling.

---

## 3. Deep Learning 2: 2D Convolutions, Residual Learning & Grad-CAM

### 3.1 2D Spatial Convolution & Residual Block Formulation
In torchvision's ResNet18 backbone, each convolutional layer applies 2D spatial filtering over input feature tensor $\mathbf{A} \in \mathbb{R}^{C_{\text{in}} \times H \times W}$:

$$(\mathbf{A} * \mathbf{K})_{c_{\text{out}}, i, j} = \sum_{c=1}^{C_{\text{in}}} \sum_{u=-k/2}^{k/2} \sum_{v=-k/2}^{k/2} K_{c_{\text{out}}, c, u, v} \cdot A_{c, i+u, j+v} + b_{c_{\text{out}}}$$

The core architectural innovation of ResNet is the additive shortcut connection:

$$\mathbf{x}_{l+1} = \text{ReLU} \left( \mathcal{F}(\mathbf{x}_l, \{\mathbf{W}_l\}) + \mathbf{x}_l \right)$$

Where $\mathcal{F}(\mathbf{x}_l, \{\mathbf{W}_l\})$ represents the residual mapping (two $3 \times 3$ convolutions with Batch Normalization). The identity shortcut ensures that gradients backpropagate directly without vanishing:

$$\frac{\partial \mathcal{E}}{\partial \mathbf{x}_l} = \frac{\partial \mathcal{E}}{\partial \mathbf{x}_{l+1}} \left( \frac{\partial \mathcal{F}}{\partial \mathbf{x}_l} + \mathbf{I} \right)$$

Even if the residual derivative $\frac{\partial \mathcal{F}}{\partial \mathbf{x}_l}$ approaches zero, the identity term $\mathbf{I}$ guarantees non-zero gradient flow back to early layers.

### 3.2 Grad-CAM Mathematical Derivation
Gradient-weighted Class Activation Mapping (Grad-CAM) computes visual explanations by calculating the gradient of the target class logit $y^c$ with respect to feature activation maps $A^k \in \mathbb{R}^{U \times V}$ in the final convolutional block (`layer4`):

$$\alpha_k^c = \frac{1}{Z} \sum_{i=1}^U \sum_{j=1}^V \frac{\partial y^c}{\partial A_{i, j}^k}$$

Where:
- $Z = U \times V$: Spatial area of the feature map ($Z = 2 \times 2 = 4$ at `layer4` for $64 \times 64$ inputs).
- $\alpha_k^c$: Importance weight capturing the causal influence of feature map $k$ on class $c$.

The coarse Grad-CAM localization heatmap $L_{\text{Grad-CAM}}^c \in \mathbb{R}^{U \times V}$ is a rectified linear combination of forward activation maps:

$$L_{\text{Grad-CAM}}^c = \text{ReLU} \left( \sum_{k} \alpha_k^c A^k \right)$$

The $\text{ReLU}$ non-linearity ensures that only features with a positive contribution to the target class are visualized, filtering out background clutter.

---

## 4. Time Series & Demand Forecasting Mathematics

### 4.1 Evaluation Loss Functions

#### Mean Absolute Error (MAE):
$$\text{MAE} = \frac{1}{N} \sum_{t=1}^N |y_t - \hat{y}_t|$$

#### Root Mean Squared Error (RMSE):
$$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{t=1}^N (y_t - \hat{y}_t)^2}$$

#### Weighted Absolute Percentage Error (WAPE):
$$\text{WAPE} = \frac{\sum_{t=1}^N |y_t - \hat{y}_t|}{\sum_{t=1}^N y_t} \times 100\%$$

Unlike MAPE (Mean Absolute Percentage Error), which diverges to infinity when actual demand $y_t = 0$, WAPE normalizes the total absolute error by aggregate demand, ensuring robust and unbiased evaluation on retail time series.

### 4.2 Ridge Regression Formulation
Ridge Regression minimizes ordinary least squares with an $L_2$ regularization penalty on weight coefficients $\boldsymbol{\beta} \in \mathbb{R}^P$:

$$\mathcal{L}_{\text{Ridge}}(\boldsymbol{\beta}) = \frac{1}{2N} \sum_{i=1}^N (y_i - \mathbf{x}_i^\top \boldsymbol{\beta})^2 + \alpha \|\boldsymbol{\beta}\|_2^2$$

The closed-form analytical solution is:

$$\hat{\boldsymbol{\beta}} = \left( \mathbf{X}^\top \mathbf{X} + \alpha \mathbf{I} \right)^{-1} \mathbf{X}^\top \mathbf{y}$$

Where $\alpha = 1.0$ guarantees that $(\mathbf{X}^\top \mathbf{X} + \alpha \mathbf{I})$ is strictly non-singular and well-conditioned even with collinear lag features.

### 4.3 Random Forest & Gradient Boosted Regression
A Random Forest ensemble of $M = 100$ decorrelated decision trees estimates demand via bootstrap aggregation:

$$\hat{y}_{\text{RF}}(\mathbf{x}) = \frac{1}{M} \sum_{m=1}^M T_m(\mathbf{x})$$

The variance of the ensemble prediction is:

$$\text{Var}(\hat{y}_{\text{RF}}) = \rho \sigma^2 + \frac{1 - \rho}{M} \sigma^2$$

Where $\rho$ is the average pairwise tree correlation and $\sigma^2$ is individual tree variance. Feature bagging (selecting random subsets of features at each split) reduces $\rho$, drastically suppressing ensemble variance without increasing bias.

---

## 5. Evaluation Metric Formulations & Step-by-Step MallMind Worked Examples

### 5.1 Confusion Matrix Algebra
For a multi-class confusion matrix $\mathbf{C} \in \mathbb{N}^{K \times K}$ where $C_{i, j}$ denotes instances of true class $i$ predicted as class $j$:

$$\text{True Positives}_i: \text{TP}_i = C_{i, i}$$

$$\text{False Positives}_i: \text{FP}_i = \sum_{k \neq i} C_{k, i}$$

$$\text{False Negatives}_i: \text{FN}_i = \sum_{k \neq i} C_{i, k}$$

$$\text{Precision}_i = \frac{\text{TP}_i}{\text{TP}_i + \text{FP}_i}, \quad \text{Recall}_i = \frac{\text{TP}_i}{\text{TP}_i + \text{FN}_i}$$

$$F_1\text{-Score}_i = \frac{2 \cdot \text{Precision}_i \cdot \text{Recall}_i}{\text{Precision}_i + \text{Recall}_i}$$

$$\text{Macro-}F_1 = \frac{1}{K} \sum_{i=1}^K F_1\text{-Score}_i$$

#### Worked Example: ResNet18 Product Image Classifier ($N = 720$)
From MallMind's actual held-out test evaluation (`models/image_eval_summary.json`):

$$\mathbf{C} = \begin{bmatrix} 239 & 1 & 0 \\ 3 & 235 & 2 \\ 0 & 0 & 240 \end{bmatrix}$$

Classes: $1 = \text{Apparel}$, $2 = \text{Bags \& Accessories}$, $3 = \text{Footwear}$.

1. **Apparel ($i=1$):**
   - $\text{TP}_1 = 239$, $\text{FP}_1 = 3 + 0 = 3$, $\text{FN}_1 = 1 + 0 = 1$.
   - $\text{Precision}_1 = \frac{239}{239 + 3} = \frac{239}{242} = 0.9876$ (98.76%).
   - $\text{Recall}_1 = \frac{239}{239 + 1} = \frac{239}{240} = 0.9958$ (99.58%).
   - $F_1\text{-Score}_1 = \frac{2 \cdot 0.9876 \cdot 0.9958}{0.9876 + 0.9958} = 0.9917$ (99.17%).

2. **Bags & Accessories ($i=2$):**
   - $\text{TP}_2 = 235$, $\text{FP}_2 = 1 + 0 = 1$, $\text{FN}_2 = 3 + 2 = 5$.
   - $\text{Precision}_2 = \frac{235}{235 + 1} = \frac{235}{236} = 0.9958$ (99.58%).
   - $\text{Recall}_2 = \frac{235}{235 + 5} = \frac{235}{240} = 0.9792$ (97.92%).
   - $F_1\text{-Score}_2 = \frac{2 \cdot 0.9958 \cdot 0.9792}{0.9958 + 0.9792} = 0.9874$ (98.74%).

3. **Footwear ($i=3$):**
   - $\text{TP}_3 = 240$, $\text{FP}_3 = 0 + 2 = 2$, $\text{FN}_3 = 0 + 0 = 0$.
   - $\text{Precision}_3 = \frac{240}{240 + 2} = \frac{240}{242} = 0.9917$ (99.17%).
   - $\text{Recall}_3 = \frac{240}{240 + 0} = 1.0000$ (100.00%).
   - $F_1\text{-Score}_3 = \frac{2 \cdot 0.9917 \cdot 1.0000}{0.9917 + 1.0000} = 0.9959$ (99.59%).

4. **Macro-Averaged Metrics:**
   - $\text{Macro-Precision} = \frac{0.9876 + 0.9958 + 0.9917}{3} = 0.9917$ (99.17%).
   - $\text{Macro-Recall} = \frac{0.9958 + 0.9792 + 1.0000}{3} = 0.9917$ (99.17%).
   - $\text{Macro-}F_1 = \frac{0.9917 + 0.9874 + 0.9959}{3} = 0.9916$ (99.16%).
   - Overall Accuracy: $\frac{239 + 235 + 240}{720} = \frac{714}{720} = 0.9917$ (99.17%).

---

### 5.2 Ranking Evaluation Algebra (MAP@K and NDCG@K)

#### Precision@K and Recall@K:
$$\text{Precision@}K = \frac{|\text{Retrieved}_K \cap \text{Relevant}|}{K}$$

$$\text{Recall@}K = \frac{|\text{Retrieved}_K \cap \text{Relevant}|}{|\text{Relevant}|}$$

#### Average Precision@K (AP@K):
$$\text{AP@}K = \frac{1}{\min(K, |\text{Relevant}|)} \sum_{k=1}^K \text{Precision@}k \cdot \text{rel}(k)$$

Where $\text{rel}(k) \in \{0, 1\}$ indicates whether item at rank $k$ is relevant.

#### Mean Average Precision@K (MAP@K):
$$\text{MAP@}K = \frac{1}{|Q|} \sum_{q=1}^{|Q|} \text{AP@}K(q)$$

#### Discounted Cumulative Gain (DCG@K) and NDCG@K:
$$\text{DCG@}K = \sum_{k=1}^K \frac{2^{\text{rel}(k)} - 1}{\log_2(k + 1)}$$

$$\text{NDCG@}K = \frac{\text{DCG@}K}{\text{IDCG@}K}$$

Where $\text{IDCG@}K$ is the Ideal DCG obtained by sorting items in descending order of relevance.

#### Worked Example: Product Recommendation Query on MallMind Catalogue
Consider querying recommendations for `Nike Air Zoom Pegasus` (Category: Footwear, Price: ₹9,449).
- Total available relevant footwear products in catalogue: $R = 8$.
- Recommendation model returns top $K = 5$ ranked items:
  1. Rank 1: `Nike Revolution 6` (Category: Footwear, Rel = 1)
  2. Rank 2: `Adidas Ultraboost Light` (Category: Footwear, Rel = 1)
  3. Rank 3: `Puma Velocity Nitro` (Category: Footwear, Rel = 1)
  4. Rank 4: `Skechers Go Walk` (Category: Footwear, Rel = 1)
  5. Rank 5: `Bata Power Running` (Category: Footwear, Rel = 1)

**Step 1: Compute Precision@k at each rank:**
- $k=1: \text{Precision@}1 = \frac{1}{1} = 1.0$
- $k=2: \text{Precision@}2 = \frac{2}{2} = 1.0$
- $k=3: \text{Precision@}3 = \frac{3}{3} = 1.0$
- $k=4: \text{Precision@}4 = \frac{4}{4} = 1.0$
- $k=5: \text{Precision@}5 = \frac{5}{5} = 1.0$

**Step 2: Compute AP@5:**
$$\text{AP@}5 = \frac{1}{5} \sum_{k=1}^5 1.0 \times 1 = \frac{1 + 1 + 1 + 1 + 1}{5} = 1.000$$

**Step 3: Compute DCG@5 and IDCG@5:**
$$\text{DCG@}5 = \frac{1}{\log_2(2)} + \frac{1}{\log_2(3)} + \frac{1}{\log_2(4)} + \frac{1}{\log_2(5)} + \frac{1}{\log_2(6)}$$
$$\text{DCG@}5 = \frac{1}{1.000} + \frac{1}{1.585} + \frac{1}{2.000} + \frac{1}{2.322} + \frac{1}{2.585} = 1.000 + 0.631 + 0.500 + 0.431 + 0.387 = 2.949$$

Since all 5 recommended items are relevant, $\text{IDCG@}5 = \text{DCG@}5 = 2.949$.

$$\text{NDCG@}5 = \frac{2.949}{2.949} = 1.000$$

This matches the empirical benchmark results recorded in `recommendation_eval_summary.json` (Precision@5: 1.00, MAP@5: 1.00, NDCG@5: 1.00).

---

## 6. Summary of Mathematical Formulations Across MallMind Models

| Model Component | Primary Formulation | Loss Function / Optimization | Key Operational Hyperparameters |
| :--- | :--- | :--- | :--- |
| **Product Recommendation** | Composite Cosine Similarity: $\mathbf{u}^\top \mathbf{v} \cdot \exp(-\lambda \Delta p / p_0)$ | Maximum Inner Product Search (MIPS) + Hard Filter Masks | $w_{\text{text}}=0.5, w_{\text{cat}}=0.3, w_{\text{brand}}=0.15, \lambda=0.5$ |
| **Demand Forecasting** | Ensemble GBDT / RF: $\hat{y} = \frac{1}{M} \sum T_m(\mathbf{x})$ | Mean Absolute Error (MAE) / Squared Error | $M=100$ trees, max_depth=10, 7-day chronological split |
| **Multilingual Intent** | Multi-Scale 1D TextCNN: $\hat{\mathbf{h}} = \max_t \text{LeakyReLU}(\mathbf{W} * \mathbf{X})$ | Cross-Entropy with $L_2$ Decay: $-\sum y_c \ln \hat{y}_c + \frac{\lambda}{2} \|\mathbf{W}\|_2^2$ | Kernels $\{2,3,4,5\}$, $N_f=64$, Dropout $p=0.35$, LR $10^{-3}$ |
| **Product Image Classifier** | ResNet18 Residual Block: $\mathbf{x}_{l+1} = \text{ReLU}(\mathcal{F}(\mathbf{x}) + \mathbf{x})$ | Cross-Entropy Loss + Grad-CAM $\alpha_k^c = \frac{1}{Z}\sum \frac{\partial y^c}{\partial A^k}$ | ImageNet fine-tune `layer4`, Adam LR $10^{-4}$, Image size $64 \times 64$ |
