import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useRouterState,
  redirect,
} from "@tanstack/react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Brain,
  LineChart,
  ShieldAlert,
  ShoppingCart,
  Receipt,
  Users,
  Package,
  Warehouse,
  Timer,
  Truck,
  Globe,
  ClipboardList,
  Wallet,
  Calculator,
  TrendingDown,
  Zap,
  FileBarChart,
  Building2,
  UserCog,
  CreditCard,
  FileText,
  Upload,
  Settings,
  Search,
  Bell,
  Sparkles,
  CalendarDays,
  ChevronsLeft,
  LogOut,
  ChevronRight,
  Circle,
  Menu,
  X,
  AlertTriangle,
  ShoppingBag as ShoppingBagIcon,
  RotateCcw,
  Loader2,
  ArrowLeft,
  Store,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { stopImpersonatingServer } from "@/lib/server-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MALL, ANOMALIES, LIVE_FEED } from "@/lib/mock-data";
import { toast } from "sonner";
import { useBusinessData } from "@/lib/business-context";
import {
  Product360Drawer,
  Customer360Drawer,
  Supplier360Drawer,
  RecommendationInvestigateDrawer,
} from "@/components/details-drawers";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }: { location: any }) => {
    const { getCurrentSessionServer } = await import("@/lib/server-auth");
    const res = await getCurrentSessionServer();
    if (!res.user) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AppShell,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
type NavSection = { section: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    section: "My Account",
    items: [
      { to: "/customer-portal", label: "Amazon Fresh Storefront", icon: Store },
      { to: "/transactions", label: "My Orders & Digital Receipts", icon: Receipt },
    ],
  },
  {
    section: "Shopping & Delivery",
    items: [
      { to: "/products", label: "Amazon Catalog & Inventory", icon: Package },
      { to: "/logistics", label: "Live 10-Min Delivery Tracking", icon: Truck },
    ],
  },
];

function AppShell() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s: any) => s.location.pathname });

  const {
    activeProductId,
    activeCustomerId,
    activeSupplierId,
    activeRecId,
    openProduct360,
    openCustomer360,
    openSupplier360,
    openRecommendation,
    products,
    customers,
    suppliers,
    activeDate,
    transactions,
    purchaseOrders,
    expenses,
    investments,
    logistics,
  } = useBusinessData();

  const isEndOfMonth = useMemo(() => {
    if (!activeDate) return false;
    const d = new Date(activeDate);
    const nextDay = new Date(d);
    nextDay.setDate(d.getDate() + 3);
    return nextDay.getMonth() !== d.getMonth();
  }, [activeDate]);

  const endOfMonthNotifId = `eom-bills-${activeDate?.slice(0, 7)}`;
  const hasEomNotif = isEndOfMonth && !readNotifs.has(endOfMonthNotifId);
  const totalUnreadNotifs =
    ANOMALIES.length + LIVE_FEED.length - readNotifs.size + (hasEomNotif ? 1 : 0);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [loading, user, navigate]);

  // Keyboard shortcut listener (Cmd/Ctrl + K to focus search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close notification dropdown
  useEffect(() => {
    if (!notifOpen) return;
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [notifOpen]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        products: [],
        customers: [],
        suppliers: [],
        transactions: [],
        purchaseOrders: [],
        expenses: [],
        investments: [],
        logistics: [],
      };
    }
    const q = searchQuery.toLowerCase();
    return {
      products: products
        .filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
        .slice(0, 3),
      customers: customers
        .filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
        .slice(0, 3),
      suppliers: suppliers
        .filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
        .slice(0, 3),
      transactions: transactions
        .filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            (t.customerName && t.customerName.toLowerCase().includes(q)) ||
            t.total.toString().includes(q),
        )
        .slice(0, 3),
      purchaseOrders: purchaseOrders
        .filter(
          (po) =>
            po.id.toLowerCase().includes(q) ||
            po.productName.toLowerCase().includes(q) ||
            po.supplierName.toLowerCase().includes(q),
        )
        .slice(0, 3),
      expenses: expenses
        .filter(
          (e) =>
            e.id.toLowerCase().includes(q) ||
            e.desc.toLowerCase().includes(q) ||
            e.vendor.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q),
        )
        .slice(0, 3),
      investments: investments
        .filter((i) => i.assetName.toLowerCase().includes(q) || i.symbol.toLowerCase().includes(q))
        .slice(0, 3),
      logistics: logistics
        .filter(
          (l) =>
            l.orderNumber.toLowerCase().includes(q) ||
            l.customerName.toLowerCase().includes(q) ||
            l.driverName.toLowerCase().includes(q) ||
            l.destination.toLowerCase().includes(q),
        )
        .slice(0, 3),
    };
  }, [
    searchQuery,
    products,
    customers,
    suppliers,
    transactions,
    purchaseOrders,
    expenses,
    investments,
    logistics,
  ]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
  }, [navigate, user, loading, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  let filteredNAV = NAV;

  const currentLabel =
    filteredNAV.flatMap((s) => s.items).find((i) => i.to === pathname)?.label ?? "Overview";

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="flex flex-1 min-h-0 bg-background text-foreground">
        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 z-50 flex h-screen shrink-0 flex-col bg-sidebar transition-all duration-300",
            "border-r-2 border-r-amber-500/30",
            "lg:sticky lg:translate-x-0",
            collapsed ? "lg:w-[68px]" : "lg:w-[260px]",
            mobileOpen
              ? "w-[280px] translate-x-0 shadow-2xl shadow-primary/10"
              : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div className="relative hairline-b flex items-center gap-3 px-4 py-5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-transparent overflow-hidden">
              <img src="/logo.png" className="h-full w-full object-contain" alt="OmniMind AI" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-base font-bold tracking-tight">Bizora Shopper</p>
                <p className="truncate text-[11px] text-muted-foreground">Amazon Fresh Hub</p>
              </div>
            )}
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={cn(
                "ml-auto rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hidden lg:block",
                collapsed && "mx-auto ml-0",
              )}
              aria-label="Toggle sidebar"
            >
              <ChevronsLeft
                className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
              />
            </button>
          </div>

          <nav className="relative flex-1 overflow-y-auto px-2 py-4">
            {filteredNAV.map((section) => (
              <div key={section.section} className="mb-4">
                {!collapsed && (
                  <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-500">
                    {section.section}
                  </p>
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = pathname === item.to;
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to as never}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                            active
                              ? "bg-amber-500/15 text-foreground shadow-sm font-bold"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-foreground",
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-amber-500" />
                          )}
                          <item.icon
                            className={cn(
                              "h-[18px] w-[18px] shrink-0",
                              active
                                ? "text-amber-500"
                                : "text-muted-foreground group-hover:text-foreground",
                            )}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="relative hairline-t p-4">
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-500 text-slate-950 text-sm font-bold shadow-md">
                {user?.name
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join("") ?? "U"}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{user?.name}</p>
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                    VIP Shopper
                  </p>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={async () => {
                    await logout();
                    navigate({ to: "/login" });
                  }}
                  className="rounded-md p-2 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Workspace View */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </div>
      </div>

      {/* Detail Drawers */}
      <Product360Drawer productId={activeProductId} onClose={() => openProduct360(null)} />
      <Customer360Drawer customerId={activeCustomerId} onClose={() => openCustomer360(null)} />
      <Supplier360Drawer supplierId={activeSupplierId} onClose={() => openSupplier360(null)} />
      <RecommendationInvestigateDrawer recId={activeRecId} onClose={() => openRecommendation(null)} />
    </div>
  );
}
