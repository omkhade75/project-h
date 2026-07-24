import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MapPin, Globe, Loader2, Building } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/page-header";
import { useAuth } from "@/lib/auth-context";
import { searchCompaniesServer } from "@/lib/server-system-admin";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/locations")({
  beforeLoad: async () => {
    const { getCurrentSessionServer } = await import("@/lib/server-auth");
    const res = await getCurrentSessionServer();
    if (!res.user || !res.user.isSystemAdmin || res.user.email !== "khade8915@gmail.com") {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [{ title: "Store Locations — OmniMind Super Admin" }],
  }),
  component: LocationsPage,
});

export function LocationsPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await searchCompaniesServer({ data: { query: "" } });
        setWorkspaces(Array.isArray(res?.workspaces) ? res.workspaces : []);
      } catch (err) {
        console.warn("Failed to load store locations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 p-6">
      <PageHeader
        title="Registered Store Locations & Map Directory"
        subtitle="View physical GPS addresses and locations of all onboarded SaaS storekeepers across cities."
      />

      <SectionCard title="Store Geocoded Directory">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          </div>
        ) : safeWorkspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-base font-bold text-foreground">No store locations registered in database.</p>
            <p className="text-xs text-muted-foreground mt-1">Store locations registered during shopkeeper onboarding will be listed here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              {safeWorkspaces.map((store: any) => (
                <div key={store.id} className="card-elevated p-4 flex items-start gap-3 border-l-4 border-l-rose-500">
                  <MapPin className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-foreground">{store.name}</p>
                    <p className="text-xs text-muted-foreground">{store.address || "Registered Store Location"}</p>
                    <p className="text-[11px] text-rose-400 font-mono mt-1">Tenant ID: {store.id}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-elevated p-6 flex flex-col items-center justify-center text-center bg-surface/40 min-h-[250px]">
              <Globe className="h-10 w-10 text-rose-500/50 mb-2" />
              <h4 className="font-bold text-sm text-foreground">Multi-Tenant Store Map</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Displaying location pins for {safeWorkspaces.length} active registered store workspace(s).
              </p>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
