# Onco Sphere — HR & Technical Presentation Guide

> **Use this document** to present **Onco Sphere** confidently to HR managers, recruiters, technical interviewers, and academic/project evaluators.

---

## 1. 60-Second Elevator Pitch

> *"Onco Sphere is a full-stack Cancer Institute Management and Clinical Research Platform I built using **React 18, Redux Toolkit, Tailwind CSS, FastAPI, SQLAlchemy, and MySQL 8**. It centralizes three critical clinical workflows in one role-secured system: (1) a **Patient & Longitudinal Visit Registry** with secure document/scan streaming, (2) **Onco Receipt**, an automated **Oxidative Stress & Pathology Report Generator** with live A4 PDF preview, versioning, and print audit logs, and (3) **Onco Access**, a 5-step **Researcher Onboarding & Super Admin Approval** pipeline with draft auto-save, OTP verification, and async HTML email notifications. The entire platform is mobile-responsive from 320px phones to 1920px desktops."*

---

## 2. Problem Statement & Objectives

**The Problem:**
- Cancer research institutes often juggle spreadsheets for patient records, manual Word templates for pathology reports, and unstructured email threads for researcher/intern access requests.
- Manual reporting introduces calculation/reference-range errors and lacks audit trails, while direct cloud-storage file links often break due to browser CORS or ACL restrictions.

**Project Objectives:**
1. Build a unified, role-secured clinical platform (`SUPER_ADMIN`, `ADMIN`, `STUDENT`) backed by a normalized relational database.
2. Automate standardized pathology reporting with real-time abnormal-value flagging, customizable institute branding/signatures, version history, and instant A4 PDF export.
3. Enforce strict onboarding governance with multi-step credential verification, document uploads, Super Admin review, and automated email alerts.
4. Deliver a polished, accessible, responsive UI supporting both Light and Dark clinical themes across desktop and mobile devices.

---

## 3. Key Features & Differentiators

1. **5-Step Researcher Application with Auto-Save & OTP Resume:**
   - Validates age (`>= 18`), Indian phone format, strong password policy, and file types/sizes (PDF/JPG/PNG, max 5 MB) on both client and server.
   - Auto-saves drafts every 60 seconds and protects draft resumption with a 6-digit expiring OTP.
2. **Onco Receipt — Live A4 Pathology Report Engine:**
   - Synchronized split-screen A4 preview on desktop (`>=768px`) and streamlined distraction-free clinical form on mobile (`<768px`), with identical high-DPI A4 PDF export (`html2canvas` + `jsPDF`).
   - Dynamic master reference parameters, doctor signatures, institute logo/stamp branding, report versioning, and immutable audit logs.
3. **Resilient File Uploads & Authenticated Download Proxy:**
   - Uses Cloudinary with automatic fallback to local static storage if cloud storage is unavailable, plus an authenticated backend streaming proxy (`/download`) that eliminates CORS and ACL errors for inline viewing and downloads.
4. **Production-Grade Auth & Silent Token Refresh:**
   - Short-lived JWT access tokens + 7-day refresh tokens with an Axios request queue that silently refreshes expired tokens without interrupting the user.
5. **Non-Blocking Async Email Pipeline:**
   - Uses FastAPI `BackgroundTasks` + `httpx` + Resend HTTPS API (port 443, compatible with cloud hosts that block SMTP) with exponential-backoff retries, idempotency keys, and 7 Jinja2 HTML templates.

---

## 4. Technology Stack (Why Each Was Chosen)

| Layer | Choice | Why Chosen |
|---|---|---|
| **Frontend** | React 18 + Vite 8 + Tailwind CSS + Radix UI | Fast HMR & builds, accessible unstyled primitives (dialogs/selects/tabs), consistent design tokens with Light/Dark mode. |
| **State & Forms** | Redux Toolkit + React Hook Form + Yup | Predictable async thunk state for auth/patients/admin; zero-lag form validation on multi-step clinical forms. |
| **Backend** | FastAPI + Pydantic v2 + SQLAlchemy 2.0 | High-performance Python API with automatic OpenAPI docs (`/api/docs`), strict type validation, and clean dependency injection for RBAC. |
| **Database** | MySQL 8 (19 tables) | ACID-compliant relational integrity for structured patient, visit, biomarker, and audit records; SSL-ready for cloud MySQL (Aiven). |
| **PDF Engine** | `html2canvas` + `jsPDF` | Pixel-accurate A4 clinical document rendering directly from the verified React report layout without needing a heavy headless browser on the backend. |
| **Security** | `bcrypt` (12 rounds) + HS256 JWT + RBAC | Industry-standard salted password hashing, stateless token auth, and server-side role enforcement on every endpoint. |

