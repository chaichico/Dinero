# Personal Finance & Smart Split — Page Structure

## 1. Navigation Structure

แอปออกแบบแบบ **Mobile-first PWA** โดย Navigation หลักประกอบด้วย:

```text
Bottom Navigation

Home
Transactions
Smart Split
Settings
```

และมี **Floating Action Button (+)** สำหรับ Action ที่ใช้บ่อย:

```text
+
├── เพิ่มรายจ่าย
├── เพิ่มรายรับ
├── ย้ายเงิน
├── Scan Slip
├── Scan Receipt
└── Scan QR
```

`Scan` เป็น Action ไม่ใช่ Navigation หลัก

---

# 2. Home / Dashboard

**Route**

```text
/
```

## หน้าที่

แสดงภาพรวมการเงินปัจจุบันและรายการล่าสุด โดยไม่ใส่ข้อมูลมากเกินไป

## โครงสร้างหน้า

```text
┌─────────────────────────────┐
│ Header                      │
│ สิงหาคม 2026          🔔    │
├─────────────────────────────┤
│ Financial Overview          │
│                             │
│ รายรับ      ฿35,000         │
│ รายจ่าย     ฿18,250         │
│ คงเหลือ     ฿16,750         │
│                             │
│ [ดูสรุปทั้งหมด]             │
├─────────────────────────────┤
│ Quick Actions               │
│                             │
│ [Scan Slip] [Scan Receipt]  │
├─────────────────────────────┤
│ รายการล่าสุด                │
│                             │
│ 🍜 อาหารกลางวัน     -250    │
│ 🚕 Grab              -120    │
│ 💰 เงินเดือน      +35,000    │
│                             │
│ [ดูทั้งหมด]                  │
├─────────────────────────────┤
│ Home  History  Split  ⚙     │
│              (+)            │
└─────────────────────────────┘
```

## Components

- Current period selector
- Income summary
- Expense summary
- Balance
- Quick Scan
- Recent Transactions
- Floating Action Button
- Bottom Navigation

---

# 3. Add Transaction

**Route**

```text
/transactions/new
```

## หน้าที่

เพิ่มรายการทางการเงินด้วยตนเอง

## Transaction Type

```text
[ รายจ่าย ] [ รายรับ ] [ ย้ายเงิน ]
```

## Expense / Income

```text
┌─────────────────────────────┐
│ ← เพิ่มรายการ               │
├─────────────────────────────┤
│                             │
│ [รายจ่าย][รายรับ][ย้ายเงิน] │
│                             │
│ จำนวนเงิน                   │
│ ฿ 250                       │
│                             │
│ หมวดหมู่                    │
│ 🍜 อาหาร                    │
│                             │
│ วันที่                       │
│ 23 สิงหาคม 2026             │
│                             │
│ รายละเอียด                  │
│ อาหารกลางวัน                │
│                             │
│ หมายเหตุ                    │
│ ________________________    │
│                             │
│ [       บันทึก       ]      │
└─────────────────────────────┘
```

## Transfer

เมื่อเลือก `ย้ายเงิน`:

```text
จำนวนเงิน
฿5,000

จาก
KBank

ไป
Wallet

วันที่
23 สิงหาคม 2026

หมายเหตุ
...
```

Transfer จะไม่ถูกนำไปคำนวณเป็น Income หรือ Expense

---

# 4. Transaction History

**Route**

```text
/transactions
```

## หน้าที่

ดูรายการทางการเงินย้อนหลังทั้งหมด

## โครงสร้าง

```text
┌─────────────────────────────┐
│ รายการ                      │
├─────────────────────────────┤
│ 🔍 ค้นหารายการ              │
│                             │
│ [ทั้งหมด] [รายจ่าย] [รายรับ]│
│                             │
│ [วันที่ ▼] [หมวดหมู่ ▼]     │
├─────────────────────────────┤
│ 23 สิงหาคม                  │
│                             │
│ 🍜 อาหารกลางวัน      -250   │
│ 🚕 Grab               -120   │
│ 🛒 Supermarket        -850   │
│                             │
│ 22 สิงหาคม                  │
│                             │
│ 💰 เงินเดือน       +35,000   │
├─────────────────────────────┤
│ Home  History  Split  ⚙     │
└─────────────────────────────┘
```

