# Onco Sphere — Complete Technology Stack & Dependency Analysis

This document catalogs every verified technology, runtime library, and development tool present in the actual Onco Sphere source code, distinguishing **actively used packages** from **indirect/runtime-only** and **installed-but-unreferenced** dependencies.

---

## 1. Complete Technology Stack Summary

| Category | Technologies Actually Used |
|---|---|
| **Programming Languages** | JavaScript (ES2022+ / JSX), Python 3, SQL (MySQL 8), HTML5, CSS3 |
| **Frontend Framework & Routing** | React `18.3.1`, React DOM `18.3.1`, React Router DOM `6.26.2` |
| **State Management** | Redux Toolkit `2.3.0`, React-Redux `9.1.2` |
| **Forms & Validation** | React Hook Form `7.53.0`, Yup `1.4.0`, `@hookform/resolvers` `3.9.0` |
| **UI Primitives, Icons & Styling** | Tailwind CSS `3.4.19`, Radix UI (`dialog`, `label`, `select`, `slot`, `tabs`), shadcn/ui pattern (`class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`), `react-icons` `5.3.0`, `lucide-react` `0.436.0`, Sonner `1.5.0`, `react-datepicker` `9.1.0` |
| **PDF & Document Generation** | `html2canvas` `1.4.1`, `jspdf` `4.2.1`, Browser CSS `@media print` |
| **HTTP Client** | Axios `1.7.7` (with centralized JWT Bearer + silent refresh interceptor) |
| **Backend Framework & ASGI Server** | FastAPI `0.115.6`, Uvicorn (`uvicorn[standard]`) `0.32.1`, Starlette (via FastAPI) |
| **Database & ORM** | MySQL `8.0.46` (verified locally; SSL-capable via `ca.pem` for Aiven Cloud MySQL), SQLAlchemy `2.0.36`, PyMySQL `1.1.1`, Cryptography `44.0.0` |
| **Data Validation & Config** | Pydantic v2 (`pydantic[email]` `2.12.0`), `pydantic-settings` `2.9.1`, `email-validator` `2.2.0`, `python-dotenv` `1.0.1` |
| **Authentication & Security** | `python-jose[cryptography]` `3.3.0` (HS256 JWT), `bcrypt` `4.2.1` (12 rounds), `passlib[bcrypt]` `1.7.4` (legacy verification fallback) |
| **Email & OTP Service** | Resend HTTPS API (`https://api.resend.com/emails`) via async `httpx` `0.28.1` + Jinja2 `3.1.4` HTML templates + `BackgroundTasks` |
| **Media & File Storage** | Cloudinary Python SDK `1.42.0` + automatic local filesystem fallback (`/static/uploads`) + `python-multipart` `0.0.12` |
| **Build & Developer Tooling** | Vite `8.1.1`, `@vitejs/plugin-react` `6.0.3`, PostCSS `8.5.19`, Autoprefixer `10.5.2`, Oxlint `1.71.0` |
| **Deployment & Hosting Config** | Vercel (`helix-frontend/vercel.json` SPA rewrites); Render-ready FastAPI backend (`main.py`, CORS allowlist, HTTPS email delivery on port 443) |

---

## 2. Frontend Package Analysis (`helix-frontend/package.json`)

### 2.1 Actively Used Runtime Dependencies (24 / 24 Active)

