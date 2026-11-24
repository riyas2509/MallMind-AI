# MallMind AI — Vercel Deployment Build Failure: Diagnosis and Permanent Fix Report

**Repository:** [https://github.com/riyas2509/MallMind-AI](https://github.com/riyas2509/MallMind-AI)  
**Deployment Platform:** Vercel  
**Date:** November 2026  
**Final Status:** **RESOLVED & VERIFIED IN ISOLATED LINUX ENVIRONMENT**  

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Reported Failure
During deployment on Vercel, the build failed during the `npm run build` execution (`tsc -b && vite build`):

```text
Error: Unable to resolve @typescript/typescript-linux-x64.
Either your platform is unsupported, or you are missing the package on disk.

at getExePath
at frontend/node_modules/typescript/lib/tsc.js

Node.js v26.13.1
Error: Command "npm run build" exited with 1
```

### 1.2 Root Cause
1. **Omission of Linux-Specific Binary in Root Lockfile:**  
   The project utilizes an npm workspace (`"workspaces": ["frontend"]`). When the root `package-lock.json` was originally generated on a Windows development workstation, npm only resolved and included packages for the host platform (`win32-x64`). Specifically:
   - `packages["frontend/node_modules/@typescript/typescript-win32-x64"]` was present.
   - `packages["frontend/node_modules/@typescript/typescript-linux-x64"]` was **completely absent** from the `packages` map in the root lockfile.
   - Similar platform omissions affected `@rolldown/binding-linux-x64-gnu` and `@oxlint/binding-linux-x64-gnu`.

2. **Strict Lockfile Behavior on Vercel:**  
   When Vercel clones a repository with a root `package-lock.json`, it runs `npm ci` or `npm install` from the repository root. Because `@typescript/typescript-linux-x64` was missing from the root lockfile's package definitions, npm on Vercel's Linux environment did not download or unpack the Linux executable to disk.

3. **Native TypeScript 7 Architecture:**  
   TypeScript `7.0.2` employs native platform binaries via `@typescript/typescript-<os>-<arch>`. When `tsc` was invoked on Vercel's Linux host, `lib/getExePath.js` attempted to locate `@typescript/typescript-linux-x64`, failed to find it on disk, and immediately aborted.

4. **Secondary Lockfile Anomaly (`frontend/package-lock.json`):**  
   A secondary lockfile existed in `frontend/package-lock.json` containing resolved URLs pointing to an external Chinese registry mirror (`https://registry.npmmirror.com/`). In an npm workspace setup, nested lockfiles are ignored by root npm commands and introduce registry inconsistency.

5. **Runtime Node Version Default:**  
   The build log reported `Node.js v26.13.1`. Bleeding-edge / experimental Node versions can cause compatibility warnings with Vite 8 tooling (Vite 8, `@vitejs/plugin-react@6`, and `oxlint` officially specify `"engines": { "node": "^20.19.0 || >=22.12.0" }`).

6. **Origin of `Unknown env config "cache-dir"`:**  
   The warning `npm warn Unknown env config "cache-dir"` occurs when the deployment platform exports `NPM_CONFIG_CACHE_DIR`. In npm CLI, the cache configuration key is `cache` (`npm_config_cache`), whereas Yarn and pnpm use `cache-dir`. When npm encounters `NPM_CONFIG_CACHE_DIR`, it emits this harmless informational warning.

---

## 2. Changes Implemented

### 2.1 Regenerated Root Lockfile (`package-lock.json`)
- Cleanly regenerated inside an isolated Linux container (`node:22-bookworm-slim`, Linux x86_64) using the official npm registry (`https://registry.npmjs.org`).
- Includes complete, validated platform packages with official integrity metadata:
  - `"node_modules/@typescript/typescript-linux-x64"` (`version: 7.0.2`, `sha512-EYdf2cNg7rgCWJnxCdJ+F3V39O8ihb37eHAu1LK8oAFizgTQbPOK7zHHXbPt8rX24COqODXeI3sIf0fCXG7H/A==`)
  - `"node_modules/@typescript/typescript-win32-x64"` (`version: 7.0.2`, `sha512-0BQ3HkAHHlKLSp1qRvf3SUhGpGsDuhB/jgFw75guyqbxJqEaS0Cw/VFO8i2nHglJUzQCRtMMR/IBAKE3ETMC4g==`)
  - `"node_modules/@rolldown/binding-linux-x64-gnu"` (`version: 1.2.19`)
  - `"node_modules/@oxlint/binding-linux-x64-gnu"` (`version: 1.95.0`)
- Validated with `0 vulnerabilities`.

### 2.2 Harmonized Frontend Lockfile (`frontend/package-lock.json`)
- Cleanly regenerated against the official npm registry (`https://registry.npmjs.org`), removing all references to `registry.npmmirror.com`.
- Guarantees complete cross-platform integrity whether built from the workspace root or directly within the `frontend/` directory.

### 2.3 Added `engines` Field in Root `package.json`
- Configured:
  ```json
  "engines": {
    "node": ">=22.12.0",
    "npm": ">=10.0.0"
  }
  ```
- Signals Vercel's build container to pin to Node 22 LTS (Active LTS) matching Vite 8 and Rolldown compatibility guidelines.

### 2.4 Added Vercel Configuration (`vercel.json`)
- Created root `vercel.json`:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "vite",
    "buildCommand": "npm run build",
    "outputDirectory": "frontend/dist",
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- Explicitly points Vercel to `frontend/dist` and enables client-side routing for React Router DOM.

---

## 3. Files Modified & Git Summary

| File | Status | Description of Change |
| :--- | :---: | :--- |
| `package.json` | Modified | Added `"engines": { "node": ">=22.12.0", "npm": ">=10.0.0" }`. |
| `package-lock.json` | Regenerated | Complete cross-platform lockfile with Linux x64 and Win32 x64 dependencies from `registry.npmjs.org`. |
| `frontend/package-lock.json` | Regenerated | Canonical lockfile from `registry.npmjs.org` with 0 mirror URLs. |
| `vercel.json` | Created | Vercel build configuration, output directory (`frontend/dist`), and SPA rewrites. |

*No application source code, components, styles, or logic were modified.*

---

## 4. Isolated Linux Clean-Install & Build Verification

The fix was verified inside a pristine Docker container (`node:22-bookworm-slim`, Linux x86_64, Node v22.23.5, npm 10.9.9) using an isolated sandbox workspace:

### 4.1 Verification Sequence
```bash
# 1. Clean environment install
npm ci --include=optional

# 2. Verify Linux TypeScript binary on disk
./node_modules/.bin/tsc --version

# 3. Execute root build command
npm run build
```

### 4.2 Verified Output Log
```text
=== 1. Verifying environment ===
Node version: v22.23.5
npm version:  10.9.9
OS / Arch:    Linux / x86_64

=== 2. Creating isolated sandbox workspace ===

=== 3. Inspecting root lockfile for Linux TypeScript ===
    "node_modules/@typescript/typescript-linux-x64": {
      "version": "7.0.2",
      "resolved": "https://registry.npmjs.org/@typescript/typescript-linux-x64/-/typescript-linux-x64-7.0.2.tgz",
      "integrity": "sha512-EYdf2cNg7rgCWJnxCdJ+F3V39O8ihb37eHAu1LK8oAFizgTQbPOK7zHHXbPt8rX24COqODXeI3sIf0fCXG7H/A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "Apache-2.0",

=== 4. Running clean npm ci --include=optional ===
added 37 packages, and audited 39 packages in 19s
11 packages are looking for funding
found 0 vulnerabilities

=== 5. Verifying tsc executable on Linux ===
Version 7.0.2

=== 6. Running root build script (npm run build) ===
> mallmind-main@1.0.0 build
> npm --prefix frontend run build

> frontend@0.0.0 build
> tsc -b && vite build

vite v8.3.8 building client environment for production...
transforming...
✓ 2165 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.77 kB │ gzip:   0.43 kB
dist/assets/index-D0x3-M-W.css   11.24 kB │ gzip:   2.81 kB
dist/assets/index-D-_M81j7.js   501.70 kB │ gzip: 133.58 kB
✓ built in 1.54s

=== 7. Verifying build artifacts ===
total 36
drwxr-xr-x 3 root root 4096 Nov 24 10:01 .
drwxr-xr-x 6 root root 4096 Nov 24 10:01 ..
drwxr-xr-x 2 root root 4096 Nov 24 10:01 assets
-rwxr-xr-x 1 root root 9522 Nov 24 10:01 favicon.svg
-rwxr-xr-x 1 root root 5031 Nov 24 10:01 icons.svg
-rw-r--r-- 1 root root  774 Nov 24 10:01 index.html

=== ALL CHECKS PASSED SUCCESSFULLY ===
```

---

## 5. Vercel Project Configuration Guidelines

When deploying this repository on Vercel:

| Setting | Recommended Value | Explanation |
| :--- | :--- | :--- |
| **Framework Preset** | `Vite` | Matches Vite 8 build tooling. |
| **Root Directory** | `./` (Repository root) | Retains the npm workspace root so root `package-lock.json` is used. |
| **Build Command** | `npm run build` | Defined in root `package.json` (`npm --prefix frontend run build`). |
| **Output Directory** | `frontend/dist` | Configured in `vercel.json`. |
| **Install Command** | `npm ci --include=optional` | Ensures all platform-specific optional dependencies install cleanly. |
| **Node.js Version** | `22.x` | Governed by `"engines": { "node": ">=22.12.0" }` in `package.json`. |

---

## 6. Documented Deployment Architectural Boundaries

In accordance with strict project guidelines:
1. **Frontend-Only Deployment on Vercel:**  
   Vercel deploys the **React 19 Single Page Application**.
2. **Backend & AI Service Reachability:**  
   The Java Spring Boot backend (port `8085`) and Python FastAPI AI model service (port `8001`) run as separate local/cloud microservices. Because `http://localhost:8085` and `http://localhost:8001` refer to the visitor's local machine, client browser requests to `/api` or `/ai` will not reach backend services unless those services are deployed to public cloud URLs (e.g., AWS, Render, Railway, or Google Cloud Run) and configured via environment variables (`VITE_API_BASE_URL` and `VITE_MODEL_SERVICE_URL`).
3. **No Secrets in Frontend:**  
   No database credentials, JWT secrets, or backend API keys are bundled into the client build.

---

## 7. Acceptance Criteria Verification

- [x] **Criterion 1:** Root lockfile contains `@typescript/typescript-linux-x64@7.0.2` and its integrity metadata.
- [x] **Criterion 2:** Clean Linux installation (`npm ci --include=optional`) succeeds with 0 vulnerabilities.
- [x] **Criterion 3:** `tsc -b` succeeds without platform binary errors.
- [x] **Criterion 4:** `vite build` succeeds, generating all production chunks in `frontend/dist`.
- [x] **Criterion 5:** Root `npm run build` succeeds end-to-end.
- [x] **Criterion 6:** No unrelated application code or features were changed.
- [x] **Criterion 7:** Git changes are strictly confined to `package.json`, `package-lock.json`, `frontend/package-lock.json`, and `vercel.json`.
