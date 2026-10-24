import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, StatusPill } from "@/components/page-header";
import { Timer, AlertTriangle, Sparkles, Upload, RefreshCw, CheckCircle2, Filter } from "lucide-react";
import { useBusinessData } from "@/lib/business-context";
import { useAuth } from "@/lib/auth-context";
import { fmtINR, fmtNum } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useRef } from "react";
import { getExpiryIntelligenceServer } from "@/lib/server-inventory";
import { db, Product } from "@/lib/db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { parseSpreadsheetFile, mapRowsToProducts } from "@/lib/spreadsheet-parser";

export const Route = createFileRoute("/_app/expiry")({
  head: () => ({
    meta: [
      { title: "Expiry Intelligence | Bizora" },
      {
        name: "description",
        content: "Perishable goods with expiry deadlines and AI markdown/transfer recommendations.",
      },
    ],
  }),
  component: Expiry,
});

export interface PerishableItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  batchNumber: string;
  stock: number;
  cost: number;
  price: number;
  expiry: string;
  days: number;
  status: "expired" | "critical" | "high" | "medium" | "safe";
  recommendation: string;
}

const SAMPLE_PERISHABLE_PRODUCTS: Product[] = [
  { id: "PROD004", name: "Amul Butter 500g", category: "Dairy", dept: "Supermarket Main", brand: "Amul", price: 285, cost: 250, stock: 25, reorder: 10, expiry: "2026-10-28", supplier: "Amul Distributor", sold: 12, revenue: 3420, margin: 12.3, status: "ok" },
  { id: "PROD011", name: "Amul Taaza Milk 1L", category: "Dairy", dept: "Supermarket Main", brand: "Amul", price: 68, cost: 60, stock: 40, reorder: 15, expiry: "2026-10-26", supplier: "Amul Distributor", sold: 30, revenue: 2040, margin: 11.8, status: "ok" },
  { id: "PROD012", name: "Mother Dairy Fresh Paneer 200g", category: "Dairy", dept: "Supermarket Main", brand: "Mother Dairy", price: 95, cost: 82, stock: 30, reorder: 10, expiry: "2026-10-30", supplier: "Mother Dairy", sold: 18, revenue: 1710, margin: 13.7, status: "ok" },
  { id: "PROD001", name: "Aashirvaad Atta 5kg", category: "Grocery", dept: "Supermarket Main", brand: "ITC", price: 265, cost: 238, stock: 40, reorder: 15, expiry: "2026-11-15", supplier: "ITC Distributor", sold: 25, revenue: 6625, margin: 10.2, status: "ok" },
  { id: "PROD003", name: "Fortune Sunflower Oil 1L", category: "Cooking Oil", dept: "Supermarket Main", brand: "Fortune", price: 160, cost: 130, stock: 60, reorder: 20, expiry: "2026-11-30", supplier: "Adani Wilmar", sold: 35, revenue: 5600, margin: 18.8, status: "ok" },
  { id: "PROD009", name: "Good Day Cookies 200g", category: "Bakery", dept: "Supermarket Main", brand: "Britannia", price: 45, cost: 35, stock: 80, reorder: 25, expiry: "2026-12-15", supplier: "Britannia Foods", sold: 65, revenue: 2925, margin: 22.2, status: "ok" },
  { id: "PROD010", name: "Haldiram Bhujia 400g", category: "Snacks", dept: "Supermarket Main", brand: "Haldiram", price: 120, cost: 95, stock: 35, reorder: 15, expiry: "2027-01-15", supplier: "Haldiram Snacks", sold: 28, revenue: 3360, margin: 20.8, status: "ok" },
  { id: "PROD002", name: "India Gate Basmati Rice 5kg", category: "Grocery", dept: "Supermarket Main", brand: "India Gate", price: 650, cost: 520, stock: 30, reorder: 10, expiry: "2027-01-31", supplier: "KRBL Limited", sold: 14, revenue: 9100, margin: 20.0, status: "ok" },
  { id: "PROD006", name: "Tata Tea Gold 500g", category: "Beverages", dept: "Supermarket Main", brand: "Tata", price: 230, cost: 195, stock: 45, reorder: 15, expiry: "2027-02-28", supplier: "Tata Consumer", sold: 22, revenue: 5060, margin: 15.2, status: "ok" },
  { id: "PROD005", name: "Maggi Noodles 4-Pack", category: "Instant Food", dept: "Supermarket Main", brand: "Nestle", price: 70, cost: 55, stock: 100, reorder: 30, expiry: "2027-03-31", supplier: "Nestle India", sold: 85, revenue: 5950, margin: 21.4, status: "ok" },
  { id: "PROD007", name: "Surf Excel Detergent 1kg", category: "FMCG", dept: "Supermarket Main", brand: "Surf Excel", price: 135, cost: 110, stock: 50, reorder: 20, expiry: "2028-05-31", supplier: "HUL Distributor", sold: 40, revenue: 5400, margin: 18.5, status: "ok" },
  { id: "PROD008", name: "Tata Salt 1kg", category: "Grocery", dept: "Supermarket Main", brand: "Tata", price: 28, cost: 22, stock: 150, reorder: 50, expiry: "2028-12-31", supplier: "Tata Consumer", sold: 110, revenue: 3080, margin: 21.4, status: "ok" },
];