---

## 5. Architecture & Database Highlights

- **Frontend:** 80 modular source files organized by feature (`Landing`, `Auth`, `Dashboard`, `Patients`, `Visits`, `Reports`, `Admin`, `Settings`) communicating with `/api/v1/*` via a single Axios instance.
- **Backend:** 9 FastAPI routers, 38 Python modules, clean separation of `routes → schemas → services → models → utils`.
- **Database:** 19 normalized MySQL 8 tables across 4 domains:
  - *Identity & Governance* (`users`, `researcher_profiles`, `researcher_drafts`)
  - *Patient Registry* (`patients`, `patient_reports`, `patient_cancer_images`)
  - *Clinical Visits* (`visits`, `visit_symptoms`, `visit_investigations`, `visit_prescriptions`, `visit_treatments`, `visit_followups`)
  - *Pathology Reporting* (`report_templates`, `report_parameters`, `reports`, `report_values`, `report_audit_logs`, `doctor_signatures`, `institute_info`)

---

## 6. Security Implementation

- **Password Security:** `bcrypt` with 12 salt rounds (never stored in plaintext; 72-byte safe handling).
- **Authentication & Session Safety:** Short-lived JWT access tokens (30 min), refresh tokens (7 days), scoped 15-min password-reset tokens, and `pageshow` bfcache guard after logout.
- **Authorization (RBAC):** Dual-layer enforcement — frontend `<RequireAuth roles={[...]} />` for UX plus mandatory backend `Depends(require_roles([...]))` on every sensitive route.
- **Approval Gate:** Newly registered researchers default to `role=STUDENT`, `is_approved=PENDING`, `is_active=False` and are blocked with `403 Forbidden` until explicitly approved by an Admin/Super Admin.
- **Privacy & Logging:** Secrets loaded exclusively from `.env` (gitignored); email logs mask recipient addresses (`j***@domain.com`) and never log API keys, passwords, or OTPs.

---

## 7. Real-World Technical Challenges & Solutions

1. **Challenge — Silent Auth Race Conditions on Token Expiry:**
   - *Solution:* Implemented a request queue (`failedQueue` + `isRefreshing` lock) inside `axiosInstance.js` so multiple simultaneous `401` responses trigger only **one** `/auth/refresh` call and seamlessly replay all pending requests.
2. **Challenge — Pending Registration Polluting Auth State & Auto-Save `409` Loops:**
   - *Solution:* Guarded `registerThunk.fulfilled` so pending applications (`access_token: null`) never persist null tokens, halted the 60s draft auto-save timer upon submission, and moved duplicate-email validation to Step 1 (`save-draft`).
3. **Challenge — Mobile Horizontal Overflow on Complex Clinical Forms & A4 Previews:**
   - *Solution:* Audited 320px–430px viewports, replaced bare `1fr` CSS grids with `minmax(0, 1fr)`, fixed CSS media-query cascade ordering, converted horizontal tab strips into vertical mobile navigation cards, and hid inline A4 preview on `<768px` while keeping identical on-demand PDF export.
4. **Challenge — Cloud Storage & SMTP Blocking on Free Cloud Hosts:**
   - *Solution:* Built an automatic local-storage fallback + signed download proxy for Cloudinary documents, and switched email delivery to the Resend HTTPS API (port 443) with retries and idempotency keys.

---

## 8. Real-World Impact & Future Scope

**Real-World Benefits:**
- Cuts pathology report turnaround time while standardizing institute branding and biomarker flagging.
- Creates an auditable governance trail for who accessed, created, edited, or printed clinical documents.

**Honest Future Roadmap (Clearly Separated from Current Implementation):**
- **AI / ML Clinical Decision Support:** Integrate predictive oncology models (e.g., oxidative stress risk scoring, imaging triage, or LLM-assisted clinical summaries) — *not yet implemented in the current codebase*.
- **Formal Alembic Migrations:** Replace startup `ALTER TABLE` guards with versioned Alembic migration scripts.
- **Verified Custom Email Domain:** Attach a custom verified domain in Resend so production emails deliver to all external applicant addresses (beyond the Resend sandbox owner address).
- **Automated Test Suite & Code Splitting:** Add Pytest + React Testing Library CI pipelines and route-level `React.lazy()` code splitting to reduce initial JS bundle size.
