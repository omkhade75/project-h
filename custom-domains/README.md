# 🌐 Bizora AI — Free Custom Domain Setup Guide (`*.is-a.dev`)

This directory contains the pre-configured, schema-validated JSON registration files for claiming free custom subdomains for the entire Bizora AI ecosystem via the official [is-a-dev/register](https://github.com/is-a-dev/register) repository.

---

## 📋 Domain Allocation Matrix

| Subdomain | Purpose | Target Render CNAME | Status |
| :--- | :--- | :--- | :--- |
| **`bizora.is-a.dev`** | Public Landing Page / Marketing Web Portal | `bizora-web.onrender.com` | ✅ Ready to Submit |
| **`bizora-owner.is-a.dev`** | Store Owner Business OS & POS Billing | `bizora-owner.onrender.com` | ✅ Ready to Submit |
| **`bizora-admin.is-a.dev`** | Super Admin Management Portal | `bizora-admin.onrender.com` | ✅ Ready to Submit |
| **`bizora-customer.is-a.dev`** | Retail Customer Storefront | `bizora-customer.onrender.com` | ✅ Ready to Submit |
| **`bizora-supplier.is-a.dev`** | Supplier Procurement & Vendor Portal | `bizora-supplier.onrender.com` | ✅ Ready to Submit |
| **`bizora-api.is-a.dev`** | Backend NestJS REST API Gateway | `bizora-backend-gtoe.onrender.com` | ✅ Ready to Submit |

---

## 🚀 How to Claim Free Domains in 3 Steps

### Step 1: Submit Pull Request to `is-a-dev/register`

#### Option A: Via GitHub Web Interface (Simplest & Fastest)
1. Open [https://github.com/is-a-dev/register](https://github.com/is-a-dev/register).
2. Click **Fork** in the top right to fork the repository to your GitHub account (`omkhade75`).
3. Inside your fork, navigate to the `domains/` folder.
4. Click **Add file** -> **Upload files**.
5. Upload the 6 `.json` files from this directory (`custom-domains/domains/`):
   - `bizora.json`
   - `bizora-owner.json`
   - `bizora-admin.json`
   - `bizora-customer.json`
   - `bizora-supplier.json`
   - `bizora-api.json`
6. Commit the changes to your fork with commit message: `Register bizora.is-a.dev and subdomains`.
7. Click **Contribute** -> **Open pull request**.
8. Fill out the PR template (mention that these point to your Render production apps) and click **Create pull request**.
9. The automated bot will run tests (syntax check) and merge it within a few hours.

#### Option B: Via Git / GitHub CLI
```bash
# 1. Clone your fork
git clone https://github.com/omkhade75/register.git is-a-dev-register
cd is-a-dev-register

# 2. Copy the 6 json files into domains/
cp /path/to/omni-mind-vue-main/custom-domains/domains/*.json domains/

# 3. Commit and push
git checkout -b add-bizora-domains
git add domains/bizora*.json
git commit -m "Register bizora.is-a.dev and subdomains"
git push origin add-bizora-domains

# 4. Create PR via gh cli
gh pr create --title "Register bizora.is-a.dev and subdomains" --body "Registering subdomains for Bizora AI retail platform on Render."
```

---

### Step 2: Add Custom Domains in Render Dashboard

Once the PR is merged (or even while waiting), configure Render:

1. Open your [Render Dashboard](https://dashboard.render.com).
2. For each service, open the service details:
   - For **`bizora-web`**:
     - Go to **Settings** -> Scroll to **Custom Domains**.
     - Click **Add Custom Domain**.
     - Enter: `bizora.is-a.dev`.
     - Click **Save Changes**.
   - For **`bizora-owner`**:
     - Add `bizora-owner.is-a.dev`.
   - For **`bizora-admin`**:
     - Add `bizora-admin.is-a.dev`.
   - For **`bizora-customer`**:
     - Add `bizora-customer.is-a.dev`.
   - For **`bizora-supplier`**:
     - Add `bizora-supplier.is-a.dev`.
   - For **`bizora-backend-gtoe`**:
     - Add `bizora-api.is-a.dev`.
3. Render automatically verifies DNS propagation and issues a free TLS/SSL certificate (Let's Encrypt) within minutes.

---

### Step 3: Zero-Downtime Verification

- **100% Backward Compatibility**: Your existing `*.onrender.com` URLs will continue to work without any interruption.
- **Backend CORS**: `services/backend` has been updated to accept requests from both `*.is-a.dev` and `*.onrender.com`.
- **Anti-Cold Start**: GitHub Actions automatically pings all services every 10 minutes via `.github/workflows/keep-alive.yml` to prevent instance spin-down.
