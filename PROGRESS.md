# MallMind AI — Progress Status

Last updated: 2026-11-18

## What's actually done (Phases 1–11)

### Phase 11: Frontend/backend polish

Two concrete items from "Known gaps" below, closed out:

- **Retailer shop-ownership UI**: the retailer product form used to ask for
  a raw numeric "Shop ID". Added `GET /api/retailer/products/shops`
  (`RetailerProductService.listMyShops`) -- RETAILER sees only shops they
  own (`ShopRepository.findByOwnerId`), ADMIN sees every shop, same
  ownership split `listMyProducts` already used. The React retailer page
  now renders a real `<select>` of shop names instead of a number input.
  **Verified live**: logged in as the demo retailer and saw exactly their
  one owned shop ("Urban Threads") in the dropdown; logged in as admin and
  saw all 18 seeded shops. Zero console errors.
- **`/actuator/health` returning 500 instead of 404**: root cause was
  `GlobalExceptionHandler`'s catch-all `@ExceptionHandler(Exception.class)`
  intercepting Spring's own "no route matched" exception
  (`NoResourceFoundException`/`NoHandlerFoundException`) and converting it
  to a generic 500 before the framework's normal 404 handling ran. Fixed
  by adding an explicit handler for those two exception types ahead of the
  catch-all, returning a clean 404. **Verified live** by curling
  `/actuator/health` (no actuator dependency is installed, so this route
  is always unmatched) and an arbitrary bogus path under a permitAll
  prefix -- both now return `{"error":"NOT_FOUND",...}` with HTTP 404
  instead of the old 500.

## What's actually done (Phases 1–10)

### Phase 10: React frontend

A full React/TypeScript frontend (Vite, React Router, no UI framework
dependency -- plain CSS using the same validated palette tokens as the
Phase 8 dashboard for visual consistency across the whole system). Talks
to the real backend through Vite's dev-server proxy (`/api/**` →
`localhost:8080`), not mocked data anywhere.

- **Auth** (`AuthContext`): register/login against the real
  `/api/auth/**` endpoints, JWT persisted in `localStorage`, role-aware
  nav (Wishlist/Orders only when signed in; "My shop" only for
  RETAILER/ADMIN; "Admin analytics" link only for ADMIN, opening the
  Phase 8 static dashboard in a new tab rather than rebuilding it in React).
- **Product discovery**: search/filter page showing both plain search
  results and a "Recommended for these filters" panel that calls Phase 9's
  `/api/products/recommendations` and **honestly displays its `source`**
  (ML-ranked vs. baseline) exactly as the API reports it.
- **Interactive floor map** (`FloorMapPage`) -- the project's core
  differentiator, now genuinely clickable: real shop/facility markers
  plotted from `/api/floors/{n}/map` on an SVG canvas sized to the floor's
  real plan dimensions; clicking one computes a real Dijkstra route from
  the main entrance (resolved live via the existing QR check-in endpoint,
  not hardcoded) and draws the on-floor segment of the path as a polyline,
  with the full cross-floor spoken-directions text always shown regardless
  of which floor tab is active. Product and shop pages deep-link into this
  map with the destination pre-selected and the route pre-computed.
- **Cart / wishlist / checkout / orders**: full real flow against
  `/api/me/**` -- add to cart, change quantity, checkout (fulfilment type
  only, no payment fields), and the resulting real order appears in order
  history.
- **Voice assistant widget**: a persistent floating panel (every page) that
  talks to Phase 7/9's `/api/voice/text` and `/api/voice/query`, supporting
  both typed text and **real browser microphone recording** via
  `MediaRecorder` + `getUserMedia`, with the spoken audio reply played back.
  Product results in a response render as clickable links into the product
  detail page.
- **Retailer product management** (`RetailerPage`): full create/edit/delete
  against `/api/retailer/products`, plus Phase 9's image-classification
  aid (`/api/retailer/products/classify-image`) as an upload-a-photo
  "suggested category" button -- advisory only, never auto-applied.
