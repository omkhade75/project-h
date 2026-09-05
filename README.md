<div align="center">

# 🚀 Bizora AI (OmniMind)
### **Autonomous Retail Operating System, Multi-Store ERP & Decision Intelligence**

[![CI Build Verification](https://github.com/omkhade75/project-h/actions/workflows/ci.yml/badge.svg)](https://github.com/omkhade75/project-h/actions/workflows/ci.yml)
[![Live Backend Health Monitor](https://github.com/omkhade75/project-h/actions/workflows/health-cron.yml/badge.svg)](https://github.com/omkhade75/project-h/actions/workflows/health-cron.yml)
![Node.js Version](https://img.shields.io/badge/Node.js-v20-brightgreen?style=flat&logo=node.js)
![NestJS](https://img.shields.io/badge/NestJS-v10-red?style=flat&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=flat&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat)
![Platform Status](https://img.shields.io/badge/Render-Production%20Live-success?style=flat&logo=render)

<br />

[**👑 Store Owner Portal**](https://bizora-owner.onrender.com) &nbsp;•&nbsp;
[**🛡️ Super Admin Portal**](https://bizora-admin.onrender.com) &nbsp;•&nbsp;
[**🚚 Supplier Hub**](https://bizora-supplier.onrender.com) &nbsp;•&nbsp;
[**🛍️ Customer CRM**](https://bizora-customer.onrender.com) &nbsp;•&nbsp;
[**🌐 Web Marketing**](https://bizora-web.onrender.com) &nbsp;•&nbsp;
[**⚙️ Backend Microservice**](https://bizora-backend-gtoe.onrender.com)

<br />

📄 **[Download Official Project Architecture PDF (Bizora_AI_Project_Documentation.pdf)](./Bizora_AI_Project_Documentation.pdf)**

</div>

---

## 📖 Executive Summary

**Bizora AI** is an enterprise-grade, multi-tenant autonomous retail operating system and multi-store ERP designed for supermarket chains, multi-branch department stores, and retail enterprises. 

Bizora replaces fragmented, disconnected tools with a unified intelligent core that orchestrates **High-Velocity POS Billing**, **360° Inventory Control & Expiry Monitoring**, **Double-Entry General Ledger Accounting**, **Customer CRM & Loyalty**, **Supplier Procurement**, **Autonomous AI Decision Engine**, **Vapi AI Voice Calling**, and **Instant WhatsApp Receipting** across 5 synchronized role-based portals.

---

## 🌐 Live Production Deployments & Access Directory

All five client applications and the centralized REST backend are deployed live on Render with automatic HTTPS/TLS, automated environment orchestration, and continuous background diagnostics:

| Portal Role | Live Web Link | Target Audience | Key Capabilities & Features |
| :--- | :--- | :--- | :--- |
| **👑 Store Owner Portal** | [https://bizora-owner.onrender.com](https://bizora-owner.onrender.com) | Business Owners, Store Directors | Executive P&L dashboard, double-entry GL ledger, barcode scanner product entry, inventory forecasting, daily sales & AI decisions. |
| **🛡️ Super Admin Portal** | [https://bizora-admin.onrender.com](https://bizora-admin.onrender.com) | Platform Administrators | Shopkeeper onboarding approvals, tenant workspace provisioning, 5-min system health monitor, audit logs, subscription tier control. |
| **🚚 Supplier Hub** | [https://bizora-supplier.onrender.com](https://bizora-supplier.onrender.com) | Vendors & Suppliers | Vendor scorecards, inbound Purchase Order (PO) accept/reject, dispatch tracking, automated WhatsApp order alerts, Vapi AI restock calls. |
| **🛍️ Customer CRM Portal** | [https://bizora-customer.onrender.com](https://bizora-customer.onrender.com) | End Shoppers & Customers | Customer CRM portal, digital POS receipt history, loyalty rewards wallet, live dispatch tracking, feedback and product reviews. |
| **🌐 Marketing Portal** | [https://bizora-web.onrender.com](https://bizora-web.onrender.com) | Public Visitors & Prospects | Main landing page, platform overview, enterprise subscription pricing, interactive module tours, and self-onboarding. |
| **⚙️ Backend API Microservice** | [https://bizora-backend-gtoe.onrender.com](https://bizora-backend-gtoe.onrender.com) | Core REST Service | Centralized NestJS REST API microservice (`/api/health`, `/api/products`, `/api/auth`, `/api/system-admin`, `/api/comms`). |
| **💓 Automated Health Watchdog** | [https://bizora-backend-gtoe.onrender.com/api/health](https://bizora-backend-gtoe.onrender.com/api/health) | DevOps Telemetry | Automated 5-minute heartbeat checks, database connectivity verification, latency benchmarks, and Resend email alerts. |

---

## 🎯 The Core Problem & The Bizora Solution

```
┌─────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│              ❌ THE TRADITIONAL RETAIL CHAOS                │              ✅ THE AUTONOMOUS BIZORA OS                    │
├─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ • Disconnected Silos: Billing separated from accounting,    │ • Single Control Plane: POS, Accounting, Stock, and CRM     │
│   requiring manual end-of-day Excel reconciliations.        │   are connected in real-time with zero manual data entry.   │
│ • Inventory Shrinkage: Perishables expire on shelves        │ • 360° Expiry Watchdog: Dynamic reorder alerts trigger      │
│   unnoticed; stock-outs happen during peak hours.           │   automated supplier POs before stock reaches zero.         │
│ • Data Cross-Contamination: Multi-store owners struggle     │ • Strict Multi-Tenant Isolation: Store 1, 2, and 3 have     │
│   with mixed inventory and conflicting branch cashflows.    │   cryptographically isolated data & clean dashboards.       │
│ • Passive Retention: Zero tracking of Customer Lifetime     │ • AI Customer Engagement: Automated RFM segmentation,       │
│   Value (LTV), churn risk, or automated post-sale outreach. │   loyalty points, and Vapi AI voice calls for VIPs.         │
│ • Manual Vendor Procurement: Chaotic phone calls and lost   │ • Automated Supplier Hub: Instant purchase orders with      │
│   paper slips cause supply chain delivery bottlenecks.      │   vendor scorecards and automated WhatsApp dispatches.      │
└─────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 🏢 Multi-Store Isolation & Tenant Security Architecture

A primary architectural foundation of Bizora AI is **Mathematical Tenant Isolation**:

```
+---------------------------------------------------------------------------------------------------------+
|                                    BIZORA MULTI-PORTAL ARCHITECTURE                                     |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  +--------------------+  +--------------------+  +--------------------+  +----------------------------+ |
|  |  👑 OWNER PORTAL   |  |  🛡️ SUPER ADMIN    |  |  🚚 SUPPLIER HUB   |  |  🛍️ CUSTOMER CRM           | |
|  | (Owner / Manager)  |  | (Platform Overseer)|  | (Vendors/Logistics)|  | (Shoppers / Loyalty)       | |
|  +---------+----------+  +---------+----------+  +---------+----------+  +-------------+--------------+ |
|            |                       |                       |                           |                |
|            +-----------------------+-----------+-----------+---------------------------+                |
|                                                |                                                        |
|                                    [Edge Runtime / Nitro SSR]                                           |
|                                                |                                                        |
|                                                v                                                        |
|                             +--------------------------------------+                                    |
|                             |   ⚙️ NESTJS REST API MICROSERVICE     |                                    |
|                             |  - Multi-Tenant Auth Guard & RBAC    |                                    |
|                             |  - Dynamic Product & Inventory APIs  |                                    |
|                             |  - System Health & Crash Watchdog    |                                    |
|                             +------------------+-------------------+                                    |
|                                                |                                                        |
|                        +-----------------------+-----------------------+                                |
|                        |                                               |                                |
|                        v                                               v                                |
|         +-----------------------------+                 +-----------------------------+                 |
|         |    🐘 POSTGRESQL DATABASE   |                 |    🤖 EXTERNAL AI & COMMS   |                 |
|         |  - Prisma Multi-Tenant ORM  |                 |  - Vapi AI Voice Calling    |                 |
|         |  - Double-Entry Ledger      |                 |  - Resend Automated Alerts  |                 |
|         |  - Isolated Store Workspaces|                 |  - WhatsApp Dispatch Engine |                 |
|         +-----------------------------+                 +-----------------------------+                 |
+---------------------------------------------------------------------------------------------------------+
```

### 3-Step Tenant Lifecycle Pipeline:
1. **Company Onboarding (`/register`)**: New store owners register their company profile and plan preference (Starter, Pro, Enterprise). The account is initially sandboxed in an unverified state.
2. **Super Admin Approval (`/system-admin`)**: Platform administrators review new store applications. Approving the request sends an automated welcome email via Resend and initializes a clean tenant database workspace.
3. **Cryptographic Scope Binding**: Every database read, mutation, inventory balance, and receipt is scoped to the verified `workspaceId`. Random users or unapproved accounts have **zero read/write access** to other stores' data.

---

## 💻 Complete Technology Stack & Detailed Technical Rationale

| Category | Technology | Why This Technology Was Chosen |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TanStack Start & Router** | **100% End-to-End Type Safety**: TanStack Router ensures strictly typed route parameters and search queries (e.g. `/products?filter=low-stock&store=2`). TanStack Start brings hybrid SSR with zero hydration mismatch and sub-second navigation. |
| **Edge Server & Bundler** | **Nitro Engine & Vite 8** | **Blazing Builds & Cloud Portability**: Vite 8 provides sub-second HMR. Nitro compiles each portal into a lightweight, cloud-agnostic server worker deployable on Render, Cloudflare, or Node.js with instant cold-start response. |
| **Styling & Design System** | **Tailwind CSS v4 & Radix UI Primitives** | **Modern Fluid UX & Accessibility**: Tailwind v4 brings zero-runtime CSS variables with modern OKLCH color spaces. Radix UI provides unstyled WAI-ARIA compliant primitives (Dialogs, Slide Drawers, Popovers, Tabs) with silky smooth CSS animations (`popup-pop-in`, `slide-in-right`). |
| **Backend Architecture** | **NestJS (Node.js & TypeScript)** | **Enterprise Architectural Rigor**: Enforces dependency injection (DI), modular providers, strictly typed request lifecycle pipelines (Guards, Interceptors, Pipes), and maintainable domain boundaries. |
| **Database & ORM** | **PostgreSQL & Prisma ORM** | **Transactional ACID Guarantee**: Relational consistency is mandatory for double-entry ledgers, stock counts, and sales receipts. Prisma provides compile-time query generation, automated schema migrations, and immunity against SQL injections. |
| **Server State & Cache** | **TanStack React Query** | **Zero-Refresh Real-Time Sync**: Manages complex server caching with automatic background revalidation, optimistic mutations for rapid barcode scanning, and multi-window cache synchronization without manual page refreshes. |
| **Voice AI & Telephony** | **Vapi AI Voice Agents** | **Autonomous Human-Like Restocking**: Integrates ultra-low latency conversational voice agents in natural regional languages for automated supplier restocking calls and VIP customer engagement. |
| **Transactional Email & Alerts**| **Resend API** | **Guaranteed Deliverability & 24/7 Watchdog**: Dispatches instant HTML alert emails to the engineering team (`khade8915@gmail.com`) when server anomalies arise, and notifies owners upon company approval. |
| **Data Visualization** | **Recharts & D3** | **Responsive Financial Analytics**: Declarative SVG charting optimized for both mobile and desktop. Powers interactive revenue area charts, sparklines, and predictive AI demand curves. |
| **Hosting & CI/CD** | **Render Cloud Platform** | **Zero-Downtime Continuous Delivery**: Seamless Git-backed deployment pipeline with automated build execution, secret management, and automatic HTTPS/TLS. |

---

## 🎨 UI & Mobile Responsiveness Highlights

- **Ultra-Crisp Brand Identity**: Re-engineered high-contrast vector geometric logo (`BizoraLogo`) featuring pure white contrast cutouts and electric cyan AI core, scaling cleanly down to 16px.
- **Silky Smooth Micro-Interactions**:
  - `popup-pop-in`: Spring-damped 0.22s scale entrance animation for all dialogs and modals.
  - `slide-in-right` / `slide-in-left`: 0.28s cubic-bezier slide transitions for Radix drawers (Product 360, Customer 360, Supplier 360).
  - `.card-elevated:hover`: Tactile -2px lift with soft shadow transitions for interactive KPI cards.
- **Mobile-First UX**: Dialogs transform automatically into native iOS/Android-style bottom sheets (`max-height: 85vh`) on small screens, inputs maintain a minimum 16px font size to prevent iOS auto-zoom, and tables support momentum touch scrolling.
- **Live Sync Beacon**: Pulsing emerald beacon (`Live`) in the top navigation bar indicating real-time background synchronization.

---

## 📁 Monorepo Structure

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
│           ├── controllers/   # REST Endpoints (Auth, POS, Inventory, Health, Comms)
│           ├── services/      # Business Logic Services
│           ├── database/      # Prisma Client & Database Service
│           └── app.module.ts  # Master Module Registration
├── packages/
│   ├── database/              # PostgreSQL Prisma Schema & Client Generation
│   ├── ui/                    # Shared UI Components & Tailwind Configuration
│   └── types/                 # Shared TypeScript Contracts & Schemas
└── Bizora_AI_Project_Documentation.pdf # 📄 Official Architecture & Project Documentation PDF
```

---

## 🛠️ Key Environment Variables

Set these environment variables on your Render Backend Web Service (`bizora-backend`):

| Variable Name | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL / Prisma Connection String with Connection Pooling |
| `JWT_SECRET` | Secret key for cryptographic session tokens |
| `VAPI_AGENT_ID` | Vapi AI Voice Agent identifier for automated calls |
| `VAPI_PHONE_ID` | Vapi outbound phone number ID |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for automated WhatsApp receipts |
| `SYSTEM_ADMIN_EMAIL` | Admin alert email destination (`khade8915@gmail.com`) |
| `RESEND_API_KEY` | Resend API key for health alerts and onboarding emails |
| `GEMINI_API_KEY` | Google Gemini AI key for autonomous decision insights |

---

## ⚡ Local Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run build -w packages/database
```

### 3. Run Development Servers
```bash
npm run dev:backend   # NestJS Backend API (Port 3000)
npm run dev:owner     # Owner Portal (Port 3001)
npm run dev:admin     # Super Admin Portal (Port 3002)
npm run dev:supplier  # Supplier Portal (Port 3003)
npm run dev:customer  # Customer Portal (Port 3004)
npm run dev           # Marketing Web Portal (Port 3005)
```

### 4. Build for Production
```bash
npm run build:render:owner    # Builds Owner Portal (Prisma + Vite + Nitro)
npm run build:render:admin    # Builds Admin Portal
npm run build:backend         # Builds NestJS Backend
```

---

## 📄 License & Intellectual Property
© 2026 Bizora AI · Enterprise Decision Intelligence & Autonomous Retail Operating System. All Rights Reserved.
