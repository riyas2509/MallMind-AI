# MallMind AI — Phase 9F: Live Demonstration Runbook

**Target Application:** MallMind AI Multilingual Smart Mall Digital Twin  
**Target Venue:** Nexus Ahmedabad One (Alpha One Mall), Vastrapur, Ahmedabad, Gujarat, India  
**Audience:** Academic Examiners, Project Evaluators, Instructors & Demonstration Team  
**Estimated Demo Duration:** 15–20 minutes  
**Document Version:** 1.0 (Phase 9 Academic Deliverable)  

---

## 1. Pre-Flight Demonstration Checklist

Perform these checks 10 minutes before the examination committee convenes:

1. **Docker PostgreSQL Container Active:**
   ```bash
   docker ps --filter "name=mallmind-postgres"
   # Expected: Up and healthy on port 5433
   ```
2. **AI Model Service Active:**
   ```bash
   curl http://localhost:8001/health
   # Expected: {"status":"healthy","service":"mallmind-ai"}
   ```
3. **Backend Service Active:**
   ```bash
   curl http://localhost:8085/api/stores
   # Expected: HTTP 200 with JSON store array
   ```
4. **Frontend Dev Server Active:**
   - Open `http://localhost:5173` in Google Chrome (recommended for Web Audio and MediaRecorder compatibility).
5. **Audio Input Ready:**
   - Ensure browser microphone permission is allowed for `http://localhost:5173`.
   - Set system output volume to 60–80% for Text-to-Speech (TTS) playback.

---

## 2. Demonstration Flow Overview

The presentation is divided into four cohesive, logical segments:
- **Part 1 (6 mins): Customer Journey & Voice AI** — Digital Twin, Multilingual ASR, Zero-Substitution Brand Search, Dijkstra Wayfinding, Cart & 18% GST Checkout.
- **Part 2 (4 mins): Retailer Store Operations** — Retailer Login, Inventory Adjustment, Real-Time Ledger, ResNet18 AI Visual Image Categorization.
- **Part 3 (4 mins): Mall Operations & Administration** — Executive Dashboard, Random Forest Demand/Footfall Forecasting, Store Management, Tamper-Evident Audit Trail.
- **Part 4 (3 mins): Technical & Model Verification** — FastAPI Docs (:8001/docs), Spring Boot API validation, PostgreSQL ACID transaction verification.

---

## 3. Step-by-Step Demonstration Script

### Part 1: Customer Journey & Multilingual Voice AI (6 Minutes)

#### Step 1.1: Landing & 5-Floor Digital Twin
- **Action:** Open `http://localhost:5173`.
- **Examiner Commentary:**  
  *"Here is the interactive 2D schematic digital twin of Nexus Ahmedabad One (Alpha One Mall) in Vastrapur, Ahmedabad. We have modeled all five active retail floors: Lower Ground, Ground Floor, First Floor, Second Floor, and Third Floor with Cinepolis and Food Court."*
- **Interaction:**
  - Click on floor selector buttons: `LG`, `G`, `1F`, `2F`, `3F`.
  - Point out anchor stores on Ground Floor (Zara, H&M) and Second Floor (Nike, Adidas, Croma).
  - Zoom and pan across the schematic layout.

#### Step 1.2: Multilingual Voice Concierge (Gujarati / Hindi / English)
- **Action:** Click the microphone button in the header navigation or the floating Concierge pill.
- **Examiner Commentary:**  
  *"Ahmedabad is a multilingual retail hub where visitors communicate in Gujarati, Hindi, and English. We integrated local speech recognition powered by Faster-Whisper and a PyTorch TextCNN intent classifier."*
- **Interaction (Gujarati):**
  - Click Speak and say: *"મને શૂઝ લેવા છે"* (or type into the chat input).
  - Observe: System transcribes the speech, extracts the category `Footwear`, and immediately highlights footwear stores across floors (Nike on 2F, Bata on 1F) while returning spoken TTS audio.
- **Interaction (Hindi):**
  - Say: *"मुझे रनिंग जूते चाहिए"* -> System identifies intent `SEARCH_PRODUCT` and category `Sportswear / Running`.

#### Step 1.3: Zero-Substitution Brand & Budget Rule Verification
- **Action:** In the Concierge search box, enter the benchmark test query:
  `Nike na running shoes under 2000 rupees`
