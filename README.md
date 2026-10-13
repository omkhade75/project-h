# 🚀 Bizora AI (OmniMind OS)
> **Autonomous Retail Operating System, Multi-Store ERP & Decision Intelligence**

[![CI Build Verification](https://github.com/omkhade75/project-h/actions/workflows/ci.yml/badge.svg)](https://github.com/omkhade75/project-h/actions/workflows/ci.yml)
![Node.js](https://img.shields.io/badge/Node.js-v20-brightgreen?logo=node.js)
![NestJS](https://img.shields.io/badge/NestJS-v10-red?logo=nestjs)
![React](https://img.shields.io/badge/React-v19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?logo=typescript)
![Status](https://img.shields.io/badge/Render-Production%20Live-success?logo=render)

---

## 📖 Overview

**Bizora AI** is an enterprise-grade, multi-tenant autonomous retail operating system designed for Indian retail store owners, supermarkets, and distributors. It unifies high-velocity POS barcode billing, real-time inventory control, double-entry financial accounting, customer CRM, and AI decision intelligence into a single synchronized platform.

---

## 🌐 Live Production Portals

| Portal | Live Link | Description |
| :--- | :--- | :--- |
| **👑 Store Owner (POS/ERP)** | [bizora-owner.onrender.com](https://bizora-owner.onrender.com) | Core POS Billing, Sales Intelligence, Inventory, Income/Expenses & Command Center. |
| **🛡️ Super Admin** | [bizora-admin.onrender.com](https://bizora-admin.onrender.com) | Multi-tenant onboarding, tenant health telemetry, subscription tier control. |
| **🚚 Supplier Hub** | [bizora-supplier.onrender.com](https://bizora-supplier.onrender.com) | Vendor scorecards, digital Purchase Orders (PO), dispatch tracking. |
| **🛍️ Customer Storefront** | [bizora-customer.onrender.com](https://bizora-customer.onrender.com) | Hyperlocal store browsing, 10-minute delivery orders, digital receipt wallet. |
| **🌐 Marketing Portal** | [bizora-web.onrender.com](https://bizora-web.onrender.com) | Platform overview, interactive demonstrations, SaaS pricing. |
| **⚙️ Backend REST Engine** | [bizora-backend-gtoe.onrender.com](https://bizora-backend-gtoe.onrender.com) | Centralized NestJS REST microservice & automated health watchdog. |

---

## 🏛️ Monorepo Architecture

The project is organized as an enterprise **Turbo Monorepo** enforcing clean separation between frontend clients and backend services:

```
omni-mind-vue-main/
├── apps/               # 🖥️ FRONTEND APPLICATIONS (React 19, Vite, TanStack Router)
│   ├── owner/          # Store Owner ERP & POS Billing Portal
│   ├── admin/          # Platform Super Admin Governance Portal
│   ├── supplier/       # Vendor Procurement & Dispatch Hub
│   ├── customer/       # Hyperlocal Neighborhood Storefront
│   └── web/            # Public Landing Page & Marketing Portal
│
├── services/           # ⚙️ BACKEND SERVICES
│   └── backend/        # NestJS / Express REST API (Controllers, Services, AI Agents, Auth)
│
└── packages/           # 📦 SHARED LIBRARIES & CONTRACTS
    ├── database/       # Prisma ORM Schema & PostgreSQL Migrations
    ├── types/          # Shared TypeScript DTOs & API Contracts
    └── ui/             # Shared Design System Primitives
```

> 📘 *For the complete technical breakdown, see [FULL_STACK_ARCHITECTURE.md](./FULL_STACK_ARCHITECTURE.md).*

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TanStack Router, Tailwind CSS, Recharts, Radix UI.
- **Backend**: NestJS v10, Express, Node.js 20 LTS, JWT Authentication, RBAC Guards.
- **Database (Polyglot)**:
  - **PostgreSQL (Supabase)** via Prisma ORM for ACID financial ledgers & POS transactions.
  - **MongoDB Atlas** via Mongoose for dynamic product attributes & AI telemetry logs.
- **AI & Automation**: Autonomous anomaly detection, restock decision agents, WhatsApp Cloud API, Vapi Voice.

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v20+
- **npm** v10+

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/omkhade75/project-h.git
cd project-h

# Install all workspace dependencies
npm install

# Generate Prisma Client
npm run build --prefix packages/database
```

### 3. Running Locally
```bash
# Start the Backend API (runs on port 3000)
npm run dev --prefix services/backend

# Start the Store Owner POS/ERP (runs on port 5173)
npm run dev --prefix apps/owner
```

---

## 📄 License
This project is licensed under the MIT License.
