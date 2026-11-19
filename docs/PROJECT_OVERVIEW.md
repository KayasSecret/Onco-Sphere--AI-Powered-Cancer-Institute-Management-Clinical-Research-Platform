# Onco Sphere — Project Overview

> **Full Title:** Onco Sphere (HELIX) — Cancer Institute Management & Clinical Research Platform  
> **Architecture:** Decoupled Full-Stack Web Application (React 18 SPA + FastAPI REST API + MySQL 8)  
> **Primary Domain:** Clinical Oncology Operations, Patient Registry, Pathology Diagnostics & Research Access Governance

---

## 1. Executive Summary

**Onco Sphere** is a full-stack clinical oncology management and research governance platform designed for cancer research institutes and pathology laboratories. It unifies day-to-day patient registry workflows, longitudinal visit tracking, diagnostic pathology report generation (Oxidative Stress Biomarker Reports with live A4 PDF preview & export), clinical document/scan storage, and a multi-step researcher access governance pipeline under strict Role-Based Access Control (RBAC).

The platform replaces fragmented spreadsheets, manual Word/PDF pathology templates, and unstructured email-based researcher onboarding with a single audited, responsive web application that works seamlessly across desktop workstations (up to 1920px+) and clinical mobile devices (320px–767px).

---

## 2. Problem Statement

Cancer institutes and clinical research centers commonly face five operational bottlenecks:
1. **Fragmented Patient Records:** Patient demographics, cancer staging, pathology reports, scan images, and follow-up visit notes are scattered across disconnected systems.
2. **Manual Pathology Reporting:** Generating standardized biomarker reports (such as Oxidative Stress panels) manually is slow, error-prone, lacks automatic abnormal-flagging, and offers no version or print audit trail.
3. **Unstructured Researcher Onboarding:** Interns, doctors, and visiting researchers apply via ad-hoc emails without standardized credential verification, ID proof uploads, or Super Admin approval workflows.
4. **Insecure Document Delivery:** Raw cloud storage links often fail with cross-origin or ACL restrictions when clinicians attempt to preview or download patient PDFs and scan images.
5. **Poor Mobile Usability:** Legacy clinical web portals break on smaller screens, preventing clinicians from reviewing records or submitting reports on tablets and phones.

---

## 3. Core Objectives

- **Centralized Patient & Visit Registry:** Maintain sequential institute patient codes (`ICSR-00001+`), longitudinal OPD/clinical visits, symptoms, investigations, prescriptions, treatments, and follow-ups.
- **Automated Pathology & Biomarker Reporting (Onco Receipt):** Provide a split-screen clinical report builder with live A4 PDF preview on desktop, direct offscreen PDF export on mobile, dynamic master reference parameters, doctor signatures, institute branding, report versioning, and print audit logging.
- **Governed Researcher Access (Onco Access):** Implement a 5-step researcher application wizard with auto-saved drafts, 6-digit OTP draft resume, document uploads, Super Admin review modal, approval/rejection email notifications, and strict RBAC (`SUPER_ADMIN`, `ADMIN`, `STUDENT`).
- **Secure Media & Document Handling:** Support Cloudinary cloud uploads with automatic local static fallback and an authenticated backend streaming proxy for reliable inline viewing and attachment downloads.
- **Responsive, Theme-Aware Clinical UI:** Deliver a consistent Light/Dark clinical interface with a floating top navigation bar, gliding sidebar, and mobile-first layouts across 320px–1920px viewports.

---

## 4. Target Users & Roles

| Role (`UserRole` enum) | Typical Persona | Primary Capabilities |
|---|---|---|
| **`SUPER_ADMIN`** | Institute Director / Chief Administrator | Full platform access: manage Admins & Researchers, approve/reject applications, configure institute branding/signatures/parameters, manage all patients, visits, and pathology reports, inspect storage telemetry. |
| **`ADMIN`** | Clinical Oncologist / Lab Coordinator | Register & edit patients, manage visits/prescriptions/treatments, create/edit/print/export Onco Receipt pathology reports, configure report settings, and review non-Super-Admin access requests. |
| **`STUDENT`** | Approved Researcher / Medical Intern | Read-oriented clinical research access to Dashboard analytics, Patient Registry, Patient Profiles, Visit Details, and personal Platform Settings (restricted from admin CRUD and report administration). |

---

## 5. High-Level System Capabilities

