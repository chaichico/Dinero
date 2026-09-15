# OCR Slip Processing Plan

## 1. เป้าหมาย

พัฒนาฟีเจอร์สำหรับอ่านข้อมูลจากสลิปการชำระเงิน/โอนเงิน เพื่อช่วยสร้างรายการรายจ่าย
โดยมีหลักสำคัญคือ:

-   ไม่เก็บรูปสลิปแบบถาวร
-   ลดการจัดเก็บข้อมูลส่วนบุคคลและข้อมูลที่ Sensitive
-   ใช้ OCR แบบ Self-hosted
-   ไม่ส่งรูปสลิปไปยัง Cloud OCR หรือ Third-party OCR API
-   ให้ผู้ใช้ตรวจสอบข้อมูลก่อนบันทึก Transaction จริง

OCR มีหน้าที่ **Extract ข้อมูล** จากสลิปเท่านั้น ไม่ได้ใช้ยืนยันกับธนาคารว่าสลิปหรือ
Transaction เป็นของจริง

------------------------------------------------------------------------

## 2. ข้อมูลที่ต้องการจาก OCR

สำหรับ MVP ให้ดึงเฉพาะข้อมูลที่จำเป็น เช่น:

-   Amount --- จำนวนเงิน
-   Transaction Date --- วันที่ทำรายการ
-   Transaction Time --- เวลาทำรายการ

ข้อมูลเพิ่มเติมสามารถพิจารณาภายหลัง เช่น:

-   Merchant / Receiver
-   Bank
-   Transaction Type

ตัวอย่าง JSON Draft:

``` json
{
  "amount": 850.00,
  "transactionDate": "2026-08-23T14:32:00+07:00",
  "source": "slip_scan"
}
```

ข้อมูลที่ไม่จำเป็นไม่ควรจัดเก็บ เช่น:

-   รูปสลิปต้นฉบับ
-   Raw OCR Text ทั้งหมด
-   ชื่อผู้โอน หากไม่ได้ใช้
-   เลขบัญชี
-   QR Raw Payload
-   Bank Reference หากไม่ได้ใช้

------------------------------------------------------------------------

## 3. OCR ที่เลือกใช้

### PaddleOCR แบบ Self-hosted

ใช้ PaddleOCR เป็น OCR Engine เบื้องต้น โดยติดตั้งและรันภายใน Docker Container
ของระบบเอง

เหตุผล:

-   เป็น Open-source
-   ไม่มีค่า API ต่อรูป
-   สามารถ Self-host ได้
-   ไม่จำเป็นต้องส่งรูปไปยังผู้ให้บริการ OCR ภายนอก
-   สามารถแยก OCR Service ออกจาก Web Application ได้

หลักสำคัญคือ **ไม่ใช้ Hosted OCR API** สำหรับสลิปธนาคารใน MVP

------------------------------------------------------------------------

## 4. OCR Processing Flow

``` text
User
 │
 │ Upload Slip
 ▼
Backend / OCR Service
 │
 ├── Validate File
 │
 ├── Image Preprocessing
 │
 ├── PaddleOCR
 │
 ├── Parse Required Fields
 │
 └── Delete / Dispose Image
 │
 ▼
JSON Draft
 │
 ▼
Frontend
 │
 ├── User ตรวจสอบ
 │
 └── User แก้ไขข้อมูลได้
 │
 ▼
Confirm
 │
 ▼
Transaction Database
```

------------------------------------------------------------------------

## 5. การจัดการรูปสลิป

รูปสลิปควรมีอายุอยู่เฉพาะระหว่างการประมวลผลเท่านั้น

``` text
Upload
  ↓
Memory / Temporary Storage
  ↓
OCR
  ↓
Extract Data
  ↓
Dispose Image
```

ไม่ควร:

-   Upload รูปเข้า Database
-   เก็บรูปลง Object Storage โดยไม่จำเป็น
-   Backup รูปสลิป
-   Log รูปสลิป
-   Log Raw OCR Text ที่มีข้อมูล Sensitive

เมื่อ OCR เสร็จแล้ว ให้ลบหรือ Dispose รูปทันที

