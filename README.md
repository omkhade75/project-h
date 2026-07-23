# Bizora — AI Business Operating System

**Bizora** is an enterprise-grade AI Business Operating System designed to run modern multi-company, multi-branch operations in a unified platform. It integrates Sales, Inventory, Finance, CRM, HR, Suppliers, Manufacturing, and AI Decision Intelligence into an auditable, real-time control plane.

---

## 🏛️ System Architecture

Bizora is structured as a production-ready monorepo workspace separating frontend portals, modular backend API services, and shared database models:

```
bizora/
├── apps/
│   └── web/                   # TanStack Start / React UI (4 Role Portals)
├── services/
│   └── backend/               # NestJS API Gateway & Business Microservices
│       └── src/
│           ├── config/        # Database Connections (MongoDB Mongoose + Supabase)
│           ├── models/        # 18 Enterprise Mongoose Schemas (Soft-Delete & Timestamps)
│           ├── controllers/   # REST MVC Controllers (Pagination, Search, Sorting)
│           ├── services/      # Reusable Business Logic Layer
│           ├── middlewares/   # JWT Auth, RBAC Guards, Helmet, Rate Limiter
│           ├── validators/    # Zod Request Validation Schemas
│           └── ai/            # Autonomous AI Agents & Prompts (CFO, CEO Advisor)
└── packages/
    ├── database/              # Supabase PostgreSQL (Prisma Client Schema)
    ├── ui/                    # Shared Design System Tokens
    └── types/                 # Shared TypeScript Interfaces
```

---

## 🌟 Core Feature Portals

1. **Admin Portal (`/system-admin`)**: Platform governance, multi-tenant workspace provisioning, subscription plan billing, feature flags, and audit logs.
2. **Owner/Executive Dashboard (`/command-center`, `/live-ops`)**: Real-time sales KPIs, margin analysis, corporate double-entry ledger, expiry warnings, and AI recommendations.
3. **Customer Portal (`/customer-portal`)**: Purchase invoice history, digital wallet balance, loyalty point tiers, order tracking, and support ticketing.
4. **Supplier Portal (`/supplier-portal`)**: Inbound Purchase Order (PO) approval, delivery dispatch logging, quality scorecards, and payment settlements.

---

## 🔒 Security & Compliance

- **Authentication**: JWT access tokens (1d) & refresh tokens (7d) with `bcryptjs` password hashing.
- **Role-Based Access Control (RBAC)**: Fine-grained route guards for `ADMIN`, `OWNER`, `MANAGER`, `CASHIER`, `SUPPLIER`, `CUSTOMER`, and `EMPLOYEE`.
- **Infrastructure Security**: `Helmet` HTTP security headers, CORS origin filtering, and Express Rate Limiting (100 reqs / 15 mins).
- **Data Integrity**: Soft-deletion (`isDeleted`, `deletedAt`) enabled across all 18 database collections with compliance audit trails (`AuditLogs`).

---

## 📊 Dual-Database Architecture

- **Supabase (PostgreSQL via Prisma)**: Handles core relational entities, transactional POS records, and ledger balances.
- **MongoDB (via Mongoose)**: Manages multi-tenant document collections, AI interaction histories, WhatsApp communication audits, and unstructured logs (`MONGODB_URI=`).

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Database Schema Setup
```bash
npm run build -w packages/database
```

### 3. Running Backend Services
```bash
npm run dev:backend
```

### 4. Running Web Application Portals
```bash
npm run dev
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.
