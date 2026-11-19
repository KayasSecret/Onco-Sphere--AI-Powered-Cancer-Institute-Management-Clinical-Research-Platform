# Onco Sphere — Feature & Module Documentation

This document details every major module, user role capability, and internal implementation mechanism verified in the Onco Sphere codebase.

---

## 1. Public Landing & Authentication Module

### 1.1 Landing Page (`/`)
- **File:** `helix-frontend/src/pages/Landing/LandingPage.jsx`
- **What It Does:** Public institutional portal introducing Onco Sphere's clinical oncology and research capabilities with direct CTAs to **Sign In** (`/login`) and **Apply for Researcher Access** (`/register/apply`).

### 1.2 Login & Silent Session Management (`/login`)
- **Files:** `LoginPage.jsx`, `authSlice.js`, `axiosInstance.js`, `app/routes/auth.py`, `app/services/auth_service.py`
- **How It Works Internally:**
  - Validates email/password with React Hook Form + Yup.
  - Backend normalizes email (`.strip().lower()`), verifies bcrypt password hash (`12 rounds`), and checks `is_approved` (`PENDING` → `403`, `REJECTED` → `403`) and `is_active` (`False` → `403`).
  - Issues signed HS256 JWT `access_token` (30 min) and `refresh_token` (7 days), updates `last_login_at`, and stores tokens in `localStorage`.
  - Axios response interceptor transparently refreshes expired access tokens via `POST /api/v1/auth/refresh` and queues concurrent in-flight requests so users are never abruptly kicked out mid-action.

### 1.3 OTP-Based Password Reset (`/forgot-password`, `/reset-password`)
- **Files:** `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx`, `auth_service.py`
- **How It Works Internally:**
  1. `POST /api/v1/auth/forgot-password` generates a 6-digit numeric OTP, stores `reset_otp` + 10-minute `reset_otp_expires_at` on the `users` row, and queues `send_password_reset_otp` via `BackgroundTasks`.
  2. `POST /api/v1/auth/verify-reset-otp` validates the code, immediately invalidates it (preventing replay attacks), and returns a 15-minute scoped `reset_password` JWT.
  3. `POST /api/v1/auth/reset-password` verifies the scoped token and replaces `password_hash` with a newly salted bcrypt hash.

---

## 2. Researcher Onboarding Wizard (`/register/apply`)

- **Files:** `ResearcherApplicationPage.jsx`, `researcherService.js`, `app/routes/researcher.py`, `app/routes/upload.py`, `app/services/auth_service.py`
- **What It Does:** Full-screen 5-step application flow for interns, doctors, and researchers:
  1. **Step 1 — Identity:** Full name, custom `DOBPicker` (enforces minimum age `>= 18` years), gender, 10-digit Indian phone validation, email, strong password (`>= 8` chars, upper, lower, digit, special char) + confirmation.
  2. **Step 2 — Academic:** Institution/university, qualification, specialization, designation (`Intern`, `Researcher`, `Doctor`, `Other`), experience range, optional LinkedIn/ResearchGate URL.
  3. **Step 3 — Research Intent:** Primary research area, cancer type of interest, expected duration, optional supervisor name, research objective (`>= 50` characters), prior cancer institute work toggle.
  4. **Step 4 — Documents & Declarations:** Required Government ID Proof & Institutional ID Card uploads + optional Letter of Intent & Publications (PDF/JPG/PNG, max 5 MB, validated on both frontend and backend), plus accuracy and ethics declarations.
  5. **Step 5 — Review & Confirm:** Read-only summary with section-level **Edit** links and final submission.
- **Internal Safeguards:**
  - **Early Duplicate Detection:** `POST /api/v1/researcher/save-draft` checks `users` and `researcher_drafts` (case-insensitively) and returns `409 Conflict` on Step 1 if the email already exists.
  - **Draft Auto-Save & OTP Resume:** Auto-saves every 60 seconds while active (and immediately halts on submission). Returning applicants with a saved draft verify ownership via a 6-digit OTP (`request-otp` / `verify-otp`) before form data is restored.
  - **Pending Isolation:** New accounts are created with `role=STUDENT`, `is_approved=PENDING`, `is_active=False`, and `access_token=null`; Redux does not authenticate pending accounts until Super Admin approval.

---

## 3. Clinical Analytics Dashboard (`/dashboard`)

- **Files:** `DashboardPage.jsx`, `DashboardPage.css`, `dashboardService.js`, `app/routes/dashboard.py`
- **What It Does:** Authenticated landing workspace displaying real-time institute metrics (`GET /api/v1/dashboard/stats`), active patient counts, treatment status distributions, recent patient activity, and quick navigation cards across desktop and mobile.

---

## 4. Patient Registry & Clinical Profile (`/patients`, `/patients/new`, `/patients/:id`, `/patients/:id/edit`)

- **Files:** `PatientListPage.jsx`, `PatientRegisterPage.jsx`, `PatientEditPage.jsx`, `PatientProfilePage.jsx`, `PhotoSelector.jsx`, `useCamera.js`, `app/routes/patients.py`
- **What It Does:**
  - **Sequential Patient Codes:** Backend auto-generates unique institute IDs (`ICSR-00001`, `ICSR-00002`, ...) inside `generate_icsr_patient_code()`.
  - **Comprehensive Oncology Record (`patients` — 27 columns):** Demographics, contact/emergency details, blood group, cancer type, stage, diagnosis date, treatment status, attending physician, and profile photo (supports file upload or live webcam capture via `useCamera`).
  - **Clinical Reports & Cancer Scans:** Upload PDFs/docs (`patient_reports`) and diagnostic scan images (`patient_cancer_images`), rename scan titles, delete records, and preview/download reliably.
  - **Authenticated Streaming Proxy (`/download`):** `GET /api/v1/patients/{id}/reports/{rid}/download` and `.../cancer-images/{iid}/download` generate signed Cloudinary private download URLs (or read local `/static/uploads` fallback) via a shared `_serve_asset_file()` helper, eliminating browser CORS and Cloudinary 401 ACL failures for both `disposition=inline` and `disposition=attachment`.

