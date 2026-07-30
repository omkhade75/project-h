import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useRouterState,
  redirect,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Building,
  HardDrive,
  MapPin,
  Database,
  LogOut,
  ChevronsLeft,
  X,
  AlertTriangle,
  Sun,
  Moon,
  Activity,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { stopImpersonatingServer } from "@/lib/server-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

type NavItem = { to: string; label: string; icon: typeof ShieldAlert };
type NavSection = { section: string; items: NavItem[] };

const NAV: NavSection[] = [
  {
    section: "Super Admin Platform Control",
    items: [
      { to: "/system-admin", label: "Shopkeeper Approvals & Queue", icon: ShieldAlert },
      { to: "/health-monitor", label: "Health Monitor & Alerts", icon: Activity },
      { to: "/workspaces", label: "Store Workspaces & Users", icon: Building },
      { to: "/subscriptions", label: "Storage Space & Subscriptions", icon: HardDrive },
      { to: "/locations", label: "Store Locations & Map Directory", icon: MapPin },
      { to: "/audits", label: "System Audit Logs & Security", icon: Database },
    ],
  },
];

function AppShell() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s: any) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
    }
  }, [navigate, user, loading, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {user?.isImpersonating && (
        <div className="flex items-center justify-between bg-amber-500 text-slate-950 px-4 py-2 text-sm font-bold select-none z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-slate-950 animate-pulse" />
            <span>Impersonation Active: Viewing store workspace as Owner ({user.name} - {user.email})</span>
          </div>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={async () => {
              await stopImpersonatingServer();
              toast.success("Returned to Super Admin session.");
              window.location.reload();
            }}
          >
            Stop Impersonation
          </Button>
        </div>
      )}

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
            "border-r-2 border-r-rose-500/30",
            "lg:sticky lg:translate-x-0",
            collapsed ? "lg:w-[68px]" : "lg:w-[280px]",
            mobileOpen
              ? "w-[280px] translate-x-0 shadow-2xl shadow-primary/10"
              : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div className="relative hairline-b flex items-center gap-3 px-4 py-5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-600/20 text-rose-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-base font-bold tracking-tight">Bizora Admin</p>
                <p className="truncate text-[11px] text-rose-400 font-bold uppercase">Super Admin Portal</p>
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
            {NAV.map((section) => (
              <div key={section.section} className="mb-4">
                {!collapsed && (
                  <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-400">
                    {section.section}
                  </p>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const active = pathname === item.to;
                    return (
                      <li key={item.label}>
                        <Link
                          to={item.to as never}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all",
                            active
                              ? "bg-rose-600/20 text-rose-400 font-bold shadow-sm"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-foreground",
                          )}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-rose-500" />
                          )}
                          <item.icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              active
                                ? "text-rose-500"
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
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rose-600 text-white text-sm font-bold shadow-md">
                SA
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">System Super Admin</p>
                  <p className="truncate text-[10px] font-bold uppercase tracking-wider text-rose-400">
                    Super Admin
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
    </div>
  );
}
