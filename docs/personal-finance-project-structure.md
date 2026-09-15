# Personal Finance & Smart Split — Project Structure

## 1. Architecture

สำหรับ MVP ใช้ **Modular Monolith + OCR Service** โดยไม่แยกทุก Module เป็น Microservice

```text
PWA Frontend
Nuxt 4
   │
   │ HTTPS / JSON
   ▼
Finance API
Elysia + Bun
   │
   ├──────────────► PostgreSQL
   │
   │
   └──────────────► OCR Service
                    FastAPI + Python
                         │
                         ├── Slip OCR
                         ├── Receipt OCR
                         └── QR Decoder
```

หลักสำคัญของ Scan Service:

```text
รับรูป
  ↓
ประมวลผลใน Memory / Temporary File
  ↓
OCR / QR Decode
  ↓
Parse ข้อมูลที่ต้องการ
  ↓
คืน Structured JSON
  ↓
ลบ Temporary File ทันที
```

**ไม่เก็บภาพ Slip หรือ Receipt ลง Database หรือ Object Storage**

Database เก็บเฉพาะข้อมูล Transaction ที่ผู้ใช้ตรวจสอบและกด Confirm แล้ว

---

# 2. Technology Stack

## Frontend / PWA

```text
Nuxt 4
Vue 3
TypeScript
Tailwind CSS
Nuxt UI
Pinia
@vite-pwa/nuxt
IndexedDB (เฉพาะ draft/offline data ที่จำเป็น)
```

## Main Backend

```text
Bun
Elysia
TypeScript
Drizzle ORM
```

## Database

```text
PostgreSQL
```

สามารถใช้ PostgreSQL Free Tier เช่น Neon หรือผู้ให้บริการที่เหมาะสม

เนื่องจากระบบไม่เก็บไฟล์ภาพ Database จะเก็บข้อมูลขนาดเล็กเป็นหลัก เช่น:

```text
User
Transaction
Category
Split Group
Split Expense
Settlement
```

## OCR / Scan Service

```text
Python
FastAPI
PaddleOCR
OpenCV
QR Decoder
```

## Infrastructure

```text
Docker
PostgreSQL
Reverse Proxy (เมื่อจำเป็น)
```

ยังไม่จำเป็นสำหรับ MVP:

```text
Redis
NATS
MinIO
S3
Kafka
ClickHouse
```

---

# 3. Project Structure

Frontend และ Backend แยกเป็น root directory ชัดเจนภายใน Repository เดียวกัน

```text
personal-finance/
│
├── frontend/                         # Nuxt 4 PWA
│   │
│   ├── app/
│   │   ├── components/
│   │   │   ├── transaction/
│   │   │   ├── scan/
│   │   │   ├── summary/
│   │   │   └── split/
│   │   │
│   │   ├── composables/
│   │   │   ├── useTransactions.ts
│   │   │   ├── useScan.ts
│   │   │   ├── useSummary.ts
│   │   │   └── useSplit.ts
│   │   │
│   │   ├── layouts/
│   │   ├── middleware/
│   │   │
│   │   ├── pages/
│   │   │   ├── index.vue
│   │   │   │
│   │   │   ├── transactions/
│   │   │   │   ├── index.vue
│   │   │   │   ├── new.vue
│   │   │   │   └── [id].vue
│   │   │   │
│   │   │   ├── scan/
│   │   │   │   ├── index.vue
│   │   │   │   └── review.vue
│   │   │   │
│   │   │   ├── summary/
│   │   │   │   └── index.vue
│   │   │   │
│   │   │   ├── splits/
│   │   │   │   ├── index.vue
│   │   │   │   ├── new.vue
│   │   │   │   └── [id]/
│   │   │   │       ├── index.vue
│   │   │   │       ├── expense.vue
│   │   │   │       └── settlement.vue
│   │   │   │
│   │   │   └── settings/
│   │   │       └── index.vue
│   │   │
│   │   ├── stores/
│   │   │   ├── transaction.ts
│   │   │   ├── scan.ts
│   │   │   └── split.ts
│   │   │
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── public/
│   │   └── icons/
│   │
│   ├── nuxt.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   │
│   ├── api/                          # Main Finance API
│   │   │
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.schema.ts
│   │   │   │   │
│   │   │   │   ├── users/
│   │   │   │   │
│   │   │   │   ├── transactions/
│   │   │   │   │   ├── transaction.controller.ts
│   │   │   │   │   ├── transaction.service.ts
│   │   │   │   │   ├── transaction.repository.ts
│   │   │   │   │   └── transaction.schema.ts
│   │   │   │   │
│   │   │   │   ├── categories/
│   │   │   │   ├── summary/
│   │   │   │   │   ├── summary.controller.ts
│   │   │   │   │   ├── summary.service.ts
│   │   │   │   │   └── summary.repository.ts
│   │   │   │   │
│   │   │   │   ├── scan/
│   │   │   │   │   ├── scan.controller.ts
│   │   │   │   │   ├── scan.service.ts
│   │   │   │   │   └── scan.schema.ts
│   │   │   │   │
│   │   │   │   ├── splits/
│   │   │   │   │   ├── split.controller.ts
│   │   │   │   │   ├── split.service.ts
│   │   │   │   │   ├── split.repository.ts
│   │   │   │   │   └── split.schema.ts
│   │   │   │   │
│   │   │   │   └── settlements/
│   │   │   │
│   │   │   ├── db/
│   │   │   │   ├── index.ts
│   │   │   │   ├── schema/
│   │   │   │   │   ├── users.ts
│   │   │   │   │   ├── transactions.ts
│   │   │   │   │   ├── categories.ts
│   │   │   │   │   ├── split-groups.ts
│   │   │   │   │   ├── split-members.ts
│   │   │   │   │   ├── split-expenses.ts
│   │   │   │   │   └── settlements.ts
│   │   │   │   └── migrations/
│   │   │   │
│   │   │   ├── middleware/
│   │   │   ├── shared/
│   │   │   ├── config/
│   │   │   └── index.ts
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ocr/                          # OCR / QR Processing Service
│       │
│       ├── app/
│       │   ├── main.py
│       │   ├── api/
│       │   │   ├── scan.py
│       │   │   └── health.py
│       │   │
│       │   ├── services/
│       │   │   ├── slip_ocr.py
│       │   │   ├── receipt_ocr.py
│       │   │   ├── qr_decoder.py
│       │   │   └── image_processor.py
│       │   │
│       │   ├── parsers/
│       │   │   ├── slip_parser.py
│       │   │   ├── receipt_parser.py
│       │   │   └── qr_parser.py
│       │   │
│       │   ├── schemas/
│       │   │   ├── scan.py
│       │   │   └── result.py
│       │   │
│       │   └── core/
│       │       └── config.py
│       │
│       ├── tests/
│       │   ├── test_slip_parser.py
│       │   ├── test_receipt_parser.py
│       │   └── test_qr_parser.py
│       │
│       ├── requirements.txt
│       └── Dockerfile
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Directory Responsibilities

```text
/frontend
→ UI / UX
→ PWA
→ Transaction forms
→ Scan UI
→ Scan review
→ Financial summary
→ Smart Split UI

