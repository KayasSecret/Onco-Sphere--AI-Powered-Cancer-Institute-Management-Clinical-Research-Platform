# Onco Sphere — Technical Interview Preparation Q&A

These questions and answers are grounded directly in the actual Onco Sphere codebase so you can answer deep follow-up questions with confidence and precision.

---

## 1. Architecture & System Design

### Q1: Walk me through the overall architecture of Onco Sphere.
**Answer:** Onco Sphere is a decoupled full-stack web application. The frontend is a **React 18** SPA built with **Vite 8**, styled with **Tailwind CSS** + **Radix UI**, using **Redux Toolkit** for global state and **Axios** for API communication. The backend is a **FastAPI** REST API organized into 9 routers under `/api/v1`, using **Pydantic v2** for validation, **SQLAlchemy 2.0** (`PyMySQL`) for ORM access to a **19-table MySQL 8** database, **Cloudinary** (with local fallback) for file storage, and **Resend HTTPS API** via async `httpx` + **Jinja2** templates for background emails.

### Q2: Why did you choose FastAPI over Flask or Django, and React + Vite over Next.js?
**Answer:**
- **FastAPI** gives us native Pydantic v2 validation, dependency injection (which makes RBAC like `Depends(require_roles([...]))` super clean), built-in `BackgroundTasks` for non-blocking emails, async `httpx` support, and automatic OpenAPI docs (`/api/docs`).
- **React 18 + Vite** is ideal for an authenticated clinical dashboard SPA where SEO/SSR isn't needed behind login, while giving instant dev HMR, simple static deployment on Vercel (`vercel.json` SPA rewrites), and clean separation from the Python API.

### Q3: How is the database structured across your 19 MySQL tables?
**Answer:** The schema is grouped into 4 normalized domains:
1. **Identity & Onboarding (3 tables):** `users`, `researcher_profiles` (1:1 FK to `users`), `researcher_drafts`.
2. **Patient Registry (3 tables):** `patients` (with sequential `ICSR-00001` codes), `patient_reports`, `patient_cancer_images`.
3. **Clinical Visits (6 tables):** `visits` + 5 child tables (`visit_symptoms`, `visit_investigations`, `visit_prescriptions` with JSON medicines, `visit_treatments`, `visit_followups`).
4. **Pathology Reporting — Onco Receipt (7 tables):** `report_templates`, `report_parameters`, `reports`, `report_values`, `report_audit_logs`, `doctor_signatures`, `institute_info`.

---

## 2. Authentication, Authorization & Security

### Q4: How do you handle JWT expiration without disrupting a clinician mid-workflow?
**Answer:** In `helix-frontend/src/services/axiosInstance.js`, our Axios response interceptor catches `401 Unauthorized` responses (skipping `/auth/login` and `/auth/refresh`). It uses an `isRefreshing` boolean lock and a `failedQueue` array: the first 401 calls `POST /api/v1/auth/refresh` with the stored refresh token, while any other concurrent 401 requests wait in `failedQueue`. Once the new access token arrives, all queued requests are replayed with the fresh Bearer header. If refresh fails, tokens are cleared and the user is redirected to `/login`.

### Q5: How is Role-Based Access Control (RBAC) enforced?
**Answer:** In two layers:
1. **Frontend (UX layer):** `RequireAuth.jsx` wraps protected routes in `src/routes/index.jsx` (e.g., `<RequireAuth roles={['ADMIN', 'SUPER_ADMIN']}>` for patient writes, Onco Access, and Onco Receipt) and `AppLayout.jsx` filters sidebar links by role.
2. **Backend (Security boundary):** Every protected endpoint uses FastAPI dependencies `get_current_user` and `require_roles([UserRole.ADMIN, UserRole.SUPER_ADMIN])` in `app/middleware/auth.py`. Even if someone bypasses the UI, the API enforces role checks server-side and also blocks `ADMIN` users from approving, rejecting, or deleting `SUPER_ADMIN` accounts.

### Q6: How are passwords hashed and verified?
**Answer:** In `helix-backend/app/utils/password.py`, passwords are hashed with **`bcrypt` at 12 rounds** (`bcrypt.gensalt(rounds=12)`), safely truncating UTF-8 bytes at 72 bytes per the bcrypt specification. Verification uses constant-time `bcrypt.checkpw`, with a `passlib` fallback in case legacy hashes ever exist. Plaintext passwords are never logged or returned by any schema.

### Q7: Explain your researcher registration, draft OTP, and approval workflow.
**Answer:**
1. Applicants complete a 5-step wizard (`/register/apply`) with per-step Yup validation (including age `>= 18` via a custom `DOBPicker`, phone/email/password regexes, and 5 MB PDF/JPG/PNG document uploads).
2. On Step 1 advance, `POST /api/v1/researcher/save-draft` checks `users` and `researcher_drafts` (case-insensitively) to reject duplicate emails immediately (`409 Conflict`), then auto-saves every 60 seconds.
3. Returning users can resume a saved draft only after verifying a 6-digit expiring OTP (`POST /researcher/request-otp` → `verify-otp`).
4. Final submission (`POST /api/v1/auth/register`) creates `User(role=STUDENT, is_approved="PENDING", is_active=False)` + `ResearcherProfile`, marks the draft `submitted`, stops auto-save, and does **not** issue JWT tokens.
5. Login is blocked with `403 Forbidden` until a Super Admin reviews the application in `ApplicationReviewModal` and calls `PATCH /api/v1/users/{id}/approval` (`APPROVE`), which sets `is_approved="APPROVED"`, `is_active=True`, and queues an approval email to `user.email`.