- **A real, necessary backend fix made for this phase**: browser
  microphone recordings are WebM/Opus by default (`MediaRecorder`'s
  standard output), which `soundfile` (libsndfile) cannot decode --
  `model-service/app/speech.py`'s audio decoder only handled WAV before.
  Fixed by adding a PyAV-based fallback decode path and **verified with a
  real WebM/Opus-encoded clip** (not just WAV) before trusting it: encoded
  a synthesized test phrase to WebM/Opus and confirmed it transcribed back
  correctly through the actual `/voice/transcribe` code path.
- **Verified end-to-end in a real browser** (Claude in Chrome, not just
  curl): registration, login (role-based nav), product search +
  ML-recommendations, add-to-cart → checkout → real order created,
  floor-map click → real multi-floor route with drawn path, voice widget
  text query → real product links → navigated to product → "get
  directions" deep-link → map auto-routed, and full retailer product
  CRUD including a live image-classification suggestion on a real sample
  image. Zero console errors across the entire session.
- Run it: `cd frontend && npm install && npm run dev` (needs the backend
  on :8080 and, for voice/recommendations/image features, the
  model-service on :8001).

## What's actually done (Phases 1–9)

### Phase 9: Full model-service integration

The remaining three model-service endpoints (recommendations, demand
prediction, image classification) are now called from the Java backend
for real, completing what Phase 7 started with intent/speech. `ModelServiceClient`
now wraps all six of the model-service's endpoints.

- **Recommendations** (`GET /api/products/recommendations`): implements
  the `RecommendationProvider` interface for real
  (`ProductRecommendationService`). Only product id + score are trusted
  from the model-service's response; every displayed fact is re-fetched
  from the live database (never the model-service's own catalog.csv
  snapshot). Per the interface's own contract, a model-service failure
  falls back to a transparent, non-ML baseline (the same filter plain
  search uses, cheapest first) rather than fabricating a recommendation --
  **verified live** by killing the model-service mid-session: the
  response kept working and honestly reported `"source":"baseline-filter"`
  instead of silently pretending to be the real model.
- **Demand prediction** (`GET /api/admin/analytics/demand/{category}/predict`,
  `GET /api/admin/analytics/categories`): added to the Phase 8 dashboard
  with a real category dropdown and a "Forecast" panel. No baseline
  fallback exists here (there's no non-ML way to predict a number) -- a
  model-service outage surfaces as a real 503, verified live the same way.
  An unknown category honestly 404s instead of inventing a number.
- **Image classification** (`POST /api/retailer/products/classify-image`):
  a RETAILER/ADMIN-only data-entry aid -- suggests a category from a
  product photo. Advisory only; never creates or changes a product.
  Verified live with a real Fashion-MNIST-derived sample image (99.98%
  confidence, correctly classified as Footwear).
- **A real bug found and fixed while testing this phase, live in the
  browser, not by inspection**: the admin dashboard's demand-forecast
  panel showed "NaN predicted searches" on first test. Root cause:
  `ModelServiceClient`'s internal DTOs (`DemandPrediction`, `ImageClassification`)
  carry `@JsonProperty("predicted_next_day_count")` / `@JsonProperty("low_confidence")`
  to deserialize the Python service's snake_case JSON -- but Jackson
  annotations are bidirectional by default, so returning those same DTOs
  directly from a Java controller silently re-serialized the response
  back out in snake_case too, instead of this codebase's camelCase
  convention. Fixed by introducing separate outward-facing response DTOs
  (`DemandForecastResponse`, `ImageClassificationResponse`) and keeping the
  model-service mirrors internal to `ModelServiceClient` only -- the same
  pattern Phase 7's `VoiceController` already used correctly (it never
  returns `IntentResult` directly either).

## What's actually done (Phases 1–8)