/backend/api
→ Authentication
→ User
→ Transaction
→ Category
→ Summary
→ Smart Split
→ Settlement
→ PostgreSQL access
→ ติดต่อ OCR Service

/backend/ocr
→ รับภาพชั่วคราว
→ Image preprocessing
→ OCR Slip / Receipt
→ QR Decode
→ Parse เป็น Structured Data
→ คืน JSON
→ ลบภาพทันที
```

## Communication Flow

```text
/frontend
    │
    │ HTTPS / JSON
    ▼
/backend/api
    │
    ├──────────────► PostgreSQL
    │
    │
    └──────────────► /backend/ocr
                         │
                         ├── OCR
                         ├── QR Decode
                         ├── Parse
                         └── Structured JSON
```

`/frontend` ไม่ควรเรียก `/backend/ocr` โดยตรง

ให้ `/backend/api` เป็นจุดเข้าหลัก เพื่อให้สามารถจัดการ Authentication, Validation, Rate Limit และ Business Logic ได้จากจุดเดียว

---

# 4. OCR Service Responsibility

OCR Service มีหน้าที่เฉพาะ:

```text
Image
  ↓
Validate
  ↓
Preprocess
  ↓
Detect / Decode
  ↓
Extract Text
  ↓
Parse
  ↓
Structured JSON
```

OCR Service **ไม่มีหน้าที่บันทึก Transaction**

---

# 5. Slip Processing Flow

```text
User
 │
 │ เลือกรูป Slip
 ▼
Nuxt PWA
 │
 │ multipart/form-data
 ▼
Elysia API
 │
 │ Forward image
 ▼
FastAPI OCR
 │
 ├── Validate image
 │
 ├── QR Decode (ถ้ามี)
 │
 ├── Image preprocessing
 │
 ├── PaddleOCR
 │
 ├── Slip parser
 │
 └── Structured result
 │
 ▼
Elysia API
 │
 ▼
Nuxt
 │
 ▼
Review Screen
```

ตัวอย่างผลลัพธ์:

```json
{
  "documentType": "bank_slip",
  "amount": 850.00,
  "transactionDate": "2026-08-23",
  "transactionTime": "18:32",
  "sender": "Somchai",
  "receiver": "ABC Store",
  "bank": "example-bank",
  "reference": "ABC123",
  "confidence": 0.94
}
```

ข้อมูลนี้ยังเป็น **Draft**

---

# 6. No Image Storage Policy

ระบบไม่เก็บภาพจริงของ Slip หรือ Receipt

```text
Upload
  ↓
Memory / Temporary File
  ↓
OCR
  ↓
JSON
  ↓
Delete Image
```

ห้าม:

```text
Slip Image → PostgreSQL
Slip Image → MinIO
Slip Image → S3
Slip Image → Permanent File System
```

หลัง OCR เสร็จให้ลบ Temporary File ทันที รวมถึงกรณี:

```text
OCR Success
OCR Failed
Parser Failed
Request Exception
```

ควรใช้ cleanup mechanism เช่น `finally` เพื่อให้ไฟล์ถูกลบเสมอ

---

# 7. Data ที่ควรเก็บ

เมื่อ OCR เสร็จ ยังไม่จำเป็นต้องเก็บอะไรลง Database

Frontend แสดง Draft ให้ผู้ใช้ตรวจสอบ:

```text
OCR
 ↓
