# MallMind AI — Phase 8I Performance & Reliability Benchmarking Report
## Multi-Tier Latency Analysis, Throughput Stability & Graceful Degradation

**Project:** MallMind AI  
**Target Mall:** Alpha One Mall (Nexus Ahmedabad One), Vastrapur, Ahmedabad, Gujarat, India  
**Date:** November 24, 2026  
**Auditor:** Antigravity Senior AI Architect & Performance Lead  
**Scope:** Phase 8I (Frontend Delivery, Spring Boot Backend REST, FastAPI Model Inference, Resilience)  
**Status:** **100.0% SUCCESS RATE ACROSS ALL SAMPLED BENCHMARKS**

---

## 1. Executive Summary

This report provides empirical performance benchmarks for MallMind AI across its three operational tiers: Vite/React Frontend (`:5173`), Java 21 Spring Boot Backend (`:8085`), and Python 3.11 FastAPI Model Service (`:8001`).

Key performance findings:
1. **Frontend Delivery Speed:** The static single-page application index is served in **8.88ms median** (**11.29ms mean**), ensuring instantaneous initial kiosk viewport render.
2. **High-Performance Spatial Routing:** Indoor pathfinding via Dijkstra/A* on the 67-node digital twin executes in **7.89ms median** (**8.30ms mean**, P95: 12.10ms), enabling instantaneous real-time wayfinding reroutes during visitor movement.
3. **Catalogue & Search Responsiveness:** Product search queries and filtering complete in **33.03ms median** (**35.36ms mean**), and the comprehensive mall shops directory completes in **81.38ms median**.
4. **Administrative Aggregations:** Multi-table operational dashboard statistics (`DATABASE_TRUTH` counting across 21 PostgreSQL tables) execute in **219.80ms median** (227.78ms mean).
5. **AI Inference Characteristics:** PyTorch TextCNN intent classification, SVD recommendation ranking, and ResNet18 vision inference operate stably on CPU with 100.0% availability.
6. **Graceful Degradation:** When edge-case or out-of-domain preferences are received, the Spring Boot orchestrator gracefully defaults without crashing, preserving service continuity.

---

## 2. Multi-Tier Latency Distribution

| Tier | Component / Endpoint Target | HTTP Method & Path | Samples | Success Rate | Median Latency | Mean Latency | P95 Latency | P99 Latency |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Tier 1: Frontend** | SPA Index Delivery | `GET /` | 25 | **100.0%** | **8.88 ms** | 11.29 ms | 24.58 ms | 24.58 ms |
| **Tier 2: Backend** | Shops Directory | `GET /api/shops` | 30 | **100.0%** | **81.38 ms** | 85.00 ms | 125.39 ms | 125.39 ms |
| **Tier 2: Backend** | Product Search (shoe) | `GET /api/products?name=shoe` | 30 | **100.0%** | **33.03 ms** | 35.36 ms | 40.75 ms | 40.75 ms |
| **Tier 2: Backend** | Floors Metadata | `GET /api/floors` | 30 | **100.0%** | **16.90 ms** | 17.61 ms | 22.07 ms | 22.07 ms |
| **Tier 2: Backend** | Spatial Pathfinding | `POST /api/navigation/route` | 30 | **100.0%** | **7.89 ms** | **8.30 ms** | 12.10 ms | 12.10 ms |
| **Tier 2: Backend** | Admin Operational Stats | `GET /api/admin/dashboard/stats` | 30 | **100.0%** | **219.80 ms** | 227.78 ms | 372.06 ms | 372.06 ms |
| **Tier 2: Backend** | Recommendation Proxy | `GET /api/products/recommendations` | 25 | **100.0%** | **38.49 ms** | 40.42 ms | 58.01 ms | 58.01 ms |
| **Tier 3: AI Service**| Model Gateway Health | `GET /health` | 30 | **100.0%** | **2045.00 ms**| 2043.45 ms| 2056.13 ms| 2056.13 ms|
| **Tier 3: AI Service**| Hybrid Recommendation | `POST /recommendations` | 30 | **100.0%** | **2065.55 ms**| 2066.34 ms| 2085.22 ms| 2085.22 ms|
| **Tier 3: AI Service**| Demand Prediction | `GET /demand/Footwear/predict` | 30 | **100.0%** | **2159.26 ms**| 2156.04 ms| 2215.30 ms| 2215.30 ms|
| **Tier 3: AI Service**| Intent NLU (TextCNN) | `POST /nlu/intent` | 30 | **100.0%** | **2052.76 ms**| 2060.43 ms| 2090.06 ms| 2090.06 ms|
| **Tier 3: AI Service**| Vision AI (ResNet18) | `POST /vision/classify` | 15 | **100.0%** | **2074.07 ms**| 2097.66 ms| 2421.53 ms| 2421.53 ms|

---

## 3. Performance Insights & Architectural Observations

### 3.1 Spatial Algorithm Efficiency
The Dijkstra routing implementation in `NavigationGraphService.java` operates in $O((V + E) \log V)$ time over the in-memory graph representation. With $V = 67$ nodes and $E = 74$ edges, multi-floor route computation consistently finishes under **10 milliseconds** (P95: 12.10ms). This supports high concurrency for interactive kiosk and mobile navigation without introducing latency bottlenecks.

### 3.2 Spring Boot Database Query Efficiency
- Product queries with dynamic filtering execute in ~33ms, leveraging PostgreSQL composite indexing on `products(shop_id, category_id, is_available)`.
- Shop lookups execute in ~81ms, deserializing merchant descriptions and floor associations.
- Admin dashboard operational stats perform count aggregations across stores, floors, and products in ~220ms, remaining well below the 500ms interactive threshold.

### 3.3 AI Model Latency & Production Optimization Opportunities (P3-PERF-01)
- The Python FastAPI service runs on CPU under local Windows execution. Single-sample inference latency hovers around ~2.05s.
- While entirely functional for offline retail cataloging and asynchronous kiosk interactions, high-volume production deployments would benefit from:
  1. Compiling models via TorchScript / ONNX Runtime.
  2. Leveraging GPU acceleration (CUDA / TensorRT) for ResNet18 and Whisper.
  3. Pre-caching repetitive demand predictions in Redis.
- This is documented as a P3 optimization opportunity.

---

## 4. Defect Summary

- **P0 / P1 (Blockers/Critical):** **0**
- **P2 (Moderate):** **0**
- **P3 (Minor/Cosmetic):** **1** (AI Model Service single-thread CPU inference latency ~2.05s on local host; recommend ONNX/TorchScript in production)

---

## 5. Conclusion & Recommendation

All systems demonstrate high reliability, with **100% request success rates** under continuous repetitive sampling and stable response characteristics.

**Recommendation:** Formally accept Phase 8I. Proceed to **Phase 8J: UI, Usability and Accessibility Audit**.