- **Examiner Commentary:**  
  *"In Phase 4, we resolved a critical real-world constraint issue. Previously, if Nike shoes under ₹2,000 were out of stock, similarity models would silently substitute Bata sneakers at ₹519. We enforced a strict zero-substitution rule."*
- **Observe:**
  - The system checks brand `Nike` and budget `2000`.
  - Since Nike running shoes in catalog start at ₹4,995, the system displays:  
    **"No Nike products found under ₹2,000."**
  - It does NOT silently show Bata as a Nike result.
  - Below, an optional clearly flagged section displays: *"Suggested Alternatives from other brands"*.

#### Step 1.4: Topological Indoor Navigation (Dijkstra's Algorithm)
- **Action:**
  - Select Starting Point: `Zara (Ground Floor, Store 101)`.
  - Select Destination: `Cinepolis (Third Floor, Store 301)`.
  - Click **Find Route**.
- **Examiner Commentary:**  
  *"The indoor space is modeled as a mathematical graph G = (V, E). Our Java Spring Boot backend executes Dijkstra's algorithm, penalizing vertical escalator traversal by 30 seconds and elevators by 60 seconds."*
- **Observe:**
  - A green dashed path animates from Zara on Ground Floor to the central atrium escalator.
  - An indicator appears: *"Take Escalator to Floor 3"*.
  - Clicking `3F` shows the continuation of the route arriving directly at Cinepolis.
  - Total distance and estimated walk time (~4 minutes) are displayed.

#### Step 1.5: Smart Shopping Cart & 18% GST Checkout
- **Action:**
  - Navigate to **Storefront / Shop**.
  - Select `Zara Slim Fit Cotton Shirt` (₹2,990) -> Click **Add to Cart**.
  - Open Cart drawer.
- **Examiner Commentary:**  
  *"Notice the transparent tax engine. In accordance with Indian commercial taxation, a standard 18% GST is computed and preserved persistently in the order record."*
- **Observe:**
  - Subtotal: ₹2,990.00
  - GST (18%): ₹538.20
  - Total Payable: ₹3,528.20
  - Select Delivery Mode: **Click-and-Collect (Store Counter)**.
  - Click **Proceed to Checkout** -> Select **Sandbox Card Payment** -> Click **Pay Now**.
  - Order is confirmed instantly with Order ID and Store Pickup Counter instructions.

---

### Part 2: Retailer Store Operations (4 Minutes)

#### Step 2.1: Retailer Authentication & Store Isolation
- **Action:**
  - Click **Logout** from customer account.
  - Click **Login** -> Enter credentials:
    - Email: `retailer@mallmind.local`
    - Password: `<LOCAL_DEMO_PASSWORD>`
  - Portal automatically routes to `/retailer/dashboard`.
- **Examiner Commentary:**  
  *"Store managers access a dedicated, role-isolated portal. The retailer cannot view or alter catalogs of competitor stores."*

#### Step 2.2: Inventory Adjustment & Real-Time Ledger
- **Action:**
  - In the Zara Product Catalog, select `Zara Slim Fit Cotton Shirt`.
  - Click **Adjust Stock**.
  - Enter Delta: `+15`, Reason: `NEW_SHIPMENT_RECEIVED`.
  - Click **Save**.
- **Observe:**
  - The live stock balance updates immediately.
  - Scroll down to the **Inventory Adjustment Ledger** table.
  - A new immutable row appears with: Timestamp, Delta (+15), New Balance, Reason, and Actor (`retailer@mallmind.local`).

#### Step 2.3: AI-Assisted Product Image Classification (ResNet18)
- **Action:**
  - Click **Add New Product**.
  - In the Image Upload field, select any sample clothing/footwear photo (or use sample asset).
  - Click **AI Auto-Categorize**.
- **Examiner Commentary:**  
  *"Our Python microservice runs a pre-trained ResNet18 convolutional neural network. The 512-dimensional feature embedding is projected onto mall retail categories, reducing manual retailer cataloging errors."*
- **Observe:**
  - Category field auto-populates with `Apparel / Clothing` with confidence percentage.

#### Step 2.4: Order Fulfillment Workflow
- **Action:**
  - Navigate to **Store Orders** tab.
  - View the customer order placed during Part 1.
  - Change status from `PAID` to `READY_FOR_PICKUP`.
  - Save status -> Observe that the customer notification status updates.

---

### Part 3: Mall Operations & Administration (4 Minutes)

