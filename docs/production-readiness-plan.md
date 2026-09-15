# Dinero Feature-Complete-First Plan

อัปเดต: 29 สิงหาคม 2026

## เป้าหมาย

พัฒนา Dinero ให้ฟีเจอร์ที่ตกลงครบและผ่านการทดสอบก่อนเริ่มงาน deploy โดย Production รุ่นแรกเป็นระบบบันทึกการเงินแบบปิด ผู้ใช้สมัครเองไม่ได้ Super Admin เป็นผู้สร้าง username/password และมอบ credentials ให้ผู้ใช้

## ขอบเขตที่ยืนยันแล้ว

- งบ infrastructure เริ่มต้น 0 บาท
- ใช้ username/password
- ไม่มี public sign-up
- มี Super Admin สำหรับสร้าง ปิดใช้งาน และ reset credentials
- ผู้ใช้เห็นเฉพาะข้อมูลของตนเอง
- รองรับบัญชีเงิน รายรับ รายจ่าย การย้ายเงิน ประวัติ และสรุปยอด
- พัก OCR/Scan และ Smart Split/Settlement
- ใช้ THB และ timezone `Asia/Bangkok`
- Vercel/Neon เป็นเป้าหมาย deployment แต่ห้ามเริ่ม deploy ก่อน feature gate ผ่าน

## Roles

### Super Admin

- Login ด้วยบัญชี bootstrap ที่กำหนดผ่าน environment variables
- สร้าง user โดยระบบ generate username/password
- เห็น plaintext password เฉพาะ response ครั้งที่สร้าง/reset
- ดูรายชื่อ role/status/วันที่สร้าง/เข้าใช้ล่าสุด โดยไม่เห็นข้อมูลการเงินหรือ password
- reset password, revoke sessions และ activate/deactivate user

### User

- Login/logout ด้วย credentials ที่ได้รับ
- จัดการบัญชีเงินของตัวเอง
- จัดการรายรับ/รายจ่ายของตัวเอง
- ย้ายเงินระหว่างบัญชีของตัวเอง
- ดู Dashboard, History และ Summary ของตัวเอง

## Security Contract

- ห้ามเก็บหรือ log plaintext password
- Password ใช้ scrypt/Argon2id พร้อม unique salt
- Session token ต้องสุ่ม, cookie เป็น httpOnly/secure/sameSite และ database เก็บเฉพาะ token hash
- Reset password ต้อง revoke sessions เดิมทั้งหมด
- Deactivate user ต้อง login และเรียก private API ไม่ได้ทันที
- ทุก finance query ต้องมี `user_id` จาก session ห้ามรับ owner ID จาก client
- Login ต้องมี rate limit/backoff และ error ไม่บอกว่า username หรือ password ผิดส่วนใด
- Super Admin API ตรวจ role ทุกครั้ง

## Data Model

- `app_users`: username, password_hash, role, status, last_login_at
- `auth_sessions`: user_id, token_hash, expires_at
- `accounts`: user_id, name, type, opening_balance, currency, archived
- `transactions`: user_id, account_id, type, amount, category, date, note
- `transfers`: user_id, from_account_id, to_account_id, amount, date, note
- Versioned SQL/Drizzle migrations; API startup ห้ามสร้าง schema เอง

Balance คำนวณจาก:

```text
opening balance
+ income
- expense
+ incoming transfers
- outgoing transfers
```

Transfer ไม่รวมใน Income/Expense summary และต้นทาง/ปลายทางต้องอยู่ใน user เดียวกัน

## Development Order

### Phase 1 — Foundation และ Migration

- [x] เพิ่ม versioned migration และ migration runner
- [x] สร้าง schema users/sessions/accounts/transactions/transfers
- [x] เพิ่ม constraints, indexes และ timestamps
- [x] เพิ่ม bootstrap Super Admin แบบ idempotent
- [x] ยกเลิก `ensureFinanceSchema()`

### Phase 2 — Authentication

- [x] Login/logout/me API
- [x] Password hashing และ session token hashing
- [x] Session expiry/revocation
- [x] Frontend login และ route guard
- [x] ปิด public sign-up
- [ ] ทดสอบ invalid/expired/deactivated sessions