### Phase 8: Admin analytics dashboard (Part 8)

A real REST API plus a working visual dashboard — the first visual UI
anywhere in this project, since the React frontend hasn't started yet.

- **API** (`/api/admin/analytics/**`, ADMIN-only, enforced both in
  `SecurityConfig` and `@PreAuthorize` on the controller): `/summary`,
  `/search-terms/top`, `/search-terms/zero-result`, `/categories/top`,
  `/products/top`, `/search-volume?days=N`, `/revenue?days=N`. Every number
  is a real aggregate over `SearchEvent`/`Order`/`OrderItem` — nothing
  simulated, nothing per-visitor (Part 17: aggregate-only, never a single
  visitor's search history).
- **Dashboard UI** (`backend/src/main/resources/static/admin-dashboard.html`):
  a static page served directly by Spring Boot (no frontend/build step
  needed yet) with a real login gate (calls `/api/auth/login`, holds the
  JWT in memory only, re-fetches on sign-out), stat tiles, a search-volume
  line chart, a revenue bar chart, top-categories/top-products horizontal
  bar lists, and top-terms/zero-result-terms tables with a
  product/shop toggle and a 7/14/30-day range filter. Built with the
  project's dataviz palette (validated categorical/sequential colors, 2px
  lines, 4px rounded bar ends, hover tooltips, light/dark mode).
- **Verified live in a real browser** (Claude in Chrome): logged in as
  `admin@mallmind.local`, confirmed real numbers rendered (184 products,
  18 shops, 2 sandbox orders, ₹7,688 revenue, 6 logged searches, a 20%
  product-search zero-result rate correctly flagged in the warning color),
  confirmed the product/shop toggle and date-range filter both re-fetch
  and re-render correctly, confirmed hover tooltips work, confirmed
  sign-out clears the session and re-shows the login gate, and confirmed
  no console errors.
- The page itself is publicly loadable (static HTML, no data in it) but
  every actual data call requires a real ADMIN JWT — unauthenticated API
  calls correctly get 403.

### Phase 7: Voice assistant (Part 15)

Real audio in, real audio out, verified with an actual round trip (not
typed-text-only): the model-service's own TTS spoke a query out loud, that
WAV was uploaded to the backend, transcribed back to text by Whisper, and
produced a spoken reply — the backend's own test bypassed needing a
microphone this way while still exercising every real component.