#### Step 3.1: Administrator Authentication
- **Action:**
  - Log out of retailer account.
  - Log in with Administrator credentials:
    - Email: `admin@mallmind.local`
    - Password: `<LOCAL_DEMO_PASSWORD>`
  - Portal routes to `/admin/dashboard`.

#### Step 3.2: Executive Mall Overview & KPIs
- **Examiner Commentary:**  
  *"The MallMind Admin console provides macro-level operational intelligence for Nexus Ahmedabad One management."*
- **Observe:**
  - Total Active Stores: `120+`
  - Total Products Listed: `152+`
  - Mall Footfall Today: Real-time counter
  - Gross Merchandise Value (GMV): Aggregate revenue across all in-mall tenants.

#### Step 3.3: Random Forest Demand & Footfall Forecasting
- **Action:**
  - Click on **Predictive Analytics & Footfall Forecast**.
  - Select forecast horizon: **Next 7 Days**.
  - Click **Generate Forecast**.
- **Examiner Commentary:**  
  *"Our predictive model is a Scikit-Learn Random Forest Regressor (100 trees). It factors in historical autoregressive lags, Ahmedabad weather patterns, and upcoming Gujarat public holidays (such as Navratri or Diwali)."*
- **Observe:**
  - An interactive multi-day forecast chart displays projected daily visitor counts (e.g. Saturday surge: ~28,500 visitors).
  - Displays Model Metrics: $R^2 = 0.84$, $\text{RMSE} = 12.4\text{ visitors}$.

#### Step 3.4: Tamper-Evident System Audit Trail
- **Action:**
  - Navigate to **System Audit Trail** in the sidebar.
- **Examiner Commentary:**  
  *"Enterprise governance requires strict immutability. Every privileged action—such as store updates, lease renewals, or catalog deletions—is permanently recorded in an append-only audit log with client IP, timestamp, and JSON before/after state."*
- **Observe:**
  - The audit log displays the stock adjustment performed by the retailer in Part 2 and the administrator's recent login event.
  - Demonstrate that there are no 'Edit' or 'Delete' buttons on audit records.

---

### Part 4: Technical & Model Verification (3 Minutes)

#### Step 4.1: FastAPI Interactive API Documentation
- **Action:** Open new browser tab to `http://localhost:8001/docs`.
- **Examiner Commentary:**  
  *"The AI microservice exposes high-performance asynchronous REST endpoints via FastAPI and Uvicorn."*
- **Inspect:**
  - `/ai/voice/transcribe` — Faster-Whisper ASR
  - `/ai/intent/predict` — PyTorch TextCNN inference
  - `/ai/vision/classify` — ResNet18 visual embedding
  - `/ai/demand/forecast` — Random Forest regressor
  - `/ai/recommend/product` — TF-IDF cosine recommender

#### Step 4.2: Direct PyTorch & Database Verification
- **Action (Terminal / PowerShell):**
  Show the active Docker PostgreSQL container:
  ```powershell
  docker exec -it mallmind-postgres psql -U mallmind -d mallmind -c "SELECT count(*) FROM orders; SELECT count(*) FROM inventory_ledger;"
  ```
- **Examiner Commentary:**  
  *"All transactions and ledgers are physically persisted in PostgreSQL 16 on port 5433 with strict relational integrity."*

---

## 4. Contingency & Fallback Procedures

| Scenario | Immediate Fallback Action |
| :--- | :--- |
| **Microphone Permission Denied / Muffled Audio** | Switch immediately to the text chat input box in the Concierge modal. Text input exercises the exact same entity extractor, TextCNN classifier, RAG search, and zero-substitution rules. |
| **Speech Misrecognition in Vernacular** | Speak clearly in Hindi ("मुझे जूते चाहिए") or English ("Find sports shoes"). If ambient room noise is high, type the query directly into the input bar. |
| **FastAPI Service Unresponsive (Port 8001)** | Run in terminal: `cd model-service && .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8001`. Service reloads in < 3 seconds. |
| **Spring Boot Backend Port Conflict** | Run `stop-mallmind.bat`, then restart: `cd backend && java -jar target\mallmind-backend-0.0.1-SNAPSHOT.jar --server.port=8085`. |
| **Database Container Disconnected** | Run `docker restart mallmind-postgres`. State is persisted on the `mallmind-pgdata` Docker volume and will not be lost. |

---
*Ready for Live Demonstration and Examiner Examination.*