| Package | Version | Why It Is Used | Where Used in Codebase | Functionality Provided |
|---|---|---|---|---|
| `react` | `^18.3.1` | Core component UI library | 45+ files across `src/` | Declarative UI, hooks (`useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`) |
| `react-dom` | `^18.3.1` | DOM renderer for React 18 | `src/main.jsx` | Mounts SPA via `createRoot` |
| `react-router-dom` | `^6.26.2` | Client-side routing & RBAC guards | 22 files (`src/routes/index.jsx`, `RequireAuth.jsx`, layouts, pages) | Declarative routes, nested layouts, programmatic `useNavigate`, `<Link>` |
| `@reduxjs/toolkit` | `^2.3.0` | Predictable global state & async thunks | `src/redux/store.js` & 5 slices (`auth`, `ui`, `patient`, `admin`, `visit`) | `configureStore`, `createSlice`, `createAsyncThunk` |
| `react-redux` | `^9.1.2` | React bindings for Redux store | 13 files (`App.jsx`, `AppLayout.jsx`, pages) | `<Provider>`, `useDispatch`, `useSelector` |
| `axios` | `^1.7.7` | HTTP client with interceptors | `src/services/axiosInstance.js`, `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx` | Base URL config, Bearer token injection, queued 401 silent refresh |
| `react-hook-form` | `^7.53.0` | Performant form state management | 8 files (`LoginPage`, `ResearcherApplicationPage`, `PatientRegisterPage`, `PatientEditPage`, `AdminListPage`, etc.) | Uncontrolled/controlled inputs, dirty/validation state |
| `yup` | `^1.4.0` | Declarative schema validation | 8 files (Auth, Patient, Admin forms) | Field rules, regex checks, age >= 18 verification, password matching |
| `@hookform/resolvers` | `^3.9.0` | Connects Yup to React Hook Form | 7 files (Auth, Patient, Admin forms) | `yupResolver(schema)` bridge |
| `@radix-ui/react-dialog` | `^1.1.19` | Accessible modal dialogs & drawers | `src/components/ui/dialog.jsx`, `sheet.jsx` | Focus trap, ESC dismiss, portal rendering |
| `@radix-ui/react-label` | `^2.1.11` | Accessible form labels | `src/components/ui/label.jsx` | Semantic `<label>` primitive |
| `@radix-ui/react-select` | `^2.3.3` | Custom keyboard-accessible dropdowns | `src/components/ui/select.jsx` | Styled select menus in registration & clinical forms |
| `@radix-ui/react-slot` | `^1.3.0` | Polymorphic component composition | `src/components/ui/button.jsx` | `asChild` prop forwarding |
| `@radix-ui/react-tabs` | `^1.1.17` | Accessible tabbed interfaces | `src/components/ui/tabs.jsx` | Keyboard-navigable tab panels |
| `class-variance-authority` | `^0.7.1` | Variant-driven component styling | `badge.jsx`, `button.jsx`, `label.jsx`, `sheet.jsx` | Type-safe Tailwind variant maps |
| `clsx` | `^2.1.1` | Conditional className joining | `src/lib/utils.js` (`cn` helper) | Clean conditional class composition |
| `tailwind-merge` | `^2.5.2` | Resolves conflicting Tailwind utilities | `src/lib/utils.js` (`cn` helper) | Deduplicates utility classes cleanly |
| `tailwindcss-animate` | `^1.0.7` | Enter/exit utility animations | `tailwind.config.js` | Popover/dialog fade & zoom animations |
| `react-icons` | `^5.3.0` | Primary icon library (Remix Icons `ri`) | 24 files across layouts & pages | Consistent clinical & navigation iconography |
| `lucide-react` | `^0.436.0` | Icons for shadcn/Radix UI primitives | `dialog.jsx`, `select.jsx`, `sheet.jsx`, `sonner.jsx` | Close (`X`), check, chevron, toast status icons |
| `sonner` | `^1.5.0` | Toast notification system | 16 files (`App.jsx`, `sonner.jsx`, pages, hooks) | Non-blocking success/error clinical alerts |
| `react-datepicker` | `^9.1.0` | Calendar date input widget | `src/components/DatePicker.jsx` + `src/index.css` | Date selection for clinical filters/forms |
| `html2canvas` | `^1.4.1` | DOM-to-Canvas rasterization | `ReportCreatorPage.jsx`, `ReportPrintPage.jsx` | Captures A4 pathology report layout at high DPI (`scale: 2`) |
| `jspdf` | `^4.2.1` | Client-side PDF document builder | `ReportCreatorPage.jsx`, `ReportPrintPage.jsx` | Generates downloadable A4 PDF files from captured canvas |

### 2.2 Frontend DevDependencies (`devDependencies`)

| Package | Version | Status & Purpose |
|---|---|---|
| `vite` | `^8.1.1` | **Active** — Dev server (`port 5173`, `/api` proxy) and production bundler (`vite build`). |
| `@vitejs/plugin-react` | `^6.0.3` | **Active** — React Fast Refresh and JSX transform in `vite.config.js`. |
| `tailwindcss` | `^3.4.19` | **Active** — Utility-first CSS engine configured via `tailwind.config.js`. |
| `postcss` | `^8.5.19` | **Active** — CSS build pipeline configured in `postcss.config.js`. |
| `autoprefixer` | `^10.5.2` | **Active** — Adds vendor prefixes automatically via `postcss.config.js`. |
| `oxlint` | `^1.71.0` | **Active** — High-speed Rust-based linter invoked via `npm run lint` / `.oxlintrc.json`. |
| `@types/react` | `^19.2.17` | **IDE-only (not imported in code)** — Provides editor IntelliSense for JSX (`jsconfig.json`); zero bundle impact. |
| `@types/react-dom` | `^19.2.3` | **IDE-only (not imported in code)** — Provides editor IntelliSense for React DOM; zero bundle impact. |

