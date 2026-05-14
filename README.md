# STeP CMU — ระบบขอเอกสารแบบแปลนผ่าน LINE OA

> ระบบ Automation สำหรับผู้เช่าพื้นที่ใน **STeP CMU (Science and Technology Park, Chiang Mai University)**  
> ให้ผู้ใช้สามารถขอเอกสารแบบแปลนอาคาร ติดตามสถานะ และส่งเอกสารกลับ ผ่าน LINE Official Account ได้ครบจบในที่เดียว

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://liff-s-te-p.vercel.app)
[![LINE OA](https://img.shields.io/badge/LINE%20OA-@148ynjar-00B900?logo=line)](https://line.me/R/ti/p/@148ynjar)

---

## ภาพรวมระบบ

ระบบนี้เชื่อมต่อหลายเทคโนโลยีเข้าด้วยกัน:

```
ผู้ใช้ (LINE App)
     │
     ▼
LINE Official Account (@148ynjar)
     │  Webhook
     ▼
n8n Cloud  ─────────────────────────────┐
(Automation Backend)                    │
     │                                  │
     ├──▶ Google Sheets (Database)      │
     ├──▶ Google Drive (ไฟล์เอกสาร)    │
     ├──▶ Gmail (อีเมลแจ้งเตือน)       │
     └──▶ OpenAI GPT-4o-mini (AI Agent)│
                                        │
Vercel (Frontend / LIFF) ◀─────────────┘
     │
     ▼
GitHub (Source Code — This Repo)
```

---

## Features

| Feature | สถานะ |
|---------|-------|
| ขอเอกสารแบบแปลนผ่าน LINE OA | ✅ |
| ฟอร์มกรอกข้อมูล (LIFF / Web Form) | ✅ |
| บันทึกคำขอลง Google Sheets อัตโนมัติ | ✅ |
| แจ้งเตือน Admin ทาง LINE ทันที | ✅ |
| ส่งอีเมลยืนยันให้ผู้ขอ | ✅ |
| Admin อนุมัติและส่งเอกสารผ่านหน้าเว็บ | ✅ |
| ผู้ใช้ดาวน์โหลดเอกสาร + ยืนยันรับ | ✅ |
| ติดตามสถานะคำขอ Real-time | ✅ |
| อัปโหลดเอกสารแก้ไขกลับ | ✅ |
| AI Agent ตอบคำถามเบื้องต้น | ✅ |
| SLA Reminder แจ้ง Admin ถ้าเกินกำหนด | ✅ |
| Admin Dashboard รายการคำขอทั้งหมด | ✅ |

---

## โครงสร้างไฟล์

```
Liff-STeP/
│
├── index.html           # ฟอร์มขอเอกสาร (LIFF) — 3 ขั้นตอน
├── upload.html          # ฟอร์มอัปโหลดเอกสารแก้ไขกลับ
├── request-status.html  # หน้าติดตามสถานะคำขอ
├── admin.html           # หน้า Admin อนุมัติคำขอรายเดียว
├── admin-list.html      # หน้า Admin Dashboard รายการคำขอทั้งหมด
├── document.html        # หน้าดาวน์โหลดเอกสาร / Preview PDF
├── vercel.json          # Vercel routing config
│
└── api/                 # Vercel Serverless Functions (Proxy → n8n)
    ├── submit.js        # POST /api/submit → n8n submit-request
    ├── upload.js        # POST /api/upload → n8n upload-revised-plan
    ├── status.js        # POST /api/status → n8n check-status
    ├── admin-approve.js # POST /api/admin-approve → n8n admin-approve
    ├── get-request.js   # GET /api/get-request → n8n check-status
    └── confirm.js       # GET /api/confirm → n8n user-confirm-receipt
```

> **หมายเหตุ:** ทุก API call จาก frontend ส่งผ่าน Vercel Serverless Function ก่อน เพื่อหลีกเลี่ยงปัญหา CORS

---

## User Flow

### Flow 1 — ขอเอกสาร

```
1. ผู้ใช้เปิด LINE → Rich Menu → กด "ขอเอกสาร"
2. LINE ส่งข้อความ "ขอเอกสาร" ไปยัง n8n
3. n8n ส่งปุ่มเปิดฟอร์ม LIFF กลับให้ผู้ใช้
4. ผู้ใช้กรอกฟอร์ม 3 ขั้นตอน (index.html)
   ├── ขั้นที่ 1: ข้อมูลผู้ขอ (ชื่อ, อีเมล, เบอร์)
   ├── ขั้นที่ 2: เลือกอาคาร / ชั้น / ห้อง / ประเภทเอกสาร
   └── ขั้นที่ 3: ยืนยันข้อมูลและส่ง
5. n8n สร้างเลขคำขอ (STeP-DOC-YYYYMM-XXXX)
6. บันทึกลง Google Sheets + สร้างโฟลเดอร์ใน Google Drive
7. ส่งอีเมลยืนยันให้ผู้ขอ
8. แจ้ง Admin ทาง LINE พร้อมปุ่ม "อนุมัติ"
```

### Flow 2 — Admin อนุมัติและส่งเอกสาร

```
1. Admin กด "อนุมัติ" ใน LINE → เปิด admin.html?code=XXX
2. ดูรายละเอียดคำขอ → กด "อนุมัติและส่งเอกสาร"
3. n8n อัปเดตสถานะ + ส่ง LINE ให้ผู้ใช้ พร้อมปุ่มดาวน์โหลด
4. ผู้ใช้กดดาวน์โหลด → เปิด document.html
5. ผู้ใช้กด "ยืนยันรับเอกสาร" → อัปเดตสถานะสมบูรณ์
```

### Flow 3 — ติดตามสถานะ

```
1. ผู้ใช้กด "ตรวจสถานะ" ใน Rich Menu → เปิด request-status.html
2. กรอกเลขคำขอ → ดู Timeline สถานะ Real-time
```

### Flow 4 — อัปโหลดเอกสารแก้ไขกลับ

```
1. ผู้ใช้กด "ส่งเอกสาร" ใน Rich Menu → เปิด upload.html
2. กรอกเลขคำขอ + แนบไฟล์ → ส่ง
3. n8n รับไฟล์ → แจ้ง Admin
```

### Flow 5 — AI Agent

```
1. ผู้ใช้พิมพ์ข้อความใดก็ตามที่ไม่ใช่ keyword
2. n8n ส่งไปยัง OpenAI GPT-4o-mini
3. AI ตอบคำถามเบื้องต้น + แนบเบอร์ติดต่อเจ้าหน้าที่เสมอ
```

---

## Tech Stack

| Component | เทคโนโลยีที่ใช้ |
|-----------|----------------|
| Frontend / LIFF | HTML, CSS, JavaScript (Vanilla) |
| Hosting | Vercel (auto-deploy จาก GitHub) |
| API Proxy | Vercel Serverless Functions (Node.js) |
| Automation Backend | n8n Cloud |
| LINE Integration | LINE Messaging API + LINE Login (LIFF) |
| Database | Google Sheets |
| File Storage | Google Drive |
| Email | Gmail (via n8n) |
| AI Agent | OpenAI GPT-4o-mini |
| Font | Sarabun (Google Fonts) |

---

## Rich Menu (6 ปุ่ม)

| ปุ่ม | ฟังก์ชัน |
|------|---------|
| ขอเอกสาร | เปิดฟอร์มขอเอกสาร (LIFF) |
| ตรวจสถานะ | เปิดหน้าติดตามสถานะ |
| ส่งเอกสาร | เปิดฟอร์มอัปโหลดเอกสาร |
| ติดต่อเจ้าหน้าที่ | แสดงข้อมูลติดต่อ |
| วิธีใช้งาน | แสดงขั้นตอนการใช้งาน |
| ช่วยแนะนำหน่อย | เปิด AI Agent |

---

## ข้อมูลเอกสารที่ขอได้

**อาคาร:** A, B, C, D (แต่ละอาคาร 5 ชั้น)

**ประเภทเอกสาร:**
- แบบสถาปัตยกรรม
- แบบโครงสร้าง
- แบบไฟฟ้า
- แบบสุขาภิบาล

---

## Deployment

ระบบ Deploy อัตโนมัติผ่าน **Vercel + GitHub**

1. Push code ขึ้น branch `main`
2. Vercel รับ webhook → Build อัตโนมัติ
3. ระบบ live ที่ `https://liff-s-te-p.vercel.app`

> **หมายเหตุสำคัญ:** ถ้าเพิ่มหน้า HTML ใหม่ ต้องเพิ่ม route ใน `vercel.json` ด้วย  
> มิเช่นนั้น Vercel จะ redirect ไปที่ `index.html` แทน

---

## n8n Workflows

| Workflow | หน้าที่ |
|----------|--------|
| **WF01 — LINE Chatbot Handler** | รับ LINE events, route ตาม keyword, AI Agent |
| **WF02 — Form Submission Handler** | รับข้อมูลฟอร์ม, บันทึก Sheets, แจ้ง Admin |
| **WF03 — SLA Reminder** | ตรวจ deadline ทุกวัน 09:00, แจ้ง Admin ถ้าเกิน |
| **WF04 — Admin Approve** | Admin อนุมัติ, ส่งเอกสารให้ผู้ใช้ |
| **WF05 — User Confirm** | ผู้ใช้ยืนยันรับเอกสาร, อัปเดตสถานะ |
| **WF06 — Check Status** | ตรวจสถานะคำขอจาก request code |

---

## Google Sheets Structure

**ชื่อ Sheet:** STeP Document Request System

| แท็บ | ข้อมูล |
|-----|--------|
| Requests | รายการคำขอทั้งหมด (request_code, ชื่อ, ประเภทเอกสาร, สถานะ, วันที่) |
| Users | ข้อมูลผู้ใช้ (LINE userId, ชื่อ, อีเมล) |
| StatusLogs | ประวัติการเปลี่ยนสถานะ |

---

## Design Decisions

- **ภาษาไทย** ในทุก UI และข้อความ LINE
- **ฟอนต์:** Sarabun — อ่านง่าย เหมาะสถาบัน
- **สีหลัก:** Navy Blue `#1A3A5C`
- **สไตล์:** เรียบ สบายตา เหมือนเว็บราชการ ไม่ใช้ emoji ใน UI
- **LINE:** ใช้ **Push Message** ทั้งหมด (ไม่ใช้ Reply Message เพราะ replyToken หมดอายุใน 30 วินาที)
- **CORS:** ทุก API ส่งผ่าน Vercel proxy — ไม่ call n8n โดยตรงจาก browser
- **Admin:** ระบุด้วย LINE userId — notification ส่งหาคนเดียว

---

## Environment Variables

ตัวแปรที่ต้องตั้งค่าใน **Vercel Dashboard** (ห้าม commit ลง repo):

```
N8N_WEBHOOK_URL=https://[your-n8n-instance].app.n8n.cloud
```

ตัวแปรที่ตั้งค่าใน **n8n** (ผ่าน Credentials):
- LINE Channel Access Token
- Google Sheets OAuth2
- Google Drive OAuth2  
- Gmail OAuth2
- OpenAI API Key

---

## License

This project is developed for **STeP CMU (Science and Technology Park, Chiang Mai University)** as an internal automation system.

---

*Developed by Sirawich Ingkawatcharakul — STeP CMU Internship Project 2569*
