<div align="center">

# 🧬 Onco-Sphere

### AI-Ready Cancer Institute Management & Clinical Research Platform

A full-stack, cloud-deployed platform that brings researcher onboarding, administrative approvals, authentication, document storage and email communication for cancer institutes into one structured system.

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://onco-sphere-ai-powered-cancer-insti.vercel.app/)
[![Source Code](https://img.shields.io/badge/💻_Source_Code-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/KayasSecret/Onco-Sphere--AI-Powered-Cancer-Institute-Management-Clinical-Research-Platform)
[![Features](https://img.shields.io/badge/✨_Features-7C3AED?style=for-the-badge)](#-features)

<br/>

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-000000?style=flat-square&logo=resend&logoColor=white)

![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=black)
![Aiven](https://img.shields.io/badge/Database-Aiven-FF4F00?style=flat-square&logo=aiven&logoColor=white)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Researcher Onboarding Workflow](#-researcher-onboarding-workflow)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Security](#-security)
- [Deployment](#-deployment)
- [Local Development](#-local-development)
- [Environment Variables](#-environment-variables)
- [Roadmap](#-roadmap)
- [Screenshots](#-screenshots)
- [Disclaimer](#-disclaimer)
- [Author](#-author)

---

## 🌌 Overview

**Onco-Sphere** replaces scattered spreadsheets, manual approvals and ad-hoc email threads with a single, role-aware web platform for cancer institutes.

It combines:

- **Authentication & authorization** with token-based sessions and protected routes
- **Researcher onboarding** as a controlled, multi-step application process (draft → OTP → admin review)
- **Cloud document storage** through Cloudinary
- **Transactional email** through Resend, isolated in a dedicated service layer
- **A relational data model** on managed MySQL (Aiven)
- **A modular architecture** designed so clinical, analytics and AI modules can be added without restructuring the app

> **Project status:** The core platform (auth, researcher onboarding, admin approval, storage, email) is the implemented foundation. AI-assisted features are part of the [roadmap](#-roadmap) and are not yet shipped.

---

## ✨ Features

### 🔐 Authentication & Authorization
- User registration and login
- Token-based (JWT) authentication
- Protected frontend routes
- Role-based access for users, admins and the super admin
- Password hashing (Passlib + bcrypt)
- OTP-based verification
- Administrative approval workflow

### 👨‍🔬 Researcher Management
- Dedicated researcher application form
- Save and update drafts before submitting
- OTP request and verification step
- Admin review with approve / reject decisions
- Access granted only after approval

### 📄 Document & File Management
- Uploads handled by the backend and stored on **Cloudinary**
- No dependency on the backend server's local disk for persistent files

### 📧 Email Notifications
- Transactional emails through **Resend**
- Dedicated email service layer, so the provider can be swapped without touching route logic
- HTML email templates kept in a separate `templates/` directory

### 🏗️ Engineering Foundation
- Separation of concerns: routes, schemas, services, models
- Pydantic validation on every request
- Auto-generated interactive API docs (Swagger UI and ReDoc)
- Environment-based configuration, no secrets in code

---

## 🔬 Researcher Onboarding Workflow

```mermaid
flowchart TD
    A[Researcher] --> B[Fill application form]
    B --> C[Save draft]
    C --> D[Request OTP]
    D --> E[Verify OTP]
    E --> F{Admin review}
    F -->|Approved| G[Researcher access granted]
    F -->|Rejected| H[Application rejected]
```

Onboarding is handled as an application process instead of instant account creation, so every researcher is verified and approved before getting access.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    U[👤 User] --> FE[React + Vite Frontend<br/>Vercel]
    FE -->|HTTPS / REST| BE[FastAPI Backend<br/>Render]
    BE --> DB[(MySQL<br/>Aiven)]
    BE --> CL[☁️ Cloudinary<br/>Documents and assets]
    BE --> RS[📧 Resend<br/>Email delivery]
```

### Request lifecycle

```mermaid
flowchart LR
    A[React component] --> B[Frontend service] --> C[HTTP request] --> D[FastAPI router]
    D --> E[Auth check] --> F[Pydantic validation] --> G[Service layer]
    G --> H[SQLAlchemy] --> I[(MySQL)] --> J[JSON response] --> K[React UI update]
```

### Backend layering

| Layer | Responsibility |
|-------|----------------|
| **Routes** | HTTP endpoints, dependency injection, auth guards |
| **Schemas** | Pydantic request/response validation |
| **Services** | Business logic, email, file upload, OTP |
| **Models** | SQLAlchemy ORM entities |
| **Database** | MySQL persistence |

---

## 🧩 Tech Stack

### Frontend

| Technology | Role |
|------------|------|
| React 19 | User interface |
| Vite 7 | Build tooling and dev server |
| React Router | Client-side routing |
| JavaScript / CSS | Application logic and styling |
| REST (fetch/HTTP) | Backend communication |

### Backend

| Technology | Role |
|------------|------|
| Python | Language |
| FastAPI | REST API framework |
| SQLAlchemy | ORM |
| Pydantic | Data validation |
| PyMySQL | MySQL driver |
| python-jose | JWT handling |
| Passlib + bcrypt | Password hashing |
| HTTPX | Outbound HTTP calls |

### Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Render | Backend hosting |
| Aiven | Managed MySQL |
| Cloudinary | File and asset storage |
| Resend | Transactional email |

---

## 📂 Project Structure

```text
Onco-Sphere/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── vite.config.*
│
├── backend/
│   ├── app/
│   │   ├── config/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── templates/
│   │   └── main.py
│   ├── requirements.txt
│   └── .env            # local only, never committed
│
└── README.md
```

> The tree reflects the intended layout. Individual files may differ slightly.

---

## 🔌 API Reference

Base path: `/api/v1`

### Researcher

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/researcher/save-draft` | Save a researcher application draft |
| `PUT` | `/researcher/update-draft/{id}` | Update a saved draft |
| `POST` | `/researcher/request-otp` | Request an OTP for verification |
| `POST` | `/researcher/verify-otp` | Verify the submitted OTP |

The complete and authoritative API surface is available in the interactive docs once the backend is running:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🔐 Security

| Area | Implementation |
|------|----------------|
| Authentication | JWT tokens, OTP verification, protected routes |
| Authorization | Role-aware workflows, admin-only approval actions |
| Passwords | Hashed with bcrypt, never stored in plain text |
| Secrets | Loaded from environment variables |
| Validation | Pydantic schemas on all inputs |
| Transport | HTTPS between all production services |

**Good practices for contributors**

- Never commit `.env` files. Make sure `.env` is listed in `.gitignore`.
- Use a long, random `SECRET_KEY` in production.
- Rotate API keys immediately if they are ever exposed.
- Restrict CORS to your real frontend origin in production.

---

## 🚀 Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | **Vercel** | Set `VITE_API_BASE_URL` to the Render backend URL |
| Backend | **Render** | Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Database | **Aiven (MySQL)** | Provide the connection string as `DATABASE_URL` |
| Storage | **Cloudinary** | Cloud name and API credentials via env vars |
| Email | **Resend** | API key and verified sender via env vars |

**Live demo:** https://onco-sphere-ai-powered-cancer-insti.vercel.app/

> If the backend is on a free Render plan, the first request after inactivity can take a while because the service spins up from sleep.

---

## 💻 Local Development

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- A MySQL database (local or hosted)
- Accounts for Cloudinary and Resend (for upload and email features)

### 1. Clone the repository

```bash
git clone https://github.com/KayasSecret/Onco-Sphere--AI-Powered-Cancer-Institute-Management-Clinical-Research-Platform.git
cd Onco-Sphere--AI-Powered-Cancer-Institute-Management-Clinical-Research-Platform
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
```

Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

Install dependencies and create your `.env` (see [Environment Variables](#-environment-variables)):

```bash
pip install -r requirements.txt
```

Run the API:

```bash
uvicorn app.main:app --reload
```

The API is now available at `http://localhost:8000`.

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

The app is now available at `http://localhost:5173`.

---

## 🔑 Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=mysql+pymysql://user:password@host:port/dbname

# Auth
SECRET_KEY=replace_with_a_long_random_string

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_verified_sender_email
EMAIL_FROM_NAME=Onco-Sphere
EMAIL_REPLY_TO=your_reply_email

# Admin
SUPER_ADMIN_EMAIL=your_admin_email

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS / links
FRONTEND_URL=http://localhost:5173
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | SQLAlchemy connection string for MySQL |
| `SECRET_KEY` | ✅ | Key used to sign JWT tokens |
| `RESEND_API_KEY` | ✅ | Resend API key for email |
| `EMAIL_FROM` | ✅ | Verified sender address |
| `EMAIL_FROM_NAME` | ➖ | Display name in emails |
| `EMAIL_REPLY_TO` | ➖ | Reply-to address |
| `SUPER_ADMIN_EMAIL` | ✅ | Email of the super administrator |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary account name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `FRONTEND_URL` | ✅ | Frontend origin for links and CORS |

> ⚠️ **Never upload real `.env` files to GitHub.**

---

## 🔮 Roadmap

**Platform**
- [ ] Audit logging
- [ ] Advanced notification system
- [ ] Multi-institution support
- [ ] Mobile application
- [ ] Advanced dashboards

**Clinical & research**
- [ ] Expanded clinical-research modules
- [ ] Research analytics

**AI-assisted capabilities** (planned, not yet implemented)
- [ ] AI-assisted clinical analysis
- [ ] Automated document processing
- [ ] Intelligent search
- [ ] Predictive analytics
- [ ] AI-assisted decision support

---

## 📸 Screenshots

<!-- Add your images to a /screenshots folder and uncomment the lines below. -->

<!--
| Landing Page | Login |
|---|---|
| ![Landing](./screenshots/landing.png) | ![Login](./screenshots/login.png) |

| Researcher Application | Admin Panel |
|---|---|
| ![Researcher](./screenshots/researcher.png) | ![Admin](./screenshots/admin.png) |
-->

_Screenshots coming soon._

---

## ⚠️ Disclaimer

Onco-Sphere is a software platform intended for authorized institutional and development use. It is **not** an autonomous medical diagnostic system and must not be used for clinical decisions unless a specific decision-support module has been independently validated, approved and deployed for that purpose.

---

## 📜 License

This project is maintained by its owner. Reproduction, redistribution or commercial use of proprietary components may be restricted. Contact the author for permissions.

---

## 🧑‍💻 Author

<div align="center">

**Built by [KayasSecret](https://github.com/KayasSecret)**

[![GitHub](https://img.shields.io/badge/GitHub-KayasSecret-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/KayasSecret)

[![Live Demo](https://img.shields.io/badge/🚀_Explore_Live_Project-00C853?style=for-the-badge)](https://onco-sphere-ai-powered-cancer-insti.vercel.app/)

⭐ If you find this project useful, consider giving it a star.

</div>