- **Speech I/O** (`model-service/app/speech.py`, served via `main.py`):
  - `POST /voice/transcribe` — faster-whisper (`base.en`, CPU, int8), decodes
    uploaded WAV bytes **entirely in memory**, never written to disk.
  - `POST /voice/speak` — Windows SAPI5 via `pyttsx3`; a temp file is
    unavoidable (pyttsx3's only API), deleted immediately after being read
    back into memory.
  - Both have no business logic — they only convert audio↔text.
- **Conversational orchestration lives in the Java backend, not the
  model-service** — a deliberate architectural choice (see
  `model-service/app/main.py`'s docstring: the model-service returns
  *understanding*, never *facts*). `VoiceAssistantService` calls the new
  `ModelServiceClient` for `/voice/transcribe` and `/nlu/intent` (the first
  real Java→Python call — early Phase 9 groundwork), then answers using the
  backend's own real data: `ProductService`, `ShopService`,
  `FacilityRepository`, `NavigationGraphService` (real Dijkstra routes,
  `spokenDirections` reused directly for TTS).
- **Conversational context**: `VoiceSessionService` holds per-session slot
  memory (category/brand/color/budget/shop/facility) in memory only —
  intentionally never persisted (Part 17: don't retain voice-derived data).
  A fresh search intent clears slots; `REFINE_SEARCH` merges into them.
  **Verified live, multi-turn**: "find me footwear under 3000 rupees" →
  8 results, then (same session) "Do you have it in blue" was correctly
  classified `REFINE_SEARCH` (93% confidence), merged `color=Blue` into the
  still-remembered Footwear+₹3000 filter, and **honestly reported zero
  matches** rather than fabricating one (no blue footwear under ₹3000
  exists in the synthetic catalogue).
- **Low-confidence handling**: below the intent model's own confidence
  floor, the assistant asks for clarification instead of acting on a
  guess — verified live with "show me shops that sell electronics" (real
  queries sometimes score low; this is the Phase 6 model's documented
  ~64% honest accuracy showing up here, not hidden).
- **No real indoor positioning exists**, so every voice-requested route
  starts from the main entrance (resolved live via the existing
  `checkin`/QR mechanism, not hardcoded) — a disclosed limitation, not a
  fabricated "current location".
- Endpoints: `POST /api/voice/text` (typed turn, for testing without a
  mic), `POST /api/voice/query` (multipart audio in, JSON out with a
  base64 WAV reply). Both public (same trust level as plain product/shop
  search). Graceful degradation: if the model-service is unreachable,
  `ModelServiceUnavailableException` → HTTP 503, not a crash.
- **A real, unrelated bug found and fixed while testing this phase**:
  `GET /api/products` with no `name` filter (i.e. any search where `name`
  is `null`) returned HTTP 500 — `operator does not exist: text ~~ bytea`.
  Postgres couldn't infer the type of a `null`-valued bind parameter wrapped
  in HQL's `concat('%', :name, '%')`. This was already broken before Phase 7
  touched anything (reproduced directly via plain `curl`); fixed by building
  the full `%term%` pattern in `ProductService` (Java) and binding it as a
  single ready-made parameter instead of concatenating in HQL.

## What's actually done (Phases 1–6)

### Phase 6: Deep Learning (two required models, see `model-service/README.md`)

Both trained and evaluated for real; results verified live via the running
FastAPI service, not just in notebooks.

- **Model 1 — text intent classification** (`model-service/app/intent_classifier.py`,
  a TextCNN: Embedding → parallel 1D convs → max-pool → dropout → softmax, 6 intents).
  Trained on a template-generated, clearly-disclosed-as-synthetic ~1,800-query
  dataset. **Reported two numbers on purpose**: ~100% on a naive random split
  (memorization of the fixed templates — misleading) vs. **~64% on a
  template-level held-out split** (genuine generalization to unseen phrasings —
  the honest number, and the one the service actually serves). This gap is
  itself the finding, not a bug. Verified live: `POST /nlu/intent` correctly
  classified "I want black formal shoes under 3000 rupees" as `PRODUCT_SEARCH`
  (93% confidence) with entities `{max_budget: 3000, color: Black}` extracted
  by a separate rule-based module (`entity_extraction.py`).
- **Model 2 — product image classification** (`model-service/app/image_classifier.py`,
  ResNet18 transfer learning). Dataset: Fashion-MNIST (Zalando Research, **MIT
  licensed** — verified, documented), 10 classes grouped into 3 real platform
  categories (Apparel, Bags & Accessories, Footwear) since no licensed dataset
  covers the other 13 categories — stated honestly as a scope limit, not hidden.
  Real result: **99.2% test accuracy**, macro F1 0.992 on 720 held-out images
  (genuinely high, not leakage — these 3 categories are visually very distinct).
  Includes Grad-CAM visual explanations. Verified live: `POST /vision/classify`
  correctly classified real sample images from all 3 classes with >99.8% confidence.
- Both models have documented fallback behaviour (a `low_confidence` flag) so
  the Java backend can route uncertain predictions to manual selection instead
  of acting on a guess.
- Four Jupyter notebooks total now (`model-service/notebooks/01`–`04`), all
  **actually executed** end-to-end under a dedicated registered kernel
  (`mallmind-venv`) — not hand-typed outputs.
- Still not wired into the Java backend (Phase 9).

## What's actually done (Phases 1–5)

### Phase 5: Data Science (two required models, see `model-service/README.md`)

Both models were trained and evaluated for real (not fabricated numbers —
run them yourself, commands below), with results embedded in **executed**
Jupyter notebooks (`model-service/notebooks/`), not hand-typed output.

- **Model 1 — content-based product recommendation engine**
  (`model-service/app/recommendation.py`): category/brand/color one-hot +
  scaled price → cosine similarity, hard-filtered by availability/budget
  first. Evaluated against a category-filter baseline using Precision@K/
  Recall@K/NDCG@K with an explicit, documented relevance rule (no real
  click data exists yet). Result: model wins on NDCG@5 (0.885 vs 0.826),
  roughly ties on Precision/Recall@5 — reported honestly, not oversold.
- **Model 2 — product/category demand prediction**
  (`model-service/app/demand_prediction.py`): RandomForestRegressor with
  lag/rolling/seasonality features, trained on a **per-category
  chronological** split (no leakage), beats a 7-day moving-average
  baseline (MAE 2.91 vs 3.52). Trained on a clearly-labeled **simulated**
  time series (`model-service/data/generate_demand_series.py`) since the
  real `search_events` table doesn't have enough history yet.
- **FastAPI service** (`model-service/app/main.py`, port 8001) exposing
  both models — `/health`, `/recommendations`, `/demand/{category}/predict`
  — all tested live. Not yet wired into the Java backend (that's Phase 9).
- A real bug worth knowing: querying with a colour that doesn't exist
  anywhere in a category (e.g. "black Apparel" — the catalogue has zero
  black apparel items) doesn't return an empty list; the model falls back
  to the closest category+price match, since colour is a soft similarity
  signal, not a hard filter. Documented as a limitation, not hidden.

Run model training/evaluation yourself:
```powershell
cd model-service
.venv\Scripts\python.exe app\evaluate_recommendation.py
.venv\Scripts\python.exe app\evaluate_demand.py
```

## What's actually done (Phases 1–4, backend)

### Phase 4: E-commerce (wishlist, cart, checkout, retailer management)

All verified live against the running backend + real Postgres, including
two real bugs found and fixed during testing (not just "it compiled"):

- **Wishlist** (`/api/me/wishlist`) — add/remove/list, per-user
- **Cart** (`/api/me/cart`) — add/update-quantity/remove/clear
- **Simulated checkout** (`POST /api/me/checkout`) — sandbox only, no
  payment gateway, no card details ever accepted (`CheckoutRequest` only
  carries a fulfilment type: `IN_STORE_PURCHASE` or `STORE_PICKUP`).
  Verified: stock is checked and decremented, an out-of-stock item
  correctly blocks checkout with a clear message, a successful checkout
  creates an `Order` with price-snapshotted `OrderItem`s and **clears the
  cart**, and checking out again with an empty cart cleanly errors instead
  of creating a bogus order
- **Order history** (`GET /api/me/orders`, `GET /api/me/orders/{id}`)
- **Product comparison** (`GET /api/products/compare?ids=1,2,3`)
- **Retailer product management** (`/api/retailer/products`) — a RETAILER
  can list/create/update/delete products only in shops they own
  (`Shop.owner`); verified a retailer updating their own product succeeds,
  and updating a product from a shop they don't own is correctly rejected
  with 403 `FORBIDDEN`. ADMIN bypasses the ownership check entirely.
- **Offers** (`GET /api/offers` public, `POST`/`DELETE /api/retailer/offers`
  owner-only) — with a `sponsored` disclosure flag per Part 12

**Two real bugs found and fixed while testing this phase** (both the same
root cause, worth knowing about if you extend this code):
1. The *very first* add to a brand-new Cart/Wishlist in a request returned
   an empty list in the response, even though the DB write succeeded — a
   newly-created JPA entity's already-initialized empty `items` collection
   doesn't get repopulated by a later fetch-join query in the *same*
   transaction. Fixed by querying `cart_items`/`wishlist_items` directly
   instead of through `Cart.items`/`Wishlist.items`.
2. `cartItemRepository.deleteByCart(cart)` (a derived Spring Data `deleteBy`
   method) silently failed to delete rows during checkout, because
   `Cart.items` (`cascade=ALL, orphanRemoval=true`) had already been lazily
   loaded earlier in the same transaction, and Hibernate's flush-time
   cascade logic re-persisted the "orphan" before the derived delete's
   `remove()` took effect. Fixed by replacing both of `CartItemRepository`
   and `WishlistItemRepository`'s delete-by methods with explicit
   `@Modifying` bulk JPQL deletes, which bypass collection-cascade state.

New seed data: a `retailer@mallmind.local` / `RetailerPass123!` account
that owns shop 1 (Urban Threads), to exercise ownership checks for real.

## What's actually done (Phases 1–3, backend MVP backbone)

Everything below was **compiled, run against a real PostgreSQL database, and
exercised with live HTTP requests** in this session — not just written.

### Infrastructure
- Java 21 (Temurin, portable install at `C:\Users\zeelp\tools\jdk-21.0.13+9`
  — your system JDK is only 20, see `backend/set-java-home.ps1`)
- Spring Boot 4.1.2 backend, Maven Wrapper (no system Maven needed)
- PostgreSQL 16 in Docker (`docker-compose.yml`), host port **5433** (not
  5432 — a native PostgreSQL 16 Windows service already owns 5432 on this
  machine; see comment in `docker-compose.yml`)

### Java backend (`backend/`)
- Full domain model: `Mall`, `Floor`, `NavigationNode`, `NavigationEdge`,
  `Shop`, `Facility`, `ProductCategory`, `Product`, `User`, `Role`, `SearchEvent`
- JWT auth (register/login), BCrypt password hashing, Spring Security
  role-based access (`ADMIN`, `RETAILER`, `VISITOR`) — **verified**: visitor
  self-registration works, self-registering as ADMIN is correctly rejected,
  an unauthenticated catalogue-import call gets HTTP 403
- Custom exceptions (`ShopNotFoundException`, `ProductNotFoundException`,
  `InvalidFloorException`, `RouteNotFoundException`, `CatalogueImportException`)
  mapped to proper HTTP responses via `GlobalExceptionHandler`
- OOP interfaces: `Searchable<C,R>`, `Navigable`, `RecommendationProvider<C,R>`
- **Navigation engine**: graph-based, real Dijkstra (`NavigationGraphService`)
  over `navigation_nodes`/`navigation_edges` loaded from the DB. Nothing
  shop-specific is hardcoded — **verified**: a real 3-floor route (ground
  shop → second-floor shop) was computed live, crossing two staircase
  transitions, with correct step-by-step + spoken directions; an
  unreachable/invalid node correctly returns 404 `ROUTE_NOT_FOUND`
- QR check-in (`GET /api/navigation/checkin?qrCode=...`) — verified
- Shop & product search/filter (budget, brand, category, color) — verified
  against real seeded data, including confirming an **honest empty result**
  for "black footwear under ₹3,000" (no such product exists in the
  synthetic catalogue — the system did not fabricate a match)
- CSV catalogue import (`POST /api/retailer/catalogue/import`, ADMIN/RETAILER
  only) — real file upload, chunked and parsed **concurrently** on a
  dedicated thread pool (`AsyncConfig.catalogueImportExecutor`), validated
  against real shop/category rows — verified: 25-row sample imported with
  0 errors
- Background analytics logging (`AnalyticsLogService`) runs off the request
  thread via `@Async` — real multithreading, not just an annotation for show

### Database & seed data (`data/seed/`)
- `01_seed_core.sql`: 1 mall, 3 floors, 40 navigation nodes, 43 edges
  (corridor spine + shop/facility spurs + vertical connectors for
  staircase/escalator/elevator between every adjacent floor pair), 18
  shops, 16 product categories, 7 facilities, roles, 1 admin user
- `generate_products.py`: deterministic (seed=42) generator for 184
  synthetic products — **clearly labeled as demo data, not real inventory**
  — writes `02_seed_products.sql` and `products_import_sample.csv`
- Admin login: `admin@mallmind.local` / `AdminPass123!`
- Retailer login (owns shop 1, Urban Threads): `retailer@mallmind.local` /
  `RetailerPass123!`
  — **change both before any non-local use**

## How to run it (Windows, PowerShell)

```powershell
# 1. Start the database
docker compose up -d

# 2. Start the backend (first run creates the schema via Hibernate)
cd backend
. .\set-java-home.ps1      # only if your `java` isn't already 21+
.\mvnw.cmd spring-boot:run

# 3. In a second terminal, load the seed data (schema must exist already)
docker exec -i mallmind-postgres psql -U mallmind -d mallmind < data/seed/01_seed_core.sql
docker exec -i mallmind-postgres psql -U mallmind -d mallmind < data/seed/02_seed_products.sql
```

Backend listens on `http://localhost:8080`. Try:
- `GET /api/floors`
- `GET /api/floors/1/map`
- `GET /api/products?category=Footwear&maxPrice=3000`
- `POST /api/navigation/route` with `{"fromNodeId":6,"toNodeId":46}`
- `POST /api/auth/login` with `{"email":"admin@mallmind.local","password":"AdminPass123!"}`
- `POST /api/voice/text` with `{"text":"find me footwear under 3000 rupees"}`
  (needs the model-service running too — see `model-service/README.md`)
- Open `http://localhost:8080/admin-dashboard.html` in a browser and sign
  in with the admin login above for the analytics dashboard (now with a
  live demand-forecast panel too)
- `GET /api/products/recommendations?category=Footwear&maxBudget=3000`
  for ML-ranked recommendations (falls back to a disclosed baseline if
  the model-service is down)

```powershell
# 4. Frontend (separate terminal)
cd frontend
npm install
npm run dev
```
Opens on `http://localhost:5173` (proxies `/api/**` to the backend on :8080).

## Known gaps / not yet built

Per the project's own MVP-first rule (Part 16), these are intentionally
deferred, not skipped:

- **Frontend**: the MVP is done as of Phase 10 (auth, product search +
  recommendations, interactive floor map + navigation, cart/wishlist/
  checkout/orders, the voice widget with real mic recording, retailer
  product management). Not built: a visual mall-layout *editor* (admin
  still edits layout via the DB/seed scripts), and the admin analytics
  dashboard stays a separate static page rather than a React route —
  deliberate, since Phase 8 already built and verified it.
- **Model service ↔ Java integration**: complete as of Phase 9 — all six
  model-service endpoints (intent/entities, speech, recommendations,
  demand prediction, image classification) are now called from the Java
  backend, each with honest degraded-mode behaviour when the model-service
  is unavailable.
- **Startup/business documentation** — not started
- Voice sessions (`VoiceSessionService`) live in an unbounded in-memory
  map with no expiry — fine for a demo, would need a TTL/eviction policy
  before any real deployment.
- The admin dashboard's top-N lists (categories/products/terms) are
  all-time, not scoped to the day-range filter — only the two time-series
  charts (search volume, revenue) respect it. Fine for this data volume;
  would need date-ranged repository queries to extend.

## Next suggested phase

Backend, model integration, the frontend MVP, and a round of polish
(Phases 1–11) are done. What's left: startup/business documentation (Lean
Canvas, SWOT, etc. — no code dependency, so it can happen any time), final
project documentation/writeup, or further optional frontend polish (a
mall-layout editor UI, a mobile pass, etc. — not required by the spec).
