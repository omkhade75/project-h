<div align="center">

# 🚀 Bizora AI (OmniMind OS)
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
[**🛍️ Customer Storefront**](https://bizora-customer.onrender.com) &nbsp;•&nbsp;
[**🌐 Web Marketing**](https://bizora-web.onrender.com) &nbsp;•&nbsp;
[**⚙️ Backend Microservice**](https://bizora-backend-gtoe.onrender.com)

<br />

📄 **[Download Official Project Architecture PDF (Bizora_AI_Project_Documentation.pdf)](./Bizora_AI_Project_Documentation.pdf)**

</div>

---

## 📖 Executive Summary

**Bizora AI** is an enterprise-grade, multi-tenant autonomous retail operating system and multi-store ERP engineered specifically for Indian retail store owners, supermarkets, grocery kiranas, and multi-branch distributors.

Bizora connects the entire retail supply chain into a single synchronized ecosystem:
- **For Shopkeepers**: Lightning-fast Point-of-Sale (POS) barcode billing, FIFO inventory control, double-entry P&L accounting, WhatsApp receipts, and automated restock alerts.
- **For Customers**: Hyperlocal neighborhood storefront for 10-minute essentials delivery, digital receipt history, and loyalty points wallet.
- **For Suppliers**: Direct B2B procurement portal with digital purchase orders (PO), logistics dispatch tracking, and automated voice reordering.
- **For Admins**: Centralized store verification, tenant health telemetry, and subscription quota management.

---

## 🌐 Live Production Deployments & Access Directory

All five client applications and the centralized REST backend are deployed live on Render with automatic HTTPS/TLS, automated environment orchestration, and continuous background diagnostics:

| Portal Role | Live Web Link | Target Audience | Key Capabilities & Features |
| :--- | :--- | :--- | :--- |
| **👑 Store Owner Portal** | [https://bizora-owner.onrender.com](https://bizora-owner.onrender.com) | Shopkeepers, Store Directors | 12 core daily operations: Command Center, POS Billing, Inventory, Sales, Customers, Expenses, Income, Suppliers, Reports, Plans & Settings + Collapsible Advanced Tools. |
| **🛡️ Super Admin Portal** | [https://bizora-admin.onrender.com](https://bizora-admin.onrender.com) | Platform Administrators | Shopkeeper onboarding approvals, tenant workspace provisioning, 5-min system health monitor, audit logs, subscription tier control. |
| **🚚 Supplier Hub** | [https://bizora-supplier.onrender.com](https://bizora-supplier.onrender.com) | Vendors & Suppliers | Vendor scorecards, inbound Purchase Order (PO) accept/reject, dispatch tracking, automated WhatsApp order alerts, Vapi AI restock calls. |
| **🛍️ Customer Storefront** | [https://bizora-customer.onrender.com](https://bizora-customer.onrender.com) | Local Neighborhood Shoppers | Hyperlocal store browsing, 10-minute delivery orders, digital receipt wallet, loyalty reward points, live order tracking. |
| **🌐 Marketing Portal** | [https://bizora-web.onrender.com](https://bizora-web.onrender.com) | Public Visitors & Prospects | Platform overview, interactive module demonstrations, ROI calculator, transparent SaaS pricing, and self-onboarding. |
| **⚙️ Backend API Microservice** | [https://bizora-backend-gtoe.onrender.com](https://bizora-backend-gtoe.onrender.com) | Central REST Engine | Centralized NestJS REST microservice (`/api/health`, `/api/products`, `/api/auth`, `/api/system-admin`, `/api/comms`). |
| **💓 Automated Health Watchdog** | [https://bizora-backend-gtoe.onrender.com/api/health](https://bizora-backend-gtoe.onrender.com/api/health) | DevOps & Telemetry | Automated 5-minute heartbeat checks, database connectivity verification, latency benchmarks, and Resend email alerting. |

---

## 🔒 Enterprise Security Hardening & Zero-Trust Architecture

The codebase has undergone a complete security hardening pass for commercial production launch:

```
┌─────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────┐
│                    SECURITY AUDIT AREA                      │                   PRODUCTION HARDENING                      │
├─────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────┤
│ 🔑 Database Credential Isolation                            │ 100% environment-driven via MONGODB_URI & DATABASE_URL.     │
│                                                             │ Zero plaintext secrets or passwords in source code.         │
│ 🛡️ Cryptographic Token Security                             │ JWT_SECRET & JWT_REFRESH_SECRET strictly required from env.  │
│                                                             │ Fail-fast server startup crash if keys are missing.         │
│ 🚪 Zero Universal Backdoors                                 │ Master password bypasses removed. All logins verified with  │
│                                                             │ bcrypt salt rounds=10. Demo accounts gated behind DEMO_MODE.│
│ 🌐 Strict CORS Origin Whitelisting                          │ Replaced wildcard (*) with explicit whitelist restricted to │
│                                                             │ the 5 verified Bizora production domains.                   │
│ 📦 Data Sanitization & Leak Protection                      │ Removed all hardcoded credentials & test autofill helpers   │
│                                                             │ from customer, supplier, owner, admin, and web login flows. │
└─────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 🎯 12-Core Shopkeeper Workflow + Advanced Tools

To ensure zero cognitive overload for busy Indian store owners, the dashboard is architected around **12 high-velocity daily tools**, with secondary modules neatly accessible via an expandable **Advanced Tools** drawer:

```
👑 STORE OWNER INTERFACE
├── 📊 Overview
│   └── ⚡ Command Center (Live Gross Revenue, Net Profit, Orders, Expenses, Onboarding Radar)
├── 🛒 Commerce
│   ├── 🖩 Billing (POS) (Barcode scanning, Walk-in / VIP checkout, Auto-stock deduction)
│   ├── 🛍️ Sales (Daily / monthly rolling revenue, Average Order Value, payment breakdown)
│   └── 👥 Customers (CRM loyalty tiers, purchase history, outstanding khata balance)
├── 📦 Operations
│   ├── 🏷️ Products (Hardware-free camera barcode scanner, batch control, auto-categorization)
│   ├── 🏬 Inventory (Real-time stock depletion, reorder thresholds, department breakdown)
│   └── 🚚 Suppliers (Vendor contacts, payment terms, procurement tracking)
├── 💰 Finance
│   ├── 💼 Income (Cash inflow tracking & revenue stream categorization)
│   ├── 📉 Expenses (Operating overhead, supplier payouts, instant ledger reconciliation)
│   └── 💳 Accounts (Double-entry balance sheet, assets, liabilities, working capital)
├── ⚙️ System
│   ├── 📄 Reports (GST reports, tax invoices, profit & loss statement exports)
│   ├── 💎 Plans & Pricing (Starter ₹0, Growth ₹699/mo, Enterprise ₹1999/mo)
│   └── ⚙️ Settings (Store profile, branch configuration, thermal printer setup)
└── 📂 [EXPANDABLE] Advanced Tools
    ├── ⚡ Live Operations (Pulsing multi-store activity feed)
    ├── ⏳ Business Time Machine (Historical simulation & replay)
    ├── 📈 Analytics & Cohort Intelligence (Department sales split)
    ├── 🧠 AI Decision Center (Gemini autonomous margin recommendations)
    ├── 🌍 Market Intelligence (Hyperlocal commodity price benchmarking)
    ├── 📉 Forecasting (Machine learning 30-day demand curves)
    ├── 🛡️ Anomaly & Risk (Shrinkage alerts & theft detection)
    ├── 🧾 Transactions (Detailed audit log of every checkout receipt)
    ├── ⏰ Expiry Intelligence (Perishable discount markdown engine)
    ├── 📋 Purchase Orders (Digital PO creation & vendor sign-off)
    ├── 🚚 Logistics & Dispatch (Driver assignment & delivery routing)
    ├── ⚡ Utilities (Electricity & facility bill tracker)
    ├── 📑 Tax & Compliance (GST slab breakdown & filings)
    ├── 🏢 Departments (Multi-counter retail department manager)
    ├── 👔 Staff & Managers (Role-based access permissions)
    ├── 🛍️ Customer Storefront Portal (Embedded shopper view)
    ├── 🚚 Supplier Portal (Embedded vendor view)
    └── 📥 Data Import (Bulk Excel/CSV catalog ingestion)
```

---

## 🏢 Multi-Store Isolation & Tenant Security Architecture

```
+---------------------------------------------------------------------------------------------------------+
|                                    BIZORA MULTI-PORTAL ARCHITECTURE                                     |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|  +--------------------+  +--------------------+  +--------------------+  +----------------------------+ |
|  |  👑 OWNER PORTAL   |  |  🛡️ SUPER ADMIN    |  |  🚚 SUPPLIER HUB   |  |  🛍️ CUSTOMER STOREFRONT     | |
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
|         |    🐘 DUAL DATABASE LAYER   |                 |    🤖 EXTERNAL AI & COMMS   |                 |
|         |  - PostgreSQL / Prisma ORM  |                 |  - Vapi AI Voice Calling    |                 |
|         |  - MongoDB Atlas Cloud      |                 |  - Resend Automated Alerts  |                 |
|         |  - Isolated Store Workspaces|                 |  - WhatsApp Dispatch Engine |                 |
|         +-----------------------------+                 +-----------------------------+                 |
+---------------------------------------------------------------------------------------------------------+
```

---

## 💻 Complete Technology Stack & Detailed Rationale

| Category | Technology | Why This Technology Was Chosen |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TanStack Start & Router** | **100% End-to-End Type Safety**: TanStack Router ensures strictly typed route parameters and search queries. TanStack Start brings hybrid SSR with zero hydration mismatch. |
| **Edge Server & Bundler** | **Nitro Engine & Vite 8** | **Blazing Builds & Cloud Portability**: Vite 8 provides sub-second HMR. Nitro compiles each portal into a lightweight server worker deployable on Render, Cloudflare, or Node.js. |
| **Styling & Design System** | **Tailwind CSS v4 & Radix UI Primitives** | **Modern Fluid UX & Accessibility**: Tailwind v4 brings zero-runtime CSS variables. Radix UI provides unstyled WAI-ARIA compliant primitives with silky smooth CSS animations. |
| **Backend Architecture** | **NestJS (Node.js & TypeScript)** | **Enterprise Architectural Rigor**: Enforces dependency injection (DI), modular providers, strictly typed request lifecycle pipelines, and maintainable domain boundaries. |
| **Database & ORM** | **PostgreSQL (Prisma) + MongoDB (Mongoose)** | **Hybrid Speed & ACID Reliability**: Dual-engine setup combining Prisma relational ACID guarantees for accounting with MongoDB Atlas for flexible catalogs and settings. |
| **Voice AI & Telephony** | **Vapi AI Voice Agents** | **Autonomous Human-Like Restocking**: Integrates ultra-low latency conversational voice agents in natural Hindi and English for automated supplier restocking calls. |
| **Transactional Email & Alerts**| **Resend API** | **Guaranteed Deliverability & 24/7 Watchdog**: Dispatches instant HTML alert emails to the engineering team when server anomalies arise, and notifies owners upon store verification. |
| **Data Visualization** | **Recharts & D3** | **Responsive Financial Analytics**: Declarative SVG charting optimized for both mobile and desktop. Powers interactive revenue area charts, sparklines, and predictive AI demand curves. |
| **Hosting & CI/CD** | **Render Cloud Platform** | **Zero-Downtime Continuous Delivery**: Seamless Git-backed deployment pipeline with automated build execution, secret management, and automatic HTTPS/TLS. |

---

## 💰 Monetization & SaaS Packaging

Bizora operates on a high-margin, predictable recurring SaaS subscription model tailored to Indian retail store sizes:

| Tier | Price | Target Market | Quotas & Capabilities |
| :--- | :--- | :--- | :--- |
| **Kirana / Starter** | **₹0 / Free Forever** | Single-counter local kiranas | POS Billing, Hardware-Free Camera Barcode Scanning, Up to 200 Products, Hindi & English UI, 1 User. |
| **Retailer / Growth** | **₹699 / mo** (₹6,999/yr) | Supermarkets, Apparel, Electronics | Unlimited Billing, Unlimited Products, FIFO Batch Control, 12 Regional Languages, 500 WhatsApp Receipts/mo, 10 Vapi AI Hindi Voice Calls/mo, Double-entry P&L, 3 Staff Accounts. |
| **Enterprise Chain** | **₹1,999 / mo** (₹18,999/yr) | Multi-store franchises & Distributors | Multi-Store Branch Control, Unlimited WhatsApp Receipts, 100 Vapi AI Voice Minutes/mo, Unlimited Gemini AI Decisions, 10 Staff Roles, Dedicated Support. |

---

## 💼 Investor Pitch & Commercial Launch Plan

The platform software is **100% built, verified, and operational across all 5 user portals**. To transition from current staging preview to commercial public launch across thousands of retail shopkeepers, capital requirements are strictly allocated to operational cloud infrastructure:

1. **Render Web Service Upgrades ($7/mo per portal)** — Eliminates free-tier cold starts to provide instant 200ms page loads for retail cashiers.
2. **MongoDB Atlas Dedicated M10 Cluster (~$57/mo)** — Production auto-scaling, dedicated RAM/CPU, automated point-in-time database backups.
3. **Vapi AI / Telephony Calling Credits** — Powers automated conversational voice reordering calls to local vendors in Hindi & English.

---

## ⚡ Local Setup & Development

```bash
# 1. Install Dependencies
npm install

# 2. Generate Prisma Client
npm run build -w packages/database

# 3. Run Development Servers
npm run dev:backend   # NestJS Backend API (Port 3000)
npm run dev:owner     # Owner Portal (Port 3001)
npm run dev:admin     # Super Admin Portal (Port 3002)
npm run dev:supplier  # Supplier Portal (Port 3003)
npm run dev:customer  # Customer Portal (Port 3004)
npm run dev           # Marketing Web Portal (Port 3005)

# 4. Build for Production
npm run build:render:owner    # Builds Owner Portal (Prisma + Vite + Nitro)
npm run build:render:admin    # Builds Admin Portal
npm run build:backend         # Builds NestJS Backend
```

---

## 📄 License & Intellectual Property
© 2026 Bizora AI · Enterprise Decision Intelligence & Autonomous Retail Operating System. All Rights Reserved.
