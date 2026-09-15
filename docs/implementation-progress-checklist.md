# Dinero PWA Implementation Progress

## 1. Project foundation

- [x] Create monorepo-style project structure
- [x] Add `frontend/` Nuxt application
- [x] Add `backend/api/` finance API scaffold
- [x] Add `backend/ocr/` OCR service scaffold
- [x] Add root README and `.gitignore`
- [x] Add Docker Compose configuration
- [x] Add frontend TypeScript configuration
- [x] Install frontend dependencies
- [x] Add local environment configuration for Neon and Better Auth

## 2. Frontend and PWA

- [x] Configure Nuxt 4
- [x] Configure Vue, TypeScript, Pinia, Tailwind CSS, and Nuxt UI-compatible styling
- [x] Configure PWA manifest
- [x] Configure service-worker app-shell caching
- [x] Create responsive mobile-first layout
- [x] Create bottom navigation: Home, History, Split, Settings
- [x] Add custom Dinero visual identity and design tokens
- [x] Add responsive desktop layout adjustments
- [x] Add reduced-motion support
- [ ] Add production app icons
- [ ] Add install prompt UX
- [ ] Add complete IndexedDB draft persistence
- [ ] Add production API client and error handling

## 3. Finance foundation

- [x] Create dashboard page
- [x] Create manual transaction form
- [x] Create transaction history page
- [x] Add expense/income filters
- [x] Create transaction detail page
- [x] Create summary page
- [x] Add mock transaction state and calculations
- [x] Connect frontend transaction reads/writes to the finance API
- [x] Connect frontend slip upload to the scan endpoint
- [ ] Add real authentication and sessions
- [ ] Add PostgreSQL schema and migrations
- [ ] Add Drizzle ORM integration
- [x] Connect frontend transactions to the API
- [ ] Add real transaction CRUD persistence
- [ ] Add real category management
- [ ] Add real daily, weekly, and monthly summaries
- [ ] Add pagination and server-side filtering
- [ ] Add ownership checks for persisted user data

## 4. OCR and scanning

- [x] Create scan type selection page
- [x] Support image selection/camera capture input
- [x] Navigate selected images to review flow
- [x] Create editable OCR review page
- [x] Require user confirmation before saving a transaction
- [x] Add OCR API service scaffold
- [x] Add Elysia slip-upload validation endpoint
- [x] Add MIME type validation
- [x] Add upload size validation
- [x] Process uploads in temporary memory
- [x] Add cleanup in a `finally` block
- [x] Avoid permanent image storage in the service design
- [ ] Integrate PaddleOCR
- [ ] Implement Thai slip preprocessing
- [ ] Implement slip parser for amount/date/time
- [ ] Implement receipt-total parser
- [ ] Connect Elysia scan endpoint to FastAPI OCR
- [ ] Return real confidence scores
- [ ] Add OCR failure and timeout UI states
- [ ] Add representative Thai slip/receipt test dataset
- [ ] Measure OCR accuracy and processing time
- [ ] Add QR decoding as a post-MVP enhancement

## 5. Smart Split

- [x] Create Smart Split groups page
- [x] Create new group form
- [x] Create group detail page
- [x] Create add-expense page
- [x] Create settlement page
- [x] Support named members conceptually without required accounts
- [x] Add mock group balances
- [ ] Persist groups in PostgreSQL
- [ ] Persist members and expenses
- [ ] Implement equal split calculations
- [ ] Implement custom participant amounts
- [ ] Implement receipt-total split flow
- [ ] Implement settlement records
- [ ] Add shareable split summary
- [ ] Add itemized receipt splitting

## 6. Backend API

- [x] Create Elysia/Bun API package
- [x] Add health endpoint
- [x] Add transaction list placeholder endpoint
- [x] Add transaction creation placeholder endpoint
- [x] Add scan endpoint placeholder
- [x] Add basic request validation for transaction creation
- [ ] Add authentication middleware
- [ ] Add rate limiting
- [ ] Add consistent API error format
- [ ] Add transaction CRUD endpoints
- [ ] Add summary endpoints
- [ ] Add split endpoints
- [ ] Add settlement endpoints
- [ ] Add OCR proxy integration
- [x] Mount Better Auth handler in the Elysia API
- [ ] Add database repositories and services

## 7. Security and privacy

- [x] Define no-permanent-image-storage policy
- [x] Add image type validation
- [x] Add image size limit
- [x] Add temporary upload cleanup
- [x] Avoid raw OCR output persistence in the scaffold
- [ ] Add HTTPS deployment configuration
- [ ] Add real API authentication
- [ ] Add user ownership enforcement
- [ ] Add sensitive-data log redaction
- [ ] Add production rate limiting
- [ ] Run dependency vulnerability checks in CI
- [ ] Run OCR container vulnerability checks
- [ ] Verify no image remains after success/failure/timeout tests

## 8. Testing and deployment

- [x] Run `npm install` successfully
- [x] Verify Neon database connection
- [x] Create initial finance tables in Neon
- [x] Pass backend TypeScript validation
- [x] Run Nuxt typecheck successfully with warnings
- [x] Compile Nuxt client bundle successfully
- [x] Compile Nuxt server bundle successfully
- [ ] Resolve the remaining Volar/vue-router compatibility warning
- [ ] Complete Nitro production packaging verification
- [ ] Add frontend unit tests
- [ ] Add API tests
- [ ] Add OCR parser tests
- [ ] Add end-to-end tests
- [ ] Add Docker health checks
- [ ] Deploy frontend/API to Vercel
- [ ] Deploy OCR service to a Docker-capable host
- [ ] Deploy managed PostgreSQL
- [ ] Configure production environment variables
- [ ] Add monitoring and error reporting

## Current status

The UI and service scaffolding are in place, with the main user flows represented using local mock state. The next highest-priority work is connecting PostgreSQL and authentication, then replacing the OCR placeholder with PaddleOCR and real parsers.
