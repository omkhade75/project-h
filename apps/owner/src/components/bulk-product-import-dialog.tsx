import React, { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { db, type Product } from "@/lib/db";
import { useBusinessData } from "@/lib/business-context";
import { useAuth } from "@/lib/auth-context";
import { bulkAddProductsServer } from "@/lib/server-products";

interface BulkProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedProductRow {
  raw: Record<string, any>;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  dept: string;
  brand: string;
  price: number;
  cost: number;
  stock: number;
  reorder: number;
  expiry: string | null;
  supplier: string;
  unit: string;
  isValid: boolean;
  error?: string;
}

// Normalize column header keys for flexible matching
const normalizeKey = (key: string): string => {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Find value from raw row by matching common aliases
const findFieldValue = (row: Record<string, any>, aliases: string[]): any => {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const match = keys.find((k) => normalizeKey(k) === normalizeKey(alias));
    if (
      match &&
      row[match] !== undefined &&
      row[match] !== null &&
      String(row[match]).trim() !== ""
    ) {
      return row[match];
    }
  }
  return undefined;
};

export function BulkProductImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: BulkProductImportDialogProps) {
  const { user } = useAuth();
  const { forceRefresh } = useBusinessData();

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedProductRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse Excel or CSV file
  const processFile = useCallback((selectedFile: File) => {
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          toast.error("The uploaded spreadsheet is empty.");
          setParsing(false);
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          toast.error("No product rows found in the uploaded file.");
          setParsing(false);
          return;
        }

        const now = Date.now();
        const parsed: ParsedProductRow[] = rawJson.map((row, idx) => {
          const rawName = findFieldValue(row, [
            "productname",
            "name",
            "product",
            "title",
            "itemname",
            "item",
          ]);
          const name = rawName ? String(rawName).trim() : "";

          const rawPrice = findFieldValue(row, [
            "sellingprice",
            "price",
            "unitprice",
            "mrp",
            "retailprice",
            "rate",
          ]);
          const price = rawPrice !== undefined ? Number(rawPrice) : NaN;

          const rawCost = findFieldValue(row, ["costprice", "cost", "purchaseprice", "buyprice"]);
          const cost =
            rawCost !== undefined && !isNaN(Number(rawCost)) && Number(rawCost) > 0
              ? Number(rawCost)
              : !isNaN(price) && price > 0
                ? Math.round(price * 0.7)
                : 0;

          // Auto-generate clean SKU if not provided
          const rawSku = findFieldValue(row, ["sku", "itemcode", "code", "productid", "id"]);
          const autoSku = name
            ? `SKU-${name
                .replace(/[^a-zA-Z0-9]/g, "")
                .slice(0, 4)
                .toUpperCase()}-${String(now + idx).slice(-5)}`
            : `SKU-${now + idx}`;
          const sku = rawSku ? String(rawSku).trim() : autoSku;

          // Auto-generate clean Barcode if not provided
          const rawBarcode = findFieldValue(row, ["barcode", "barcodeno", "upc", "ean", "code128"]);
          const barcode = rawBarcode
            ? String(rawBarcode).trim()
            : `BAR-${String(now + idx).slice(-8)}`;

          const rawCat = findFieldValue(row, ["category", "cat", "group"]);
          const category = rawCat ? String(rawCat).trim() : "General";

          const rawDept = findFieldValue(row, ["department", "dept", "section"]);
          const dept = rawDept ? String(rawDept).trim() : category;

          const rawBrand = findFieldValue(row, ["brand", "company", "manufacturer", "make"]);
          const brand = rawBrand ? String(rawBrand).trim() : "Generic";

          const rawStock = findFieldValue(row, [
            "stock",
            "quantity",
            "qty",
            "initialstock",
            "openingstock",
          ]);
          const stock =
            rawStock !== undefined && !isNaN(Number(rawStock)) ? Math.max(0, Number(rawStock)) : 10;

          const rawReorder = findFieldValue(row, [
            "reorderlevel",
            "reorder",
            "minstock",
            "safetystock",
          ]);
          const reorder =
            rawReorder !== undefined && !isNaN(Number(rawReorder))
              ? Math.max(1, Number(rawReorder))
              : 5;

          const rawExpiry = findFieldValue(row, [
            "expirydate",
            "expiry",
            "expdate",
            "bestbefore",
            "expiration",
          ]);
          let expiry: string | null = null;
          if (rawExpiry) {
            if (rawExpiry instanceof Date && !isNaN(rawExpiry.getTime())) {
              expiry = rawExpiry.toISOString().split("T")[0];
            } else if (typeof rawExpiry === "string" && rawExpiry.trim()) {
              expiry = rawExpiry.trim();
            }
          }

          const rawSupplier = findFieldValue(row, ["supplier", "vendor", "distributor", "source"]);
          const supplier = rawSupplier ? String(rawSupplier).trim() : "Wholesalers";

          const rawUnit = findFieldValue(row, ["unit", "uom", "measure", "unitofmeasure"]);
          const unit = rawUnit ? String(rawUnit).trim().toLowerCase() : "units";

          // Validation
          let isValid = true;
          let error = "";
          if (!name) {
            isValid = false;
            error = "Missing Product Name";
          } else if (isNaN(price) || price <= 0) {
            isValid = false;
            error = "Invalid or missing Selling Price";
          }

          return {
            raw: row,
            name,
            sku,
            barcode,
            category,
            dept,
            brand,
            price: isNaN(price) ? 0 : price,
            cost,
            stock,
            reorder,
            expiry,
            supplier,
            unit,
            isValid,
            error,
          };
        });

        setParsedRows(parsed);
        const validCount = parsed.filter((r) => r.isValid).length;
        if (validCount === 0) {
          toast.error("None of the rows have both a valid Product Name and Selling Price.");
        } else {
          toast.success(
            `Parsed ${parsed.length} items (${validCount} valid products ready to import).`,
          );
        }
      } catch (err: any) {
        console.error("Error parsing spreadsheet:", err);
        toast.error(err.message || "Failed to parse spreadsheet file.");
      } finally {
        setParsing(false);
      }
    };

    reader.onerror = () => {
      toast.error("Could not read uploaded file.");
      setParsing(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  }, []);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setParsing(false);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  // Commit valid products to local database and backend API
  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error("No valid products to import.");
      return;
    }

    setImporting(true);
    try {
      if (user?.workspaceId) {
        db.setWorkspace(user.workspaceId);
      }

      // 1. Prepare products for local db (used immediately by POS, Inventory 360, Expiry Radar)
      const localProducts: Product[] = validRows.map((r) => ({
        id: r.sku,
        name: r.name,
        category: r.category,
        dept: r.dept,
        brand: r.brand,
        price: r.price,
        cost: r.cost,
        stock: r.stock,
        reorder: r.reorder,
        expiry: r.expiry,
        supplier: r.supplier,
        sold: 0,
        revenue: 0,
        margin: r.price > 0 ? Math.round(((r.price - r.cost) / r.price) * 100) : 25,
        status: (r.stock <= r.reorder ? "low" : "ok") as "ok" | "low" | "critical" | "expiring",
      }));

      // Import directly into workspace-scoped local db
      db.importProducts(localProducts);
      forceRefresh();

      // 2. Prepare payload for Backend REST API
      const apiPayload = validRows.map((r) => ({
        name: r.name,
        sku: r.sku,
        barcode: r.barcode,
        brand: r.brand,
        sellingPrice: r.price,
        costPrice: r.cost,
        initialStock: r.stock,
        reorderLevel: r.reorder,
        expiryDate: r.expiry || undefined,
        unit: r.unit,
        category: r.category,
        supplier: r.supplier,
        role: user?.role || "owner",
        emailUser: user?.email || "",
      }));

      // Try bulk create endpoint on backend
      try {
        await bulkAddProductsServer({ data: apiPayload });
      } catch (backendErr) {
        console.warn("Backend bulk sync note:", backendErr);
        // Local database already updated, backend will sync on next fetch
      }

      toast.success(`🎉 Successfully imported ${validRows.length} products into inventory!`);
      resetState();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("Bulk import failed:", err);
      toast.error(err.message || "Failed to complete product import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetState();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col bg-sidebar border border-hairline text-foreground p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-hairline/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Bulk Product Import</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload an Excel (.xlsx, .xls) or CSV file with multiple products to import in
                  bulk.
                </p>
              </div>
            </div>

            {/* Template Download Buttons */}
            <div className="flex items-center gap-2">
              <a
                href="/samples/sample_products.xlsx"
                download="bizora_sample_products.xlsx"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-hairline hover:bg-muted/60 transition-colors text-foreground"
                title="Download pre-filled Excel template"
              >
                <Download className="h-3.5 w-3.5 text-emerald-500" />
                <span>Sample Excel (.xlsx)</span>
              </a>
              <a
                href="/samples/sample_products.csv"
                download="bizora_sample_products.csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-hairline hover:bg-muted/60 transition-colors text-foreground"
                title="Download CSV template"
              >
                <Download className="h-3.5 w-3.5 text-blue-500" />
                <span>Sample CSV</span>
              </a>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* File Upload Dropzone */}
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                dragOver
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-hairline hover:border-primary/50 hover:bg-muted/30 bg-surface/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Click to browse or drag and drop your spreadsheet here
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) files up to 10MB
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-2">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Auto-detects column names
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Auto-generates missing SKUs
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Auto-calculates cost margins
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected File Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-hairline">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                      {file.name}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {parsing
                        ? "Parsing file contents..."
                        : `${parsedRows.length} total rows found • ${validRows.length} ready to import`}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetState}
                  disabled={importing || parsing}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" /> Change File
                </Button>
              </div>

              {/* Status Counters */}
              {!parsing && parsedRows.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-surface border border-hairline text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Total Products
                    </p>
                    <p className="text-lg font-bold text-foreground mt-0.5">{parsedRows.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">
                      Valid to Import
                    </p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {validRows.length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                    <p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider">
                      Invalid Rows
                    </p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-0.5">
                      {invalidRows.length}
                    </p>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {parsing ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <p className="text-xs">Analyzing spreadsheet data...</p>
                </div>
              ) : parsedRows.length > 0 ? (
                <div className="border border-hairline rounded-xl overflow-hidden bg-surface/50">
                  <div className="max-h-[260px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/40 sticky top-0 border-b border-hairline text-muted-foreground text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                          <th className="py-2.5 px-3 font-semibold">Product Name</th>
                          <th className="py-2.5 px-3 font-semibold">SKU</th>
                          <th className="py-2.5 px-3 font-semibold">Category</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Cost</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Stock</th>
                          <th className="py-2.5 px-3 font-semibold">Expiry</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline">
                        {parsedRows.slice(0, 50).map((row, i) => (
                          <tr
                            key={i}
                            className={`hover:bg-muted/20 transition-colors ${
                              !row.isValid ? "bg-red-500/5" : ""
                            }`}
                          >
                            <td className="py-2 px-3 whitespace-nowrap">
                              {row.isValid ? (
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-medium"
                                >
                                  Valid
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-[10px] font-medium flex items-center gap-1 w-fit"
                                >
                                  <AlertCircle className="h-2.5 w-2.5" />
                                  {row.error}
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 px-3 font-medium text-foreground max-w-[180px] truncate">
                              {row.name || <span className="text-red-400 italic">None</span>}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground font-mono text-[11px]">
                              {row.sku}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">{row.category}</td>
                            <td className="py-2 px-3 text-right font-semibold text-foreground">
                              ₹{row.price}
                            </td>
                            <td className="py-2 px-3 text-right text-muted-foreground">
                              ₹{row.cost}
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-foreground">
                              {row.stock}
                            </td>
                            <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">
                              {row.expiry || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedRows.length > 50 && (
                    <div className="py-2 px-3 text-center text-[11px] text-muted-foreground bg-muted/20 border-t border-hairline">
                      Showing first 50 of {parsedRows.length} products. All {validRows.length} valid
                      items will be imported.
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Quick Guidance Box */}
          <div className="p-3.5 rounded-xl bg-muted/20 border border-hairline text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
              <Package className="h-3.5 w-3.5 text-primary" /> Supported Excel Columns:
            </p>
            <p className="text-[11px] leading-relaxed">
              <strong className="text-foreground">Required:</strong> Product Name, Selling Price (or
              Price).
              <br />
              <strong className="text-foreground">Optional:</strong> Cost Price, Category, Brand,
              Stock, SKU, Barcode, Reorder Level, Expiry Date (YYYY-MM-DD), Supplier, Unit.
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-hairline/60 bg-muted/20 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={importing}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            onClick={handleImport}
            disabled={validRows.length === 0 || importing || parsing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Importing {validRows.length} Products...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Import {validRows.length} Products Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
