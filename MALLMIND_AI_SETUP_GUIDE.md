# MallMind AI — Setup and Installation Guide

**Target Application:** MallMind AI Multilingual Smart Mall Digital Twin  
**Target Venue:** Nexus Ahmedabad One (Alpha One Mall), Vastrapur, Ahmedabad, Gujarat, India  
**Target Audience:** Students, Instructors, Academic Examiners, and Developers  
**Document Version:** 1.0 (Phase 9 Final Release)  

---

## 1. System Requirements & Prerequisites

Before setting up MallMind AI, ensure your development machine meets the following specifications:

### 1.1 Hardware Requirements
- **Processor:** Intel Core i5 / AMD Ryzen 5 or higher (4+ cores recommended)
- **RAM:** Minimum 8 GB (16 GB recommended for concurrent Docker, Java, and PyTorch execution)
- **Disk Space:** At least 5 GB of free disk storage (excluding dataset zips)
- **Audio:** Microphone and speakers/headphones (for testing Faster-Whisper ASR and TTS audio)

### 1.2 Software Prerequisites
Verify the installation of these required runtime environments:

1. **Docker & Docker Compose:**
   - Docker Desktop 4.x+ on Windows/macOS or Docker Engine on Linux.
   - Verify: `docker --version` and `docker compose version`
2. **Java Development Kit (JDK):**
   - OpenJDK 21 (LTS) or Eclipse Temurin 21.
   - Verify: `java -version` and `javac -version`
3. **Python:**
   - Python 3.11.x (or 3.12.x).
   - Verify: `python --version` (or `python3 --version`)
4. **Node.js & Package Manager:**
   - Node.js 20.x or 22.x LTS.
   - Verify: `node -v` and `npm -v`
5. **Build Tools (Optional for re-building from source):**
   - Apache Maven 3.9+ (Optional if using pre-compiled backend JAR).
   - Verify: `mvn -version`

---

## 2. Architecture Overview & Port Bindings

MallMind AI comprises four decoupled services communicating over designated local ports:

| Service | Directory | Technology | Port | URL |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | Root (`docker-compose.yml`) | PostgreSQL 16 Alpine | `5433` | `localhost:5433` |
| **AI Model Service** | `model-service/` | Python 3.11 / FastAPI | `8001` | `http://localhost:8001` |
| **Backend REST API** | `backend/` | Java 21 / Spring Boot 3.2+ | `8085` | `http://localhost:8085` |
| **Frontend Web App** | `frontend/` | React 19 / TypeScript / Vite | `5173` | `http://localhost:5173` |

> **Why Port 5433 for PostgreSQL?**  
> On many developer workstations, a local instance of PostgreSQL is already running as a Windows service on default port 5432. Docker Compose maps host port `5433` to container port `5432` to avoid port collision.

---

## 3. Step-by-Step Installation Instructions

### Step 1: Database Initialization (PostgreSQL Container)

1. Open a terminal in the root directory: `c:\Users\riyam\Downloads\mallmind-main`.
2. Launch the PostgreSQL container via Docker Compose:
   ```bash
   docker compose up -d
   ```
3. Verify that the container is healthy:
   ```bash
   docker ps --filter "name=mallmind-postgres"
   ```
4. *(Optional — Seed Database if Starting Empty)*:
   If setting up from an empty database volume, apply the core schemas and catalog data:
   ```bash
   docker exec -i mallmind-postgres psql -U mallmind -d mallmind < data/seed/01_seed_core.sql
   docker exec -i mallmind-postgres psql -U mallmind -d mallmind < data/seed/02_seed_products.sql
   ```

---

### Step 2: Python AI Model Service Setup

1. Navigate to the `model-service` directory:
   ```bash
   cd model-service
   ```
2. Create and activate a dedicated virtual environment:
   - **Windows:**
     ```cmd
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
3. Install the standard Python dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Install CPU-optimized PyTorch and Torchvision:
   ```bash
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
   ```
5. Install presentation generator library:
   ```bash
   pip install python-pptx
   ```
6. Verify the model service starts cleanly:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
   ```
   Open `http://localhost:8001/docs` in your browser to inspect Swagger API docs.

---

### Step 3: Java Spring Boot Backend Setup

1. Open a new terminal and navigate to `backend`:
   ```bash
   cd backend
   ```
2. Verify that the compiled JAR exists:
   - File path: `backend/target/mallmind-backend-0.0.1-SNAPSHOT.jar`
3. *(Optional — Recompile JAR from source)*:
   If you have modified Java source code, recompile using Maven:
   ```bash
   mvn clean package -DskipTests
   ```
4. Launch the Spring Boot backend on port 8085:
   - **Windows (Command Prompt / PowerShell):**
     ```cmd
     java -jar target\mallmind-backend-0.0.1-SNAPSHOT.jar --server.port=8085
     ```
   - **Linux / macOS:**
     ```bash
     java -jar target/mallmind-backend-0.0.1-SNAPSHOT.jar --server.port=8085
     ```
5. Verify backend readiness by checking:
   ```bash
   curl http://localhost:8085/api/stores
   ```

---

### Step 4: React Vite Frontend Setup

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in Google Chrome or any modern browser.

---

## 4. One-Click Convenience Scripts (Windows)

For academic demonstrations and quick evaluations, automated batch files are provided in the project root:

- **Launch All Services:** Double-click `run-mallmind.bat`
  - Starts PostgreSQL container.
  - Spawns separate cmd windows for FastAPI (8001), Spring Boot (8085), and Vite (5173).
  - Automatically launches `http://localhost:5173` in your default browser.
- **Stop All Services:** Double-click `stop-mallmind.bat`
  - Gracefully terminates all listening processes on ports 8001, 8085, and 5173.

---

## 5. Verification & Health Check Procedure

To confirm all components are operational before a presentation:

1. **Frontend:** Navigate to `http://localhost:5173`. Ensure the Nexus Ahmedabad One 5-floor digital twin renders.
2. **Backend API:** Execute `curl http://localhost:8085/api/stores`. Ensure JSON list of stores is returned.
3. **AI Model Service:** Execute `curl http://localhost:8001/health`. Ensure status is `healthy`.
4. **Database:** Execute `docker exec -it mallmind-postgres psql -U mallmind -d mallmind -c "SELECT COUNT(*) FROM stores;"`. Should return 120+.

---

## 6. Troubleshooting Common Issues

### Issue 1: Port Conflict on 8085, 8001, or 5173
- **Symptom:** `Address already in use` or `Port 8085 is already bound`.
- **Resolution:** Run `stop-mallmind.bat` or manually identify the process:
  ```powershell
  netstat -ano | findstr :8085
  taskkill /PID <PID> /F
  ```

### Issue 2: Docker Container Port 5433 Fails to Bind
- **Symptom:** `Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:5433`.
- **Resolution:** Another container or program is using port 5433. Change `ports: - "5434:5432"` in `docker-compose.yml` and update `DB_PORT=5434` in `application.yml`.

### Issue 3: Missing Python Module `PIL` / `faster_whisper`
- **Symptom:** `ModuleNotFoundError: No module named 'PIL'`.
- **Resolution:** Ensure commands are run within the activated virtual environment (`.venv\Scripts\activate`), then run `pip install pillow faster-whisper soundfile`.

### Issue 4: PyTorch Weights Only Load Warning
- **Symptom:** `Weights only load failed. Unsupported global: Vocabulary`.
- **Resolution:** Already handled in `model-service/app/intent_classifier.py` by enabling `weights_only=False` and registering `intent_classifier` module alias for legacy PyTorch checkpoints.
