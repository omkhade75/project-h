/**
 * Robust Spreadsheet & CSV Ingestion Engine for Bizora
 * Supports .xlsx, .xls (SheetJS binary + XML 2003 + HTML tables), .csv, .tsv, .txt
 * Provides intelligent, case-insensitive, fuzzy header mapping, compound name merging,
 * strict ID-code exclusion from human names, and UTF-8 BOM stripping.
 */

import type { Product, Customer, Transaction } from "./db";

// Dynamic loader for SheetJS (xlsx.full.min.js)
let xlsxPromise: Promise<any> | null = null;

export async function getXLSX(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).XLSX) return (window as any).XLSX;

  if (xlsxPromise) return xlsxPromise;

  xlsxPromise = new Promise((resolve, reject) => {
    // Check if already in DOM
    const existing = document.querySelector('script[data-xlsx="sheetjs"]');
    if (existing) {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
        return;
      }
      existing.addEventListener("load", () => resolve((window as any).XLSX));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.setAttribute("data-xlsx", "sheetjs");
    script.src = "/vendor/xlsx.full.min.js";
    script.async = true;

    script.onload = () => {
      if ((window as any).XLSX) {
        resolve((window as any).XLSX);
      } else {
        fallbackCDN();
      }
    };

    script.onerror = () => {
      fallbackCDN();
    };

    function fallbackCDN() {
      const cdnScript = document.createElement("script");
      cdnScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      cdnScript.async = true;
      cdnScript.onload = () => resolve((window as any).XLSX);
      cdnScript.onerror = () => reject(new Error("Unable to load Excel parser from local vendor or CDN."));
      document.head.appendChild(cdnScript);
    }

    document.head.appendChild(script);
  });

  return xlsxPromise;
}

/**
 * Normalizes a header or key:
 * - strips UTF-8 BOM \uFEFF
 * - converts to lowercase
 * - strips quotes, brackets, parentheses, and punctuation
 * - collapses all spaces, underscores, dashes to empty string for fuzzy comparison
 */
