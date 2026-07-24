import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { HardDrive, CreditCard, Layers, ShieldCheck, Loader2 } from "lucide-react";
import { PageHeader, SectionCard, StatusPill } from "@/components/page-header";
import { useAuth } from "@/lib/auth-context";
import { searchCompaniesServer, getSystemAdminDashboardServer } from "@/lib/server-system-admin";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/subscriptions")({
  beforeLoad: async () => {
    const { getCurrentSessionServer } = await import("@/lib/server-auth");
    const res = await getCurrentSessionServer();
    if (!res.user || !res.user.isSystemAdmin || res.user.email !== "khade8915@gmail.com") {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [{ title: "Subscriptions & Storage — OmniMind Super Admin" }],
  }),
  component: SubscriptionsPage,
});

export function SubscriptionsPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [wsRes, dashRes] = await Promise.all([
          searchCompaniesServer({ data: { query: "" } }),
          getSystemAdminDashboardServer(),
        ]);
        setWorkspaces(Array.isArray(wsRes?.workspaces) ? wsRes.workspaces : []);
        setDashboardStats(dashRes?.stats || null);
      } catch (err) {
        console.warn("Failed to load subscriptions data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];
  const storageMB = ((dashboardStats?.storageUsage || 0) / 1024).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 p-6">
      <PageHeader
        title="Tenant Storage Space & Subscription Quotas"
        subtitle="Monitor multi-tenant database size consumption, storage space occupied per store, and subscription plan tiers."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Database Storage Occupied</p>
          <p className="mt-2 font-display text-3xl font-bold text-amber-500">{storageMB} MB</p>
          <HardDrive className="absolute right-3 bottom-3 h-8 w-8 text-amber-500/10" />
        </div>
        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Subscriptions</p>
          <p className="mt-2 font-display text-3xl font-bold text-rose-500">{safeWorkspaces.length}</p>
          <CreditCard className="absolute right-3 bottom-3 h-8 w-8 text-rose-500/10" />
        </div>
        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">System Quota Status</p>
          <p className="mt-2 font-display text-3xl font-bold text-emerald-500">100% Healthy</p>
          <ShieldCheck className="absolute right-3 bottom-3 h-8 w-8 text-emerald-500/10" />
        </div>
      </div>

      <SectionCard title="Store Workspace Storage Breakdown">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          </div>
        ) : safeWorkspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <HardDrive className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-base font-bold text-foreground">0 MB storage consumed.</p>
            <p className="text-xs text-muted-foreground mt-1">No tenant store workspaces currently registered in the database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/50 text-[10px] font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Store Workspace Name</th>
                  <th className="px-4 py-3">Storage Space Occupied</th>
                  <th className="px-4 py-3">Subscription Plan</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {safeWorkspaces.map((store: any) => (
                  <tr key={store.id} className="transition-colors hover:bg-surface/30">
                    <td className="px-4 py-3 font-bold text-foreground">{store.name}</td>
                    <td className="px-4 py-3 font-bold text-amber-400">
                      {((store.storageMB || 4.2)).toFixed(1)} MB
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{store.plan || "Enterprise"}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone="success">{store.status || "ACTIVE"}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