## Filter

MVP รองรับ:

- Date
- Transaction Type
- Category

---

# 5. Transaction Detail

**Route**

```text
/transactions/:id
```

## หน้าที่

ดูรายละเอียด Transaction และสามารถแก้ไขหรือลบได้

```text
┌─────────────────────────────┐
│ ← รายละเอียด          ⋮     │
├─────────────────────────────┤
│                             │
│ 🍜 อาหาร                    │
│                             │
│ - ฿250                      │
│                             │
│ อาหารกลางวัน                │
│                             │
├─────────────────────────────┤
│ วันที่                       │
│ 23 สิงหาคม 2026             │
│                             │
│ ประเภท                      │
│ รายจ่าย                     │
│                             │
│ Source                      │
│ Slip Scan                   │
│                             │
│ หมายเหตุ                    │
│ -                           │
├─────────────────────────────┤
│ [แก้ไข]                     │
│ [ลบรายการ]                  │
└─────────────────────────────┘
```

ไม่แสดงภาพ Slip เพราะระบบไม่เก็บภาพต้นฉบับ

---

# 6. Scan

**Route**

```text
/scan
```

## หน้าที่

เป็นหน้ากลางสำหรับนำข้อมูลจากรูปเข้าสู่ระบบ

```text
┌─────────────────────────────┐
│ ← Scan                      │
├─────────────────────────────┤
│                             │
│ เพิ่มข้อมูลจากรูป           │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📄 Scan Slip            │ │
│ │ อ่านข้อมูลจากสลิป       │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🧾 Scan Receipt         │ │
│ │ อ่านรายการจากใบเสร็จ    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ▣ Scan QR              │ │
│ │ อ่านข้อมูล QR           │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

เมื่อเลือกประเภท:

```text
Camera / Gallery
      ↓
Upload
      ↓
Processing
      ↓
Review
```

---

# 7. Scan Processing

ไม่จำเป็นต้องเป็น Route ถาวร สามารถเป็น Loading State ของหน้า Scan ได้

```text
┌─────────────────────────────┐
│                             │
│          Processing         │
│                             │
│             ◌               │
│                             │
│ กำลังอ่านข้อมูลจากสลิป...   │
│                             │
│ กรุณารอสักครู่              │
│                             │
└─────────────────────────────┘
```

Backend Flow:

```text
Image
 ↓
OCR / QR Decode
 ↓
Parse
 ↓
Structured JSON
 ↓
Delete Image
```

---

# 8. Scan Review

**Route**

```text
/scan/review
```

## หน้าที่

ให้ผู้ใช้ตรวจสอบข้อมูลที่ Extract ก่อนสร้าง Transaction

```text
┌─────────────────────────────┐
│ ← ตรวจสอบข้อมูล             │
├─────────────────────────────┤
│                             │
│ อ่านข้อมูลสำเร็จ ✓          │
│                             │
│ ประเภท                      │
│ [รายจ่าย ▼]                 │
│                             │
│ จำนวนเงิน                   │
│ ฿850                        │
│                             │
│ วันที่                       │
│ 23/08/2026                  │
│                             │
│ เวลา                         │
│ 18:32                       │
│                             │
│ ผู้รับ                       │
│ ABC Restaurant              │
│                             │
│ หมวดหมู่                    │
│ [🍜 อาหาร ▼]                │
│                             │
│ รายละเอียดเพิ่มเติม         │
│ ________________________    │
│                             │
│ [       บันทึก       ]      │
└─────────────────────────────┘
```

ทุก Field ที่จำเป็นควรแก้ไขได้

เมื่อกดบันทึก:

```text
OCR Draft
 ↓
User Confirm
 ↓
POST /transactions
 ↓
PostgreSQL
```

---

# 9. Receipt Review

สามารถใช้ Route เดียวกับ Scan Review แต่เปลี่ยน UI ตาม Document Type

```text
/scan/review
```

## โครงสร้าง

```text
ร้าน ABC

23 สิงหาคม 2026

รายการ

Pizza
฿320
[แก้ไข]

Pasta
฿180
[แก้ไข]

Water
฿40
[แก้ไข]

Coffee
฿90
[แก้ไข]

