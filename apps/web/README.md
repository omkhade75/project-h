# 🌐 Bizora AI — Public Web Portal & Marketing Hub (`apps/web`)

## 📌 Overview & Role in Bizora Monorepo

`apps/web` serves as the **public-facing front door and customer acquisition website** for the Bizora AI ecosystem:
- **Production URL**: `https://bizora.is-a.dev` (or `https://bizora-web.onrender.com`)
- **Primary Audience**: Prospective business owners, retail merchants, supermarket managers, and partners.
- **Key Responsibilities**:
  1. **Brand Showcase & Feature Presentation**: Highlights Bizora's core value propositions (POS billing, barcode scanning, 12 regional languages, Vapi AI voice calls, WhatsApp invoices, offline-first reliability).
  2. **High-Converting Lead Gen & Registration**: Vyapar-style promotional modals, interactive pricing plans, feature matrices, and FAQ accordions.
  3. **Gateway to Ecosystem Portals**:
     - **Owner Dashboard & POS**: Directs logged-in merchants or registered users to `https://bizora-owner.is-a.dev`.
     - **Customer Shopping Portal**: Links retail consumers to `https://bizora-customer.is-a.dev`.
     - **Supplier / Vendor Portal**: Connects wholesale suppliers to `https://bizora-supplier.is-a.dev`.
     - **System Administration**: Directs super administrators to `https://bizora-admin.is-a.dev`.

---

## 🏛️ Monorepo Portal Distribution

Bizora uses a dedicated **Multi-Portal Architecture**, separating concerns across individual frontend applications rather than bundling everything into a single monolithic bundle:

| Portal Directory | Target Audience | Custom Domain | Render URL |
| :--- | :--- | :--- | :--- |
| **`apps/web`** | Public Visitors & Prospects | `bizora.is-a.dev` | `bizora-web.onrender.com` |
| **`apps/owner`** | Retail Store Owners & Cashiers | `bizora-owner.is-a.dev` | `bizora-owner.onrender.com` |
| **`apps/admin`** | Platform Super Admins | `bizora-admin.is-a.dev` | `bizora-admin.onrender.com` |
| **`apps/customer`** | End-Consumers / Online Shoppers | `bizora-customer.is-a.dev` | `bizora-customer.onrender.com` |
| **`apps/supplier`** | Wholesale Vendors & Suppliers | `bizora-supplier.is-a.dev` | `bizora-supplier.onrender.com` |
| **`services/backend`** | NestJS Core API Gateway | `bizora-api.is-a.dev` | `bizora-backend-gtoe.onrender.com` |

---

## 🛠️ Build & Deployment Instructions

- **Build Script**: `npm run build:web` (or `npm run build:render:web`)
- **Static Output**: `.output/public` (contains pre-rendered `index.html`, `200.html`, and `_redirects` for SPA routing fallback)
- **Deployment Platform**: Render Static Site (with zero-configuration fallback routing)
