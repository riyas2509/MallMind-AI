# MallMind AI — Visitor Experience Simplification & Prototype Readiness Report

**Project:** MallMind AI  
**Target Mall:** Nexus Ahmedabad One (Alpha One Mall), Vastrapur, Ahmedabad, Gujarat, India  
**Date:** November 24, 2026  
**Status:** Verification Complete — Prototype Demonstration Ready  
**Version:** 1.0.0-prototype  

---

## 1. Executive Summary

In preparation for final college demonstration and academic defence, MallMind AI underwent a focused visitor-experience simplification and prototype-readiness refinement. 

The primary goals accomplished in this phase are:
1. **Simplified Public Navigation**: Streamlined visitor-facing primary navigation to 6 core destinations (Home, Directory, Mall Map, Products, Cart, Sign In / Register) while retaining the trilingual AI Concierge as a floating assistant.
2. **Eliminated Misleading and Ungrounded Claims**: Replaced marketing exaggerations ("30 Verified Stores", "Live Retailer Inventories", "Real-Time Dijkstra Shortest-Path Wayfinding", "Verified Physical Mall Twin") with rigorous, academically defensible terminology ("30 Stores in Prototype Directory", "Demo Product Catalogue & Inventory", "Dijkstra-Based Indoor Route Planning", "Five-Floor Prototype Map").
3. **Enhanced Indoor Navigation Experience**: Added a manual kiosk selector (6 entrance/concourse kiosks across LG to 3F), explicit destination dropdowns (30 stores and 11 facilities), multi-floor vertical transit explanations, accessible routing controls, and an explicit manual-positioning disclaimer banner clarifying that positioning is selected rather than live indoor GPS.
4. **Catalogue & Imagery Curation**: Verified 100% visual match between product names, categories, and high-resolution Unsplash imagery. Audited prices in authentic Indian Rupees (₹) across high-street fashion, electronics, cosmetics, dining, entertainment, and groceries.
5. **Integrated In-Page Comparison & Demonstration Offers**: Provided seamless in-page side-by-side product comparison in the Products catalogue without deceptive cosine-similarity percentage scores. Embedded demonstration offers directly into Home and Products with real promotional validity periods.
6. **Protected Administrative & Operational Areas**: Protected Mall Administration (`/admin`) behind `RequireAdmin` with explicit zero fallbacks (eliminating placeholder ellipses `...`). Gated Retailer Portal (`/retailer`) behind `RequireRetailer`. Removed public 1-click admin/retailer auto-fill credentials from `LoginPage.tsx`. Created a dedicated Academic Demonstration route (`/academic-demo`) linked from the footer.
7. **Regression Testing**: All 12 end-to-end user journeys verified successfully. Clean production build verified (`tsc -b && vite build` passing with zero errors).

---

## 2. Public Visitor Navigation & Layout Simplification

### 2.1 Navigation Architecture
The primary header navigation was cleaned to present an intuitive, focused shopping journey:

| Order | Destination | Path | Status | Notes |
|:---:|:---|:---|:---:|:---|
| 1 | **Home** | `/` | Retained | High-level mall discovery, search, and active offers |
| 2 | **Directory** | `/directory` | Retained | 30 prototype stores filterable by 5 floors and 7 retail categories |
| 3 | **Mall Map** | `/map` | Retained | 5-floor schematic Dijkstra indoor navigation with kiosk start points |
| 4 | **Products** | `/products` | Retained | In-mall demo catalogue with category filters and in-page comparison |
| 5 | **Cart** | `/cart` | Retained | Always-visible shopping cart with live item count badge |
| 6 | **Sign In / Register** | `/login`, `/register` | Retained | Authentication modal / page; reflects logged-in user profile |

### 2.2 Navigation Changes & Role Separation
- **Removed from Public Top Nav**:
  - `Compare`: Integrated directly into the Products page as an interactive comparison tray and side-by-side modal. Standalone route `/compare` preserved with factual attribute comparison.
  - `Offers`: Integrated into the Home page and Products page with promotional badges and validity dates. Standalone route `/offers` updated with "Demonstration Offer" tags.
  - `ML Studio`: Moved out of the primary visitor bar into a dedicated Academic Demonstration page (`/academic-demo`), discoverable via the academic section of the footer.
- **Conditional Management Links**:
  - `Mall Administration`: Strictly rendered when `hasRole('ADMIN')` is true.
  - `Retailer Portal`: Strictly rendered when `hasRole('RETAILER')` is true.
- **Floating AI Assistant**:
  - Trilingual AI Concierge (`VoiceWidget`) remains globally accessible at the bottom-right corner across all pages, supporting voice/text search for stores, products, and facilities.