export function normalizeKey(key: string): string {
  if (!key) return "";
  return String(key)
    .replace(/^[\uFEFF\u200B\u00EF\u00BB\u00BF]+/, "")
    .trim()
    .toLowerCase()
    .replace(/["'\[\]\(\)\{\}]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Detects if a string is an ID code, SKU, or identifier rather than a human/item name.
 * e.g. "CUST001", "CUST-001", "C001", "SKU-100", "PROD99", "10023", "#123", "ID_44"
 */
export function isCodeOrId(val: any): boolean {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  if (!s) return false;
  // Specific code patterns
  if (/^(CUST|CID|ID|CODE|SKU|PROD|ITEM|ACC|USER|CLIENT|REF|NO|TXN|INV)[-_]?[0-9A-Za-z]+$/i.test(s)) return true;
  // Patterns like C001, P102, S99
  if (/^[A-Za-z]{1,4}[-_]?[0-9]{2,}$/.test(s)) return true;
  // Pure digits (e.g. 1001, 45892)
  if (/^[0-9]+$/.test(s)) return true;
  return false;
}

/**
 * Checks if a column key represents an ID, code, or number rather than a name.
 */
export function isIdColumnKey(key: string): boolean {
  if (!key) return false;
  const norm = normalizeKey(key);
  if (/^(id|code|sku|barcode|hsn|no|num|number|key|uuid|ref|custid|productid|itemcode|clientid)$/.test(norm)) return true;
  if (norm.endsWith("id") || norm.endsWith("code") || norm.endsWith("no") || norm.endsWith("number") || norm.endsWith("num") || norm.endsWith("key")) return true;
  return false;
}

/**
 * Robust CSV/TSV parser supporting quotes, escaped quotes, multiline values,
 * and auto-detected delimiters (comma, semicolon, tab, pipe).
 */
export function parseDelimitedText(text: string): Array<Record<string, string>> {
  // Strip BOM
  const clean = text.replace(/^[\uFEFF\u200B\u00EF\u00BB\u00BF]+/, "").trim();
  if (!clean) return [];

  // Detect delimiter from first non-empty lines
  const sample = clean.slice(0, 3000);
  const firstLine = sample.split(/\r?\n/)[0] || "";

  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;

  let delimiter = ",";
  if (tabCount > commaCount && tabCount > semicolonCount) delimiter = "\t";
  else if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ";";
  else if (pipeCount > commaCount) delimiter = "|";

  // RFC-4180 compliant CSV parser
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.replace(/^["']|["']$/g, "").trim());
  const results: Array<Record<string, string>> = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    // Skip empty lines
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const obj: Record<string, string> = {};
    headers.forEach((header, colIdx) => {
      obj[header] = (row[colIdx] || "").trim();
    });
    results.push(obj);
  }

  return results;
}

/**
 * Reads any spreadsheet file (XLSX, XLS, CSV, TSV, TXT) into an array of objects.
 */
export async function parseSpreadsheetFile(file: File): Promise<{
  rows: Array<Record<string, any>>;
  format: string;
}> {
  const fileName = file.name;
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  // 1. Excel files: .xlsx, .xls, .xlsm, .xlsb, .ods
  if (["xlsx", "xls", "xlsm", "xlsb", "ods"].includes(ext)) {
    try {
      const XLSX = await getXLSX();
      if (XLSX) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) return { rows: [], format: "Empty Excel Workbook" };

        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });

        return {
          rows: rawJson,
          format: `${ext.toUpperCase()} Spreadsheet (${sheetName})`,
        };
      }
    } catch (err) {
      console.warn("SheetJS binary parsing encountered an issue, trying text fallback:", err);
    }
  }

  // 2. CSV / Delimited text files or text fallback
  const text = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => resolve("");
    reader.readAsText(file);
  });

  if (text && text.trim()) {
    // Check if it's an HTML table disguised as .xls (common in legacy software)
    if (text.includes("<table") || text.includes("<TABLE")) {
      try {
        const XLSX = await getXLSX();
        if (XLSX) {
          const workbook = XLSX.read(text, { type: "string" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
          return { rows: rawJson as any[], format: "HTML Table Spreadsheet" };
        }
      } catch (_) {}
    }

    const csvRows = parseDelimitedText(text);
    return {
      rows: csvRows,
      format: ext ? `${ext.toUpperCase()} Data File` : "Delimited Text File",
    };
  }

  return { rows: [], format: "Unknown Format" };
}

/**
 * Finds a generic value from a row object using normalized candidate matching.
 */
export function extractField(
  row: Record<string, any>,
  candidates: string[],
  fallback = ""
): string {
  if (!row || typeof row !== "object") return fallback;

  const normalizedMap = new Map<string, any>();
  for (const [key, val] of Object.entries(row)) {
    const norm = normalizeKey(key);
    if (norm) {
      normalizedMap.set(norm, val);
    }
  }

  // 1. Check exact normalized match
  for (const cand of candidates) {
    const normCand = normalizeKey(cand);
    if (normalizedMap.has(normCand)) {
      const v = normalizedMap.get(normCand);
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        return String(v).trim();
      }
    }
  }

  // 2. Check partial/contains match
  for (const cand of candidates) {
    const normCand = normalizeKey(cand);
    if (normCand.length < 3) continue;
    for (const [key, val] of normalizedMap.entries()) {
      if (key === normCand || key.includes(normCand) || normCand.includes(key)) {
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return String(val).trim();
        }
      }
    }
  }

  return fallback;
}

/**
 * Intelligent Name Extractor:
 * 1. Checks compound Name: First Name + Last Name (handles "first_name", "last_name", etc.)
 * 2. Checks exact candidate matches, STRICTLY SKIPPING ID columns (e.g. "customerid") and ID values (e.g. "CUST001")
 * 3. Checks partial candidate matches, skipping ID columns
 * 4. Checks company or business name
 * 5. Derives clean human name from email if name is missing (e.g. "rahul.sharma@example.com" -> "Rahul Sharma")
 * 6. Scans for first non-ID, non-numeric column containing human text
 */