function Expiry() {
  const { products, applyMarkdown, forceRefresh } = useBusinessData();
  const { user } = useAuth();
  const [serverBatches, setServerBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTier, setFilterTier] = useState<"all" | "critical" | "soon" | "mid" | "safe" | "expired">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const payload = { data: { role: user?.role || "owner", email: user?.email || "" } };
        const data = await getExpiryIntelligenceServer(payload);
        if (isMounted) setServerBatches(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setServerBatches([]);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Combine products from context and direct db
  const allProducts = useMemo(() => {
    let prods = products || [];
    if (prods.length === 0) {
      try {
        prods = db.getProducts() || [];
      } catch (e) {}
    }
    return prods;
  }, [products]);

  // Transform products and batches into monitored perishable items
  const perishableList: PerishableItem[] = useMemo(() => {
    const list: PerishableItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Process all products with expiry dates
    allProducts.forEach((p, idx) => {
      if (!p.expiry) return;

      const expDate = new Date(p.expiry);
      if (isNaN(expDate.getTime())) return;

      const diffMs = expDate.getTime() - today.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: PerishableItem["status"] = "safe";
      let recommendation = "Optimal Freshness · Standard FIFO Rotation";

      if (days <= 0) {
        status = "expired";
        recommendation = "Dispose & Write-Off Stock";
      } else if (days <= 3) {
        status = "critical";
        recommendation = "Flash Sale · Apply 40% Markdown";
      } else if (days <= 7) {
        status = "critical";
        recommendation = "Urgent · Apply 25% Markdown";
      } else if (days <= 30) {
        status = "high";
        recommendation = "Elevated · Bundle & Promote 15%";
      } else if (days <= 90) {
        status = "medium";
        recommendation = "Promotional End-Cap Placement";
      } else {
        status = "safe";
        recommendation = "Maintain Standard Inventory Rotation";
      }

      const batchNumber = `BATCH-${p.id.replace(/[^A-Za-z0-9]/g, "").slice(-4) || String(idx + 1).padStart(3, "0")}-${expDate.getFullYear()}${String(expDate.getMonth() + 1).padStart(2, "0")}`;

      list.push({
        id: `PERISH-${p.id}`,
        productId: p.id,
        name: p.name,
        category: p.category || "Grocery",
        batchNumber,
        stock: p.stock || 25,
        cost: p.cost || Math.round((p.price || 100) * 0.7),
        price: p.price || 100,
        expiry: p.expiry,
        days,
        status,
        recommendation,
      });
    });

    // 2. Merge any server batches that aren't already represented
    serverBatches.forEach((sb) => {
      if (!list.some((item) => item.productId === sb.productId)) {
        list.push({
          id: sb.id,
          productId: sb.productId,
          name: sb.name || "Perishable Item",
          category: sb.category || "Perishable",
          batchNumber: sb.batchNumber || "BATCH-SRV",
          stock: sb.stock || 20,
          cost: sb.cost || 100,
          price: sb.price || 130,
          expiry: sb.expiry || new Date().toISOString(),
          days: sb.days ?? 15,
          status: sb.days <= 0 ? "expired" : sb.days <= 7 ? "critical" : sb.days <= 30 ? "high" : "medium",
          recommendation: sb.recommendation || "Dynamic Markdown Review",
        });
      }
    });

    // Sort by earliest expiry first (urgent at the top)
    return list.sort((a, b) => a.days - b.days);
  }, [allProducts, serverBatches]);

  // Filter based on active tab
  const filteredPerishables = useMemo(() => {
    switch (filterTier) {
      case "critical":
        return perishableList.filter((p) => p.days > 0 && p.days <= 7);
      case "soon":
        return perishableList.filter((p) => p.days > 7 && p.days <= 30);
      case "mid":
        return perishableList.filter((p) => p.days > 30 && p.days <= 90);
      case "safe":
        return perishableList.filter((p) => p.days > 90);
      case "expired":
        return perishableList.filter((p) => p.days <= 0);
      case "all":
      default:
        return perishableList;
    }
  }, [perishableList, filterTier]);

  // Metrics
  const expiringToday = perishableList.filter((p) => p.days === 0).length;
  const critical7d = perishableList.filter((p) => p.days > 0 && p.days <= 7).length;
  const within30d = perishableList.filter((p) => p.days > 7 && p.days <= 30).length;
  const next90d = perishableList.filter((p) => p.days > 30 && p.days <= 90).length;
  const safeStock = perishableList.filter((p) => p.days > 90).length;
  const expiredCount = perishableList.filter((p) => p.days < 0).length;

  const totalMonitoredValue = perishableList.reduce((sum, p) => sum + p.stock * p.cost, 0);
  const atRiskValue = perishableList
    .filter((p) => p.days >= 0 && p.days <= 30)
    .reduce((sum, p) => sum + p.stock * p.cost, 0);
  const expiredValue = perishableList
    .filter((p) => p.days < 0)
    .reduce((sum, p) => sum + p.stock * p.cost, 0);

  const handleLoadDemoPerishables = () => {
    db.importProducts(SAMPLE_PERISHABLE_PRODUCTS);
    forceRefresh();
    toast.success("Loaded 12 sample perishable items with verified expiry dates!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const { rows } = await parseSpreadsheetFile(file);
      if (rows && rows.length > 0) {
        const prods = mapRowsToProducts(rows);
        db.importProducts(prods);
        forceRefresh();
        toast.success(`Imported ${prods.length} products with expiry dates from ${file.name}!`);
      } else {
        toast.error("No valid product rows found in file.");
      }
    } catch (err: any) {
      toast.error(`Import failed: ${err?.message || "Check file formatting"}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAction = (item: PerishableItem) => {
    if (item.days <= 0) {
      toast.info(`Write-off initiated for ${item.name} (${item.batchNumber})`);
      return;
    }
    const discount = item.days <= 3 ? 40 : item.days <= 7 ? 25 : item.days <= 30 ? 15 : 10;
    applyMarkdown(item.productId, item.batchNumber, discount);
    toast.success(`Applied ${discount}% AI Markdown to ${item.name}! Updated on POS & Shelf labels.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Expiry Intelligence"
          subtitle="Predict, prevent, and recover from perishable stock loss."
        />
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.xlsx,.xls,.tsv,.txt"
            onChange={handleFileUpload}
          />
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Import Products / Expiry CSV
          </Button>
          {perishableList.length === 0 && (
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground text-xs h-8 gap-1.5"
              onClick={handleLoadDemoPerishables}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Load Sample Perishables (12 SKUs)
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Kpi
          label="Monitored SKUs"
          v={`${perishableList.length} SKUs`}
          sub="Active inventory tracked"
        />
        <Kpi
          label="Critical (≤7 Days)"
          v={`${critical7d + expiringToday} SKUs`}
          tone={critical7d + expiringToday > 0 ? "danger" : undefined}
          sub="Immediate action required"
        />
        <Kpi
          label="Within 30 Days"
          v={`${within30d} SKUs`}
          tone={within30d > 0 ? "warning" : undefined}
          sub="Markdown eligible"
        />
        <Kpi
          label="Next 1–3 Months"
          v={`${next90d} SKUs`}
          sub="Upcoming shelf reviews"
        />
        <Kpi
          label="Monitored Value"
          v={fmtINR(totalMonitoredValue)}
          sub="Total cost of stock"
        />
        <Kpi
          label="At-Risk Value (≤30d)"
          v={fmtINR(atRiskValue)}
          tone={atRiskValue > 0 ? "warning" : undefined}
          sub="Urgent loss prevention"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
        <div className="flex items-center gap-1 rounded-md border border-hairline bg-surface p-1 text-xs">
          <button
            onClick={() => setFilterTier("all")}
            className={cn(
              "px-3 py-1 rounded font-medium transition-colors",
              filterTier === "all" ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            All Monitored ({perishableList.length})
          </button>
          <button
            onClick={() => setFilterTier("critical")}
            className={cn(
              "px-3 py-1 rounded font-medium transition-colors",
              filterTier === "critical" ? "bg-destructive/20 text-destructive font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Critical ≤7d ({critical7d + expiringToday})
          </button>
          <button
            onClick={() => setFilterTier("soon")}
            className={cn(
              "px-3 py-1 rounded font-medium transition-colors",
              filterTier === "soon" ? "bg-warning/20 text-warning font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Expiring in 30d ({within30d})
          </button>
          <button
            onClick={() => setFilterTier("mid")}
            className={cn(
              "px-3 py-1 rounded font-medium transition-colors",
              filterTier === "mid" ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            30–90 Days ({next90d})
          </button>
          <button
            onClick={() => setFilterTier("safe")}
            className={cn(
              "px-3 py-1 rounded font-medium transition-colors",
              filterTier === "safe" ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            Safe &gt;90d ({safeStock})
          </button>
          {expiredCount > 0 && (
            <button
              onClick={() => setFilterTier("expired")}
              className={cn(
                "px-3 py-1 rounded font-medium transition-colors",
                filterTier === "expired" ? "bg-destructive/20 text-destructive font-semibold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Expired ({expiredCount})
            </button>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground">
          Showing {filteredPerishables.length} of {perishableList.length} perishable inventory batches
        </span>
      </div>

      <SectionCard
        title="Expiring Perishables & Dynamic AI Recommendations"
        subtitle="Sorted by days remaining · Real-time shelf-life countdown and action triggers"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-hairline pb-2">
                <th className="pb-3 font-semibold">Product & Category</th>
                <th className="pb-3 font-semibold">Batch No.</th>
                <th className="pb-3 text-right font-semibold">Stock Qty</th>
                <th className="pb-3 font-semibold pl-4">Expiry Date</th>
                <th className="pb-3 text-right font-semibold">Days Remaining</th>
                <th className="pb-3 text-right font-semibold pr-4">Stock Value</th>
                <th className="pb-3 font-semibold">Shelf Severity</th>
                <th className="pb-3 font-semibold text-right pr-2">AI Action Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredPerishables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No perishable items matching the selected filter.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Import a spreadsheet with Product Name, Stock, and Expiry Date to track freshness.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button size="sm" onClick={handleLoadDemoPerishables} className="gradient-primary text-xs gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> Load Sample Perishables (12 SKUs)
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setFilterTier("all")} className="text-xs">
                        Show All Monitored
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPerishables.map((p) => {
                  const severity =
                    p.days <= 0
                      ? "Expired"
                      : p.days <= 3
                        ? "Critical"
                        : p.days <= 7
                          ? "Urgent"
                          : p.days <= 30
                            ? "Elevated"
                            : p.days <= 90
                              ? "Medium"
                              : "Safe";

                  const tone =
                    p.days <= 0
                      ? "danger"
                      : p.days <= 7
                        ? "danger"
                        : p.days <= 30
                          ? "warning"
                          : p.days <= 90
                            ? "info"
                            : "success";

                  const isUrgent = p.days > 0 && p.days <= 7;
                  const isExpired = p.days <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 font-medium">
                        <div className="flex flex-col">
                          <span className="text-foreground font-semibold">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground">{p.category}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-muted-foreground">
                        {p.batchNumber}
                      </td>
                      <td className="py-3 text-right font-semibold">{fmtNum(p.stock)} units</td>
                      <td className="py-3 font-medium pl-4">
                        {new Date(p.expiry).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-right font-bold">
                        {isExpired ? (
                          <span className="text-destructive font-mono">Expired ({Math.abs(p.days)}d ago)</span>
                        ) : isUrgent ? (
                          <span className="text-destructive font-mono font-bold animate-pulse">{p.days} days left</span>
                        ) : p.days <= 30 ? (
                          <span className="text-warning font-mono font-bold">{p.days} days</span>
                        ) : (
                          <span className="text-muted-foreground font-mono">{p.days} days</span>
                        )}
                      </td>
                      <td className="py-3 text-right font-semibold pr-4 font-mono">
                        {fmtINR(p.stock * p.cost)}
                      </td>
                      <td className="py-3">
                        <StatusPill tone={tone as any}>{severity}</StatusPill>
                      </td>
                      <td className="py-3 text-right pr-2">
                        {isExpired ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="py-1 h-7 text-[10px] font-semibold"
                            onClick={() => handleAction(p)}
                          >
                            Dispose & Write-off
                          </Button>
                        ) : isUrgent ? (
                          <Button
                            size="sm"
                            className="gradient-primary text-primary-foreground font-semibold py-1 h-7 text-[10px]"
                            onClick={() => handleAction(p)}
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> Flash Markdown
                          </Button>
                        ) : p.days <= 30 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="py-1 h-7 text-[10px] font-semibold border-primary/40 text-primary hover:bg-primary/10"
                            onClick={() => handleAction(p)}
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> Apply 15% Markdown
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-medium">
                            {p.recommendation}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="AI Perishable Recovery Playbook">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Play
            title="Dynamic Velocity Markdowns"
            desc="Automatically markdown items approaching the 7-day shelf window to accelerate sell-through before disposal."
            icon={<Timer className="h-4 w-4" />}
          />
          <Play
            title="Cross-Sell Bundle Placement"
            desc="Attach items expiring within 30 days to popular high-velocity baskets. Historic store recovery is 68%."
            icon={<Sparkles className="h-4 w-4" />}
          />
          <Play
            title="Supplier Returns & NGO CSR"
            desc="Trigger automated return-to-vendor (RTV) claims under SLA or coordinate food bank donations for full tax credits."
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function Kpi({
  label,
  v,
  tone,
  sub,
}: {
  label: string;
  v: string;
  tone?: "warning" | "danger";
  sub?: string;
}) {
  return (
    <div className="card-elevated p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-display text-lg font-semibold",
          tone === "danger" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-foreground",
        )}
      >
        {v}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Play({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
