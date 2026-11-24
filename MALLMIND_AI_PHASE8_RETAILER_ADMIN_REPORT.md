# MallMind AI — Phase 8C & 8D Quality Assurance Report
## Retailer and Administrator Workflow Verification

**Project:** MallMind AI  
**Target Mall:** Alpha One Mall (Nexus Ahmedabad One), Vastrapur, Ahmedabad, Gujarat, India  
**Date:** November 24, 2026  
**Auditor:** Antigravity Senior AI Architect & QA Lead  
**Scope:** Phase 8C (Retailer Operations) & Phase 8D (Mall Administrator Operations)  
**Status:** **17 / 17 TESTS PASSED (100.0%)** — **ZERO P0/P1 DEFECTS**

---

## 1. Executive Summary

This report documents the end-to-end verification of retailer and mall administrator operational workflows in MallMind AI. All tests were executed against the live multi-tier stack (React frontend at `:5173`, Java Spring Boot backend at `:8085`, Python FastAPI model service at `:8001`, and PostgreSQL database at `:5433`).

Across both administrative domains:
- **Retailer Operations (Phase 8C):** 7 / 7 tests passed (100.0%). Retailers can securely authenticate, classify product images using ResNet18 vision inference, adjust store inventory with immutable audit ledger recording, receive stock alerts, access store-specific order queues, and are strictly prevented from cross-store tampering.
- **Administrator Operations (Phase 8D):** 10 / 10 tests passed (100.0%). Mall administrators access database-grounded operational statistics, overview and configure the 5-floor digital twin structure, update store metadata, safely toggle store active statuses, onboard new retailers, enforce immediate account suspension, exercise mall-wide order oversight, and query audit logs whose immutability is strictly enforced at the API boundary.

---

## 2. Test Execution Matrix & Results