export function extractNameField(
  row: Record<string, any>,
  candidates: string[],
  fallback = ""
): string {
  if (!row || typeof row !== "object") return fallback;

  const normalizedMap = new Map<string, any>();
  for (const [k, v] of Object.entries(row)) {
    const norm = normalizeKey(k);
    if (norm) normalizedMap.set(norm, v);
  }

  // 1. First, check compound Name: First Name + Last Name
  const fnCandidates = ["firstname", "first", "fname", "givenname", "first_name"];
  const lnCandidates = ["lastname", "last", "lname", "surname", "familyname", "last_name"];
  let foundFn = "";
  let foundLn = "";

  for (const cand of fnCandidates) {
    const norm = normalizeKey(cand);
    if (normalizedMap.has(norm)) {
      const val = String(normalizedMap.get(norm) || "").trim();
      if (val && !isCodeOrId(val)) {
        foundFn = val;
        break;
      }
    }
  }

  for (const cand of lnCandidates) {
    const norm = normalizeKey(cand);
    if (normalizedMap.has(norm)) {
      const val = String(normalizedMap.get(norm) || "").trim();
      if (val && !isCodeOrId(val)) {
        foundLn = val;
        break;
      }
    }
  }

  if (foundFn || foundLn) {
    return `${foundFn} ${foundLn}`.trim();
  }

  // 2. Check exact matches for candidates, strictly skipping ID columns and ID values
  for (const cand of candidates) {
    const normCand = normalizeKey(cand);
    if (isIdColumnKey(normCand)) continue; // Never treat an ID column as a Name!

    if (normalizedMap.has(normCand)) {
      const val = String(normalizedMap.get(normCand) || "").trim();
      if (val && !isCodeOrId(val)) {
        return val;
      }
    }
  }

  // 3. Check partial matches, strictly avoiding ID column keys
  for (const cand of candidates) {
    const normCand = normalizeKey(cand);
    if (normCand.length < 3 || isIdColumnKey(normCand)) continue;

    for (const [key, val] of normalizedMap.entries()) {
      if (isIdColumnKey(key)) continue; // SKIP "customerid", "customercode", etc.!

      if (key === normCand || key.includes(normCand) || normCand.includes(key)) {
        const v = String(val || "").trim();
        if (v && !isCodeOrId(v)) {
          return v;
        }
      }
    }
  }

  // 4. Check company/business/organization name
  for (const compKey of ["companyname", "company", "businessname", "organization", "firmname", "partyname"]) {
    if (normalizedMap.has(compKey)) {
      const val = String(normalizedMap.get(compKey) || "").trim();
      if (val && !isCodeOrId(val)) return val;
    }
  }

  // 5. Check if an email is present: derive clean readable name from email
  for (const emailKey of ["email", "emailaddress", "mail", "emailid"]) {
    if (normalizedMap.has(emailKey)) {
      const emailVal = String(normalizedMap.get(emailKey) || "").trim();
      if (emailVal && emailVal.includes("@")) {
        const local = emailVal.split("@")[0].replace(/[0-9._-]+/g, " ").trim();
        if (local.length >= 2 && !local.toLowerCase().startsWith("client") && !local.toLowerCase().startsWith("user")) {
          return local.replace(/\b\w/g, (c) => c.toUpperCase());
        }
      }
    }
  }

  // 6. Look for first non-ID, non-numeric column with real human text
  for (const [key, val] of Object.entries(row)) {
    if (isIdColumnKey(key)) continue;
    const str = String(val || "").trim();
    if (str.length >= 2 && !isCodeOrId(str) && isNaN(Number(str)) && !str.includes("@") && !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
  }

  return fallback;
}

/**
 * Extracts a numeric value cleanly, stripping currency symbols, commas, and formatting.
 */
export function extractNumber(
  row: Record<string, any>,
  candidates: string[],
  fallback = 0
): number {
  const raw = extractField(row, candidates, "");
  if (!raw) return fallback;

  // Remove currency signs (₹, $, €, £, Rs.), commas, and whitespace
  const sanitized = raw.replace(/[₹$€£, ]/g, "").replace(/rs\.?/gi, "").trim();
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? fallback : parsed;
}

// Candidate alias lists
const PRODUCT_NAME_ALIASES = [
  "product name",
  "item name",
  "product description",
  "item description",
  "particulars",
  "title",
  "product",
  "item",
  "article",
  "material",
  "goods",
  "name",
  "details",
];

const SKU_ALIASES = [
  "sku",
  "barcode",
  "item code",
  "product code",
  "code",
  "item no",
  "product id",
  "id",
  "part no",
  "ean",
  "upc",
  "hsn",
  "batch",
  "sku code",
];

const PRICE_ALIASES = [
  "selling price",
  "price",
  "mrp",
  "rate",
  "sale price",
  "unit price",
  "retail price",
  "selling rate",
  "saleprice",
  "sellingprice",
  "salerate",
];

const COST_ALIASES = [
  "cost price",
  "cost",
  "purchase price",
  "buy price",
  "buying rate",
  "costprice",
  "purchase rate",
  "landing cost",
];

const STOCK_ALIASES = [
  "stock",
  "quantity",
  "qty",
  "current stock",
  "inventory",
  "count",
  "units",
  "balance",
  "opening stock",
  "closing stock",
  "available",
  "qnty",
];

const CATEGORY_ALIASES = [
  "category",
  "dept",
  "department",
  "group",
  "item group",
  "type",
  "class",
  "family",
  "product category",
];

const BRAND_ALIASES = ["brand", "brand name", "manufacturer", "make", "company", "mfg"];
const SUPPLIER_ALIASES = ["supplier", "vendor", "distributor", "source", "dealer", "wholesaler", "party"];

const CUSTOMER_NAME_ALIASES = [
  "customer name",
  "client name",
  "full name",
  "contact name",
  "party name",
  "buyer name",
  "person name",
  "customer",
  "client",
  "name",
  "party",
  "contact",
  "buyer",
  "person",
];

const CUSTOMER_PHONE_ALIASES = [
  "phone",
  "mobile",
  "contact",
  "phone number",
  "mobile number",
  "cell",
  "telephone",
  "contact no",
  "mobile no",
  "whatsapp",
  "phone_no",
  "mobile_no",
];

const CUSTOMER_EMAIL_ALIASES = ["email", "email address", "mail", "e-mail", "email id", "email_id"];
const CUSTOMER_ID_ALIASES = ["customer id", "client id", "id", "code", "account no", "cust id", "party code", "customer code"];

/**
 * Maps raw spreadsheet rows to validated Product entities.
 */
export function mapRowsToProducts(rows: Array<Record<string, any>>): Product[] {
  return rows.map((r, i) => {
    // 1. Resolve SKU / ID
    let sku = extractField(r, SKU_ALIASES);
    if (!sku) {
      sku = `SKU-${Date.now().toString().slice(-4)}${i + 1}`;
    }

    // 2. Resolve Product Name (strictly never an SKU/code)
    let name = extractNameField(r, PRODUCT_NAME_ALIASES);
    if (!name || isCodeOrId(name)) {
      name = `Item #${sku.replace(/^SKU-?/i, "") || i + 1}`;
    }

    // 3. Resolve Pricing & Stock
    const price = extractNumber(r, PRICE_ALIASES, 100);
    const cost = extractNumber(r, COST_ALIASES, Math.round(price * 0.7));
    const stock = extractNumber(r, STOCK_ALIASES, 25);
    const reorder = extractNumber(r, ["reorder", "reorder level", "min stock"], 10);

    // 4. Resolve Metadata
    const category = extractField(r, CATEGORY_ALIASES, "General");
    const brand = extractField(r, BRAND_ALIASES, "Standard");
    const supplier = extractField(r, SUPPLIER_ALIASES, "General Supplier");
    const expiry = extractField(r, ["expiry", "expiry date", "exp date", "validity"], "2026-12-31");

    const margin = price > 0 ? parseFloat((((price - cost) / price) * 100).toFixed(1)) : 25;
    const status = stock <= 0 ? "critical" : stock <= reorder ? "low" : "ok";

    return {
      id: sku,
      name,
      category,
      dept: "Supermarket Main",
      brand,
      price,
      cost,
      stock,
      reorder,
      expiry,
      supplier,
      sold: 0,
      revenue: 0,
      margin,
      status: status as "ok" | "low" | "critical" | "expiring",
    };
  });
}

/**
 * Maps raw spreadsheet rows to validated Customer entities.
 */
export function mapRowsToCustomers(rows: Array<Record<string, any>>): Customer[] {
  return rows.map((r, i) => {
    // 1. Resolve ID / Code
    let id = extractField(r, CUSTOMER_ID_ALIASES);
    if (!id) {
      id = `CUST-${String(i + 1).padStart(3, "0")}`;
    }

    // 2. Resolve Customer Name (strictly never an ID code)
    let name = extractNameField(r, CUSTOMER_NAME_ALIASES);
    if (!name || isCodeOrId(name)) {
      name = `Customer ${id.replace(/^CUST-?/i, "") || i + 1}`;
    }

    // 3. Split Name into First & Last
    const parts = name.split(" ");
    const firstName = parts[0] || name;
    const lastName = parts.slice(1).join(" ") || "";

    // 4. Contact info
    const phone = extractField(r, CUSTOMER_PHONE_ALIASES, `+91 98765 ${String(i + 10).padStart(5, "0")}`);
    const email = extractField(r, CUSTOMER_EMAIL_ALIASES, `client${i + 1}@example.com`);

    // 5. Tier & Metrics
    const tierRaw = extractField(r, ["membership", "tier", "segment", "loyalty", "grade"], "Regular");
    const validTiers: Customer["segment"][] = ["VIP", "Loyal", "New", "Frequent", "At Risk", "Dormant"];
    const matchedTier = validTiers.find((t) => t.toLowerCase() === tierRaw.toLowerCase()) || "Regular";
    const segment = (matchedTier === "Regular" ? "New" : matchedTier) as Customer["segment"];

    let spend = extractNumber(r, ["spend", "total spend", "lifetime spend", "amount", "revenue", "sales"], 0);
    let visits = extractNumber(r, ["visits", "visit count", "orders", "orders count", "transactions"], 0);

    // If file had no spend/orders data, provide realistic active store baselines
    if (spend === 0 && visits === 0) {
      visits = (i % 6) + 1;
      spend = visits * 750 + ((i * 120) % 500);
    } else if (spend > 0 && visits === 0) {
      visits = Math.max(1, Math.round(spend / 650));
    } else if (visits > 0 && spend === 0) {
      spend = visits * 650;
    }

    const aov = visits > 0 ? Math.round(spend / visits) : 500;

    return {
      id,
      customerCode: id,
      name,
      firstName,
      lastName,
      phone,
      email,
      joined: extractField(r, ["joined", "created at", "join date", "date"], new Date().toISOString().split("T")[0]),
      visits,
      spend,
      aov,
      favDept: extractField(r, ["department", "fav dept", "preferred dept", "category"], "Grocery"),
      lastVisit: new Date().toISOString().split("T")[0],
      segment,
      churn: Math.max(5, (i * 7) % 35),
    };
  });
}

/**
 * Maps raw spreadsheet rows to validated Transaction entities.
 */
export function mapRowsToTransactions(rows: Array<Record<string, any>>): Transaction[] {
  return rows.map((r, i) => {
    const invNo = extractField(r, ["invoice no", "invoice", "bill no", "bill", "id"], `INV-${Date.now().toString().slice(-5)}${i + 1}`);
    const dateStr = extractField(r, ["date", "invoice date", "bill date"], new Date().toISOString().split("T")[0]);
    const custName = extractNameField(r, CUSTOMER_NAME_ALIASES) || "Walk-in Customer";
    const prodName = extractNameField(r, PRODUCT_NAME_ALIASES) || "General Item";
    const qty = extractNumber(r, ["quantity", "qty", "count"], 1);
    const price = extractNumber(r, PRICE_ALIASES, 100);
    const total = extractNumber(r, ["total", "amount", "grand total", "net amount"], qty * price);

    const paymentRaw = extractField(r, ["payment", "payment method", "mode", "payment mode"], "UPI").toUpperCase();
    const payment: "Cash" | "Card" | "UPI" | "Wallet" = paymentRaw.includes("CASH")
      ? "Cash"
      : paymentRaw.includes("CARD")
      ? "Card"
      : paymentRaw.includes("WALLET")
      ? "Wallet"
      : "UPI";

    return {
      id: invNo,
      date: dateStr,
      time: "12:00",
      dept: "Supermarket Main",
      customerId: `CUST-${i + 100}`,
      customerName: custName,
      subtotal: total,
      tax: Math.round(total * 0.05),
      discount: 0,
      total,
      payment,
      status: "Completed",
      items: [
        {
          productId: `PROD-${i + 1}`,
          name: prodName,
          quantity: qty,
          price,
          cost: Math.round(price * 0.7),
        },
      ],
    };
  });
}
