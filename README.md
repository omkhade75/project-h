# 🚀 OmniMind AI — Enterprise Business Intelligence & SaaS OS

**OmniMind AI (Bizora)** is an enterprise-grade, multi-tenant AI Business Operating System designed to run modern retail chains, supermarkets, franchises, and multi-department businesses. It unifies POS Billing, Inventory Stock Control, Double-Entry Accounting, Customer CRM, Supplier Procurement, VAPI AI Voice Calls, Automated WhatsApp Messaging, and Gemini AI Decision Intelligence into a single control plane.

---

## 🏛️ Platform Architecture & Deployment Topology

OmniMind AI is built as a production-grade monorepo separating static frontend portals and a centralized NestJS REST API Web Service:

```
omnimind-ai/
├── apps/
│   ├── admin/                 # 🛡️ Admin Portal (bizora-admin.onrender.com)
│   ├── owner/                 # 👑 Owner Portal (bizora-owner.onrender.com)
│   ├── customer/              # 🛍️ Customer Portal (bizora-customer.onrender.com)
│   ├── supplier/              # 🚚 Supplier Portal (bizora-supplier.onrender.com)
│   └── web/                   # 🌐 Main Marketing Web Portal
├── services/
│   └── backend/               # ⚙️ Centralized NestJS REST API (bizora-backend-gtoe.onrender.com)
│       └── src/
│           ├── controllers/   # REST Controllers (Auth, POS, Inventory, Comms, SystemAdmin)
│           ├── services/      # Core Business Logic Services
│           ├── guards/        # JWT Authentication & RBAC Guards
│           └── database/      # Prisma & MongoDB Mongoose ORMs
└── packages/
    ├── database/              # Supabase PostgreSQL Prisma Schema
    ├── ui/                    # Shared Design System Tokens
    └── types/                 # Shared TypeScript Contracts
```

---

## 🔐 Demo Credentials & Portals Quick Reference

All static frontends communicate directly via REST API `fetch()` to the NestJS backend on Render:

| Role Portal | Live URL | Email | Password | Primary Color & Features |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ Admin** | `bizora-admin.onrender.com` | `admin@gmail.com` | `123456789` | **Deep Purple/Indigo**. POS Billing, Command Center, Tenant Management, Anomaly Audits, System Admin. |
| **👑 Owner** | `bizora-owner.onrender.com` | `owner@gmail.com` | `123456789` | **Premium Gold/Amber**. Executive P&L Dashboard, Double-Entry GL Ledger, Treasury Reserves, Time Machine. |
| **🛍️ Customer** | `bizora-customer.onrender.com` | `customer@gmail.com` | `123456789` | **Electric Blue/Cyan**. VIP Loyalty Wallet, Purchase Receipts, Delivery Tracking, AI Rewards. |
| **🚚 Supplier** | `bizora-supplier.onrender.com` | `supplier@gmail.com` | `123456789` | **Emerald Green**. Vendor Scorecards, Inbound PO Accept/Reject, Logistics Dispatch, Voice Outbound. |

---

## 🏢 Multi-Tenant SaaS Onboarding & Approval Workflow

1. **Unauthenticated Landing**: When a business owner visits `bizora-owner.onrender.com`, they see the **Landing Page** with two clear options:
   - **Login to Workspace** (`/login`)
   - **Register Company** (`/register`)
2. **Company Registration**: The store owner fills out Company Details, Owner Name, Mobile Number, Email, and Password (`/register`).
3. **Automated Admin Notifications**:
   - 📩 **Resend Email Alert**: Sent immediately to `khade8915@gmail.com` via Resend API.
   - 📱 **WhatsApp Alert**: Sent immediately to the Super Admin's phone number.
4. **Super Admin Approval**: You review pending requests in **System Admin Dashboard** (`bizora-admin.onrender.com/system-admin`) and click **`[APPROVE & CREATE WORKSPACE]`**.
5. **Strict Data Privacy**: Each company gets a dedicated `workspaceId` (e.g. `store-a`, `store-b`). Store A data is **100% isolated and private** from Store B.

---

## 🎙️ Indian Hindi VAPI AI Voice Agent

OmniMind AI includes an integrated **Vapi Outbound AI Calling Assistant**:

- **Vapi Credentials**:
  - **Agent ID**: `88b76de6-b66b-46f0-a536-8182804fab8a`
  - **Phone Number ID**: `027dfd39-b626-43cf-859f-6583a33f580b`
- **Voice Engine**: `hi-IN-SwaraNeural` (Natural Azure Indian Accent).
- **Language & Tone**: Fluent Indian Hindi / Hinglish with polite Indian business etiquette (*"Namaste Ji"*).
- **Model**: `gpt-4o-mini` (0.3 temperature) for ultra-low latency, instant voice responses.
- **REST Dispatch**: Triggered from **Settings**, **AI Decision Center**, and **Supplier 360 Drawers**.

---

## 📱 Automated WhatsApp & Email Messaging

- **Twilio WhatsApp API**: Integrated via `POST /api/comms/whatsapp/send`.
- **Resend Email API**: Integrated for `SYSTEM_ADMIN_EMAIL` (`khade8915@gmail.com`) and customer/owner email dispatches.
- **Automated Trigger Points**:
  - 🧾 **Digital POS Receipts**: Dispatched to customer WhatsApp numbers upon checkout.
  - ⚠️ **Low Stock & Expiry Alerts**: Sent immediately to the store owner's WhatsApp.
  - 📊 **Daily EOD Reports**: Dispatches end-of-day revenue, order count, and net profit summaries.
  - 🚚 **Purchase Orders**: Dispatches order notifications to supplier WhatsApp numbers.

---

## 🛠️ Environment Variables Configuration

Set these environment variables on your Render Web Service (`bizora-backend`):

| Variable Name | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL / Prisma Connection String |
| `DIRECT_URL` | Direct PostgreSQL Connection String |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens |
| `VAPI_AGENT_ID` | `88b76de6-b66b-46f0-a536-8182804fab8a` |
| `VAPI_PHONE_ID` | `027dfd39-b626-43cf-859f-6583a33f580b` |
| `VAPI_PUBLIC_KEY` | `e3322c27-c9ac-45cb-9c58-e49c8f423a1f` |
| `VAPI_PRIVATE_KEY` | `581c84cb-6185-4714-98d1-bdd823189ea0` |
| `TWILIO_ACCOUNT_SID` | `AC0c2e3acc342bd7771e472e2902b8a57f` |
| `TWILIO_AUTH_TOKEN` | `e5fb8f54afddd75806e8fd4f336a738f` |
| `TWILIO_WHATSAPP_SENDER` | Sender WhatsApp number (e.g. `whatsapp:+14155238886`) |
| `OWNER_WHATSAPP_NUMBER` | Real mobile number for WhatsApp alerts (e.g. `+919876543210`) |
| `SYSTEM_ADMIN_EMAIL` | `khade8915@gmail.com` |
| `RESEND_API_KEY` | `re_aKZeAQDH_915aDwRpwS1JdaWsMrikuRah` |
| `GEMINI_API_KEY` | Google Gemini AI Key |

---

## ⚡ Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run build -w packages/database
```

### 3. Build Backend Service
```bash
npm run build --prefix services/backend
```

### 4. Build Static Portals
```bash
npm run build -w apps/admin
npm run build -w apps/owner
npm run build -w apps/customer
npm run build -w apps/supplier
```

---

## 📄 License
© 2026 OmniMind AI · Enterprise Decision Intelligence & Business OS