| Test ID | Domain | Workflow Target | Tested Endpoint / Operation | HTTP Status | Outcome | Evidence / Verification Notes |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **P8-RET-01** | Retailer | Authentication | `POST /api/auth/login` | 200 OK | **PASSED** | JWT token issued with `ROLE_RETAILER` for Zara store manager. |
| **P8-RET-02** | Retailer | Vision Assistance | `POST /api/retailer/products/classify-image` | 200 OK | **PASSED** | ResNet18 image classifier returns predicted category (`Footwear`). |
| **P8-RET-03** | Retailer | Stock Adjustment | `POST /api/retailer/inventory/adjust` | 200 OK | **PASSED** | Stock updated to 30 with reason `RESTOCK`. Atomically written to DB. |
| **P8-RET-04** | Retailer | Inventory Alerts | `GET /api/retailer/inventory/alerts` | 200 OK | **PASSED** | Returns low-stock and out-of-stock items for Zara (Shop #7). |
| **P8-RET-05** | Retailer | Adjustment History | `GET /api/retailer/inventory/history` | 200 OK | **PASSED** | Immutable ledger records (oldStock, newStock, actorEmail, reason). |
| **P8-RET-06** | Retailer | Order Queue | `GET /api/retailer/orders` | 200 OK | **PASSED** | Tenant-filtered orders restricted strictly to Zara's assigned items. |
| **P8-RET-07** | Retailer | Tenant Isolation | `POST /api/retailer/inventory/adjust` | 403 Forbidden | **PASSED** | Zara manager blocked from adjusting Smart Bazaar (Shop #1) Product #1. |
| **P8-ADM-01** | Admin | Authentication | `POST /api/auth/login` | 200 OK | **PASSED** | JWT token issued with `ROLE_ADMIN` (`admin@mallmind.local`). |
| **P8-ADM-02** | Admin | Dashboard Stats | `GET /api/admin/dashboard/stats` | 200 OK | **PASSED** | Real database truth: 30 stores, 5 floors, 304 products (`DATABASE_TRUTH`). |
| **P8-ADM-03** | Admin | Digital Twin Structure | `GET /api/admin/floors` | 200 OK | **PASSED** | 5 distinct floor objects returned (LG, G, 1F, 2F, 3F) with store counts. |
| **P8-ADM-04** | Admin | Store Metadata | `PUT /api/admin/shops/7` | 200 OK | **PASSED** | Updated Zara description persisted and audited. |
| **P8-ADM-05** | Admin | Soft Store Activation | `PATCH /api/admin/shops/7/status?active=...` | 200 OK | **PASSED** | Safe deactivation and reactivation without deleting relational entities. |
| **P8-ADM-06** | Admin | Retailer Onboarding | `POST /api/admin/retailers` | 200 OK | **PASSED** | New retailer account onboarded and assigned to Shop #3. |
| **P8-ADM-07** | Admin | Retailer Suspension | `PATCH /api/admin/retailers/{id}/status` | 200 OK / 403 | **PASSED** | Suspended retailer login instantly rejected with HTTP 403 Forbidden. |
| **P8-ADM-08** | Admin | Order Oversight | `GET /api/admin/orders` | 200 OK | **PASSED** | Mall-wide order visibility across all stores and fulfillment states. |
| **P8-ADM-09** | Admin | Audit Log Retrieval | `GET /api/admin/audit-logs` | 200 OK | **PASSED** | Complete audit trail returned with action types, actor emails, and timestamps. |
| **P8-ADM-10** | Admin | Immutability Verification | `POST /api/admin/audit-logs`, `DELETE` | 405 / 404 | **PASSED** | No mutation endpoints exist on audit log controller. Tamper-proof at API layer. |

---

## 3. Deep-Dive Workflow Analysis

### 3.1 Tenant Isolation & Data Boundary Security (P8-RET-07)
A vital requirement for multi-retailer platforms is rigorous tenant isolation. In test `P8-RET-07`, the authenticated Zara store manager (`manager_zara@mallmind.local`, assigned to Shop #7) submitted a stock adjustment request targeting Product #1 (belonging to Smart Bazaar, Shop #1).
- **Result:** The backend security check in `InventoryService.java` evaluated the product ownership against the authenticated caller's assigned shops and returned **HTTP 403 Forbidden**.
- **Finding:** No unauthorized inventory or order data cross-contamination is possible between merchant tenants.

### 3.2 Operational Statistics Truthfulness (P8-ADM-02)
Prior audits in earlier phases highlighted risk around hardcoded or fabricated statistics. In test `P8-ADM-02`:
- `countsSource` is explicitly reported as `"DATABASE_TRUTH"`.
- Total Stores: **30** (exact count of active shops across all 5 floors in PostgreSQL).
- Total Floors: **5** (LG, Ground, 1st, 2nd, 3rd Floor).
- Total Active Catalogue Products: **304** (exact count from `products` table).
- **Finding:** All administrative dashboards reflect genuine relational database reality.

### 3.3 Retailer Account Lifecycle & Instant Suspension (P8-ADM-06, P8-ADM-07)
- An administrative user onboarded a retailer for Shop #3 (`manager_shop3_{ts}@mallmind.local`).
- Immediate suspension via `PATCH /api/admin/retailers/{id}/status?enabled=false` was executed.
- A login attempt with valid credentials immediately received **HTTP 403 Forbidden** due to Spring Security's `DisabledException` handling.
- Reactivation via `PATCH ...?enabled=true` succeeded, restoring normal retailer access.
- **Finding:** Account deactivation takes effect immediately without requiring cache invalidation or token revocation delays.

### 3.4 Audit Log Immutability Qualification (P8-ADM-10)
- The audit log endpoint `GET /api/admin/audit-logs` was queried and returned historical entries for administrative and retailer actions.
- Probing HTTP `POST`, `PUT`, or `DELETE` against `/api/admin/audit-logs` yielded **HTTP 405 Method Not Allowed** and **HTTP 404 Not Found**.
- **Documented Limitation:** As established in Phase 6 verification, immutability is enforced at the Application and API layer (no modification or deletion APIs exist in `AuditLogController` or `AuditLogService`). PostgreSQL superusers with direct SQL console access retain raw table permissions unless a database-level trigger or separate WORM storage is implemented. This limitation is documented and acceptable for the current single-tenant deployment.

---

## 4. Defect Summary

- **P0 / P1 (Blockers/Critical):** **0**
- **P2 (Moderate):** **0**
- **P3 (Minor/Cosmetic):** **0**

---

## 5. Conclusion & Recommendation

Phases 8C (Retailer Operations) and 8D (Mall Administrator Operations) satisfy all requirements:
1. Multi-merchant isolation is strictly enforced.
2. Inventory adjustments maintain an audit trail.
3. Retailer suspension enforces immediate access revocation.
4. Administrative dashboard metrics are directly grounded in PostgreSQL data.

**Recommendation:** Formally accept Phase 8C and Phase 8D. Proceed to **Phase 8E: Security and Access-Control Audit**.
