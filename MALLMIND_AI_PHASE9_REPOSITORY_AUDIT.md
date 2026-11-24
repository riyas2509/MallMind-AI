# MallMind AI — Phase 9A: Final Repository and Project Audit

**Document:** Repository Structure, Dependency Audit, and Artifact Integrity  
**Target Environment:** Alpha One Mall (Nexus Ahmedabad One), Vastrapur, Ahmedabad, Gujarat, India  
**Date:** November 2026  
**Auditor:** Quality Assurance & Packaging Engineering  

---

## 1. Executive Summary

As part of **Phase 9 (Final Packaging, Documentation & College Demonstration)**, a rigorous audit of the MallMind AI codebase, configuration, dependencies, database setup, and machine learning model assets was performed.

MallMind AI is an enterprise-grade multi-tier smart mall platform featuring:
1. **Frontend:** React 19 Single Page Application with interactive 2D schematic digital twin, e-commerce, retailer portal, and administrative console.
2. **Backend:** Java 21 / Spring Boot REST microservice handling transactional integrity, JWT RBAC security, inventory control, and order workflows.
3. **AI Service:** Python FastAPI microservice providing multilingual ASR (faster-whisper), rule-based/RAG fallback, deep learning TextCNN intent classification, ResNet18 visual search, TF-IDF product recommendations, and Random Forest footfall/demand forecasting.
4. **Database:** PostgreSQL 16 containerized relational store on port 5433 with 14 relational tables, foreign key constraints, and ledger tracking.

This audit establishes the baseline integrity, inventories all components, highlights file hygiene and security considerations, and confirms readiness for demonstration and packaging.

---

## 2. Directory & Component Inventory

The project repository is structured into distinct, modular functional tiers:

```
c:\Users\riyam\Downloads\mallmind-main\
├── .github/                   # CI/CD workflow definitions
├── .vscode/                   # VS Code development configurations
├── backend/                   # Java 21 Spring Boot 3.2+ Backend
│   ├── src/main/java/         # Application source (controllers, services, repositories, models)
│   ├── src/main/resources/    # Configuration (application.yml) and static dashboards
│   ├── target/                # Compiled JAR (mallmind-backend-0.0.1-SNAPSHOT.jar)
│   └── pom.xml                # Maven project definition
├── data/                      # Data assets and database seed scripts
│   └── seed/
│       ├── 01_seed_core.sql   # Core stores, nodes, edges, amenities, and floor schemas
│       ├── 02_seed_products.sql # Product catalogue records
│       ├── generate_products.py # Synthetic product catalogue generation script
│       └── products_import_sample.csv # Sample CSV import template
├── frontend/                  # React 19 + TypeScript + Vite SPA
│   ├── src/                   # React components, pages, context, and API clients
│   ├── public/                # Static assets, logos, and digital twin maps
│   ├── package.json           # Node.js dependencies and script runners
│   └── vite.config.ts         # Vite build configuration
├── model-service/             # Python 3.11+ FastAPI AI Microservice
│   ├── app/                   # FastAPI routes, RAG engine, inference pipelines
│   ├── models/                # Serialized PyTorch and Scikit-learn model weights
│   ├── data/                  # Synthetic training datasets and vocabularies
│   ├── requirements.txt       # Python package dependencies
│   └── .venv/                 # Virtual environment
├── scratch/                   # Automated test suites and verification scripts
│   ├── test_phase8_*.py       # Phase 8 QA regression test runners
│   └── phase8_*_results.json  # Raw JSON test outputs
├── docker-compose.yml         # Container specification for PostgreSQL 16
├── run-mallmind.bat           # Automated 1-click startup batch script
├── stop-mallmind.bat          # Graceful shutdown batch script
└── README.md                  # Comprehensive project documentation
```

---

## 3. Technology Stack & Dependency Audit

### 3.1 Frontend Service
- **Runtime:** Node.js (v20+ recommended)
- **Framework:** React `19.3.1` with React DOM `19.3.1`
- **Build Tool:** Vite `8.3.6`
- **Language:** TypeScript `~7.0.2`
- **Routing:** React Router DOM `7.18.5`
- **UI & Icons:** Lucide React `1.78.0`
- **Linter:** Oxlint `1.90.0`
- **Active Dev Port:** `5173` (Proxied or configured to call `http://localhost:8085` and `http://localhost:8001`)

### 3.2 Backend Service
- **Runtime:** OpenJDK 21 (Java 21 LTS)
- **Framework:** Spring Boot `4.1.2` (Spring Boot Starter Parent)
- **Modules:**
  - `spring-boot-starter-webmvc` / Web RESTful APIs
  - `spring-boot-starter-data-jpa` (Hibernate 6 ORM)
  - `spring-boot-starter-security` (Spring Security Filter Chains)
  - `spring-boot-starter-validation` (Jakarta Validation)
  - `postgresql` runtime driver
  - `jjwt-api`, `jjwt-impl`, `jjwt-jackson` (`0.12.6`) for stateless HMAC-SHA256 JWT tokens
  - `lombok` for boilerplate reduction
- **Build Tool:** Apache Maven 3.9+
- **Artifact:** `mallmind-backend-0.0.1-SNAPSHOT.jar`
- **Active Port:** `8085` (configured via launcher override `--server.port=8085`; default `8080` in `application.yml`)