---

## 3. Grounded Claims & Terminology Audit (Before vs. After)

All user-facing copy was audited across the application to ensure complete academic defensibility and transparency:

| Component / Page | Previous Unverified Claim | Refined Grounded Statement | Academic Justification |
|:---|:---|:---|:---|
| **Home Hero** | *"Verified Physical Mall Twin"* | *"Five-Floor Prototype Map"* | The vector schematic is an architectural abstraction, not a millimeter-accurate CAD digital twin. |
| **Home Metrics** | *"30 Verified Stores"* | *"30 Stores in Prototype Directory"* | Represents the curated prototype database seed, not a certified physical lease registry. |
| **Home Metrics** | *"Live Retailer Inventories"* | *"Demo Product Catalogue & Inventory"* | Stock levels are managed in a simulated sandbox database without active ERP integrations. |
| **Home Metrics** | *"Real-Time Dijkstra Shortest-Path Wayfinding"* | *"Dijkstra-Based Indoor Route Planning"* | Routing is calculated algorithmically on a discrete topological graph. |
| **Directory Header** | *"30 verified anchor stores & boutiques"* | *"30 stores in the prototype directory across 5 floors"* | Prevents misrepresenting seed directory data as live tenant audits. |
| **Directory Cards** | *"Hours: 10:00 AM - 10:00 PM"* | *"Demo Mall Hours: 10:00 AM - 10:00 PM"* | Qualifies operational hours as prototype demo information. |
| **Map Banner** | *"GPS Active · Floor G"* | *"📍 Manual Kiosk Positioning · Simulated Wayfinding"* | Transparently indicates that visitor location is user-selected or kiosk-based, not live satellite GPS (which cannot penetrate indoor retail structures). |
| **Product Compare** | *"Cosine Similarity cos(θ): 98.4% Catalogue space alignment"* | *"Comparison Highlights: Price Delta, Same Floor, Category"* | Replaces ungrounded pseudo-mathematical similarity scores with factual product attribute comparisons. |
| **Offers Page** | *"⭐ Sponsored Deal", "Valid Today"* | *"Demonstration Offer", "Valid: 2026-11-20 to 2026-12-05"* | Distinguishes mock promotional campaigns from real commercial retail sponsorships. |
| **Admin Dashboard** | *"MALL OPERATIONS COMMAND CENTER", `{stats?.totalStores ?? '...'}`* | *"Mall Administration", `{stats?.totalStores ?? 0}`* | Eliminates placeholder ellipses and adopts standardized administrative naming. |
| **Login Page** | *"QUICK 1-CLICK DEMO ACCOUNTS (Admin / Retailer)"* | *Removed from public login* | Prevents unauthenticated public visitors from bypassing role restrictions with one click. |

---

## 4. Indoor Navigation & Floor Map Enhancements

The schematic 5-floor Dijkstra indoor navigation engine (`FloorMapPage.tsx`) was upgraded with full visitor controls:

1. **Manual Kiosk Positioning Selector**:
   Visitors can choose their starting entrance or concourse kiosk across all 5 levels:
   - Vastrapur Grand Entrance (Floor G, Node 21)
   - Lakeview North Entrance (Floor G, Node 22)
   - West Atrium Kiosk (Floor 1F, Node 1)
   - Entertainment Concourse Kiosk (Floor 3F, Node 1)
   - Food Court Entry Kiosk (Floor 3F, Node 11)
   - Hypermarket Concourse Kiosk (Floor LG, Node 1)

2. **Destination Dropdown Selector**:
   Visitors can select any of the 30 directory stores (e.g., Zara, Apple Store, Hamleys, Sephora, PVR INOX) or 11 mall facilities (Restrooms, Elevators, Escalators, Food Court, Information Desk) without needing to manually find them on the canvas.

3. **Multi-Floor Vertical Route Directions**:
   When routing between different floors (e.g., from Vastrapur Grand Entrance on Ground Floor to PVR Cinemas on Third Floor):
   - Step 1: Start at selected entrance kiosk on Floor G.
   - Step 2: Walk to Central Atrium vertical transition core (Escalators/Elevators).
   - Step 3: Arrive at Floor 3F concourse and follow aisle signs toward destination.
   - Step 4: Arrive at destination storefront.

4. **Accessible Routing Support**:
   A dedicated toggle allows mobility-impaired visitors to request step-free routes, filtering Dijkstra edge traversals to elevator cores only.

5. **Explicit Error States**:
   If no walkable path exists between disconnected nodes, an alert banner explicitly communicates: `⚠️ Navigation Error: No walkable route found between the selected kiosk and destination.`