JSON Draft
 ↓
Review
```

เมื่อผู้ใช้กด Confirm:

```text
Review
 ↓
Confirm
 ↓
POST /transactions
 ↓
PostgreSQL
```

Database จึงเก็บเฉพาะข้อมูลที่จำเป็น เช่น:

```text
Transaction

id
user_id
type
amount
category_id
transaction_date
description
note
source
created_at
updated_at
```

`source` ตัวอย่าง:

```text
manual
slip_scan
receipt_scan
qr_scan
```

---

# 8. สิ่งที่ไม่ควรเก็บโดยไม่จำเป็น

เพื่อประหยัดพื้นที่และลดข้อมูล Sensitive:

```text
❌ Original Slip Image
❌ Original Receipt Image
❌ OCR Temporary Image
❌ Raw Image Binary
❌ Base64 Image
```

และหาก Feature ไม่ได้ใช้ข้อมูลเหล่านี้ต่อ ก็ควรหลีกเลี่ยงการเก็บ:

```text
Raw OCR Text
Sender Account Number
Receiver Account Number
QR Raw Payload
```

เก็บเฉพาะ Field ที่ Product ต้องใช้จริง

---

# 9. Database Strategy สำหรับ Free Tier

เนื่องจากไม่เก็บรูป Database จะมีข้อมูลขนาดเล็กเป็นหลัก

```text
PostgreSQL
│
├── users
├── categories
├── transactions
├── split_groups
├── split_members
├── split_expenses
├── split_expense_participants
└── settlements
```

Transaction หนึ่งรายการมีเพียง structured data จึงใช้พื้นที่น้อยกว่าการเก็บ Slip/Receipt image มาก

ไม่จำเป็นต้องมี:

```text
MinIO
S3
GridFS
Blob Storage
```

สำหรับ MVP

---

# 10. API Overview

## Transaction

```text
GET    /transactions
GET    /transactions/:id
POST   /transactions
PATCH  /transactions/:id
DELETE /transactions/:id
```

## Summary

```text
GET /summary/daily
GET /summary/weekly
GET /summary/monthly
```

## Scan

```text
POST /scan/slip
POST /scan/receipt
POST /scan/qr
```

Scan endpoint คืนข้อมูลเท่านั้น ไม่สร้าง Transaction อัตโนมัติ

```text
POST /scan/slip
        ↓
OCR
        ↓
JSON Draft

POST /transactions
        ↓
Confirm แล้ว
        ↓
Database
```

## Smart Split

```text
GET    /splits
POST   /splits
GET    /splits/:id
POST   /splits/:id/expenses
PATCH  /splits/:id/expenses/:expenseId
```

## Settlement

```text
GET  /splits/:id/settlements
POST /splits/:id/settlements
```

---

# 11. MVP Infrastructure

MVP ใช้เพียง:

```text
Nuxt PWA
     │
     ▼
Elysia API
  │       │
  ▼       ▼
Postgres  FastAPI OCR
```

ไม่ต้องมี:

```text
Redis
NATS
MinIO
S3
Kafka
Microservices หลายตัว
```

ทำให้:

- Deploy ง่าย
- Debug ง่าย
- ใช้ Resource น้อย
- เหมาะกับ Free Tier
- ลดค่า Infrastructure
- พัฒนา MVP ได้เร็ว

---

# 12. Development Order

```text
Phase 1
│
├── Nuxt PWA Setup
├── Elysia API Setup
├── PostgreSQL + Drizzle
└── Auth
        ↓
Phase 2
│
├── Transaction CRUD
├── Categories
└── Daily / Weekly / Monthly Summary
        ↓
Phase 3
│
├── FastAPI OCR Service
├── Slip OCR
├── QR Decoder
└── Review / Confirm Flow
        ↓
Phase 4
│
├── Receipt OCR
└── Receipt Item Extraction
        ↓
Phase 5
│
├── Smart Split
├── Multiple Payers
├── Receipt Item Split
└── Debt Simplification
        ↓
Phase 6
│
├── Settlement
└── Share Split
```

---

# 13. Final Stack

```text
Frontend / PWA
- Nuxt 4
- Vue 3
- TypeScript
- Tailwind CSS
- Nuxt UI
- Pinia
- @vite-pwa/nuxt

Backend
- Bun
- Elysia
- TypeScript
- Drizzle ORM

Database
- PostgreSQL Free Tier

OCR
- Python
- FastAPI
- PaddleOCR
- OpenCV
- QR Decoder

Infrastructure
- Docker

Not Required for MVP
- Redis
- NATS
- MinIO
- S3
- Kafka
```

## Design Principle

> **Database เก็บข้อมูลทางการเงินที่จำเป็น ไม่ใช่เอกสารต้นฉบับ**

และสำหรับ Scan:

> **Image In → Structured Data Out → Image Deleted**