────────────

รวม
฿630

[+ เพิ่มรายการ]

[บันทึกเป็นรายจ่าย]
[นำไป Smart Split]
```

จุดสำคัญคือผู้ใช้สามารถเลือกได้ว่า Receipt นี้จะ:

```text
Receipt
   │
   ├── บันทึกเป็น Personal Expense
   │
   └── นำไป Smart Split
```

---

# 10. Financial Summary

**Route**

```text
/summary
```

## หน้าที่

แสดงสรุปการเงินตามช่วงเวลา

## Period Selector

```text
[ วัน ] [ สัปดาห์ ] [ เดือน ]
```

## โครงสร้าง

```text
┌─────────────────────────────┐
│ ← สรุปการเงิน               │
├─────────────────────────────┤
│                             │
│ [วัน] [สัปดาห์] [เดือน]     │
│                             │
│ สิงหาคม 2026       <   >    │
│                             │
├─────────────────────────────┤
│ รายรับ                      │
│ ฿35,000                     │
│                             │
│ รายจ่าย                     │
│ ฿18,250                     │
│                             │
│ คงเหลือ                     │
│ ฿16,750                     │
├─────────────────────────────┤
│ ค่าใช้จ่ายตามหมวดหมู่       │
│                             │
│ 🍜 อาหาร          ฿5,200    │
│ 🛍 Shopping       ฿4,100    │
│ 🏠 ที่พัก          ฿3,500    │
│ 🚕 เดินทาง         ฿2,800    │
│ 📦 อื่น ๆ          ฿2,650    │
└─────────────────────────────┘
```

สามารถเพิ่ม Chart ได้ แต่ไม่ควรให้ Chart เป็นข้อมูลหลักเพียงอย่างเดียว

กด Category เพื่อดู Transactions ในหมวดนั้นได้

---

# 11. Smart Split Groups

**Route**

```text
/splits
```

## หน้าที่

แสดงกลุ่มหารเงินทั้งหมด

```text
┌─────────────────────────────┐
│ Smart Split                 │
│                             │
│ [ + สร้างกลุ่ม ]            │
├─────────────────────────────┤
│                             │
│ 🇯🇵 Japan Trip 2026         │
│ 4 สมาชิก                    │
│                             │
│ คุณต้องได้รับคืน ฿1,400      │
│                             │
├─────────────────────────────┤
│ 🍽 Dinner                   │
│ 5 สมาชิก                    │
│                             │
│ ✓ เคลียร์แล้ว               │
│                             │
├─────────────────────────────┤
│ Home  History  Split  ⚙     │
└─────────────────────────────┘
```

---

# 12. Create Split Group

**Route**

```text
/splits/new
```

## หน้าที่

สร้างกลุ่มใหม่

```text
┌─────────────────────────────┐
│ ← สร้างกลุ่ม                │
├─────────────────────────────┤
│                             │
│ ชื่อกลุ่ม                   │
│ Japan Trip 2026             │
│                             │
│ สมาชิก                      │
│                             │
│ 👤 ฉัน                      │
│ 👤 A                 [×]    │
│ 👤 B                 [×]    │
│ 👤 C                 [×]    │
│                             │
│ [+ เพิ่มสมาชิก]             │
│                             │
│ [      สร้างกลุ่ม      ]    │
└─────────────────────────────┘
```

MVP สามารถเพิ่มสมาชิกด้วยชื่อโดยไม่บังคับว่าทุกคนต้องมี Account

---

# 13. Split Group Detail

**Route**

```text
/splits/:id
```

## หน้าที่

เป็นหน้าหลักของแต่ละ Group

```text
┌─────────────────────────────┐
│ ← Japan Trip 2026      ⋮    │
├─────────────────────────────┤
│                             │
│ คุณจ่ายไป                   │
│ ฿5,200                      │
│                             │
│ ส่วนของคุณ                  │
│ ฿3,800                      │
│                             │
│ ต้องได้รับคืน               │
│ ฿1,400                      │
│                             │
├─────────────────────────────┤
│ [รายการ]       [ยอดคงค้าง]  │
├─────────────────────────────┤
│                             │
│ 🏨 Hotel          ฿4,000    │
│ A เป็นผู้จ่าย               │
│                             │
│ 🍜 Dinner         ฿1,500    │
│ คุณเป็นผู้จ่าย              │
│                             │
│ 🚕 Taxi             ฿600    │
│ C เป็นผู้จ่าย               │
│                             │
│ [ + เพิ่มค่าใช้จ่าย ]       │
└─────────────────────────────┘
```

---

# 14. Add Split Expense

**Route**

```text
/splits/:id/expense
```

## หน้าที่

เพิ่มค่าใช้จ่ายภายใน Group

สามารถเพิ่มจาก:

```text
Manual
Scan Slip
Scan Receipt
```

Manual:

```text
รายการ
Pizza