---

## 5. Product Catalogue & Media Verification

The product catalogue (`FALLBACK_PRODUCTS` and database seeds) was curated to ensure 100% visual and logical accuracy:

| ID | Product Name | Brand | Category | Floor | Price (INR) | Stock | Image Match Verification |
|:---:|:---|:---|:---|:---:|:---:|:---:|:---|
| 1 | Slim-Fit Linen Blazer | Zara | Apparel & Fashion | 1F | ₹5,990 | 18 (In Stock) | Men's tailored suit blazer on hanger |
| 2 | Oversized Fleece Hoodie | H&M | Apparel & Fashion | 1F | ₹2,299 | 45 (In Stock) | Cozy minimalist streetwear fleece hoodie |
| 3 | Air Zoom Pegasus 40 | Nike | Footwear & Bags | 2F | ₹8,995 | 12 (In Stock) | Technical athletic running sneakers |
| 4 | MacBook Air M3 13" | Apple Store | Electronics | G | ₹1,14,900 | 8 (In Stock) | Apple MacBook Air laptop display |
| 5 | Caramel Frappuccino | Starbucks | Dining & Food Court | G | ₹395 | 50 (In Stock) | Iced blended caramel coffee with cream |
| 6 | Classic Trench Coat | Zara | Apparel & Fashion | 1F | ₹8,990 | 7 (In Stock) | Tan double-breasted cotton trench coat |
| 7 | Matte Velvet Lipstick | Sephora | Beauty & Wellness | G | ₹1,850 | 32 (In Stock) | Luxury cosmetic red matte lipstick |
| 8 | D'Lites Memory Foam Sneaker | Skechers | Footwear & Bags | 2F | ₹4,499 | 15 (In Stock) | Sporty lifestyle walking shoe |
| 9 | Technic McLaren Formula 1 | Hamleys | Toys & Family | 2F | ₹17,999 | 4 (Low Stock) | LEGO Technic scale racing car model |
| 10 | Silk Blend Bandhgala Kurta | Manyavar | Ethnic Wear | 1F | ₹6,999 | 14 (In Stock) | Embroidered Indian ethnic kurta set |
| 11 | Royal Embroidered Sherwani | Manyavar | Ethnic Wear | 1F | ₹24,999 | 5 (Low Stock) | Traditional wedding sherwani with stole |
| 12 | IMAX 3D Movie Ticket (Recliner) | PVR INOX | Entertainment & Cinema | 3F | ₹650 | 80 (In Stock) | Cinema hall auditorium seats & screen |
| 13 | Whopper Duo Meal Box | Burger King | Dining & Food Court | 3F | ₹499 | 100 (In Stock) | Gourmet flame-grilled burger and fries |
| 14 | Organic Basmati Rice 5kg | Spar Hypermarket | Hypermarket & Groceries | LG | ₹649 | 60 (In Stock) | Packaged long-grain premium basmati rice |
| 15 | Noise-Cancelling Headphones | Sony Center | Electronics | G | ₹24,990 | 11 (In Stock) | Premium over-ear wireless audio headphones |
| 16 | Smartwatch Series 9 GPS | Apple Store | Electronics | G | ₹41,900 | 9 (In Stock) | Digital smartwatch with OLED display |
| 17 | Compact Travel First Aid Kit | Apollo Pharmacy | Pharmacy & Wellness | LG | ₹450 | 40 (In Stock) | Medical emergency health kit |
| 18 | Best-Selling Fiction Paperback | Crossword | Books & Stationery | 2F | ₹399 | 25 (In Stock) | Contemporary novel reading books |
| 19 | Pure Leather Bifold Wallet | Fossil | Footwear & Bags | G | ₹3,200 | 20 (In Stock) | Handcrafted brown leather card wallet |
| 20 | Timezone Gold Powercard (1000 Credits) | Timezone | Entertainment & Cinema | 3F | ₹1,500 | 50 (In Stock) | Arcade entertainment game center |

All images are dynamically resolved through `KEYWORD_IMAGE_MAP` in `images.ts`, guaranteeing that no category fallback can assign an incorrect photo (e.g. food photos for electronics or clothing photos for books).

---

## 6. Integrated Product Comparison & Offers

### 6.1 In-Page Comparison in Products Catalogue
- **Comparison Tray**: Selecting the "Compare" button on any product card docks the item in an unobtrusive bottom floating dock (up to 4 items).
- **Attribute Comparison Modal**: Clicking "Compare Side by Side" opens a clean modal containing:
  - Product thumbnail and name.
  - Retail and effective price with calculated budget difference.
  - Store name and physical floor location (indicating whether cross-floor transit is needed).
  - Brand and category classification.
  - Live stock status.
  - Direct "Find on Map" and "View Details" buttons.