------------------------------------------------------------------------

## 6. Sensitive Data

ระบบควรใช้หลัก Data Minimization คือเก็บข้อมูลให้น้อยที่สุดเท่าที่ Feature จำเป็นต้องใช้

ในระยะแรก OCR อาจอ่านข้อความหลายส่วนของภาพก่อน แล้ว Parser เลือกเฉพาะ Field
ที่ต้องการ

ในอนาคตสามารถเพิ่ม Image Preprocessing เช่น:

``` text
Original Slip
      ↓
Detect / Crop / Mask
      ↓
เฉพาะบริเวณที่ต้องการ
      ↓
OCR
```

ตัวอย่าง:

``` text
ชื่อผู้โอน       █████████
เลขบัญชี         █████████

จำนวนเงิน         850.00
วันที่             23/08/2026
เวลา              14:32
```

จากนั้นจึงส่งเฉพาะบริเวณที่จำเป็นเข้า OCR เพื่อลดการประมวลผลข้อมูล Sensitive
ที่ไม่เกี่ยวข้อง

------------------------------------------------------------------------

## 7. User Confirmation

ผลลัพธ์จาก OCR ไม่ควรถูกบันทึกเป็น Transaction จริงทันที

ตัวอย่าง:

``` text
OCR Result

Amount: 850.00
Date:   23/08/2026
Time:   14:32

[ Edit ] [ Confirm ]
```

เหตุผลคือ OCR อาจอ่านข้อมูลผิด เช่น:

``` text
850.00
```

อาจถูกอ่านผิดเป็น:

``` text
650.00
```

ดังนั้น Flow ควรเป็น:

``` text
OCR
 ↓
Transaction Draft
 ↓
User Review
 ↓
User Confirm
 ↓
Save Transaction
```

------------------------------------------------------------------------

## 8. API Design เบื้องต้น

### Extract Slip

``` http
POST /api/slips/extract
```

Input:

``` text
Slip Image
```

Output:

``` json
{
  "amount": 850.00,
  "transactionDate": "2026-08-23T14:32:00+07:00",
  "source": "slip_scan"
}
```

API นี้ไม่บันทึก Transaction จริง

### Create Transaction

หลังจากผู้ใช้ตรวจสอบและยืนยันแล้ว:

``` http
POST /api/transactions
```

ตัวอย่าง:

``` json
{
  "amount": 850.00,
  "transactionDate": "2026-08-23T14:32:00+07:00",
  "categoryId": "food",
  "source": "slip_scan"
}
```

จากนั้นจึงบันทึกข้อมูลลง PostgreSQL

------------------------------------------------------------------------

## 9. Deployment Architecture

สำหรับ MVP:

``` text
                 User
                   │
                   ▼
             Web Application
                   │
                   ▼
                 Vercel
            ┌──────────────┐
            │ Web / API    │
            └──────┬───────┘
                   │
                   ▼
             OCR Service
            ┌──────────────┐
            │ Docker       │
            │ PaddleOCR    │
            │ Parser       │
            └──────┬───────┘
                   │
                JSON only
                   │
                   ▼
              User Confirm
                   │
                   ▼
            Neon PostgreSQL
```

### Web Application

ใช้ Vercel สำหรับ:

-   Frontend
-   Transaction API
-   Authentication
-   Business Logic

### Database

ใช้ Neon PostgreSQL Free Tier สำหรับ:

-   Transaction
-   Category
-   User data ที่จำเป็น

ไม่เก็บรูปสลิปใน PostgreSQL

### OCR Service

ใช้ Docker สำหรับ:

-   PaddleOCR
-   Image Processing
-   Transaction Field Parser

สามารถทดลอง Deployment บน Vercel ในช่วง Prototype ได้ แต่ควรออกแบบ OCR เป็น
Service แยก เพื่อให้สามารถย้ายไป Infrastructure ที่เหมาะกับ CPU-heavy workload
ได้ง่ายหากพบข้อจำกัดด้าน Memory, Execution Time หรือ Cold Start

------------------------------------------------------------------------

## 10. QR Code