จำนวน
฿600

ผู้จ่าย
[ฉัน ▼]

หารกับ

✓ ฉัน
✓ A
✓ B
□ C

หารเท่ากัน

ฉัน     200
A       200
B       200

[บันทึก]
```

---

# 15. Receipt Item Split

**Route**

```text
/splits/:id/receipt
```

## หน้าที่

แบ่งสมาชิกตามแต่ละรายการที่ OCR อ่านจาก Receipt

```text
┌─────────────────────────────┐
│ ← แบ่งรายการ                │
├─────────────────────────────┤
│ ABC Restaurant              │
│ รวม ฿1,000                  │
├─────────────────────────────┤
│ Pizza                ฿600   │
│                             │
│ ✓ A  ✓ B  ✓ C  □ D         │
│                             │
├─────────────────────────────┤
│ Beer                 ฿300   │
│                             │
│ □ A  ✓ B  ✓ C  □ D         │
│                             │
├─────────────────────────────┤
│ Water                ฿100   │
│                             │
│ ✓ A  ✓ B  ✓ C  ✓ D         │
│                             │
├─────────────────────────────┤
│ ผู้จ่าย                     │
│ [A ▼]                       │
│                             │
│ [คำนวณยอด]                  │
└─────────────────────────────┘
```

หลังคำนวณแสดง Preview ก่อน Confirm

---

# 16. Split Calculation Preview

สามารถเป็น Step ต่อจาก Receipt Item Split โดยไม่จำเป็นต้องมี Route แยก

```text
สรุป

A
รับผิดชอบ ฿225

B
รับผิดชอบ ฿375

C
รับผิดชอบ ฿375

D
รับผิดชอบ ฿25

────────────

รวม ฿1,000

[ย้อนกลับ]
[ยืนยัน]
```

---

# 17. Settlement

**Route**

```text
/splits/:id/settlement
```

หรือเป็น Tab ภายใน Group Detail

## หน้าที่

แสดงผล Debt Simplification

```text
┌─────────────────────────────┐
│ ยอดคงค้าง                   │
├─────────────────────────────┤
│                             │
│ B                           │
│ ↓                           │
│ A                           │
│ ฿420                        │
│                 [ชำระแล้ว] │
│                             │
├─────────────────────────────┤
│ C                           │
│ ↓                           │
│ A                           │
│ ฿180                        │
│                 [ชำระแล้ว] │
│                             │
├─────────────────────────────┤
│ D                           │
│ ↓                           │
│ B                           │
│ ฿250                        │
│                 [ชำระแล้ว] │
└─────────────────────────────┘
```

เมื่อกด `ชำระแล้ว` ต้องมี Confirm ก่อนเปลี่ยนสถานะ

---

# 18. Share Split

ไม่จำเป็นต้องอยู่ Bottom Navigation

เข้าจาก Group Menu:

```text
Japan Trip
    ↓
Share
    ↓
Generate Link
```

Public View:

```text
Japan Trip 2026

ยอดของคุณ

ต้องจ่าย A
฿850

ต้องจ่าย B
฿320

────────────

รวม
฿1,170
```

ผู้รับ Link สามารถดูได้โดยไม่จำเป็นต้องสมัคร Account

ควรแสดงเฉพาะข้อมูลที่จำเป็นต่อผู้รับ Link

---

# 19. Settings

**Route**

```text
/settings
```

## MVP

```text
Settings

Account
────────────
Profile

การเงิน
────────────
จัดการหมวดหมู่

Application
────────────
Theme
Language