1. **Public Landing & Researcher Onboarding (`/`, `/register/apply`)** — 5-step application wizard (`Identity → Academic → Research → Documents → Review`), 60-second draft auto-save, OTP-verified draft resume, and automated email notifications.
2. **Authentication & Account Security (`/login`, `/forgot-password`, `/reset-password`)** — JWT access/refresh tokens with silent Axios refresh queue, bcrypt (`12 rounds`) password hashing, and 6-digit OTP password reset.
3. **Clinical Analytics Dashboard (`/dashboard`)** — Real-time institute metrics, patient distribution, and activity telemetry.
4. **Patient Registry & Clinical Visits (`/patients`, `/patients/new`, `/patients/:id`, `/visits/:visitId`)** — Full patient CRUD, report & cancer scan uploads, authenticated download proxy, and structured visit management (check-in, symptoms, investigations, prescriptions, treatments, follow-ups).
5. **Onco Receipt — Pathology & Biomarker Reporting (`/reports`, `/reports/new`, `/reports/edit/:id`, `/reports/print/:id`, `/reports/settings`)** — Versioned Oxidative Stress & pathology reports, live A4 preview (desktop), direct PDF export (`html2canvas` + `jsPDF`), audit trail, doctor signatures, and customizable reference ranges.
6. **Onco Access — User & Application Governance (`/admin-management`)** — Pending application review modal with document viewer, one-click Approve/Reject, user creation, role/status management.
7. **Platform Settings (`/settings`)** — 5-section control center (`Account Overview`, `Appearance`, `Storage`, `Security`, `About Onco Sphere`) with Light/Dark/System themes and storage telemetry.

---

## 6. Repository Structure at a Glance

```text
Onco-Sphere--AI-Powered-Cancer-Institute-Management-Clinical-Research-Platform/
├── helix-frontend/          # React 18 + Vite 8 + Tailwind CSS + Redux Toolkit SPA
│   ├── public/              # Static public assets
│   ├── src/
│   │   ├── assets/          # Institute branding assets (ICSR-LOGO.png)
│   │   ├── components/      # Reusable UI primitives (Radix/shadcn), DataTable, DatePicker, Visits
│   │   ├── config/          # Navigation & role configuration
│   │   ├── hooks/           # Custom hooks (e.g., useCamera)
│   │   ├── layouts/         # AppLayout (floating navbar + gliding sidebar), AuthLayout
│   │   ├── lib/             # Shared utilities (cn, age/byte formatters, theme) & regex validation
│   │   ├── pages/           # Feature modules: Landing, Auth, Dashboard, Patients, Visits, Reports, Admin, Settings
│   │   ├── redux/           # Redux Toolkit store & slices (auth, ui, patient, admin, visit)
│   │   ├── routes/          # AppRouter & RequireAuth RBAC route guard
│   │   └── services/        # Axios instance (JWT refresh interceptor) & domain API services
│   ├── package.json         # Frontend dependencies & scripts
│   ├── tailwind.config.js   # Design tokens & dark mode config
│   ├── vite.config.js       # Vite bundler & /api dev proxy
│   └── vercel.json          # SPA rewrite rules for Vercel deployment
├── helix-backend/           # FastAPI + SQLAlchemy 2.0 + Pydantic v2 + MySQL 8 REST API
│   ├── app/
│   │   ├── config/          # Pydantic BaseSettings (.env loader)
│   │   ├── database/        # SQLAlchemy engine, SessionLocal, Base, create_tables
│   │   ├── middleware/      # JWT authentication & require_roles RBAC dependencies
│   │   ├── models/          # 19 SQLAlchemy ORM models (MySQL tables)
│   │   ├── routes/          # 9 FastAPI routers mounted under /api/v1
│   │   ├── schemas/         # Pydantic v2 request/response validation schemas
│   │   ├── services/        # Business logic (auth_service, async Resend email_service)
│   │   ├── templates/emails/# 7 Jinja2 HTML email templates
│   │   └── utils/           # bcrypt password hashing, OTP generator, JWT helpers
│   ├── main.py              # FastAPI app, lifespan table/column bootstrap, CORS, static mount
│   ├── requirements.txt     # Pinned Python dependencies
│   ├── seed.py              # Initial database seeding script
│   └── seed_reports.py      # Oxidative Stress template & parameter seeder
└── docs/                    # Complete technical & interview documentation suite
```

---

## 7. Note on AI Naming vs. Verified Implementation

While the repository title references *"AI-Powered Cancer Institute Management & Clinical Research Platform"*, a strict audit of the current codebase confirms that **all currently implemented features are deterministic clinical workflows, rule-based biomarker interpretation, data management, and reporting** — there is **no** live machine-learning model inference or LLM API integration currently wired in the frontend or backend. This is transparently documented as a **Future Scope** roadmap item in `HR_PROJECT_PRESENTATION.md`.
