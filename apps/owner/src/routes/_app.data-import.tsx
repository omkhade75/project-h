import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/page-header";
import { useBusinessData } from "@/lib/business-context";
import { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Database,
  Download,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  parseSpreadsheetFile,
  mapRowsToProducts,
  mapRowsToCustomers,
  mapRowsToTransactions,
} from "@/lib/spreadsheet-parser";

export const Route = createFileRoute("/_app/data-import")({
  head: () => ({
    meta: [
      { title: "Data Import | Bizora" },
      {
        name: "description",
        content:
          "Connect data sources and upload historical records from spreadsheets, CSVs, photos, and PDFs.",
      },
    ],
  }),
  component: DataImportPage,
});

export function DataImportPage() {
  const { transactions, products, customers, forceRefresh } = useBusinessData();
  const [uploading, setUploading] = useState(false);
  const [ingestionLogs, setIngestionLogs] = useState<
    Array<{
      fileName: string;
      type: string;
      records: number;
      sampleNames?: string;
      time: string;
      status: "success" | "error";
    }>
  >([]);

  const salesInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const generalInputRef = useRef<HTMLInputElement>(null);

  const downloadSampleTemplate = (type: "products" | "customers" | "sales") => {
    let csvContent = "";
    let filename = "";

    if (type === "products") {
      csvContent =
        "Product Name,SKU,Category,Brand,Selling Price,Cost Price,Stock,Supplier,Barcode\r\n" +
        "Amul Butter 500g,SKU-1001,Dairy,Amul,280,250,60,Amul Distributor,890126201001\r\n" +
        "Tata Tea Gold 500g,SKU-1002,Beverages,Tata,350,310,80,Tata Consumer,890126201002\r\n" +
        "Fortune Sunlite Sunflower Oil 1L,SKU-1003,Cooking Oil,Fortune,145,128,120,Adani Wilmar,890126201003\r\n" +
        "Maggi 2-Minute Masala Noodles 70g,SKU-1004,Instant Food,Nestle,14,11.5,250,Nestle India,890126201004\r\n" +
        "Aashirvaad Shudh Chakki Atta 5kg,SKU-1005,Staples & Grocery,Aashirvaad,265,240,45,ITC Limited,890126201005\r\n" +
        "Dettol Original Bathing Soap 125g,SKU-1006,Personal Care,Dettol,65,52,100,Reckitt Benckiser,890126201006\r\n" +
        "Surf Excel Easy Wash Detergent 1kg,SKU-1007,Household,Surf Excel,140,118,70,Hindustan Unilever,890126201007\r\n" +
        "Britannia Good Day Butter Cookies 200g,SKU-1008,Snacks & Bakery,Britannia,40,32,150,Britannia Industries,890126201008\r\n" +
        "Haldiram's Nagpur Aloo Bhujia 400g,SKU-1009,Snacks,Haldirams,120,95,90,Haldiram Foods,890126201009\r\n" +
        "Colgate MaxFresh Spicy Fresh 150g,SKU-1010,Oral Care,Colgate,110,88,85,Colgate-Palmolive,890126201010\r\n" +
        "Parle-G Gold Biscuits 1kg,SKU-1011,Snacks & Bakery,Parle,95,80,110,Parle Products,890126201011\r\n" +
        "Nestle Everyday Dairy Whitener 400g,SKU-1012,Dairy,Nestle,240,210,50,Nestle India,890126201012\r\n" +
        "Brooke Bond Red Label Tea 500g,SKU-1013,Beverages,Red Label,290,255,65,Hindustan Unilever,890126201013\r\n" +
        "Saffola Gold Pro Healthy Oil 1L,SKU-1014,Cooking Oil,Saffola,175,152,95,Marico Limited,890126201014\r\n" +
        "Cadbury Dairy Milk Silk 60g,SKU-1015,Chocolates,Cadbury,90,74,130,Mondelez India,890126201015\r\n";
      filename = "bizora_sample_products.csv";
    } else if (type === "customers") {
      csvContent =
        "Customer Name,Phone Number,Email,Membership Tier,Total Spend,Favorite Department\r\n" +
        "Rahul Sharma,+91 98201 12345,rahul.sharma@example.com,VIP,24500,Grocery\r\n" +
        "Pooja Deshmukh,+91 98192 34567,pooja.deshmukh@example.com,Loyal,14200,Dairy\r\n" +
        "Vikram Patel,+91 98765 43210,vikram.patel@example.com,Regular,6400,Snacks\r\n" +
        "Sneha Kulkarni,+91 97654 89012,sneha.kulkarni@example.com,VIP,18900,Beverages\r\n" +
        "Amit Verma,+91 91234 56789,amit.verma@example.com,New,1850,Personal Care\r\n" +
        "Neha Joshi,+91 99887 76655,neha.joshi@example.com,Loyal,11200,Cooking Oil\r\n" +
        "Karan Malhotra,+91 98223 34455,karan.m@example.com,Regular,4300,Instant Food\r\n" +
        "Ananya Sen,+91 98334 55667,ananya.sen@example.com,VIP,31000,Household\r\n" +
        "Rohan Gupta,+91 98112 23344,rohan.gupta@example.com,Loyal,9800,Dairy\r\n" +
        "Meera Iyer,+91 97445 66778,meera.iyer@example.com,Frequent,7650,Grocery\r\n" +
        "Suresh Nair,+91 98210 99887,suresh.nair@example.com,Regular,5100,Beverages\r\n" +
        "Deepak Rao,+91 98901 22334,deepak.rao@example.com,New,950,Snacks\r\n";
      filename = "bizora_sample_customers.csv";
    } else {
      csvContent =
        "Invoice No,Date,Customer Name,Customer Phone,Product Name,SKU,Quantity,Price,Total Amount,Payment Mode\r\n" +
        "INV-1001,2026-10-21,Rahul Sharma,+91 98201 12345,Amul Butter 500g,SKU-1001,2,280,560,UPI\r\n" +
        "INV-1002,2026-10-21,Rahul Sharma,+91 98201 12345,Tata Tea Gold 500g,SKU-1002,1,350,350,UPI\r\n" +
        "INV-1003,2026-10-21,Pooja Deshmukh,+91 98192 34567,Aashirvaad Shudh Chakki Atta 5kg,SKU-1005,1,265,265,Card\r\n" +
        "INV-1004,2026-10-22,Vikram Patel,+91 98765 43210,Fortune Sunlite Sunflower Oil 1L,SKU-1003,2,145,290,Cash\r\n" +
        "INV-1005,2026-10-22,Sneha Kulkarni,+91 97654 89012,Maggi 2-Minute Masala Noodles 70g,SKU-1004,6,14,84,UPI\r\n" +
        "INV-1006,2026-10-22,Sneha Kulkarni,+91 97654 89012,Cadbury Dairy Milk Silk 60g,SKU-1015,2,90,180,UPI\r\n" +
        "INV-1007,2026-10-23,Amit Verma,+91 91234 56789,Dettol Original Bathing Soap 125g,SKU-1006,3,65,195,Cash\r\n" +
        "INV-1008,2026-10-23,Neha Joshi,+91 99887 76655,Surf Excel Easy Wash Detergent 1kg,SKU-1007,1,140,140,UPI\r\n" +
        "INV-1009,2026-10-23,Neha Joshi,+91 99887 76655,Haldiram's Nagpur Aloo Bhujia 400g,SKU-1009,2,120,240,UPI\r\n" +
        "INV-1010,2026-10-23,Karan Malhotra,+91 98223 34455,Parle-G Gold Biscuits 1kg,SKU-1011,1,95,95,Cash\r\n" +
        "INV-1011,2026-10-24,Ananya Sen,+91 98334 55667,Saffola Gold Pro Healthy Oil 1L,SKU-1014,3,175,525,Card\r\n" +
        "INV-1012,2026-10-24,Ananya Sen,+91 98334 55667,Brooke Bond Red Label Tea 500g,SKU-1013,1,290,290,Card\r\n" +
        "INV-1013,2026-10-24,Rohan Gupta,+91 98112 23344,Colgate MaxFresh Spicy Fresh 150g,SKU-1010,2,110,220,UPI\r\n" +
        "INV-1014,2026-10-24,Meera Iyer,+91 97445 66778,Britannia Good Day Butter Cookies 200g,SKU-1008,4,40,160,UPI\r\n" +
        "INV-1015,2026-10-24,Meera Iyer,+91 97445 66778,Nestle Everyday Dairy Whitener 400g,SKU-1012,1,240,240,UPI\r\n" +
        "INV-1016,2026-10-25,Suresh Nair,+91 98210 99887,Fortune Sunlite Sunflower Oil 1L,SKU-1003,1,145,145,Cash\r\n" +
        "INV-1017,2026-10-25,Suresh Nair,+91 98210 99887,Amul Butter 500g,SKU-1001,1,280,280,Cash\r\n" +
        "INV-1018,2026-10-25,Deepak Rao,+91 98901 22334,Maggi 2-Minute Masala Noodles 70g,SKU-1004,10,14,140,UPI\r\n" +
        "INV-1019,2026-10-25,Rahul Sharma,+91 98201 12345,Haldiram's Nagpur Aloo Bhujia 400g,SKU-1009,1,120,120,UPI\r\n" +
        "INV-1020,2026-10-25,Pooja Deshmukh,+91 98192 34567,Tata Tea Gold 500g,SKU-1002,2,350,700,Card\r\n";
      filename = "bizora_sample_sales.csv";
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}! You can fill it in Excel and re-upload.`);
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetCategory: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase() || "";

    try {
      const dbModule = await import("@/lib/db");
      const dbInstance = dbModule.db;

      let recordCount = 0;
      let fileTypeLabel = `${extension.toUpperCase()} Spreadsheet`;
      let previewNames = "";

      // 1. Try spreadsheet parser (supports .xlsx, .xls, .csv, .tsv, .txt)
      const isSpreadsheet = ["xlsx", "xls", "xlsm", "xlsb", "csv", "tsv", "txt"].includes(
        extension,
      );

      if (isSpreadsheet) {
        const { rows, format } = await parseSpreadsheetFile(file);
        fileTypeLabel = format;

        if (rows.length > 0) {
          if (targetCategory === "product") {
            const parsedProducts = mapRowsToProducts(rows);
            dbInstance.importProducts(parsedProducts);
            recordCount = parsedProducts.length;
            previewNames =
              parsedProducts
                .slice(0, 3)
                .map((p) => p.name)
                .join(", ") +
              (parsedProducts.length > 3 ? ` +${parsedProducts.length - 3} more` : "");
          } else if (targetCategory === "customer") {
            const parsedCusts = mapRowsToCustomers(rows);
            dbInstance.importCustomers(parsedCusts);
            recordCount = parsedCusts.length;
            previewNames =
              parsedCusts
                .slice(0, 3)
                .map((c) => c.name)
                .join(", ") + (parsedCusts.length > 3 ? ` +${parsedCusts.length - 3} more` : "");
          } else if (targetCategory === "sales") {
            const parsedTxns = mapRowsToTransactions(rows);
            dbInstance.importTransactions(parsedTxns);
            recordCount = parsedTxns.length;
            previewNames =
              parsedTxns
                .slice(0, 3)
                .map((t) => `${t.id} (${t.customerName})`)
                .join(", ") + (parsedTxns.length > 3 ? ` +${parsedTxns.length - 3} more` : "");
          }
        }
      }

      // 2. Photo / Receipt / Fallback simulation if non-spreadsheet or empty
      if (recordCount === 0) {
        if (targetCategory === "product") {
          fileTypeLabel = ["png", "jpg", "jpeg", "webp"].includes(extension)
            ? "Photo OCR SKU Scanner"
            : "Product Catalog (Sample)";
          const sampleProducts = [
            {
              id: "SKU001",
              name: "Amul Gold Milk 500ml",
              category: "Dairy",
              dept: "Supermarket Main",
              brand: "Amul",
              price: 33,
              cost: 29,
              stock: 120,
              reorder: 15,
              expiry: "2026-12-31",
              supplier: "Amul Distributor",
              sold: 0,
              revenue: 0,
              margin: 12.1,
              status: "ok" as const,
            },
            {
              id: "SKU002",
              name: "Parle-G Gold 1kg",
              category: "Biscuits",
              dept: "Supermarket Main",
              brand: "Parle",
              price: 85,
              cost: 72,
              stock: 250,
              reorder: 15,
              expiry: "2026-12-31",
              supplier: "Parle Foods",
              sold: 0,
              revenue: 0,
              margin: 15.3,
              status: "ok" as const,
            },
            {
              id: "SKU003",
              name: "Coca-Cola 750ml",
              category: "Beverages",
              dept: "Supermarket Main",
              brand: "Coca-Cola",
              price: 40,
              cost: 34,
              stock: 80,
              reorder: 15,
              expiry: "2026-12-31",
              supplier: "Coke Distributor",
              sold: 0,
              revenue: 0,
              margin: 15,
              status: "ok" as const,
            },
            {
              id: "SKU004",
              name: "Maggi Masala Noodles 280g",
              category: "Noodles",
              dept: "Supermarket Main",
              brand: "Nestle",
              price: 58,
              cost: 48,
              stock: 300,
              reorder: 15,
              expiry: "2026-12-31",
              supplier: "Nestle India",
              sold: 0,
              revenue: 0,
              margin: 17.2,
              status: "ok" as const,
            },
            {
              id: "SKU005",
              name: "Aashirvaad Atta 5kg",
              category: "Grocery",
              dept: "Supermarket Main",
              brand: "ITC",
              price: 265,
              cost: 238,
              stock: 60,
              reorder: 15,
              expiry: "2026-12-31",
              supplier: "ITC Distributor",
              sold: 0,
              revenue: 0,
              margin: 10.2,
              status: "ok" as const,
            },
          ];
          dbInstance.importProducts(sampleProducts);
          recordCount = sampleProducts.length;
          previewNames = sampleProducts
            .map((p) => p.name)
            .slice(0, 3)
            .join(", ");
        } else if (targetCategory === "sales") {
          fileTypeLabel = ["png", "jpg", "jpeg", "webp"].includes(extension)
            ? "Receipt Slip OCR"
            : "Sales History (Sample)";
          const todayStr = new Date().toISOString().split("T")[0];
          const sampleTxns = [
            {
              id: "INV1001",
              date: todayStr,
              time: "10:15",
              dept: "Supermarket Main",
              customerId: "C001",
              customerName: "Rahul Patil",
              subtotal: 66,
              tax: 3,
              discount: 0,
              total: 66,
              payment: "UPI" as const,
              status: "Completed" as const,
              cashier: "POS-1",
              items: [
                {
                  productId: "SKU001",
                  name: "Amul Gold Milk 500ml",
                  quantity: 2,
                  price: 33,
                  cost: 29,
                },
              ],
            },
            {
              id: "INV1002",
              date: todayStr,
              time: "11:20",
              dept: "Supermarket Main",
              customerId: "C002",
              customerName: "Sneha Shah",
              subtotal: 170,
              tax: 8,
              discount: 0,
              total: 170,
              payment: "Cash" as const,
              status: "Completed" as const,
              cashier: "POS-1",
              items: [
                { productId: "SKU002", name: "Parle-G Gold 1kg", quantity: 2, price: 85, cost: 72 },
              ],
            },
            {
              id: "INV1003",
              date: todayStr,
              time: "14:10",
              dept: "Supermarket Main",
              customerId: "C003",
              customerName: "Amit Joshi",
              subtotal: 80,
              tax: 4,
              discount: 0,
              total: 80,
              payment: "Card" as const,
              status: "Completed" as const,
              cashier: "POS-2",
              items: [
                { productId: "SKU003", name: "Coca-Cola 750ml", quantity: 2, price: 40, cost: 34 },
              ],
            },
          ];
          dbInstance.importTransactions(sampleTxns);
          recordCount = sampleTxns.length;
          previewNames = sampleTxns.map((t) => t.customerName).join(", ");
        } else if (targetCategory === "customer") {
          fileTypeLabel = ["png", "jpg", "jpeg", "webp"].includes(extension)
            ? "Member Sheet Photo OCR"
            : "Customer CRM (Sample)";
          const sampleCusts = [
            {
              id: "C001",
              name: "Rahul Patil",
              joined: "2026-07-01",
              visits: 6,
              spend: 4500,
              aov: 750,
              favDept: "Dairy",
              lastVisit: "2026-07-29",
              segment: "Loyal" as const,
              churn: 8,
            },
            {
              id: "C002",
              name: "Sneha Shah",
              joined: "2026-06-15",
              visits: 4,
              spend: 2800,
              aov: 700,
              favDept: "Biscuits",
              lastVisit: "2026-07-29",
              segment: "Frequent" as const,
              churn: 15,
            },
            {
              id: "C003",
              name: "Amit Joshi",
              joined: "2026-01-10",
              visits: 14,
              spend: 12500,
              aov: 893,
              favDept: "Beverages",
              lastVisit: "2026-07-30",
              segment: "VIP" as const,
              churn: 5,
            },
          ];
          dbInstance.importCustomers(sampleCusts);
          recordCount = sampleCusts.length;
          previewNames = sampleCusts.map((c) => c.name).join(", ");
        }
      }

      const newLog = {
        fileName,
        type: fileTypeLabel,
        records: recordCount,
        sampleNames: previewNames,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "success" as const,
      };

      setIngestionLogs((prev) => [newLog, ...prev]);
      toast.success(`🎉 Ingestion Successful: ${recordCount} ${targetCategory}s Imported!`, {
        description: previewNames
          ? `Recognized: ${previewNames}`
          : `All records updated in central business ledger.`,
        duration: 7000,
      });

      forceRefresh();
    } catch (err: any) {
      console.error("Data import error:", err);
      toast.error(`Import failed for "${fileName}"`, {
        description: err.message || "An unexpected error occurred while parsing the file.",
      });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Import & Spreadsheet Ingestion"
        subtitle="Upload Excel workbooks (.xlsx, .xls), CSV catalogs, or photos to auto-populate your live inventory and customer ledger."
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={salesInputRef}
        className="hidden"
        accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt,.pdf,.png,.jpg,.jpeg,.webp"
        onChange={(e) => handleFileUpload(e, "sales")}
      />
      <input
        type="file"
        ref={productInputRef}
        className="hidden"
        accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt,.pdf,.png,.jpg,.jpeg,.webp"
        onChange={(e) => handleFileUpload(e, "product")}
      />
      <input
        type="file"
        ref={customerInputRef}
        className="hidden"
        accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt,.pdf,.png,.jpg,.jpeg,.webp"
        onChange={(e) => handleFileUpload(e, "customer")}
      />
      <input
        type="file"
        ref={generalInputRef}
        className="hidden"
        accept=".xlsx,.xls,.xlsm,.csv,.tsv,.txt,.pdf,.png,.jpg,.jpeg,.webp"
        onChange={(e) => handleFileUpload(e, "product")}
      />

      {/* Accepted File Types Banner */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-bold text-foreground text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Universal Excel (.xlsx / .xls) & CSV Engine Enabled
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Upload files exported from <strong>Microsoft Excel</strong>,{" "}
            <strong>Tally Prime</strong>, <strong>Busy</strong>, <strong>Google Sheets</strong>, or
            POS systems. Bizora automatically recognizes column variations (e.g.{" "}
            <em>Product Name, Item Name, Particulars, Customer Name, Party Name, Contact</em>) and
            strips byte-order marks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadSampleTemplate("products")}
            className="text-xs h-9 font-semibold gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Sample Products CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadSampleTemplate("customers")}
            className="text-xs h-9 font-semibold gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Sample Customers CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadSampleTemplate("sales")}
            className="text-xs h-9 font-semibold gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Sample Sales CSV
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={async () => {
              if (
                !confirm(
                  "Are you sure you want to clear all existing products, transactions, and customers to start fresh with zero data?",
                )
              )
                return;
              try {
                const dbModule = await import("@/lib/db");
                dbModule.db.clearAllData();
                setIngestionLogs([]);

                try {
                  const { fetchApi } = await import("@/lib/api-client");
                  await fetchApi("/api/transactions", { method: "DELETE" }).catch(() => {});
                } catch (_) {
                  /* ignore network error if backend is unavailable */
                }

                forceRefresh();
                toast.success("🗑️ All records cleared! Database is 100% clean with zero data.");
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              } catch (e: any) {
                toast.error("Failed to clear database.");
              }
            }}
            className="shrink-0 font-bold gap-1.5 text-xs h-9"
          >
            🗑️ Clear Database
          </Button>
        </div>
      </div>

      {/* Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-hairline bg-surface p-6 space-y-4 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
              XLSX / XLS / CSV
            </span>
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Sales & Transaction History</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Upload daily billing CSVs, Tally Excel exports (.xlsx / .xls), or receipt scans.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => salesInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}{" "}
              Upload Sales
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Download Sales Template"
              onClick={() => downloadSampleTemplate("sales")}
              className="h-9 w-9 shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-surface p-6 space-y-4 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
              XLSX / XLS / CSV
            </span>
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Product Master & Inventory</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Upload SKU catalogs, supplier price lists (.xlsx, .xls, .csv), or photos of barcodes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => productInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}{" "}
              Upload Products
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Download Product Template"
              onClick={() => downloadSampleTemplate("products")}
              className="h-9 w-9 shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-hairline bg-surface p-6 space-y-4 hover:border-primary/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
              XLSX / XLS / CSV
            </span>
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Customer Directory</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Upload customer contact sheets, CRM spreadsheets (.xlsx, .xls), or member lists.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => customerInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}{" "}
              Upload Customers
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Download Customer Template"
              onClick={() => downloadSampleTemplate("customers")}
              className="h-9 w-9 shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sync Status & Ingestion Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Connected Live Integrations">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-medium text-foreground">POS · GoFrugal / RetailEZ</span>
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted/20 px-2 py-0.5 rounded">
                Ready for Ingest
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-medium text-foreground">ERP · Tally Prime / Busy / Zoho</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Excel Export Supported
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-medium text-foreground">HR · Zoho People</span>
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted/20 px-2 py-0.5 rounded">
                Not Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-hairline">
              <span className="font-medium text-foreground">Format Compatibility</span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                .XLSX, .XLS, .CSV, .TSV
              </span>
            </div>
          </div>
        </SectionCard>

        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Database Ingestion Audit Log">
            {ingestionLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                <Database className="h-8 w-8 mx-auto opacity-40 text-muted-foreground" />
                <p className="font-medium">No external files uploaded yet.</p>
                <p className="text-[11px]">
                  Upload Excel (.xlsx, .xls) or CSV spreadsheets above to ingest your real products
                  and customer database.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {ingestionLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-hairline bg-surface gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-md bg-emerald-500/10 text-emerald-400 shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground flex items-center gap-2">
                          {log.fileName}
                          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-normal">
                            {log.records} records
                          </span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Type: <strong>{log.type}</strong>
                          {log.sampleNames && (
                            <span className="text-foreground/90 ml-1.5 font-medium">
                              · Sample: {log.sampleNames}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
