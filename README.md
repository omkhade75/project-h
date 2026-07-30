# 🚀 Bizora AI (OmniMind) — Enterprise Business Intelligence & SaaS OS

**Bizora AI** is an enterprise-grade, multi-tenant AI Business Operating System designed for modern retail chains, supermarkets, franchises, and multi-department enterprises. It unifies POS Billing, Inventory Stock Control, Double-Entry Accounting, Customer CRM, Supplier Procurement, Vapi Voice AI Calls, Automated WhatsApp Messaging, and Gemini AI Decision Intelligence into a single unified control plane.

---

## 🌐 Live Deployed Portals Quick Reference

All static frontends communicate directly via REST API `fetch()` to the centralized NestJS backend hosted on Render:

| Portal Role | Live Web URL | Key Capabilities & Features |
| :--- | :--- | :--- |
| **🛡️ Super Admin** | [https://bizora-admin.onrender.com](https://bizora-admin.onrender.com) | Shopkeeper approvals, tenant workspace management, 5-min system health monitor, audit logs, subscription control. |
| **👑 Business Owner** | [https://bizora-owner.onrender.com](https://bizora-owner.onrender.com) | Executive P&L dashboard, double-entry GL ledger, barcode scanner product entry, inventory forecasting, daily sales & AI decisions. |
| **🛍️ Customer Portal** | [https://bizora-customer.onrender.com](https://bizora-customer.onrender.com) | Customer CRM portal, digital POS receipt history, loyalty rewards wallet, order tracking, product reviews. |
| **🚚 Supplier Portal** | [https://bizora-supplier.onrender.com](https://bizora-supplier.onrender.com) | Vendor scorecards, inbound PO accept/reject, dispatch status, automated WhatsApp order alerts, Vapi AI outbound calling. |
| **🌐 Marketing Portal** | [https://bizora-web.onrender.com](https://bizora-web.onrender.com) | Main landing page, platform overview, enterprise pricing, module feature tours, store onboarding. |
| **⚙️ Backend API** | [https://bizora-backend-gtoe.onrender.com](https://bizora-backend-gtoe.onrender.com) | Centralized NestJS REST API microservice (`/api/health`, `/api/products`, `/api/auth`, `/api/comms`). |

---

## ✨ Key Features & Technological Highlights

### 1. 🌞 Professional Light & Dark Mode
- **Clean SaaS Aesthetics**: Warm-cream background palette (`#FAFAF8`) with crisp solid cards, soft shadows, and clean border lines.
- **Instant Toggle**: Sun/Moon header button on all 5 portals with zero-flicker `localStorage` persistence.

### 2. 🇮🇳 12 Indian Regional Languages Support
- Supported languages: **English** (`en`), **Hindi** (`hi`), **Marathi** (`mr`), **Gujarati** (`gu`), **Tamil** (`ta`), **Telugu** (`te`), **Kannada** (`kn`), **Malayalam** (`ml`), **Bengali** (`bn`), **Punjabi** (`pa`), **Odia** (`or`), and **Assamese** (`as`).
- Header Globe selector dropdown with search filtering + dedicated Settings page regional language picker.

### 3. 📷 Camera Barcode Scanner & Simplified Product Entry
- **Connect Scanner**: Camera viewfinder modal utilizing browser `BarcodeDetector` API for instant barcode detection.
- **Fast Product Entry**: Simplified form requiring only **Product Name** and **Selling Price** with automated SKU and Barcode generation.

### 4. 🩺 Automated 5-Minute System Health Monitor & Email Alerting
- **Live Server Checks**: Automated checks for database connectivity (Prisma `$queryRaw`), memory usage, response times, and server uptime.
- **Email Alerts**: Automatically sends formatted HTML alert emails to `khade8915@gmail.com` via Resend API when database issues or high latencies occur.

### 5. 🎨 Custom Bizora AI Vector Logo Component
- Custom geometric 3D-gradient vector mark (`BizoraLogo`) with color-coded portal badges across all sidebars and sign-in pages.

---

## 🏛️ Platform Architecture & Deployment Topology

```
bizora-ai/
├── apps/
│   ├── admin/                 # 🛡️ Super Admin Portal (bizora-admin.onrender.com)
│   ├── owner/                 # 👑 Owner Portal (bizora-owner.onrender.com)
│   ├── customer/              # 🛍️ Customer Portal (bizora-customer.onrender.com)
│   ├── supplier/              # 🚚 Supplier Portal (bizora-supplier.onrender.com)
│   └── web/                   # 🌐 Main Marketing Portal (bizora-web.onrender.com)
├── services/
│   └── backend/               # ⚙️ NestJS REST API Backend (bizora-backend-gtoe.onrender.com)
│       └── src/
│           ├── controllers/   # REST Controllers (Auth, POS, Inventory, Health, Comms)
│           ├── services/      # Business Logic Services
│           ├── database/      # Prisma & Database Services
│           └── app.module.ts  # Master Module Registration
└── packages/
    ├── database/              # Supabase PostgreSQL Prisma Schema
    ├── ui/                    # Shared UI Components & Design Tokens
    └── types/                 # Shared TypeScript Contracts
```

---

## 🏢 Multi-Tenant SaaS Onboarding & Approval Workflow

1. **Store Onboarding**: A store owner registers company details via `bizora-owner.onrender.com/register`.
2. **Instant Super Admin Notification**:
   - 📩 **Resend Email Alert**: Dispatched immediately to `khade8915@gmail.com`.
   - 📱 **WhatsApp Alert**: Sent to the Super Admin's mobile number.
3. **Super Admin Approval**: Super Admin approves pending shopkeeper requests in `bizora-admin.onrender.com/system-admin`.
4. **Data Isolation**: Multi-tenant `workspaceId` ensures 100% data isolation per store.

---

## 🛠️ Key Backend Environment Variables

Set these environment variables on your Render Web Service (`bizora-backend`):

| Variable Name | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL / Prisma Connection String |
| `JWT_SECRET` | Secret key for JWT session tokens |
| `VAPI_AGENT_ID` | `88b76de6-b66b-46f0-a536-8182804fab8a` |
| `VAPI_PHONE_ID` | `027dfd39-b626-43cf-859f-6583a33f580b` |
| `TWILIO_ACCOUNT_SID` | `AC0c2e3acc342bd7771e472e2902b8a57f` |
| `SYSTEM_ADMIN_EMAIL` | `khade8915@gmail.com` |
| `RESEND_API_KEY` | Resend API Key for health & onboarding emails |
| `GEMINI_API_KEY` | Google Gemini AI Key for intelligent decision insights |

---

## ⚡ Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Database Client
```bash
npm run build -w packages/database
```

### 3. Build Backend Service
```bash
npm run build -w services/backend
```

### 4. Build Frontends
```bash
npm run build -w apps/owner
npm run build -w apps/admin
npm run build -w apps/supplier
npm run build -w apps/customer
npm run build -w apps/web
```

---

## 📄 License
© 2026 Bizora AI · Enterprise Decision Intelligence & Business OS
