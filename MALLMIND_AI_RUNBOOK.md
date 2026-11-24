# MallMind AI — Operational Runbook & Maintenance Guide

**Document Purpose:** System Operations, Service Administration, Health Monitoring & Diagnostics  
**Venue:** Nexus Ahmedabad One (Alpha One Mall), Vastrapur, Ahmedabad  
**Target Environment:** Local Development & Academic Demonstration  
**Document Version:** 1.0  

---

## 1. System Operations Lifecycle

This runbook outlines standard operating procedures for operating, diagnosing, and maintaining the four services comprising MallMind AI.

```
+------------------------------------------------------------------------+
|                     MALLMIND SERVICE TOPOLOGY                          |
|                                                                        |
|  [Vite Frontend :5173] ---> [Spring Boot :8085] ---> [Postgres :5433]  |
|          |                         |                                   |
|          +-------- (Proxy) --------+---> [FastAPI AI :8001]            |
+------------------------------------------------------------------------+
```

---

## 2. Standard Start & Stop Commands

### 2.1 Starting Services Individually

```bash
# 1. Database Tier
docker start mallmind-postgres
# Or if first run:
docker compose up -d

# 2. AI Model Service (Python 3.11+)
cd model-service
.\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8001 --reload

# 3. Java Spring Boot Backend (Java 21)
cd backend
java -jar target\mallmind-backend-0.0.1-SNAPSHOT.jar --server.port=8085

# 4. React Vite Frontend
cd frontend
npm run dev
```

### 2.2 Terminating Services Individually

```powershell
# Gracefully kill process listening on specific ports (Windows PowerShell)
Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Get-NetTCPConnection -LocalPort 8085 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Stop PostgreSQL Container
docker stop mallmind-postgres
```

---

## 3. Health Checks & Verification Commands

Execute these verification checks before each viva or live demonstration:

### 3.1 Health Check Endpoints

| Service | Protocol | Method | Endpoint | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| **Model Service** | HTTP | `GET` | `http://localhost:8001/health` | `{"status":"healthy","service":"mallmind-ai"}` |
| **Backend REST** | HTTP | `GET` | `http://localhost:8085/api/stores` | `[{"id":1,"name":"Zara",...}]` |
| **Digital Twin** | HTTP | `GET` | `http://localhost:8085/api/navigation/nodes?floor=1` | Array of floor 1 topological nodes |
| **Frontend UI** | HTTP | `GET` | `http://localhost:5173` | HTML markup containing `<!doctype html>` |

### 3.2 Automated Curl Verification Script

Run the following command in PowerShell to verify all endpoints at once:

```powershell
Write-Host "Verifying AI Model Service..." -ForegroundColor Cyan
curl -Uri "http://localhost:8001/health" -UseBasicParsing | Select-Object -ExpandProperty Content

Write-Host "`nVerifying Backend API..." -ForegroundColor Cyan
(curl -Uri "http://localhost:8085/api/stores" -UseBasicParsing).StatusCode

Write-Host "`nVerifying Database Connectivity..." -ForegroundColor Cyan
docker exec -i mallmind-postgres psql -U mallmind -d mallmind -c "SELECT count(*) AS store_count FROM stores;"
```

---

## 4. Log Inspection & Monitoring

### 4.1 Backend Service Logs
- Spring Boot outputs formatted logs with timestamps, thread IDs, log level (`INFO`, `WARN`, `ERROR`), and logger names.
- Active logging output can be observed directly in the terminal running the JAR.
- SQL queries can be enabled by setting `JPA_SHOW_SQL=true` in `application.yml` or via CLI:
  ```bash
  java -jar target\mallmind-backend-0.0.1-SNAPSHOT.jar --server.port=8085 --spring.jpa.show-sql=true
  ```

### 4.2 AI Model Service Logs
- FastAPI utilizes Uvicorn's asynchronous event logger.
- HTTP requests log with status codes, client IPs, and latency in milliseconds.
- PyTorch inference logging (intent classification and visual embeddings) is streamed to stdout.

### 4.3 Database Container Logs
- Inspect PostgreSQL engine and transaction logs:
  ```bash
  docker logs --tail 100 -f mallmind-postgres
  ```

---

## 5. Database Backup and Restoration

### 5.1 Export Database Backup (Dump)
To snapshot the current state including test orders, products, and inventory adjustments:
```bash
docker exec -t mallmind-postgres pg_dump -U mallmind -d mallmind -F c -b -v -f /tmp/mallmind_backup.dump
docker cp mallmind-postgres:/tmp/mallmind_backup.dump ./data/mallmind_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump
```

### 5.2 Reset Database to Clean Seed State
To restore the clean demonstration state:
```bash
# Drop and recreate schema
docker exec -i mallmind-postgres psql -U mallmind -d mallmind -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Reapply initial seed SQL
docker exec -i mallmind-postgres psql -U mallmind -d mallmind < data/seed/01_seed_core.sql
docker exec -i mallmind-postgres psql -U mallmind -d mallmind < data/seed/02_seed_products.sql
```

---

## 6. Security Incident & Operational Recovery

### 6.1 Forgotten Administrator Password
If the admin account password is changed or lost during testing, reset it directly in PostgreSQL:
```bash
# Hash for '<LOCAL_DEMO_PASSWORD>' with BCrypt ($2a$10$wT0l...):
docker exec -i mallmind-postgres psql -U mallmind -d mallmind -c "UPDATE users SET password_hash = '\$2a\$10\$Y8Y0P8zFsmgL6eE5hXQW1e7n7wP0n3vF5H5B8iP7Z4vL1R5L5K5M5' WHERE email = 'admin@mallmind.local';"
```

### 6.2 Clearing Tampered Audit Trails
The audit trail is append-only by application design. If test records need purges prior to formal demonstration:
```bash
docker exec -i mallmind-postgres psql -U mallmind -d mallmind -c "TRUNCATE TABLE audit_logs RESTART IDENTITY;"
```

---

## 7. Emergency Demonstration Fallback Procedures

If any service encounters issues during a live presentation:

1. **Frontend fails to load:**
   - Terminate port 5173: `taskkill /F /IM node.exe`
   - Restart Vite: `cd frontend && npm run dev`
2. **AI voice input does not recognize speech:**
   - Use the text input bar in the Voice Concierge modal. Text input exercises the exact same intent classification, RAG retrieval, and product recommendation pipelines without microphone hardware dependencies.
3. **Database connection refused:**
   - Run `docker restart mallmind-postgres`.
   - Verify health: `docker inspect --format='{{json .State.Health.Status}}' mallmind-postgres`