---

## 5. Longitudinal Clinical Visits Module (`/visits/:visitId` & Patient Profile Visits Tab)

- **Files:** `VisitDetailPage.jsx`, `src/components/visits/*`, `visitService.js`, `app/routes/visits.py`, `app/models/visit.py`
- **What It Does:** Tracks structured outpatient and oncology treatment encounters linked to a patient:
  - **Visit Lifecycle:** Schedule visit (`POST /api/v1/visits`), check-in with token number & room (`POST /visits/{id}/check-in`), update status (`PATCH /visits/{id}/status`), and delete visit.
  - **Clinical Sub-Records (5 Child Tables):**
    - `visit_symptoms` — Symptom name, severity score/label, patient notes, recorder role.
    - `visit_investigations` — Ordered lab/imaging tests, status, result URLs.
    - `visit_prescriptions` — Structured JSON medication list, clinical instructions, prescribing doctor.
    - `visit_treatments` — Chemotherapy/radiation/procedure logs and clinician attribution.
    - `visit_followups` — Post-visit advice and next appointment scheduling.

---

## 6. Onco Receipt — Pathology & Oxidative Stress Report Generator (`/reports/*`)

- **Files:** `ReportHistoryPage.jsx`, `ReportCreatorPage.jsx`, `ReportPrintPage.jsx`, `ReportSettingsPage.jsx`, `OxidativeReportDocument.jsx`, `ReportsModule.css`, `reportService.js`, `app/routes/report_generator.py`
- **What It Does:**
  - **Report Registry (`/reports`):** Searchable, filterable pathology report archive with responsive desktop table + dedicated mobile report cards (320px–430px), audit history drawer, version history, quick print/download, and delete controls.
  - **Clinical Report Creator (`/reports/new`, `/reports/edit/:id`):**
    - Patient selector (auto-fills registered patient demographics) or manual entry.
    - Dynamic Oxidative Stress & clinical biomarker panel driven by `report_parameters` with live abnormal flagging (`LOW` / `NORMAL` / `HIGH`).
    - **Desktop (`>=768px`):** Split-screen layout with synchronized Live A4 PDF Preview (`OxidativeReportDocument`), plus History, Sample Values, Print, Download PDF, and Save Document toolbar.
    - **Mobile (`<768px`):** Hides inline A4 preview and redundant top buttons for clean clinical form entry; provides a compact top History back button and a prominent bottom **Save Clinical Report** CTA.
    - **PDF Export (`html2canvas` + `jsPDF`):** Captures the exact A4 clinical layout at `scale: 2` and downloads a print-ready A4 PDF identically across desktop and mobile.
  - **Versioning & Audit Trail:** Every save creates/increments versions (`reports`) and appends an immutable event (`CREATED`, `UPDATED`, `PRINTED`) to `report_audit_logs`.
  - **Onco Receipt Settings (`/reports/settings`):** 3-section configuration studio (horizontal tabs on desktop, vertical stacked navigation cards on mobile):
    1. **Institute Branding:** Institute name, address, phone, email, accreditation text, Institute Logo & Verification Stamp uploads with responsive header preview.
    2. **Doctor Signatures:** Add, edit, and delete authorized clinician signatures (name, qualification, designation, signature image).
    3. **Master Parameters:** Add, edit, or reset default biomarker reference ranges, units, and display order.

---

## 7. Onco Access — Admin & Application Governance (`/admin-management`)

- **Files:** `AdminListPage.jsx`, `AdminListPage.css`, `ApplicationReviewModal.jsx`, `adminService.js`, `adminSlice.js`, `app/routes/users.py`
- **What It Does:**
  - Lists all platform accounts with approval status badges (`PENDING`, `APPROVED`, `REJECTED`), role filters, search, and active/inactive toggles.
  - **Application Review Modal:** Displays the applicant's full 5-step `researcher_profile` (identity, academic credentials, research objective, clickable Government & Institutional ID documents) with inline confirmation for **Approve** or **Reject** (with optional rejection reason).
  - **Approval Decision (`PATCH /api/v1/users/{id}/approval`):** Updates `is_approved` and `is_active` in MySQL and queues a non-blocking HTML approval or rejection email to `user.email`.
  - **Direct User Management:** Super Admins and Admins can create/edit/deactivate/delete accounts (with backend guard preventing Admins from modifying Super Admin accounts).

---

## 8. Platform Settings (`/settings`)

- **Files:** `SettingsPage.jsx`, `SettingsPage.css`, `app/routes/users.py`, `app/routes/upload.py`
- **What It Does:** 5-section personal and system control center (`Account Overview`, `Appearance`, `Storage`, `Security`, `About Onco Sphere`) with desktop sticky navigation dock and mobile vertical tab stack:
  - **Account Overview:** Inline profile name/avatar editing (`PUT /api/v1/users/profile`) and role clearance telemetry.
  - **Appearance:** Light / Dark / System theme switcher, clinical density, and reduced-motion preferences persisted in `localStorage`.
  - **Storage:** Live storage telemetry (`GET /api/v1/upload/storage`) showing Cloudinary vs. local fallback status, reports/images/backups/avatars breakdown, and capacity utilization.
  - **Security:** Authenticated password change (`POST /api/v1/users/{id}/change-password`) with current-password verification.
  - **About Onco Sphere:** Platform version, compliance posture, and technical specifications.