Account
────────────
Logout
```

---

# 20. Category Management

**Route**

```text
/settings/categories
```

## หน้าที่

จัดการ Category สำหรับ Transaction

```text
หมวดหมู่รายจ่าย

🍜 อาหาร
🚕 เดินทาง
🛍 Shopping
🏠 ที่พัก
🎮 Entertainment

[+ เพิ่มหมวดหมู่]


หมวดหมู่รายรับ

💰 เงินเดือน
💼 Freelance
🎁 โบนัส
📦 อื่น ๆ
```

---

# 21. Complete Sitemap

```text
App
│
├── Home
│   └── /
│
├── Transactions
│   ├── /transactions
│   ├── /transactions/new
│   └── /transactions/:id
│
├── Scan
│   ├── /scan
│   └── /scan/review
│
├── Summary
│   └── /summary
│
├── Smart Split
│   ├── /splits
│   ├── /splits/new
│   ├── /splits/:id
│   ├── /splits/:id/expense
│   ├── /splits/:id/receipt
│   └── /splits/:id/settlement
│
└── Settings
    ├── /settings
    └── /settings/categories
```

---

# 22. Main User Flows

## Manual Transaction

```text
Home
 ↓
+
 ↓
Expense / Income / Transfer
 ↓
กรอกข้อมูล
 ↓
Save
 ↓
Home / Transaction History
```

## Scan Slip

```text
Home
 ↓
Scan Slip
 ↓
เลือกรูป / ถ่ายรูป
 ↓
OCR
 ↓
ลบรูปหลังประมวลผล
 ↓
Scan Review
 ↓
แก้ไข / Confirm
 ↓
Create Transaction
```

## Scan Receipt → Personal Expense

```text
Scan Receipt
 ↓
OCR
 ↓
Receipt Review
 ↓
ตรวจสอบ Items
 ↓
บันทึกเป็นรายจ่าย
```

## Scan Receipt → Smart Split

```text
Scan Receipt
 ↓
OCR
 ↓
Receipt Review
 ↓
นำไป Smart Split
 ↓
เลือก Group
 ↓
เลือกสมาชิกของแต่ละ Item
 ↓
คำนวณ
 ↓
Confirm
```

## Smart Split

```text
Create Group
 ↓
Add Members
 ↓
Add Expenses
 ↓
Calculate Balance
 ↓
Debt Simplification
 ↓
Settlement
```

---

# 23. MVP Page Priority

## Priority 1 — Finance Foundation

```text
Home
Add Transaction
Transaction History
Transaction Detail
Summary
```

## Priority 2 — Scan

```text
Scan
Scan Processing
Scan Review
Receipt Review
```

## Priority 3 — Smart Split

```text
Split Groups
Create Group
Group Detail
Add Split Expense
Receipt Item Split
Settlement
Share View
```

## Priority 4 — Supporting Pages

```text
Settings
Category Management
```

---

# 24. UI Design Principles

อ้างอิงแนวทางจากแอปบันทึกรายรับรายจ่ายที่ให้มา โดยไม่ Copy UI โดยตรง

### Mobile First

ทุก Action หลักต้องใช้งานง่ายบนมือถือ เพราะ Scan Slip / Receipt เป็น Use Case สำคัญ

### Fast Transaction Entry

การเพิ่มรายการ Manual ควรใช้ขั้นตอนให้น้อยที่สุด

```text
Type → Amount → Category → Save
```

Fields อื่นเป็น Secondary Information

### Scan ต้อง Review ก่อน Save

```text
Image
→ OCR
→ Draft
→ Review
→ Confirm
→ Transaction
```

ห้ามสร้าง Transaction จาก OCR โดยอัตโนมัติโดยไม่ให้ผู้ใช้ตรวจสอบ

### Summary ต้องอ่านง่าย

หน้า Home แสดงเฉพาะข้อมูลหลัก ส่วน Analytics รายละเอียดให้อยู่หน้า Summary

### Smart Split แยกจาก Personal Transaction

Personal Finance และ Smart Split ใช้ข้อมูลร่วมกันได้ แต่ UI ควรแยก Context ชัดเจน เพื่อไม่ให้ผู้ใช้สับสนระหว่าง:

```text
เงินของฉัน
vs
เงินที่หารกับกลุ่ม
```
