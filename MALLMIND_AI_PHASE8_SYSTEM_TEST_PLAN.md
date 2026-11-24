# MallMind AI — Phase 8 System Inventory & Test Plan
## End-to-End Quality Assurance, Security & Validation Matrix

**Target Mall:** Alpha One Mall (Nexus Ahmedabad One), Vastrapur, Ahmedabad, Gujarat, India  
**Date:** November 24, 2026  
**Status:** Approved for Execution  
**Scope Boundary:** Phase 8 Quality Assurance and Validation ONLY.  

---

## 1. System Inventory

### 1.1 Frontend Application (React 19 + TypeScript + Vite)
- **Base URL:** `http://localhost:5173`
- **Routing Engine:** `react-router-dom` v6
- **Primary Pages and Routes:**
  1. `/` — `HomePage.tsx`: Hero banner, mall quick stats, top categories, featured offers, concierge entry.
  2. `/login` — `LoginPage.tsx`: Authentication form (Customer, Retailer, Admin).
  3. `/register` — `RegisterPage.tsx`: New customer registration.
  4. `/products` — `ProductsPage.tsx`: Mall catalogue (304 products) with category, brand, floor, availability, and price filtering.
  5. `/products/:id` — `ProductDetailPage.tsx`: Product specs, stock level, store location, similar product recommendations, add-to-cart/wishlist.
  6. `/directory` — `MallDirectoryPage.tsx`: Interactive 30-store directory across 5 levels (LG, G, 1F, 2F, 3F).
  7. `/shops/:id` — `ShopDetailPage.tsx`: Store metadata, floor location, phone, operating hours, and active inventory.
  8. `/compare` — `ProductComparePage.tsx`: Side-by-side comparison of 2–4 catalogue items.
  9. `/map` — `FloorMapPage.tsx`: Interactive SVG digital twin map across 5 levels with route navigation overlays.
  10. `/offers` — `OffersPage.tsx`: Active mall promotions and store discount codes.
  11. `/cart` — `CartPage.tsx` (Protected): Shopping cart with item quantity updates, tax computation, and fulfilment toggle.
  12. `/checkout` — `CheckoutPage.tsx` (Protected): Fulfilment details, delivery address / pickup schedule, tax calculation, sandbox payment.
  13. `/orders` — `OrdersPage.tsx` (Protected): Customer order history with status tracking.
  14. `/orders/:id` — `OrderDetailPage.tsx` (Protected): Detailed order invoice, item breakdown, and cancellation button.
  15. `/wishlist` — `WishlistPage.tsx` (Protected): Saved items with 1-click cart transfer.
  16. `/retailer` — `RetailerPage.tsx` (Role: `RETAILER`, `ADMIN`): Retailer store inventory, cycle-count stock adjustments, low-stock alerts, order queue.
  17. `/admin` — `AdminDashboardPage.tsx` (Role: `ADMIN`): Operational overview, 5-floor structure, store activation, retailer onboarding, catalog oversight, mall-wide orders, audit logs.
- **Global Widgets:**
  - `VoiceWidget.tsx`: Multilingual Voice Concierge (ASR audio recording, text input, TTS playback).
  - `NavigationDrawer.tsx`: Turn-by-turn route directions and floor transition step list.

---

