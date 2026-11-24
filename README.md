# MallMind AI — Multilingual Smart Mall Digital Twin & Retail Operations Platform

**Target Venue:** Nexus Ahmedabad One (Alpha One Mall), Vastrapur, Ahmedabad, Gujarat, India  
**Academic Category:** B.Tech / Final Year Engineering Capstone Project  
**Tech Stack:** React 19 + TypeScript | Java 21 + Spring Boot | Python 3.11 + FastAPI + PyTorch | PostgreSQL 16  
**Quality Assurance Verdict:** Ready with Documented Limitations (121 / 124 Tests Passed, 97.6% Reliability, 0 Critical Defects)

---

## 1. Project Overview

**MallMind AI** is a comprehensive, enterprise-grade, multilingual indoor navigation, smart shopping, and mall management ecosystem specifically customized for **Nexus Ahmedabad One** (formerly Alpha One Mall) in Vastrapur, Ahmedabad.

The platform bridges the gap between physical retail mall discovery and digital convenience through:
- **Interactive 5-Floor Digital Twin:** Interactive 2D schematic indoor wayfinding with topological graph routing (Dijkstra's shortest path across escalators, elevators, corridors, and 120+ retail spaces).
- **Multilingual Voice & Chat Concierge:** Real-time speech recognition (faster-whisper) supporting Gujarati, Hindi, and English; TextCNN deep learning intent classification; and RAG-driven responses.
- **E-Commerce & Smart Shopping Journey:** Complete product discovery across 152+ in-mall items, dynamic cart management, tax calculation (18% GST), click-and-collect or delivery checkout, and sandbox payments.
- **Retailer Management & Operations:** Store-specific product catalog management, ResNet18 AI-assisted visual category assignment, inventory adjustment ledgers, and order fulfillment tracking.
- **Mall Administrative Intelligence:** Mall-wide footfall analytics, Random Forest footfall and demand forecasting, store lease management, and tamper-evident administrative audit logging.

---

## 2. System Architecture

MallMind AI operates on a modern 4-tier decoupled architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 19 + Vite Frontend SPA                         │
│                    (Runs on Port 5173 / Localhost)                     │
│  - Digital Twin (2D SVG/Canvas)       - Multilingual Voice UI (ASR)    │
│  - Customer E-Commerce Storefront     - Retailer Inventory Portal      │
│  - Administrative Operations Console  - Dijkstra Route Visualizer      │
└───────────────────┬─────────────────────────────────┬──────────────────┘
                    │ /api/*                          │ /ai/* (via Vite Proxy)
                    ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│     Java 21 + Spring Boot 3.2+       │  │ Python 3.11+ FastAPI Service │
│            (Port 8085)               │  │         (Port 8001)          │
│ - JWT RBAC Security & Auth Filter    │  │ - Faster-Whisper ASR (En/Hi/Gu│
│ - Transactional E-Commerce Engine    │  │ - TextCNN Intent Classifier  │
│ - Inventory Ledger & Concurrency     │  │ - ResNet18 Visual Classifier │
│ - Graph Pathfinding & Floor Routing  │  │ - Random Forest Demand Model │
│ - Immutable System Audit Logging     │  │ - TF-IDF Item Recommender    │
└───────────────────┬──────────────────┘  └──────────────────────────────┘
                    │ JDBC (Port 5433)
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL 16 Relational Store                    │
│                        (Docker Container :5433)                        │
│  - Users, Roles & Stores              - Nodes, Edges & Floor Plans     │
│  - Products, Orders & Order Items     - Inventory Adjustment Ledger    │
│  - Audit Logs & Security Trails       - Demand Historical Timeseries   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Component | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | `19.3.1` | Modern Single Page Application UI |
| | Vite | `8.3.6` | Next-generation frontend build tooling and dev server |
| | TypeScript | `~7.0.2` | Type-safe enterprise JavaScript codebase |
| | React Router DOM | `7.18.5` | Client-side declarative application routing |
| | Lucide React | `1.78.0` | Comprehensive accessible UI icon library |
| **Backend** | OpenJDK | `21 (LTS)` | High-performance Java runtime environment |
| | Spring Boot | `4.1.2` (starter-parent) | Microservice framework for REST APIs and DI |
| | Spring Security | 6.x | Stateless JWT authentication & role-based access control |
| | Spring Data JPA | Hibernate 6 | Relational Object-Relational Mapping & Transactions |
| | JJWT | `0.12.6` | HMAC-SHA256 stateless JSON Web Token security |
| **AI / ML** | Python | `3.11+` | Machine learning runtime engine |
| | FastAPI & Uvicorn | `0.115.5` / `0.32.1` | High-throughput asynchronous REST inference server |
| | PyTorch & Torchvision | `2.15.0+cpu` | TextCNN intent model & ResNet18 visual encoder |
| | Scikit-Learn | `1.5.2` | Random Forest demand model & TF-IDF recommender |
| | Faster-Whisper | `1.1.1` | Local CTranslate2-based Whisper ASR inference |
| **Database** | PostgreSQL | `16-alpine` | Containerized ACID relational database |
| | Docker | Compose v2 | Local container orchestration |

---

## 4. Key Features by User Persona

### 4.1 Mall Shoppers & Customers
- **Floor-by-Floor Digital Twin:** Explore 5 floors (Lower Ground to Fourth Floor) with schematic layout, category filtering, and direct store selection.
- **Topological Navigation:** Select starting point and destination; calculates shortest path with turn-by-turn routing and inter-floor traversal (escalators/elevators).
- **Voice Concierge:** Press mic and speak in Gujarati ("મને શૂઝ લેવા છે"), Hindi ("मुझे रनિંગ જૂતે ખરીદને હૈ"), or English ("Find Nike running shoes").
- **Product Search & Discovery:** Hard brand constraints, category filtering, budget thresholds, and alternative suggestions without silent substitution.
- **Unified E-Commerce Cart:** Add products across stores, review 18% GST tax breakdown, select fulfillment (Store Pickup or Home Delivery), and simulate payments.

### 4.2 Retail Store Managers
- **Store-Centric Authentication:** Log in with store-assigned credentials (`retailer@mallmind.local`).
- **Catalog Management:** View active inventory, edit price/stock, and create new product listings.
- **AI-Assisted Image Classification:** Upload product photo to receive real-time category predictions from ResNet18.
- **Inventory Ledger:** Real-time stock adjustment tracking and transaction logs.
- **Order Processing:** Review incoming customer orders and progress fulfillment statuses (PENDING -> PROCESSING -> COMPLETED).

### 4.3 Mall Operations & Administration
- **Executive Dashboard:** Overview of total stores (120+), live products (152+), active customer orders, and mall revenue.
- **Footfall & Demand Forecasting:** AI-driven footfall projections generated by Random Forest regressor with weather, holiday, and day-of-week variables.
- **Store Management:** Update tenant leases, assign store locations, and manage floor directory data.
- **Immutable Audit Trail:** Append-only administrative activity logging recording actor, timestamp, client IP, action type, and before/after state.

---

## 5. Quickstart Guide (1-Click Launch)

### Prerequisites
- **Windows 10 / 11** (tested on Windows 11 64-bit)
- **Docker Desktop** installed and running
- **Java 21 JDK** installed (`java -version`)
- **Python 3.11+** installed (`python --version`)
- **Node.js 20+** installed (`node -v`)

### Automated Startup
1. Ensure Docker Desktop is active.
2. Double-click **`run-mallmind.bat`** in the project root directory.
3. The script will automatically:
   - Start the PostgreSQL Docker container on port `5433`.
   - Start the Python FastAPI AI Model Service on port `8001`.
   - Start the Java Spring Boot Backend on port `8085`.
   - Start the Vite React Frontend on port `5173`.
   - Open `http://localhost:5173` in your default browser.

### Shutdown
- Double-click **`stop-mallmind.bat`** to gracefully terminate all running services on ports `8001`, `8085`, and `5173`.

---

## 6. Default Demonstration Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@mallmind.local` | `<LOCAL_DEMO_PASSWORD>` | Mall operations, demand forecast, store manager, audit logs |
| **Store Retailer (Zara)** | `retailer@mallmind.local` | `<LOCAL_DEMO_PASSWORD>` | Store catalogue, inventory ledger, order fulfillment |
| **Shopper / Customer** | `customer@mallmind.local` | `<LOCAL_DEMO_PASSWORD>` | Directory, navigation, voice concierge, cart, checkout |
| *(Self-Registration)* | Any valid email | Minimum 8 chars | Instant customer account creation via `/register` |

---

## 7. Quality Assurance & Verification Summary

During **Phase 8 Comprehensive Quality Assurance**, the complete system underwent 124 automated end-to-end regression tests across 10 functional dimensions:

| Test Suite | Tests Executed | Passed | Failed | Pass Rate |
| :--- | :---: | :---: | :---: | :---: |
| Customer Journey & E-Commerce | 20 | 20 | 0 | 100.0% |
| Retailer & Admin Operations | 17 | 17 | 0 | 100.0% |
| Security & RBAC Isolation | 19 | 19 | 0 | 100.0% |
| Database Integrity & Transactions | 6 | 6 | 0 | 100.0% |
| AI Model Reliability & RAG | 16 | 16 | 0 | 100.0% |
| Navigation & Topological Graph | 8 | 8 | 0 | 100.0% |
| Performance & Latency Benchmarks | 12 | 12 | 0 | 100.0% |
| UI Usability & Accessibility | 12 | 10 | 2 | 83.3% |
| Defect Regression Gates | 14 | 13 | 1 | 92.9% |
| **Overall System Total** | **124** | **121** | **3** | **97.6%** |

- **Critical (P0) Defects:** 0
- **High (P1) Defects:** 0
- **Medium (P2) Defects:** 1 (Non-blocking: Read-modify-write lost update risk under high concurrent checkout without row-level locking)
- **Low / Cosmetic (P3) Defects:** 2 (Lighthouse color contrast edge cases on muted badges, aria-label omission on digital twin zoom buttons)
- **Final Verdict:** **READY WITH DOCUMENTED LIMITATIONS**

---

## 8. Documented Architectural & Prototype Assumptions

In keeping with rigorous academic integrity, the following limitations are formally documented:
1. **Schematic Digital Twin:** Coordinates use an estimated scale factor (0.25 meters per coordinate unit) representing schematic store topology rather than laser-scanned architectural blueprints.
2. **Demonstration Inventory & Payments:** Stock levels represent seeded demonstration inventory rather than live retailer ERP integrations. Payment checkout uses a sandbox gateway.
3. **Simulated Footfall Series:** Historical demand data for the Random Forest model is synthetically generated using calibrated retail distribution curves.
4. **Deep Learning Generalization:** TextCNN intent model achieves 44.4% accuracy on out-of-domain synthetic phrasings, automatically backed by rule-based keyword fallback. ResNet18 visual classification has an expected domain gap when categorizing e-commerce studio shots vs. real-world store shelf images.
5. **Universal Tax Assumption:** A standard 18% GST rate is applied universally across products as a prototype baseline.

---

## 9. Academic Project Documentation Index

| Document | File Link | Purpose |
| :--- | :--- | :--- |
| **Repository Audit** | [MALLMIND_AI_PHASE9_REPOSITORY_AUDIT.md](file:///c:/Users/riyam/Downloads/mallmind-main/MALLMIND_AI_PHASE9_REPOSITORY_AUDIT.md) | Component inventory, dependency audit, file hygiene |
| **Setup Guide** | [MALLMIND_AI_SETUP_GUIDE.md](file:///c:/Users/riyam/Downloads/mallmind-main/MALLMIND_AI_SETUP_GUIDE.md) | Step-by-step installation instructions for all OS |
| **Operational Runbook** | [MALLMIND_AI_RUNBOOK.md](file:///c:/Users/riyam/Downloads/mallmind-main/MALLMIND_AI_RUNBOOK.md) | Commands, health checks, troubleshooting, port resolution |
| **System Architecture Diagrams** | [MALLMIND_AI_ARCHITECTURE_DIAGRAMS.md](file:///c:/Users/riyam/Downloads/mallmind-main/MALLMIND_AI_ARCHITECTURE_DIAGRAMS.md) | 15 detailed Mermaid architecture & sequence diagrams |
| **Academic Project Report** | [MALLMIND_AI_FINAL_PROJECT_REPORT.md](file:///c:/Users/riyam/Downloads/mallmind-main/MALLMIND_AI_FINAL_PROJECT_REPORT.md) | Complete 12-chapter comprehensive project dissertation |
| **Live Demo Script** | [MALLMIND_AI_LIVE_DEMO_RUNBOOK.md](file:///c:/Users/riyam/Downloads/mallmind-main/MALLMIND_AI_LIVE_DEMO_RUNBOOK.md) | 4-part structured viva & examiner presentation script |
| **Viva Question Bank** | [MALLMIND_AI_VIVA_QUESTION_BANK.md](file:///c:/Users/riyam/Downloads/mallmind-main/MALLMIND_AI_VIVA_QUESTION_BANK.md) | Deep technical defence questions & answers for viva |
| **Submission Readiness Report** | [MALLMIND_AI_PHASE9_SUBMISSION_READINESS_REPORT.md](file:///c:/Users/riyam/Downloads/mallmind-main/MALLMIND_AI_PHASE9_SUBMISSION_READINESS_REPORT.md) | Formal audit checklist and submission clearance |

---
*Developed for College Demonstration & Academic Examination, November 2026.*
#   M a l l M i n d - A I  
 