QR Code ยังไม่ใช่ Requirement หลักของ OCR MVP

Phase แรก:

``` text
Slip
 ↓
OCR
 ↓
Transaction Draft
```

Phase หลังสามารถเพิ่ม:

``` text
Slip
 ├── OCR
 └── QR Decoder
        ↓
   Cross Validation
        ↓
Transaction Draft
```

QR สามารถใช้เป็นข้อมูลเสริมสำหรับตรวจสอบหรือเติมข้อมูล แต่ไม่ควรให้ MVP พึ่งพา QR Code
เป็นแหล่งข้อมูลหลักจนกว่าจะทดสอบ Payload จากสลิปของธนาคารที่ต้องการรองรับ

------------------------------------------------------------------------

## 11. Security Requirements

ระบบ OCR ควรมีอย่างน้อย:

-   HTTPS
-   Authentication สำหรับ API ที่จำเป็น
-   File type validation
-   File size limit
-   Rate limiting
-   Temporary image processing
-   ไม่เก็บ Original Slip
-   ไม่ Log Sensitive Data
-   ไม่ Log Raw OCR Output โดยไม่จำเป็น
-   ไม่ใช้ Third-party Cloud OCR ใน MVP
-   จำกัดข้อมูล Transaction ที่บันทึกตามหลัก Data Minimization
-   ตรวจสอบ Dependency และ Telemetry ของ OCR Service ก่อน Production

------------------------------------------------------------------------

## 12. MVP Implementation Plan

### Phase 1 --- OCR PoC

-   สร้าง PaddleOCR Docker Container
-   ทดลอง OCR กับสลิปธนาคารหลายรูปแบบ
-   ตรวจ Accuracy ของ Amount, Date และ Time
-   ทดสอบภาษาไทยและตัวเลข

### Phase 2 --- Parser

-   แปลง OCR Result เป็น Structured JSON
-   Extract Amount
-   Extract Date
-   Extract Time
-   Normalize รูปแบบวันที่และจำนวนเงิน

### Phase 3 --- API

สร้าง:

``` text
POST /api/slips/extract
```

Flow:

``` text
Image
 ↓
Validate
 ↓
OCR
 ↓
Parse
 ↓
JSON
 ↓
Delete Image
```

### Phase 4 --- User Confirmation

สร้าง UI:

``` text
Scan Slip
   ↓
OCR Result
   ↓
Edit / Confirm
   ↓
Save
```

### Phase 5 --- Database

เชื่อม Neon PostgreSQL และบันทึกเฉพาะ Transaction ที่ผู้ใช้ Confirm แล้ว

### Phase 6 --- Security

-   ตรวจ File Upload
-   จำกัดขนาดไฟล์
-   ตรวจ MIME Type
-   ป้องกัน Sensitive Logging
-   ตรวจ Temporary File Cleanup
-   ตรวจว่าไม่มีการส่งข้อมูลไป Third Party โดยไม่ตั้งใจ

### Phase 7 --- Accuracy Testing

สร้าง Test Dataset จากสลิปหลายธนาคารและวัด:

``` text
Amount Accuracy
Date Accuracy
Time Accuracy
Field Extraction Success Rate
Processing Time
```

### Phase 8 --- Optional Improvements

หลัง MVP จึงพิจารณา:

-   QR Code Decoder
-   Merchant / Receiver Extraction
-   Automatic Category Classification
-   Sensitive Region Masking
-   Slip Template Detection
-   Confidence Score
-   Duplicate Transaction Detection

------------------------------------------------------------------------

## 13. สรุป Architecture

แนวทางหลักของระบบคือ:

``` text
Self-hosted OCR
      ↓
Extract Minimum Data
      ↓
Delete Original Image
      ↓
Return JSON Draft
      ↓
User Confirmation
      ↓
Save Transaction
```

หลักสำคัญคือ:

> **Slip Image ไม่ถูกเก็บถาวร, ไม่ส่งไปยัง Third-party OCR, เก็บเฉพาะข้อมูลที่จำเป็น
> และต้องให้ผู้ใช้ยืนยันก่อนสร้าง Transaction จริง**