### 1.2 Backend API Services (Java 21 + Spring Boot 3.2)
- **Base URL:** `http://localhost:8085`
- **Security:** Spring Security with stateless JWT Bearer filter, BCrypt password hashing.
- **REST Endpoints by Domain:**
  - **Auth (`AuthController`):**
    - `POST /api/auth/login` — Authenticate email/password; returns JWT and role array.
    - `POST /api/auth/register` — Register customer account.
    - `GET /api/auth/me` — Retrieve current authenticated user profile.
  - **Products & Catalog (`ProductController`):**
    - `GET /api/products` — Paginated catalogue search with category, brand, shop, floor, min/max price, in-stock filters.
    - `GET /api/products/{id}` — Single product details.
    - `GET /api/products/categories` — List of 15 retail categories.
    - `GET /api/products/recommendations` — Content-based recommendations via FastAPI proxy.
    - `GET /api/products/search/suggest` — Autocomplete suggestions.
  - **Malls, Floors & Shops (`ShopController`, `FloorController`):**
    - `GET /api/malls/1` — Alpha One Mall metadata and operational hours.
    - `GET /api/floors` — List 5 levels (LG, G, 1F, 2F, 3F).
    - `GET /api/shops` — Directory of 30 shops with filter parameters.
    - `GET /api/shops/{id}` — Shop profile and mapped navigation node.
  - **Navigation (`NavigationController`):**
    - `POST /api/navigation/route` — Compute shortest Dijkstra path (`fromNodeId`, `toNodeId`, `accessibleOnly`).
    - `GET /api/navigation/validate-graph` — Audit topological connectivity (nodes, edges, components).
    - `GET /api/navigation/checkin` — Resolve starting node from physical QR code scan.
    - `POST /api/navigation/reload-graph` — Reload in-memory graph after admin edits.
  - **Cart & Wishlist (`CartController`, `WishlistController`):**
    - `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}` — Cart management.
    - `GET /api/wishlist`, `POST /api/wishlist/items`, `DELETE /api/wishlist/items/{id}` — Wishlist management.
  - **Orders & Checkout (`OrderController`):**
    - `POST /api/orders/checkout` — Validate stock, compute tax/convenience fee, create order, deduct inventory.
    - `GET /api/orders` — Customer order list.
    - `GET /api/orders/{id}` — Order details.
    - `POST /api/orders/{id}/cancel` — Cancel eligible order, issue sandbox refund, restore stock.
  - **Retailer Operations (`RetailerInventoryController`, `RetailerOrderController`, `RetailerProductController`):**
    - `GET /api/retailer/inventory/alerts` — Store low-stock ($\le 5$) and out-of-stock ($0$) items.
    - `POST /api/retailer/inventory/adjust` — Adjust stock with reason codes (`RESTOCK`, `DAMAGE`, `RETURN`, `CYCLE_COUNT`).
    - `GET /api/retailer/inventory/history` — Audit trail of stock adjustments.
    - `GET /api/retailer/orders` — Store-specific order queue (tenant isolated).
    - `PATCH /api/retailer/orders/{id}/status` — Advance order state (`CONFIRMED`, `READY_FOR_PICKUP`, `FULFILLED`).
    - `POST /api/retailer/products/classify-image` — Advisory image classification via FastAPI proxy.
  - **Admin Operations (`AdminOperationsController`, `AdminAnalyticsController`):**
    - `GET /api/admin/dashboard/stats` — Real database-grounded operational statistics.
    - `GET /api/admin/floors` — 5-floor structure overview with store counts.
    - `PATCH /api/admin/shops/{id}` — Edit store metadata.
    - `PATCH /api/admin/shops/{id}/status` — Soft-activate / deactivate store.
    - `POST /api/admin/retailers/onboard` — Onboard store manager account with BCrypt password.
    - `PATCH /api/admin/retailers/{id}/status` — Suspend / reactivate retailer account.
    - `GET /api/admin/orders` — Mall-wide order oversight.
    - `PATCH /api/admin/orders/{id}/status` — Administrative order intervention / cancellation.
    - `GET /api/admin/audit-logs` — Read-only immutable system event log.
    - `GET /api/admin/analytics/demand/{category}/predict` — Demand forecast proxy to FastAPI.
  - **Voice & Assistant (`VoiceController`):**
    - `POST /api/voice/concierge` — Unified voice interaction endpoint orchestrating NLU, RAG, and directions.

---