---

## 3. Frontend Engineering & Responsive Design

### Q8: Why did you use manual Yup validation instead of `yupResolver` in the 5-step registration wizard?
**Answer:** `yupResolver` passed into `useForm()` is bound once at mount time (Step 1) and doesn't dynamically swap schemas across steps. In `ResearcherApplicationPage.jsx`, we keep a `STEP_SCHEMAS` array (`[null, step1Schema, step2Schema, step3Schema, step4Schema]`) and call `schema.validate(getValues(), { abortEarly: false, stripUnknown: true })` manually on `goNext()`, ensuring each step's exact rules run cleanly.

### Q9: How does PDF generation work in Onco Receipt, and how did you optimize it for mobile?
**Answer:** We render a dedicated A4-proportioned React component (`OxidativeReportDocument.jsx`) containing institute branding, patient metadata, color-coded biomarker results, and clinician signatures. On **desktop (`>=768px`)**, it renders live in a split-screen preview alongside the clinical form. On **mobile (`<768px`)**, we hide the inline preview via responsive breakpoints to prevent horizontal overflow and avoid continuous DOM/layout work on phones, while keeping on-demand PDF export identical via `html2canvas` (`scale: 2`) → `jsPDF` (A4 portrait).

### Q10: Tell me about a tricky CSS/responsive bug you solved in this project.
**Answer:** Two concrete ones:
1. **CSS Grid `1fr` Blowout:** On 320px–375px mobile viewports, `grid-template-columns: 1fr` allows wide flex children to expand past 100% viewport width. Switching to `minmax(0, 1fr)` with `min-width: 0; max-width: 100%` eliminated horizontal scrolling completely.
2. **Cascade Order & Unlayered `display` Overrides:** A mobile `@media (max-width: 960px)` rule setting `position: static` on the Settings navigation dock was declared *before* the base `.onco-settings-dock { position: sticky; }` rule, causing the sticky card to float over content on mobile. Moving media queries after base rules and converting horizontal tab strips into vertical stacked mobile cards fixed the overlap completely.

---

## 4. Backend Engineering & Integrations

### Q11: How do you handle file uploads and why did you build a `/download` streaming proxy?
**Answer:** Uploads (`app/routes/upload.py`) validate file extensions, MIME types, and size (5 MB for researcher docs), attempt Cloudinary upload first, and automatically fall back to local `/static/uploads/` if Cloudinary is unavailable. For viewing/downloading patient PDFs and cancer scans, raw Cloudinary URLs can fail with browser CORS or `401` PDF ACL restrictions — so `patients.py` exposes authenticated `/download` endpoints that generate signed Cloudinary `private_download_url` links (or read local fallback files) via a shared `_serve_asset_file()` helper and stream them back with proper `Content-Disposition` (`inline` or `attachment`) and `Content-Type` headers.

### Q12: Why does your email service use Resend's HTTPS API instead of SMTP, and how does it handle failures?
**Answer:** Cloud platforms like Render Free often block outbound SMTP ports (25/465/587), whereas HTTPS port 443 is always open. `email_service.py` sends via async `httpx` inside FastAPI `BackgroundTasks` so API endpoints never block on email latency. It attaches a UUID `Idempotency-Key` per email, retries transient errors (`TransportError`, `429`, `5xx`) up to 3 times with exponential backoff, immediately stops on permanent `4xx` errors (logging `[EMAIL_REJECTED]` with masked recipient emails), and never raises unhandled exceptions into the main request flow.

### Q13: What happened when you debugged the approval email delivery issue?
**Answer:** By tracing the full approval pipeline end-to-end and running live API tests, I confirmed that `PATCH /api/v1/users/{id}/approval` correctly mapped `user_email=user.email` and rendered `approval.html`, but Resend rejected external applicant emails with `HTTP 403 validation_error` because `onboarding@resend.dev` is a sandbox sender restricted to the Resend account owner's email. Meanwhile, the owner's own alerts showed `Delivered` in Resend, creating the illusion that all emails were working. This taught me to always verify per-recipient delivery responses rather than assuming a provider dashboard's `Delivered` count applies to every recipient.

---

## 5. Questions to Expect About Trade-offs & Improvements

### Q14: What would you improve first before deploying Onco Sphere to a large hospital?
**Answer:**
1. **Verify a custom domain in Resend** (SPF/DKIM) and set `EMAIL_FROM=noreply@<verified-domain>` so all external clinicians and applicants receive emails.
2. **Adopt Alembic migrations** (already listed in `requirements.txt`) instead of startup `ALTER TABLE` guards for strict schema version control.
3. **Add `HttpOnly` Secure cookies** for refresh tokens (hardening against XSS compared to `localStorage`) and add rate limiting on `/auth/login`, `/request-otp`, and `/forgot-password`.
4. **Add automated CI testing** (Pytest for FastAPI endpoints + Playwright/RTL for critical flows) and route-based `React.lazy()` code splitting.