---

## 3. Backend Package Analysis (`helix-backend/requirements.txt`)

### 3.1 Actively Used & Runtime-Required Dependencies (16 / 17 Active)

| Package | Version | Why It Is Used | Where Used | Functionality Provided |
|---|---|---|---|---|
| `fastapi` | `0.115.6` | Core web framework | `main.py` & all 9 routers in `app/routes/` | Async/sync REST routing, OpenAPI docs (`/api/docs`), DI, `BackgroundTasks` |
| `uvicorn[standard]` | `0.32.1` | ASGI HTTP server | CLI runtime (`uvicorn main:app`) | Runs FastAPI in development and production |
| `sqlalchemy` | `2.0.36` | Relational ORM & connection pool | `app/database/db.py`, `app/models/*`, `app/routes/*`, `app/services/*` | 19 ORM models, sessions, parameterized queries, `create_all` |
| `pymysql` | `1.1.1` | Pure-Python MySQL DB-API driver | `DATABASE_URL` (`mysql+pymysql://...`) | Connects SQLAlchemy to MySQL 8 |
| `cryptography` | `44.0.0` | Cryptographic primitives | Runtime dependency of `pymysql` & `python-jose` | Required for MySQL 8 `caching_sha2_password` & SSL/TLS connections |
| `pydantic[email]` | `2.12.0` | Request/response schema validation | `app/schemas/*`, `app/routes/*` | Strict input validation, `EmailStr`, ORM serialization (`from_attributes=True`) |
| `email-validator` | `2.2.0` | Email syntax validator | Runtime dependency of Pydantic `EmailStr` | Validates email fields on auth/researcher schemas |
| `pydantic-settings` | `2.9.1` | Environment variable management | `app/config/settings.py` | Loads typed settings from `.env` with `@lru_cache` |
| `python-dotenv` | `1.0.1` | `.env` file parser | Runtime dependency of `pydantic-settings` & `uvicorn` | Reads environment variables from `.env` |
| `python-jose[cryptography]` | `3.3.0` | JWT encoding/decoding | `app/utils/jwt.py` | Signs and verifies HS256 access, refresh, and password-reset tokens |
| `bcrypt` | `4.2.1` | Password hashing | `app/utils/password.py` | Direct `bcrypt.hashpw` (12 rounds) & `bcrypt.checkpw` |
| `passlib[bcrypt]` | `1.7.4` | Legacy password hash fallback | `app/utils/password.py` (L37) | Fallback verification in `verify_password()` for older hash formats |
| `python-multipart` | `0.0.12` | Multipart form-data parser | Runtime dependency of FastAPI `UploadFile` / `File(...)` | Required by `/api/v1/upload/*` endpoints |
| `cloudinary` | `1.42.0` | Cloud media storage SDK | `app/routes/upload.py`, `app/routes/patients.py` | Uploads patient photos, reports, researcher IDs; generates signed download URLs |
| `httpx` | `0.28.1` | Async HTTP client | `app/services/email_service.py` | Sends emails to Resend HTTPS API with retries & idempotency keys |
| `jinja2` | `3.1.4` | HTML templating engine | `app/services/email_service.py` + `app/templates/emails/*.html` | Renders 7 branded HTML email templates with autoescaping |

### 3.2 Installed but Currently Unused Dependencies (Do Not Remove Without Migration Strategy)

| Package | Location | Status & Explanation |
|---|---|---|
| `alembic==1.14.0` | `helix-backend/requirements.txt` | **Installed, not actively configured.** No `alembic.ini` or `alembic/` migration folder exists; schema creation and incremental column checks are currently handled in `main.py` lifespan startup via `Base.metadata.create_all()` and idempotent `ALTER TABLE` guards. Retained for future formal migration adoption. |
| `@types/react`, `@types/react-dom` | `helix-frontend/package.json` (`devDependencies`) | **IDE-only.** Pure JavaScript/JSX project (no `.ts`/`.tsx` files); provides editor autocompletion only. |

---

## 4. Unused Internal Exports Noted (Retained for Library/Store Integrity)
- Standard shadcn/ui sub-exports in `src/components/ui/{card,dialog,select,sheet,table}.jsx` (tree-shaken by Vite).
- `src/redux/slices/visitSlice.js` is mounted in `store.js`, though the Visits UI currently calls `visitService.js` directly.
- `public/helix-icon.svg` exists in `public/` while `index.html` currently uses `/src/assets/ICSR-LOGO.png`.