### 1.3 AI Model Service (Python 3.11 + FastAPI + PyTorch)
- **Base URL:** `http://localhost:8001`
- **Active ML/DL Engines:**
  1. `recommendation.py` — Content-based product recommender with composite TF-IDF + price/category cosine search.
  2. `demand_prediction.py` — Chronological GBDT demand forecaster on simulated 240-day series.
  3. `intent_classifier.py` — Subword 1D TextCNN intent classifier across 8 intents.
  4. `image_classifier.py` — ResNet18 transfer-learning product classifier + Grad-CAM explainability.
  5. `speech.py` — Faster-Whisper ASR engine for Gujarati, Hindi, and English transcription.
  6. `rag_engine.py` — Multilingual retail RAG engine with hard brand constraint enforcement and eSpeak-NG TTS.

---

### 1.4 Database Layer (PostgreSQL 16)
- **Port:** `5433` (Database: `mallmind`, User: `mallmind`)
- **Tables (21):**
  - `malls`, `floors`, `shops`, `facilities`
  - `navigation_nodes`, `navigation_edges`
  - `products`, `product_categories`, `offers`
  - `users`, `roles`, `user_roles`
  - `carts`, `cart_items`, `wishlists`, `wishlist_items`
  - `orders`, `order_items`
  - `inventory_adjustments`, `audit_logs`, `search_events`

---

## 2. Comprehensive Test Matrix Across User Roles

| Role | Test Domain | Test Scenario | Expected Outcome | Risk / Criticality |
| :--- | :--- | :--- | :--- | :---: |
| **Customer** | Discovery | Floor and store browsing | Correct 5-floor hierarchy, 30 active stores | High |
| **Customer** | Discovery | Multi-filter catalogue search | Filters by category, brand, budget, availability | High |
| **Customer** | Navigation | Multi-floor routing (G $\to$ 3F) | Calibrated distance, floor transition steps | High |
| **Customer** | Navigation | Accessible routing toggle | Routes strictly via elevators; avoids escalators | High |
| **Customer** | Voice AI | Multilingual queries (GU, HI, EN) | Correct intent, entity parsing, hard brand filtering | High |
| **Customer** | Checkout | Cart update & stock deduction | Atomic reservation; non-negative stock | **P0 (Critical)** |
| **Customer** | Checkout | Order cancellation & stock return | Sandbox refund issued; stock restored | **P0 (Critical)** |
| **Retailer** | Operations | Store tenant isolation | Cannot access or mutate another store's inventory | **P0 (Critical)** |
| **Retailer** | Operations | Cycle count stock adjustment | Validated non-negative stock; audit ledger written | High |
| **Retailer** | Vision AI | Product photo classification | Advisory category prediction or fallback ($<0.50$) | Medium |
| **Admin** | Governance | Real metrics dashboard | Grounded in database truth (stores, floors, revenue) | High |
| **Admin** | Governance | Store soft deactivation | Store disabled without dangling navigation nodes | High |
| **Admin** | Governance | Retailer onboarding & suspension | Suspended retailer login rejected (HTTP 403) | High |
| **Admin** | Security | Audit log immutability | Mutations (`POST`, `DELETE`) rejected (405/404) | High |
| **System** | Integrity | Concurrent checkouts on low stock | No overselling; rejected when stock depleted | **P0 (Critical)** |
| **System** | Security | Unauthenticated admin/retailer access | Rejected with HTTP 401/403 | **P0 (Critical)** |

---

## 3. Phase 8 Execution Roadmap

1. **Phase 8B:** Complete Customer Journey Testing (Discovery, Navigation, Voice AI, Checkout).
2. **Phase 8C & 8D:** Retailer & Administrator Workflow Verification.
3. **Phase 8E:** Comprehensive Security and Access-Control Audit.
4. **Phase 8F:** Database Transaction & Concurrency Integrity Verification.
5. **Phase 8G:** AI and Model Reliability Testing across all 4 models + RAG/ASR.
6. **Phase 8H:** Navigation and Digital Twin Graph Integrity.
7. **Phase 8I:** Performance Benchmarks (Frontend, Backend, AI Latency).
8. **Phase 8J:** UI, Usability & Accessibility Audit.
9. **Phase 8K:** Unified Defect Register & Final QA Report.
