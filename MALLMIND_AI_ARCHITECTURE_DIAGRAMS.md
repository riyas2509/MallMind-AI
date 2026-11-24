# MallMind AI — Phase 9D: System Architecture & Technical Diagrams

**Target Venue:** Nexus Ahmedabad One (Alpha One Mall), Vastrapur, Ahmedabad, Gujarat, India  
**Document Purpose:** Complete Technical Specification & Visual Architecture Reference  
**Diagram Format:** GitHub-Flavored Mermaid Diagrams  
**Document Version:** 1.0 (Phase 9 Academic Deliverable)  

---

## Table of Contents
1. [Overall 4-Tier System Architecture](#1-overall-4-tier-system-architecture)
2. [Microservice Communication & Data Flow](#2-microservice-communication--data-flow)
3. [Relational Database Entity-Relationship Diagram (ERD)](#3-relational-database-entity-relationship-diagram-erd)
4. [Customer Shopping & Navigation Use Case Diagram](#4-customer-shopping--navigation-use-case-diagram)
5. [Retailer Store Operations Use Case Diagram](#5-retailer-store-operations-use-case-diagram)
6. [Mall Administrator Operations Use Case Diagram](#6-mall-administrator-operations-use-case-diagram)
7. [Smart Shopping Cart & E-Commerce Activity Flow](#7-smart-shopping-cart--e-commerce-activity-flow)
8. [End-to-End Checkout & Transaction Sequence Diagram](#8-end-to-end-checkout--transaction-sequence-diagram)
9. [Multilingual Voice Concierge Processing Pipeline](#9-multilingual-voice-concierge-processing-pipeline)
10. [RAG Engine & Query Routing Decision Tree](#10-rag-engine--query-routing-decision-tree)
11. [Product Recommendation Engine Pipeline (TF-IDF)](#11-product-recommendation-engine-pipeline-tf-idf)
12. [Footfall & Demand Forecasting Pipeline (Random Forest)](#12-footfall--demand-forecasting-pipeline-random-forest)
13. [Deep Learning Intent Classification Architecture (TextCNN)](#13-deep-learning-intent-classification-architecture-textcnn)
14. [Deep Learning Visual Search Architecture (ResNet18)](#14-deep-learning-visual-search-architecture-resnet18)
15. [Multi-Floor Indoor Navigation & Dijkstra Topological Routing](#15-multi-floor-indoor-navigation--dijkstra-topological-routing)

---

## 1. Overall 4-Tier System Architecture

```mermaid
graph TD
    subgraph Presentation_Layer["Presentation Layer (Client Browser)"]
        UI["React 19 SPA (Vite :5173)"]
        DT["2D Schematic Digital Twin (SVG)"]
        VoiceUI["Audio Recorder & Speech UI"]
        CartUI["E-Commerce & Checkout Storefront"]
        AdminUI["Admin & Retailer Portals"]
    end

    subgraph Gateway_Proxy["Reverse Proxy & Gateway"]
        ViteProxy["Vite Dev Server Proxy"]
    end

    subgraph Application_Backend["Enterprise Backend Tier (Port 8085)"]
        SB["Spring Boot 3.2+ Core Engine"]
        Sec["Spring Security & JWT Filter"]
        StoreCtrl["Store & Digital Twin Controller"]
        OrderCtrl["Order & Checkout Controller"]
        InvSvc["Inventory & Ledger Service"]
        NavSvc["Dijkstra Graph Router"]
        AuditSvc["Immutable Audit Logger"]
    end

    subgraph AI_Model_Tier["AI & Machine Learning Microservice (Port 8001)"]
        FA["FastAPI Asynchronous Gateway"]
        WhisperASR["Faster-Whisper Multilingual ASR"]
        TextCNN["PyTorch TextCNN Intent Classifier"]
        RAG["Rule-Based & Semantic RAG Engine"]
        ResNet["Torchvision ResNet18 Visual Embedder"]
        RFDemand["Scikit-Learn Random Forest Demand Model"]
        TFIDF["TF-IDF Cosine Product Recommender"]
    end

    subgraph Data_Tier["Relational Persistence Tier (PostgreSQL 16 :5433)"]
        PG[(PostgreSQL 16 Engine)]
        CoreTables["Stores, Floors, Nodes, Edges"]
        CommerceTables["Products, Carts, Orders, Payments"]
        LedgerTables["Inventory Ledgers, Audit Logs"]
        DemandTables["Historical Footfall & Demand Series"]
    end

    UI --> ViteProxy
    ViteProxy -- "/api/*" --> Sec
    ViteProxy -- "/ai/*" --> FA

    Sec --> StoreCtrl
    Sec --> OrderCtrl
    Sec --> InvSvc
    Sec --> NavSvc
    Sec --> AuditSvc

    StoreCtrl --> CoreTables
    OrderCtrl --> CommerceTables
    InvSvc --> CommerceTables
    InvSvc --> LedgerTables
    NavSvc --> CoreTables
    AuditSvc --> LedgerTables

    FA --> WhisperASR
    FA --> TextCNN
    FA --> RAG
    FA --> ResNet
    FA --> RFDemand
    FA --> TFIDF

    RFDemand --> DemandTables
    TFIDF --> CommerceTables
```

---

## 2. Microservice Communication & Data Flow

```mermaid
sequenceDiagram
    autonumber
    participant Client as React Client (:5173)
    participant Spring as Spring Boot (:8085)
    participant FastAPI as FastAPI AI (:8001)
    participant Postgres as PostgreSQL (:5433)

    Note over Client, FastAPI: 1. Multilingual Voice Query Flow
    Client->>FastAPI: POST /ai/voice/transcribe (Audio Blob)
    FastAPI->>FastAPI: Faster-Whisper ASR (Gujarati/Hindi/English)
    FastAPI-->>Client: { transcript, language, confidence }

    Client->>FastAPI: POST /ai/rag/query { text: transcript }
    FastAPI->>FastAPI: TextCNN Intent + RAG Search
    FastAPI-->>Client: { intent, entities, answer, stores, products }

    Note over Client, Spring: 2. Store Wayfinding & Navigation Flow
    Client->>Spring: GET /api/navigation/route?from=101&to=305
    Spring->>Postgres: SELECT * FROM nodes, edges WHERE floor IN (1,3)
    Postgres-->>Spring: Graph Topology
    Spring->>Spring: Dijkstra Shortest Path across Escalators
    Spring-->>Client: 200 OK { path, totalDistanceMeters, floorChanges }

    Note over Client, Postgres: 3. E-Commerce Checkout Flow
    Client->>Spring: POST /api/orders/checkout (JWT Auth)
    Spring->>Postgres: BEGIN TRANSACTION
    Spring->>Postgres: SELECT stock FROM products FOR UPDATE
    Spring->>Postgres: INSERT INTO orders, order_items, inventory_ledger
    Spring->>Postgres: COMMIT TRANSACTION
    Spring-->>Client: 201 Created { orderId, status: "PAID", tax: 18% }
```

---

## 3. Relational Database Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ AUDIT_LOGS : performs
    STORES ||--o{ PRODUCTS : sells
    STORES ||--o{ STORE_MANAGERS : managed_by
    STORES ||--o{ NODES : located_at
    FLOORS ||--o{ STORES : houses
    FLOORS ||--o{ NODES : contains
    NODES ||--o{ EDGES : connects_from
    NODES ||--o{ EDGES : connects_to
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : ordered_in
    PRODUCTS ||--o{ INVENTORY_LEDGER : tracks
    ORDERS ||--|| PAYMENTS : settled_by
    STORES ||--o{ DEMAND_RECORDS : predicts

    USERS {
        bigint id PK
        varchar email UK
        varchar password_hash
        varchar full_name
        varchar role "CUSTOMER, RETAILER, ADMIN"
        timestamp created_at
    }

    STORES {
        bigint id PK
        varchar name
        varchar category
        int floor_number
        varchar unit_number
        varchar contact_phone
        boolean is_active
    }

    FLOORS {
        int floor_number PK
        varchar name "LG, G, 1, 2, 3, 4"
        decimal scale_factor
        varchar map_asset_path
    }

    NODES {
        bigint id PK
        int floor_number FK
        decimal x_coord
        decimal y_coord
        varchar node_type "STORE, CORRIDOR, ESCALATOR, LIFT"
        bigint store_id FK
    }

    EDGES {
        bigint id PK
        bigint from_node_id FK
        bigint to_node_id FK
        decimal weight_distance
        boolean is_accessible
    }

    PRODUCTS {
        bigint id PK
        bigint store_id FK
        varchar name
        varchar brand
        varchar category
        decimal price
        int stock_quantity
        varchar image_url
        boolean is_active
    }

    ORDERS {
        bigint id PK
        bigint user_id FK
        decimal subtotal
        decimal tax_amount "18% GST"
        decimal total_amount
        varchar fulfillment_type "PICKUP, DELIVERY"
        varchar status "PENDING, PAID, PROCESSING, COMPLETED"
        timestamp created_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        int quantity
        decimal unit_price
        decimal total_price
    }

    PAYMENTS {
        bigint id PK
        bigint order_id FK
        varchar payment_method "SANDBOX_CARD, UPI, CASH"
        varchar transaction_ref
        decimal amount
        varchar payment_status "SUCCESS, FAILED"
        timestamp paid_at
    }

    INVENTORY_LEDGER {
        bigint id PK
        bigint product_id FK
        int delta_quantity
        int balance_after
        varchar reason "CHECKOUT, RESTOCK, ADJUSTMENT"
        timestamp recorded_at
    }

    AUDIT_LOGS {
        bigint id PK
        bigint actor_user_id FK
        varchar action_type
        varchar entity_name
        varchar entity_id
        varchar ip_address
        text metadata_json
        timestamp created_at
    }

    DEMAND_RECORDS {
        bigint id PK
        bigint store_id FK
        date record_date
        int footfall_count
        decimal daily_revenue
        decimal temperature
        boolean is_weekend
        boolean is_holiday
    }
```

---

## 4. Customer Shopping & Navigation Use Case Diagram

```mermaid
flowchart LR
    Customer((Mall Shopper))

    subgraph MallMind_Customer_Portal["MallMind Customer Capabilities"]
        UC1["Explore 5-Floor Digital Twin"]
        UC2["Search Products by Brand & Budget"]
        UC3["Voice Query in Gujarati/Hindi/English"]
        UC4["Calculate Shortest Path to Store"]
        UC5["View AI Product Recommendations"]
        UC6["Add Products to Shopping Cart"]
        UC7["Select Pickup or Mall Delivery"]
        UC8["Complete Sandbox Payment"]
        UC9["Track Live Order Status"]
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC8
    Customer --> UC9
```

---

## 5. Retailer Store Operations Use Case Diagram

```mermaid
flowchart LR
    Retailer((Store Manager))

    subgraph MallMind_Retailer_Portal["Retailer Operations Capabilities"]
        UC_R1["Authenticate with Store Credentials"]
        UC_R2["Manage Store Product Catalog"]
        UC_R3["Upload Product Image for ResNet18 AI Categorization"]
        UC_R4["Adjust Stock Levels with Reason Logging"]
        UC_R5["View Real-Time Inventory Ledger"]
        UC_R6["View Incoming Customer Store Orders"]
        UC_R7["Update Order Status (Processing / Ready)"]
    end

    Retailer --> UC_R1
    Retailer --> UC_R2
    Retailer --> UC_R3
    Retailer --> UC_R4
    Retailer --> UC_R5
    Retailer --> UC_R6
    Retailer --> UC_R7
```

---

## 6. Mall Administrator Operations Use Case Diagram

```mermaid
flowchart LR
    Admin((Mall Administrator))

    subgraph MallMind_Admin_Portal["Mall Management Capabilities"]
        UC_A1["Admin Authentication & Role Gate"]
        UC_A2["Monitor Mall-Wide Footfall & Revenue"]
        UC_A3["Run Random Forest Footfall Demand Forecast"]
        UC_A4["Configure Store Leases & Unit Assignments"]
        UC_A5["Inspect Immutable System Audit Trails"]
        UC_A6["Simulate Concurrent Checkout Peak Load"]
        UC_A7["Review Security & RBAC Logs"]
    end

    Admin --> UC_A1
    Admin --> UC_A2
    Admin --> UC_A3
    Admin --> UC_A4
    Admin --> UC_A5
    Admin --> UC_A6
    Admin --> UC_A7
```

---

## 7. Smart Shopping Cart & E-Commerce Activity Flow

```mermaid
flowchart TD
    Start([User Browses Catalogue]) --> Search[Search by Brand / Category / Price]
    Search --> SelectProd[Select Product Item]
    SelectProd --> CheckStock{Stock > 0?}

    CheckStock -- No --> ShowOutOfStock[Display 'Out of Stock' Badge]
    ShowOutOfStock --> Alt[Show Similar Category Alternatives]

    CheckStock -- Yes --> AddCart[Add to Shopping Cart]
    AddCart --> ViewCart[Open Cart Drawer]
    ViewCart --> ModQty[Modify Quantity or Apply Coupon]
    ModQty --> CalcTax[Compute Subtotal + 18% GST]
    CalcTax --> SelectDelivery{Choose Delivery Mode}

    SelectDelivery -- Click & Collect --> PickStore[Assign Pickup Counter at Store]
    SelectDelivery -- Home Delivery --> InputAddress[Collect Shipping Address]

    PickStore --> CheckoutBtn[Click Proceed to Checkout]
    InputAddress --> CheckoutBtn
    CheckoutBtn --> AuthCheck{User Authenticated?}

    AuthCheck -- No --> AuthPrompt[Show Modal Login / Registration]
    AuthPrompt --> AuthCheck
    AuthCheck -- Yes --> Transact[Trigger Secure Checkout API]
    Transact --> End([Order Confirmed & Route Generated])
```

---

## 8. End-to-End Checkout & Transaction Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant React as React Frontend
    participant Auth as Spring Security Filter
    participant CheckoutSvc as CheckoutService
    participant InvSvc as InventoryService
    participant DB as PostgreSQL 16
    participant Payment as Sandbox Payment Gateway

    Customer->>React: Click "Pay Now" (₹2,360)
    React->>Auth: POST /api/orders/checkout (Bearer JWT)
    Auth->>Auth: Validate JWT Signature & Claims
    Auth->>CheckoutSvc: Authorize(CUSTOMER_ROLE)

    activate CheckoutSvc
    CheckoutSvc->>DB: BEGIN TRANSACTION (SERIALIZABLE/REPEATABLE READ)

    CheckoutSvc->>InvSvc: verifyAndDeductStock(cartItems)
    activate InvSvc
    loop For each item in cart
        InvSvc->>DB: SELECT stock_quantity FROM products WHERE id=? FOR UPDATE
        alt Stock Available
            InvSvc->>DB: UPDATE products SET stock_quantity = stock_quantity - ? WHERE id=?
            InvSvc->>DB: INSERT INTO inventory_ledger (product_id, delta, balance, reason)
        else Stock Insufficient
            InvSvc-->>CheckoutSvc: Throw InsufficientStockException
            CheckoutSvc->>DB: ROLLBACK TRANSACTION
            CheckoutSvc-->>React: 409 Conflict "Item out of stock"
        end
    end
    deactivate InvSvc

    CheckoutSvc->>Payment: Process Sandbox Payment (₹2,360)
    Payment-->>CheckoutSvc: Payment APPROVED (TxnRef: MPT-92812)

    CheckoutSvc->>DB: INSERT INTO orders (user_id, subtotal, tax_18, total, status)
    CheckoutSvc->>DB: INSERT INTO order_items (...)
    CheckoutSvc->>DB: INSERT INTO payments (order_id, txn_ref, status)
    CheckoutSvc->>DB: INSERT INTO audit_logs (action: ORDER_CREATED)
    CheckoutSvc->>DB: COMMIT TRANSACTION
    deactivate CheckoutSvc

    CheckoutSvc-->>React: 201 Created { orderId: 1042, status: "PAID" }
    React-->>Customer: Display Success Confirmation & Receipt
```

---

## 9. Multilingual Voice Concierge Processing Pipeline

```mermaid
flowchart TD
    UserVoice([User Speaks Query]) --> AudioCapture[MediaRecorder Audio Capture (16kHz WAV)]
    AudioCapture --> Base64[Base64 Encoding / Multipart Upload]
    Base64 --> FastAPIGateway[FastAPI /voice/transcribe Endpoint]

    subgraph ASR_Pipeline["Faster-Whisper Inference Engine"]
        FastAPIGateway --> CTranslate[CTranslate2 Model Loader]
        CTranslate --> AudioPre[Spectrogram & Mel-Filterbank]
        AudioPre --> LangDetect{Detect Language}
        LangDetect -- Gujarati (gu) --> GuModel[Decode Gujarati Syllabary]
        LangDetect -- Hindi (hi) --> HiModel[Decode Devanagari Script]
        LangDetect -- English (en) --> EnModel[Decode English Phonemes]
    end

    GuModel --> Normalizer[Text Normalization & Script Transliteration]
    HiModel --> Normalizer
    EnModel --> Normalizer

    Normalizer --> IntentRouter[Route to Query Understanding Pipeline]
    IntentRouter --> TextCNNClass[TextCNN Deep Learning Classifier]
    IntentRouter --> RuleMatcher[Deterministic Keyword / Brand Filter]

    TextCNNClass --> ConfidenceCheck{Confidence >= 0.70?}
    ConfidenceCheck -- Yes --> FinalIntent[Execute Predicted Intent]
    ConfidenceCheck -- No --> RuleMatcher
    RuleMatcher --> FinalIntent

    FinalIntent --> ResponseGen[Generate Multilingual Response]
    ResponseGen --> TTSOutput[Pyttsx3 / Browser Speech Synthesis Audio]
    TTSOutput --> UserEar([Customer Hears Response & Sees Map Route])
```

---

## 10. RAG Engine & Query Routing Decision Tree

```mermaid
flowchart TD
    QueryIn([User Query String]) --> EntityExtract[Entity Extractor: Brands, Categories, Floor, Budget]

    EntityExtract --> BrandCheck{Explicit Brand Mentioned?}
    BrandCheck -- Yes --> ExactBrandFilter[Apply Hard Brand Filter e.g. brand='Nike']
    BrandCheck -- No --> SemanticCheck[Semantic Matching across Categories]

    ExactBrandFilter --> BudgetCheck{Budget Mentioned?}
    BudgetCheck -- Yes --> PriceFilter[Apply Max Price Filter: price <= budget]
    BudgetCheck -- No --> ExecuteSearch[Query Product Database]

    PriceFilter --> ExecuteSearch
    SemanticCheck --> BudgetCheck

    ExecuteSearch --> MatchCount{Matching Count?}
    MatchCount -- Count > 0 --> ReturnDirect[Return Exact Matching Items]
    MatchCount -- Count == 0 --> BrandRelaxCheck{Was Brand Explicit?}

    BrandRelaxCheck -- Yes (Explicit) --> ZeroSubstitute[Return 'No Items Found for Brand' + Alternative Flag]
    BrandRelaxCheck -- No (Generic) --> CategoryFallback[Return Related Category Recommendations]

    ZeroSubstitute --> FormatPayload[Construct Unified RAG Payload]
    ReturnDirect --> FormatPayload
    CategoryFallback --> FormatPayload

    FormatPayload --> SendClient([Send JSON to React Frontend])
```

---

## 11. Product Recommendation Engine Pipeline (TF-IDF)

```mermaid
flowchart LR
    subgraph Data_Preparation["Catalog Feature Ingestion"]
        DB[(PostgreSQL Products)] --> Fields["Extract: name, brand, category, description, tags"]
        Fields --> Clean["Text Lowercase, Stopword Removal, Stemming"]
    end

    subgraph Feature_Extraction["Vector Space Representation"]
        Clean --> TFIDF["TfidfVectorizer (Max Features=5000, N-gram=(1,2))"]
        TFIDF --> TermMatrix["Sparse TF-IDF Matrix (152 items x D dimensions)"]
    end

    subgraph Similarity_Engine["Inference & Scoring"]
        UserTarget["Active Target Product ID"] --> TargetVec["Lookup Vector V_target"]
        TargetVec --> CosineSim["Cosine Similarity: cos(θ) = (A · B) / (||A|| ||B||)"]
        TermMatrix --> CosineSim
        CosineSim --> Rank["Sort by Similarity Score Descending"]
        Rank --> TopK["Filter out Target itself; Select Top-K (K=5)"]
    end

    TopK --> Recommendations([Recommended Product Cards in Frontend])
```

---

## 12. Footfall & Demand Forecasting Pipeline (Random Forest)

```mermaid
flowchart TD
    subgraph Historical_Features["Historical Data Ingestion"]
        Calendar["Calendar: Day of Week, Month, Day of Month"]
        Holidays["Gujarat / Ahmedabad Public Holiday Flags"]
        Weather["Environmental: Temperature, Precipitation, AQI"]
        LagSales["Autoregressive Lags: Footfall (t-1), Footfall (t-7)"]
        Promo["Mall Promotions & Festival Sale Flags"]
    end

    Calendar --> Preprocessor[Feature Engineering & RobustScaler Pipeline]
    Holidays --> Preprocessor
    Weather --> Preprocessor
    LagSales --> Preprocessor
    Promo --> Preprocessor

    subgraph Ensemble_Model["Random Forest Regressor (100 Trees)"]
        Preprocessor --> Tree1[Decision Tree 1]
        Preprocessor --> Tree2[Decision Tree 2]
        Preprocessor --> TreeN[Decision Tree 100]

        Tree1 --> EnsembleAvg[Aggregate Average Prediction]
        Tree2 --> EnsembleAvg
        TreeN --> EnsembleAvg
    end

    EnsembleAvg --> OutputKPIs["Forecasted Daily Visitors & Store Demand"]
    OutputKPIs --> AdminChart[Mall Operations Executive Dashboard Visualization]
```

---

## 13. Deep Learning Intent Classification Architecture (TextCNN)

```mermaid
flowchart TD
    RawQuery["Input User Query: 'Where can I find Adidas shoes?'"] --> Tokenizer["Whitespace & Punctuation Tokenizer"]
    Tokenizer --> VocabLookup["Vocabulary Integer Mapping (Vocab Size: 1,842)"]
    VocabLookup --> PadSeq["Fixed Length Padding (Sequence Length L = 32)"]

    subgraph PyTorch_TextCNN["PyTorch TextCNN 1D Architecture"]
        PadSeq --> EmbedLayer["Embedding Layer (Dim = 128) -> Tensor (32, 128)"]

        EmbedLayer --> Conv3["Conv1D (Kernel=3, Filters=64)"]
        EmbedLayer --> Conv4["Conv1D (Kernel=4, Filters=64)"]
        EmbedLayer --> Conv5["Conv1D (Kernel=5, Filters=64)"]

        Conv3 --> ReLU3["ReLU + 1D Max-Over-Time Pooling -> (64,)"]
        Conv4 --> ReLU4["ReLU + 1D Max-Over-Time Pooling -> (64,)"]
        Conv5 --> ReLU5["ReLU + 1D Max-Over-Time Pooling -> (64,)"]

        ReLU3 --> Concat["Concatenation Layer -> Feature Vector (192,)"]
        ReLU4 --> Concat
        ReLU5 --> Concat

        Concat --> Dropout["Dropout Layer (p = 0.5)"]
        Dropout --> FC["Fully Connected Linear Layer (192 -> 9)"]
        FC --> Softmax["Softmax Activation Function"]
    end

    Softmax --> ProbDist["Probability Distribution across 9 Intent Classes"]
    ProbDist --> ArgMax["ArgMax -> Predicted Class (e.g. FIND_STORE, NAVIGATE, SEARCH_PRODUCT)"]
```

---

## 14. Deep Learning Visual Search Architecture (ResNet18)

```mermaid
flowchart LR
    subgraph Input_Transform["Image Preprocessing Pipeline"]
        Upload[Retailer / Customer Uploaded Image] --> Resize[Resize 256x256]
        Resize --> CenterCrop[Center Crop 224x224]
        CenterCrop --> ToTensor[Convert to Tensor]
        ToTensor --> Normalize["Normalize (Mean=[0.485, 0.456, 0.406], Std=[0.229, 0.224, 0.225])"]
    end

    subgraph ResNet18_Backbone["Pre-trained ResNet18 Feature Extractor"]
        Normalize --> Conv7x7["Conv 7x7, 64, Stride 2"]
        Conv7x7 --> ResBlock1["4x Residual Blocks (Layer 1 - 64-dim)"]
        ResBlock1 --> ResBlock2["4x Residual Blocks (Layer 2 - 128-dim)"]
        ResBlock2 --> ResBlock3["4x Residual Blocks (Layer 3 - 256-dim)"]
        ResBlock3 --> ResBlock4["4x Residual Blocks (Layer 4 - 512-dim)"]
        ResBlock4 --> AvgPool["Adaptive Average Pooling (1x1)"]
        AvgPool --> Flatten["Flatten -> 512-Dimensional Dense Vector"]
    end

    subgraph Category_Classifier["Category Assignment"]
        Flatten --> LinearClass["Linear Projection Head (512 -> 8 Mall Retail Categories)"]
        LinearClass --> CategoryPred["Predicted Category: 'Footwear' (Confidence: 89.4%)"]
    end
```

---

## 15. Multi-Floor Indoor Navigation & Dijkstra Topological Routing

```mermaid
flowchart TD
    subgraph Navigation_Request["Routing Input"]
        StartNode["Start Location: Store 105 (Ground Floor)"]
        DestNode["Destination: Cinepolis Cinema (Third Floor)"]
    end

    subgraph Graph_Model["Topological Indoor Graph G = (V, E)"]
        V["Vertices (V): 120 Stores, 45 Corridors, 8 Escalators, 4 Lifts"]
        E["Edges (E): Euclidean Distance Weights (0.25m / unit scale)"]
        Weights["Inter-floor Penalty: Escalator (+30s), Elevator (+60s wait)"]
    end

    StartNode --> DijkstraEngine["Dijkstra Shortest Path Search Engine"]
    DestNode --> DijkstraEngine
    V --> DijkstraEngine
    E --> DijkstraEngine
    Weights --> DijkstraEngine

    subgraph Search_Execution["Graph Traversal Steps"]
        DijkstraEngine --> Step1["1. Local Traversal on Ground Floor (Store 105 -> Escalator E1_GF)"]
        Step1 --> Step2["2. Inter-floor Vertical Transition (GF -> Floor 1 -> Floor 2 -> Floor 3)"]
        Step2 --> Step3["3. Destination Arrival on Third Floor (Escalator E1_3F -> Cinepolis)"]
    end

    Step3 --> TurnByTurn["Turn-by-Turn Instruction Generator"]
    TurnByTurn --> SVGVisualizer["React SVG Digital Twin Path Highlighter"]
    SVGVisualizer --> CustomerScreen([Interactive Route Shown with Animated Dash Lines])
```

---
*End of Technical Architecture Specification.*
