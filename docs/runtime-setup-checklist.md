# Runtime Setup Checklist

เอกสารนี้สรุปสิ่งที่ยังต้องทำในระบบภายนอกเพื่อให้ flow ใหม่ใช้งานได้จริงครบวงจร

## 1. Vercel Environment Variables

ต้องตั้งอย่างน้อย:

- `STEP_WEBHOOK_SECRET`
- `ADMIN_USER_IDS`
- `GOOGLE_DRIVE_FOLDER_ID`

หมายเหตุ:
- `STEP_WEBHOOK_SECRET` ใช้เป็น `x-step-secret` ระหว่าง Vercel proxy และ n8n
- `ADMIN_USER_IDS` ใช้เป็น allowlist ของ LINE user ID เจ้าหน้าที่
- `GOOGLE_DRIVE_FOLDER_ID` ใช้เป็นโฟลเดอร์หลักสำหรับเก็บไฟล์จริง

## 2. Google Sheets Columns

ต้องมีคอลัมน์อย่างน้อย:

- `request_code`
- `line_user_id`
- `requester_name`
- `company`
- `phone`
- `email`
- `document_type`
- `building`
- `floor`
- `room_number`
- `required_date`
- `note`
- `status`
- `admin_file_name`
- `drive_file_id`
- `drive_file_url`
- `file_download_url`
- `pdf_file_name`
- `pdf_download_token`
- `approved_by`
- `approved_at`
- `delivered_at`
- `confirmed_at`
- `updated_at`

## 3. Required n8n Webhooks

### `submit-request`
รับ payload จาก `index.html` ผ่าน `/api/submit`

ควรบันทึก:
- `building`
- `floor`
- `roomNumber` / `room_number`
- `lineUserId`
- `status = PENDING_ADMIN`
- `pdf_download_token`

### `check-status`
รับ `requestCode` แล้วคืน JSON รูปแบบนี้:

```json
{
  "found": true,
  "request": {
    "request_code": "STeP-DOC-2569-0001",
    "status": "DELIVERED",
    "requester_name": "...",
    "document_type": "...",
    "area": "...",
    "building": "D",
    "floor": "2",
    "room_number": "D206",
    "admin_file_name": "D206-blueprint.pdf",
    "drive_file_id": "...",
    "drive_file_url": "...",
    "file_download_url": "...",
    "pdf_download_token": "...",
    "approved_at": "...",
    "updated_at": "..."
  }
}
```

### `admin-upload-file`
รับ payload จาก `admin.html` ผ่าน `/api/admin-upload-file`

payload หลัก:

```json
{
  "requestCode": "...",
  "adminUserId": "U...",
  "adminDisplayName": "...",
  "uploadedAt": "ISO timestamp",
  "file": {
    "name": "filename.pdf",
    "mimeType": "application/pdf",
    "size": 123456,
    "base64": "..."
  }
}
```

งานที่ webhook นี้ควรทำ:
- ตรวจ `x-step-secret`
- ตรวจ `adminUserId` ว่าอยู่ใน allowlist
- อัปโหลดไฟล์เข้า Google Drive
- บันทึก `admin_file_name`, `drive_file_id`, `drive_file_url`, `file_download_url`
- เปลี่ยน `status = FILE_UPLOADED`
- คืนข้อมูล request ที่อัปเดตแล้ว

### `admin-approve`
รับ payload จาก `admin.html` ผ่าน `/api/admin-approve`

payload หลัก:

```json
{
  "requestCode": "...",
  "action": "approve",
  "adminUserId": "U...",
  "adminDisplayName": "...",
  "driveFileId": "...",
  "driveFileUrl": "...",
  "adminFileName": "..."
}
```

งานที่ webhook นี้ควรทำ:
- ตรวจสิทธิ์ admin
- ตรวจว่ามีไฟล์จริงแล้ว
- เปลี่ยน `status = DELIVERED`
- set `approved_by`, `approved_at`, `delivered_at`, `updated_at`
- Push LINE หา user พร้อมลิงก์ `document.html?code=...&token=...`
- Push LINE แจ้ง admin ว่าส่งแล้ว

### `user-confirm-receipt`
รับ payload จาก `document.html` ผ่าน `/api/confirm`

payload หลัก:

```json
{
  "requestCode": "...",
  "lineUserId": "U...",
  "token": "..."
}
```

งานที่ webhook นี้ควรทำ:
- ตรวจ `token`
- ตรวจว่า `lineUserId` ตรงกับเจ้าของคำขอ
- เปลี่ยน `status = RECEIVED`
- set `confirmed_at`, `updated_at`
- Push LINE ขอบคุณผู้ใช้

## 4. Google Drive Behavior

โครงเก็บไฟล์ที่แนะนำ:

- โฟลเดอร์หลัก: `STeP-CMU-Documents/Admin-Files`
- โฟลเดอร์ย่อย: `<request_code>`

ถ้าต้องการซ่อนลิงก์ Drive จริง:
- ให้ n8n สร้าง `file_download_url` สำหรับ proxy หรือ signed/public link ที่ควบคุมได้
- หน้า `document.html` จะเรียก `/api/file-download?code=...&token=...` ก่อนทุกครั้ง

## 5. Current Frontend Behavior

ตอนนี้ฝั่งเว็บถูกเตรียมไว้แล้วดังนี้:

- `admin.html`
  - ตรวจสิทธิ์ LINE admin
  - เลือกไฟล์และส่งไป `admin-upload-file`
  - อนุมัติและส่งไป `admin-approve`
- `document.html`
  - ใช้ `/api/file-download` เป็นทางเข้าหลัก
  - fallback เป็น `/api/pdf` ถ้ายังไม่มีไฟล์จริง
  - ยืนยันรับเอกสารผ่าน `/api/confirm`
- `status.html`
  - รองรับสถานะ `FILE_UPLOADED`
  - แสดงชื่อไฟล์เอกสารและเลขห้อง
- `index.html`
  - ส่ง `building`, `floor`, `roomNumber`, `room_number` ไปพร้อม payload

## 6. Recommended Test Sequence

1. User ส่งคำขอ
2. `submit-request` บันทึก `PENDING_ADMIN`
3. Admin ได้ LINE แจ้งเตือนพร้อมลิงก์ `admin.html`
4. Admin อัปโหลดไฟล์จริง
5. `admin-upload-file` บันทึก `FILE_UPLOADED`
6. Admin กด approve
7. `admin-approve` ส่งเอกสารให้ user และเปลี่ยนเป็น `DELIVERED`
8. User เปิด `document.html` และดาวน์โหลดไฟล์
9. User กดยืนยันรับ
10. `user-confirm-receipt` เปลี่ยนเป็น `RECEIVED`