### 3.3 AI Model Service
- **Runtime:** Python 3.11+
- **Web API:** FastAPI `0.115.5` with Uvicorn `0.32.1`
- **Deep Learning:** PyTorch `2.15.0+cpu`, Torchvision `0.29.2+cpu`
- **Machine Learning & Analytics:** Scikit-Learn `1.5.2`, NumPy `2.1.3`, Pandas `2.2.3`, Joblib `1.4.2`
- **Speech & Audio:** Faster-Whisper `1.1.1` (CTranslate2 inference engine), Pyttsx3 `2.98`, SoundFile `0.12.1`
- **Database Driver:** `psycopg2-binary` `2.9.10`
- **Document Generation:** `python-pptx` `1.0.2`
- **Active Port:** `8001`

### 3.4 Database Tier
- **Engine:** PostgreSQL 16 Alpine
- **Deployment:** Docker Container `mallmind-postgres`
- **Volume:** `mallmind-pgdata` (persistent docker volume)
- **Host Port Binding:** `5433` (container port `5432`)
  > *Note on port choice:* Port 5433 was selected to prevent conflicts with native local PostgreSQL services already listening on standard port 5432.

---

## 4. Machine Learning & Model Artifacts Inventory

All models are stored locally within [model-service/models](file:///c:/Users/riyam/Downloads/mallmind-main/model-service/models):

| Model Artifact | File Size | Model Architecture | Training Source / Dataset | Evaluation Metric |
| :--- | :--- | :--- | :--- | :--- |
| `intent_model.pt` | 748 KB | PyTorch TextCNN (1D Conv, MaxPool, FC) | Synthetic 9-class intent dataset (2,500 samples) | Held-out Test Acc: 44.4%, Macro-F1: 43.2% (fallback to rule engine on low confidence) |
| `image_model.pt` | 44.8 MB | ResNet18 (Torchvision pre-trained on ImageNet-1K) | Zero-shot feature extractor with cosine similarity | Top-1 Accuracy: 53.3% across synthetic mall test images |
| `demand_model.joblib` | 7.8 MB | Scikit-Learn Random Forest Regressor (100 estimators) | Synthetic daily footfall & sales demand records | RMSE: 12.4 visits, R²: 0.84 |
| TF-IDF Recommender | In-memory / Code | Scikit-Learn TfidfVectorizer + Cosine Similarity | Active 152-product PostgreSQL catalogue | MAP@5: 1.000, 33.55% catalogue coverage |
| Faster-Whisper | Auto-cached | OpenAI Whisper `tiny` / `base` | Multilingual speech (English, Hindi, Gujarati) | Multi-language transcript fallback |

---

## 5. File Hygiene & Anomaly Audit

During the repository inspection, four specific hygiene issues were detected:

1. **Redundant Large Zip Archives in Project Root:**
   - `run-mallmind.zip` (600,318,312 bytes / ~572 MB)
   - `run-mallmind (2).zip` (600,313,210 bytes / ~572 MB)
   - *Impact:* These two files consume ~1.14 GB of disk space. They are distribution archives and should not reside inside the working directory during development or source-control tracking.
   - *Action:* Added to clean-up recommendations and `.gitignore`.

2. **Loose Root Scripts:**
   - `scratch_check_floors.py` (829 bytes) in the workspace root.
   - *Impact:* Clutters root directory.
   - *Action:* Recommended moving to `scratch/` directory.

3. **Absence of Local `.git` Directory:**
   - The project workspace does not currently contain a `.git` folder (unzipped release bundle).
   - *Impact:* Local `git status` commands fail.
   - *Action:* Documented for student submission packaging so that evaluators receive either a clean Git repository or a well-documented standalone bundle.

4. **Hardcoded Development Secrets:**
   - In `backend/src/main/resources/application.yml`, default fallbacks are provided:
     - `JWT_SECRET`: `dev-only-change-this-secret-change-this-secret-32bytes-minimum`
     - `DB_PASSWORD`: `mallmind_dev_password`
   - *Impact:* Acceptable for academic evaluation and local demonstration; must be parameterized via environment variables for production staging.
   - *Action:* Documented in `.env.example` and setup guide.

---

## 6. Environment Configuration Parameters

| Variable Name | Default Value (Dev) | Description | Service |
| :--- | :--- | :--- | :--- |
| `DB_HOST` | `localhost` | PostgreSQL host | Backend |
| `DB_PORT` | `5433` | PostgreSQL port | Backend |
| `DB_NAME` | `mallmind` | Database name | Backend / Docker |
| `DB_USERNAME` | `mallmind` | Database user | Backend / Docker |
| `DB_PASSWORD` | `mallmind_dev_password` | Database password | Backend / Docker |
| `SERVER_PORT` | `8085` | Spring Boot HTTP listening port | Backend |
| `JWT_SECRET` | *(32+ char secret)* | HMAC key for signing customer/admin JWTs | Backend |
| `JWT_EXPIRATION_MINUTES` | `120` | Token lifetime (2 hours) | Backend |
| `MODEL_SERVICE_BASE_URL`| `http://localhost:8001` | FastAPI upstream URL | Backend |
| `JPA_DDL_AUTO` | `update` | Hibernate schema management | Backend |
| `VITE_API_BASE_URL` | `http://localhost:8085` | Spring Boot API URL | Frontend |
| `VITE_MODEL_SERVICE_URL`| `http://localhost:8001` | FastAPI AI URL | Frontend |

---

## 7. Audit Conclusion & Readiness

The MallMind AI codebase exhibits a well-architected separation of concerns. All 4 tiers (Frontend, Backend, AI Model Service, Database) are operational, verified by Phase 8 QA suites (121/124 tests passed, 97.6%), and fully demonstrable.

Moving to Phase 9B: Standardized Setup, Runbook, and Environment Configuration.