### Phase 3 — Super Admin

- [x] User list API และหน้า Admin
- [x] Generate username/password
- [x] แสดง credential ticket ครั้งเดียวพร้อม copy controls
- [x] Reset password และ revoke sessions
- [x] Activate/deactivate user
- [x] ป้องกัน admin ทำบัญชี bootstrap ใช้งานไม่ได้โดยไม่ตั้งใจ

### Phase 4 — Accounts

- [x] Create/list/update/archive accounts
- [x] Opening balance และ balance calculation
- [x] ป้องกันการเข้าถึง account ข้าม user
- [x] หน้า Accounts และ account selector ในฟอร์ม

### Phase 5 — Income/Expense

- [x] CRUD ครบ
- [x] Category, date, note และ validation
- [ ] Pagination/filter by month/type/account/category
- [x] ลบ mock fallback ใน Production path
- [ ] Loading/empty/error/success states

### Phase 6 — Transfer

- [x] CRUD ครบ
- [x] Atomic database transaction
- [x] ต้นทาง/ปลายทางห้ามซ้ำและต้องเป็นของ user
- [x] ไม่รวมใน income/expense totals
- [x] ทดสอบ create/edit/delete และ balance invariants

### Phase 7 — Dashboard และ Summary

- [x] ยอดรวมและยอดแยกบัญชี
- [x] รายรับ/รายจ่าย/สุทธิรายเดือน
- [x] ค่าใช้จ่ายตามหมวดหมู่
- [x] รายการล่าสุดและ month navigation
- [ ] Timezone tests สำหรับ Asia/Bangkok

### Phase 8 — Scope Cleanup และ UX

- [x] ซ่อน/ปิด `/scan` และ `/splits`
- [x] ลบ OCR/Split copy จาก navigation/manifest/settings
- [ ] ทำ responsive, keyboard focus, reduced motion และ accessibility states
- [x] ตรวจ Admin/Login/Finance UI ให้ใช้ design system เดียวกัน

### Phase 9 — Feature Gate

- [x] Typecheck และ build ผ่านโดยไม่มี blocking warning
- [ ] Unit tests: password, balance, transfer, summary
- [x] API integration smoke: auth/admin/finance CRUD และ cleanup
- [x] E2E API: admin creates user → user login → account → income/expense → transfer → summary
- [ ] Security checks: unauthenticated, cross-user, deactivated user, replay/revoked session
- [x] Migration test บนฐานข้อมูลเดิมโดยสร้างตารางใหม่แบบไม่ทับ schema เก่า

## Feature-Complete Gate

ถือว่าฟีเจอร์ครบเมื่อ:

- Super Admin ออกและ reset credentials ได้โดยไม่เก็บ plaintext
- User login และเห็นเฉพาะข้อมูลตนเอง
- Account/Income/Expense/Transfer CRUD ทำงานจริงและ refresh แล้วข้อมูลไม่หาย
- Balance และ Summary ตรงกับ fixtures
- ไม่มี mock fallback, Scan หรือ Smart Split ใน user flow
- Auth/Admin/ownership/finance tests ผ่าน
- Typecheck และ production build ผ่าน

## Deployment — ทำหลัง Feature Gate เท่านั้น

เมื่องานครบจึงเริ่ม:

1. ปรับ Nuxt/Elysia สำหรับ Vercel
2. สร้าง Neon Production database แยกจาก development/test
3. ตั้ง secrets และ bootstrap admin ใน Vercel
4. Deploy Preview และรัน migration/E2E
5. ตรวจ free-tier terms, quota, logs, backup/restore และ rollback
6. Deploy Production หลัง manual approval

## Environment Variables

```text
DATABASE_URL
FRONTEND_ORIGIN
SESSION_SECRET
SUPER_ADMIN_USERNAME
SUPER_ADMIN_PASSWORD_HASH
ALLOW_DEV_USER=false
FEATURE_SCAN=false
FEATURE_SPLITS=false
```

ห้ามนำ password จริง, session token หรือ secret ใส่ repository, log หรือเอกสารนี้