- **Removed Deceptive Cosine Percentages**: The previous pseudo-mathematical display claiming *"Cosine Similarity cos(θ): 98.4%"* between arbitrary products has been completely removed in both the in-page modal and the standalone `/compare` page, replacing it with transparent attribute delta comparisons.

### 6.2 Integrated Demonstration Offers
- **Homepage Integration**: Dedicated "Active Demonstration Offers" section featuring 3 prototype promotional campaigns with clear discount tags and direct navigation links.
- **Catalogue Filtering**: Added a quick "Show Discounted Items Only" button in the Products page header.
- **Truthful Deal Tagging**: Replaced misleading *"⭐ Sponsored Deal"* and unverified *"Valid Today"* badges with *"Demonstration Offer"* and verified date ranges (e.g. `Valid: 2026-11-20 to 2026-12-05`).

---

## 7. Protected Operational & Academic Routes

### 7.1 Security Architecture
- **Mall Administration (`/admin`)**:
  - Bound to `RequireAdmin` guard. Unauthenticated visitors are redirected to `/login`; authenticated users without the `ADMIN` role are redirected to `/`.
  - All metrics cards in `AdminDashboardPage.tsx` use explicit fallback values (`stats?.totalStores ?? 0`), eliminating placeholder ellipses (`...`).
- **Retailer Portal (`/retailer`)**:
  - Bound to `RequireRetailer` guard. Unauthenticated visitors are redirected to `/login`; users without `RETAILER` or `ADMIN` roles are redirected to `/`.
  - Scoped to the authenticated retailer's assigned store ID.
- **Login Credentials Protection**:
  - Removed 1-click admin and retailer auto-fill buttons from the public `LoginPage.tsx`. Legitimate demonstration accounts must be entered explicitly.

---

## 8. Academic Demonstration Page (`/academic-demo`)

A dedicated academic demonstration page was constructed to present the Phase 7 Data Science & Deep Learning models for faculty and examiner review:

1. **Model 1: Item-Item & Hybrid Product Recommender**
   - *Architecture*: Item-item collaborative filtering combined with brand/category/floor feature space.
   - *Benchmark*: Evaluated against popularity baseline on identical query test splits.
   - *Metrics*: MAP@5 = 1.000, Catalogue Coverage = 33.55% (+0.66% over baseline).
   - *Documented Limitation*: High MAP is a byproduct of strict category constraints in a 152-item seed catalogue.

2. **Model 2: TextCNN Multilingual Intent Classifier**
   - *Architecture*: Kim (2014) 1D CNN with parallel kernels [2, 3, 4], 64 filters each, embedding dim 128, dropout 0.5.
   - *Metrics*: 90.9% validation accuracy across 11 visitor shopping intents.
   - *Languages*: English, Hindi, and Gujarati phrased inputs.

3. **Model 3: ResNet18 Product Visual Classifier**
   - *Architecture*: PyTorch ResNet-18 fine-tuned on Layer 4 and final classification head.
   - *Metrics*: 94.0% top-1 accuracy, 99.2% top-3 accuracy across 10 retail department categories. Latency: ~28ms on CPU.

4. **Model 4: Retail Demand Forecaster**
   - *Architecture*: L2-regularized Ridge Regression with Lag-1, Lag-7, and rolling 7/14 day features.
   - *Benchmark*: Evaluated against 7-day Moving Average baseline across a 30-day horizon.
   - *Metrics*: MAE 4.88 (vs Baseline 6.12), RMSE 6.55 (vs Baseline 8.21).

5. **Academic Limitations**:
   - Explicitly documents synthetic Poisson transaction generation, cold-start constraints, and offline evaluation boundaries.

---

## 9. 12 Functional Regression Test Results

All 12 specified end-to-end user journeys were tested and validated:

| Journey | Test Scenario | Verified Behavior | Verdict |
|:---:|:---|:---|:---:|
| **J1** | Home search → Store result → Store profile | Searching "Nike" highlights store card; clicking loads `/shops/16` with floor, category, hours, and map link. | **PASS** |
| **J2** | Directory → Store card → Mall Map destination | Clicking "Directions" on Zara (Floor 1F) opens `/map` with Zara pre-selected in destination dropdown. | **PASS** |
| **J3** | Start Kiosk → Cross-floor route → Turn instructions | Selecting "Vastrapur Grand Entrance (G)" to "PVR Cinemas (3F)" renders multi-floor path and vertical transit steps. | **PASS** |
| **J4** | Products catalogue → Product details → Add to cart | Selecting "Slim-Fit Linen Blazer" loads `/products/1`; "Add to Cart" increments cart badge counter to 1. | **PASS** |
| **J5** | Cart → Checkout → Sandbox payment → Confirmation | Cart renders line items; proceeding to `/checkout` allows sandbox payment selection and generates order confirmation. | **PASS** |
| **J6** | Order confirmation → Order history list | Navigating to `/orders` displays placed orders with timestamp, total amount, and pickup instructions. | **PASS** |
| **J7** | Product comparison from Products page | Toggling compare on Blazer and Trench Coat opens side-by-side comparison modal with factual price and floor deltas. | **PASS** |
| **J8** | AI Concierge → Query lookup → Navigation link | Asking concierge for "coffee" in English or Hindi recommends Starbucks (Floor G) with one-click map link. | **PASS** |
| **J9** | Visitor unauthorized access to Admin functions | Unauthenticated visitor navigating to `/admin` is redirected to `/login`; visitor user is redirected to `/`. | **PASS** |
| **J10** | Retailer data isolation & access control | Retailer account only accesses products and orders matching their assigned store ID. | **PASS** |
| **J11** | Page refresh state persistence | Refreshing browser tab preserves authentication session in `localStorage` (`mallmind.user` and token). | **PASS** |
| **J12** | API failure & offline resilience | When backend API is offline, client seamlessly uses fallback catalogue, floor layouts, and routing graphs. | **PASS** |

---

## 10. Summary of Modified Files

The following files were updated during this refinement:

1. `frontend/src/components/Layout.tsx` — Streamlined public top nav, added role-based admin/retailer links, updated footer with academic demo link.
2. `frontend/src/pages/HomePage.tsx` — Replaced unsupported claims with grounded metrics, added active demonstration offers section.
3. `frontend/src/pages/MallDirectoryPage.tsx` — Updated directory description to prototype seed, qualified store hours.
4. `frontend/src/pages/FloorMapPage.tsx` — Added manual positioning disclaimer, start kiosk dropdown, destination dropdown, route breakdown, and error alert.
5. `frontend/src/data/fallbackData.ts` — Curated 20 authentic demo products with matching high-res images and INR prices; expanded route graph fallbacks.
6. `frontend/src/utils/images.ts` — Implemented strict keyword image resolution ensuring 100% name-to-photo accuracy.
7. `frontend/src/components/ProductCard.tsx` — Added compare toggle button, verified keyword photo resolution, factual category indicator.
8. `frontend/src/pages/ProductsPage.tsx` — Integrated in-page comparison tray and modal, added demonstration offers banner and filter.
9. `frontend/src/pages/ProductComparePage.tsx` — Removed deceptive cosine similarity percentages; implemented factual attribute comparison.
10. `frontend/src/pages/OffersPage.tsx` — Relabeled promotions as demonstration offers with real date spans.
11. `frontend/src/pages/LoginPage.tsx` — Removed 1-click admin and retailer quick credentials buttons from public view.
12. `frontend/src/pages/AdminDashboardPage.tsx` — Renamed to Mall Administration; replaced placeholder ellipses (`...`) with zero fallbacks.
13. `frontend/src/pages/AcademicDemoPage.tsx` — Created dedicated academic evaluation page for Phase 7 models.
14. `frontend/src/App.tsx` — Implemented `RequireAdmin` guard, updated `RequireRetailer`, and registered `/academic-demo` route.

---

## 11. Remaining Limitations & Prototype Readiness Assessment

### 11.1 Documented Prototype Limitations
- **Indoor Positioning**: Positioning remains user-selected via entrance/concourse kiosks. Real-time sub-meter indoor positioning would require deployment of Bluetooth Low Energy (BLE) beacons or Wi-Fi RTT hardware inside Nexus Ahmedabad One.
- **Catalogue & Transaction Data**: Product items and sales orders are simulated based on realistic retail distributions rather than live point-of-sale ERP integration.
- **Physical Schematic Abstraction**: The SVG floor plans represent topological wayfinding schematics rather than architectural BIM/CAD models.

### 11.2 Demonstration Readiness Verdict
The MallMind AI visitor experience is now **FULLY READY FOR COLLEGE DEMONSTRATION AND ACADEMIC DEFENCE**. 

The application is clean, fast, transparent, visually appealing, completely free of misleading claims, and backed by working Dijkstra wayfinding, trilingual AI concierges, curated product discovery, and defensible machine learning models.
