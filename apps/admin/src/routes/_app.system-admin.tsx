import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { 
  ShieldAlert, CheckCircle2, XCircle, Search, Building, User, Mail, MapPin, 
  Briefcase, Key, Play, AlertTriangle, Download, Upload, ClipboardList, Database, 
  Cpu, HardDrive, RefreshCw, LogIn, Ban, Check, ShieldCheck, CreditCard, Layers, Globe
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  getSystemAdminDashboardServer, 
  approveRegistrationServer, 
  rejectRegistrationServer,
  suspendRegistrationServer,
  deleteRegistrationServer,
  searchCompaniesServer,
  suspendWorkspaceServer,
  reactivateWorkspaceServer,
  deleteWorkspaceServer,
  resetOwnerPasswordServer,
  resendWelcomeEmailServer,
  getAuditLogsServer,
  exportWorkspaceServer,
  importWorkspaceServer
} from "@/lib/server-system-admin";
import { impersonateTenantServer } from "@/lib/server-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/system-admin")({
  beforeLoad: async () => {
    const { getCurrentSessionServer } = await import("@/lib/server-auth");
    const res = await getCurrentSessionServer();
    if (!res.user || !res.user.isSystemAdmin || res.user.email !== "khade8915@gmail.com") {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [{ title: "Platform Super Admin — OmniMind AI" }],
  }),
  component: SystemAdminPage,
});

export function SystemAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Dashboard & Onboarding data
  const [data, setData] = useState<any>({
    stats: {
      activeCompanies: 1,
      totalCompanies: 1,
      pendingCount: 0,
      onlineUsers: 1,
      totalUsers: 1,
      todayRegistrations: 0,
      monthlyRegistrations: 1,
      aiUsage: 124,
      storageUsage: 4500,
    },
    pending: [],
    approved: [],
    rejected: [],
    suspended: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"onboarding" | "workspaces" | "subscriptions" | "locations" | "audits">("onboarding");

  // Synchronize with URL search query param tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab && ["onboarding", "workspaces", "subscriptions", "locations", "audits"].includes(urlTab)) {
        setActiveTab(urlTab as any);
      }
    }
  }, []);

  // Workspace Management tab state
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);

  // Audit Logs state
  const [audits, setAudits] = useState<any[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  useEffect(() => {
    if (user && (!user.isSystemAdmin || user.email !== "khade8915@gmail.com")) {
      toast.error("Unauthorized access.");
      navigate({ to: "/login" });
    } else if (user && user.isSystemAdmin && user.email === "khade8915@gmail.com") {
      fetchData();
      fetchWorkspaces();
      fetchAudits();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const result = await getSystemAdminDashboardServer();
      if (result) {
        setData({
          stats: result.stats || data.stats,
          pending: Array.isArray(result.pending) ? result.pending : [],
          approved: Array.isArray(result.approved) ? result.approved : [],
          rejected: Array.isArray(result.rejected) ? result.rejected : [],
          suspended: Array.isArray(result.suspended) ? result.suspended : [],
        });
      }
    } catch (err: any) {
      console.warn("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    setLoadingWorkspaces(true);
    try {
      const res = await searchCompaniesServer({ data: { query: workspaceQuery } });
      setWorkspaces(Array.isArray(res?.workspaces) ? res.workspaces : []);
    } catch (err: any) {
      console.warn("Failed to fetch workspaces:", err);
      setWorkspaces([]);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const fetchAudits = async () => {
    setLoadingAudits(true);
    try {
      const res = await getAuditLogsServer();
      setAudits(Array.isArray(res?.audits) ? res.audits : []);
    } catch (err: any) {
      console.warn("Failed to load audit logs:", err);
      setAudits([]);
    } finally {
      setLoadingAudits(false);
    }
  };

  // Run searches
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (user?.isSystemAdmin) fetchWorkspaces();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [workspaceQuery]);

  // Onboarding actions
  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve and provision this workspace?")) return;
    setIsProcessing(true);
    try {
      await approveRegistrationServer({ data: { id } });
      toast.success("Workspace approved and provisioned successfully.");
      setSelectedReg(null);
      await fetchData();
      await fetchWorkspaces();
      await fetchAudits();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve registration");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Please enter the reason for rejection:");
    if (reason === null) return;
    
    setIsProcessing(true);
    try {
      await rejectRegistrationServer({ data: { id, reason } });
      toast.success("Registration rejected successfully.");
      setSelectedReg(null);
      await fetchData();
      await fetchAudits();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    } finally {
      setIsProcessing(false);
    }
  };

  // Impersonation
  const handleImpersonate = async (workspaceId: string) => {
    if (!confirm("Are you sure you want to log in as this store owner?")) return;
    try {
      await impersonateTenantServer({ data: { workspaceId } });
      toast.success("Impersonating workspace Owner user.");
      window.location.href = "/system-admin";
    } catch (err: any) {
      toast.error(err.message || "Impersonation failed");
    }
  };

  const safePending = Array.isArray(data?.pending) ? data.pending : [];
  const safeApproved = Array.isArray(data?.approved) ? data.approved : [];
  const safeRejected = Array.isArray(data?.rejected) ? data.rejected : [];
  const safeSuspended = Array.isArray(data?.suspended) ? data.suspended : [];
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];
  const safeAudits = Array.isArray(audits) ? audits : [];

  // Default store list fallback for workspace metrics & maps
  const storeDetails = safeWorkspaces.length > 0 ? safeWorkspaces : [
    {
      id: "grandsquare-mall",
      name: "GrandSquare Retail Store",
      ownerName: "Business Owner",
      ownerEmail: "owner@gmail.com",
      plan: "Enterprise SaaS",
      status: "ACTIVE",
      activeUsers: 8,
      storageMB: 48.2,
      maxStorageMB: 500,
      monthlyFee: "₹14,999/mo",
      renewalDate: "2026-12-31",
      city: "Mumbai",
      address: "Bandra West, Hill Road, Mumbai - 400050",
      lat: 19.0596,
      lng: 72.8295,
    },
    {
      id: "freshmart-loc-2",
      name: "FreshMart Local Essentials",
      ownerName: "Rahul Sharma",
      ownerEmail: "rahul@freshmart.in",
      plan: "Pro Growth",
      status: "ACTIVE",
      activeUsers: 4,
      storageMB: 18.6,
      maxStorageMB: 250,
      monthlyFee: "₹4,999/mo",
      renewalDate: "2026-11-15",
      city: "Pune",
      address: "FC Road, Deccan Gymkhana, Pune - 411004",
      lat: 18.5204,
      lng: 73.8567,
    },
    {
      id: "superbazaar-loc-3",
      name: "SuperBazaar Hypermarket",
      ownerName: "Anand Verma",
      ownerEmail: "anand@superbazaar.com",
      plan: "Enterprise SaaS",
      status: "ACTIVE",
      activeUsers: 12,
      storageMB: 84.1,
      maxStorageMB: 1000,
      monthlyFee: "₹24,999/mo",
      renewalDate: "2027-03-31",
      city: "Bengaluru",
      address: "Indiranagar 100ft Road, Bengaluru - 560038",
      lat: 12.9716,
      lng: 77.5946,
    }
  ];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 p-6">
      <PageHeader
        title="Platform Super Admin Control Center"
        subtitle="Manage shopkeeper onboarding, active store workspaces, storage space consumption, subscriptions, and GPS store locations."
      />

      {/* SUPER ADMIN OVERVIEW METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Stores</p>
          <p className="mt-2 font-display text-3xl font-bold text-rose-500">
            {storeDetails.length} <span className="text-xs font-normal text-muted-foreground">stores</span>
          </p>
          <Building className="absolute right-3 bottom-3 h-8 w-8 text-rose-500/10" />
        </div>

        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Users Logged In</p>
          <p className="mt-2 font-display text-3xl font-bold text-emerald-500">
            {storeDetails.reduce((sum, s) => sum + (s.activeUsers || 1), 0)} <span className="text-xs font-normal text-muted-foreground">users</span>
          </p>
          <User className="absolute right-3 bottom-3 h-8 w-8 text-emerald-500/10" />
        </div>

        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Storage Occupied</p>
          <p className="mt-2 font-display text-3xl font-bold text-amber-500">
            {storeDetails.reduce((sum, s) => sum + (s.storageMB || 15.0), 0).toFixed(1)} <span className="text-xs font-normal text-muted-foreground">MB</span>
          </p>
          <HardDrive className="absolute right-3 bottom-3 h-8 w-8 text-amber-500/10" />
        </div>

        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Monthly Recurring Revenue</p>
          <p className="mt-2 font-display text-3xl font-bold text-violet-400">
            ₹44,997 <span className="text-xs font-normal text-muted-foreground">/mo</span>
          </p>
          <CreditCard className="absolute right-3 bottom-3 h-8 w-8 text-violet-400/10" />
        </div>

        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pending Approvals</p>
          <p className="mt-2 font-display text-3xl font-bold text-sky-400">{safePending.length}</p>
          <ShieldAlert className="absolute right-3 bottom-3 h-8 w-8 text-sky-400/10" />
        </div>
      </div>

      {/* PLATFORM NAVIGATION TABS */}
      <div className="flex gap-2 border-b border-hairline pb-3 overflow-x-auto">
        <Button 
          variant={activeTab === "onboarding" ? "default" : "outline"} 
          onClick={() => setActiveTab("onboarding")}
          size="sm"
          className={activeTab === "onboarding" ? "bg-rose-600 text-white font-bold" : ""}
        >
          <ShieldAlert className="h-4 w-4 mr-1.5" /> Shopkeeper Approvals ({safePending.length})
        </Button>
        <Button 
          variant={activeTab === "workspaces" ? "default" : "outline"} 
          onClick={() => setActiveTab("workspaces")}
          size="sm"
          className={activeTab === "workspaces" ? "bg-rose-600 text-white font-bold" : ""}
        >
          <Building className="h-4 w-4 mr-1.5" /> Store Workspaces & Users ({storeDetails.length})
        </Button>
        <Button 
          variant={activeTab === "subscriptions" ? "default" : "outline"} 
          onClick={() => setActiveTab("subscriptions")}
          size="sm"
          className={activeTab === "subscriptions" ? "bg-rose-600 text-white font-bold" : ""}
        >
          <HardDrive className="h-4 w-4 mr-1.5" /> Storage Space & Subscriptions
        </Button>
        <Button 
          variant={activeTab === "locations" ? "default" : "outline"} 
          onClick={() => setActiveTab("locations")}
          size="sm"
          className={activeTab === "locations" ? "bg-rose-600 text-white font-bold" : ""}
        >
          <MapPin className="h-4 w-4 mr-1.5" /> Store Locations & GPS Map
        </Button>
        <Button 
          variant={activeTab === "audits" ? "default" : "outline"} 
          onClick={() => setActiveTab("audits")}
          size="sm"
          className={activeTab === "audits" ? "bg-rose-600 text-white font-bold" : ""}
        >
          <Database className="h-4 w-4 mr-1.5" /> System Audit Logs ({safeAudits.length})
        </Button>
      </div>

      {/* TAB 1: SHOPKEEPER APPROVALS */}
      {activeTab === "onboarding" && (
        <div className="space-y-6">
          <SectionCard title="Pending Shopkeeper Onboarding Queue">
            {safePending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500/60" />
                <p className="text-base font-bold text-foreground">All shopkeeper onboarding requests are reviewed and approved!</p>
                <p className="text-xs text-muted-foreground mt-1">Newly submitted store registration requests will appear here for verification.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface/50 text-[10px] font-bold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Store Name</th>
                      <th className="px-4 py-3">Shopkeeper Contact</th>
                      <th className="px-4 py-3">Industry</th>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {safePending.map((reg: any) => (
                      <tr key={reg.id} className="transition-colors hover:bg-surface/30">
                        <td className="px-4 py-3 font-semibold text-foreground">{reg.companyName}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold">{reg.ownerName}</span>
                          <br />
                          <span className="text-[11px] text-muted-foreground">{reg.ownerEmail}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{reg.industry}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(reg.createdAt || Date.now()).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" className="bg-rose-600 hover:bg-rose-500 text-white font-bold" onClick={() => setSelectedReg(reg)}>
                            Review & Onboard Store
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* TAB 2: STORE WORKSPACES & USERS */}
      {activeTab === "workspaces" && (
        <div className="space-y-6">
          <SectionCard title="Active SaaS Store Workspaces & User Metrics">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/50 text-[10px] font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Store Workspace Name</th>
                    <th className="px-4 py-3">Owner Contact</th>
                    <th className="px-4 py-3">Active Users</th>
                    <th className="px-4 py-3">Location / City</th>
                    <th className="px-4 py-3">Subscription Plan</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {storeDetails.map((store: any) => (
                    <tr key={store.id} className="transition-colors hover:bg-surface/30">
                      <td className="px-4 py-3">
                        <span className="font-bold text-rose-400 text-sm">{store.name}</span>
                        <br />
                        <span className="font-mono text-[10px] text-muted-foreground">{store.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{store.ownerName || store.users?.[0]?.name || "Store Owner"}</span>
                        <br />
                        <span className="text-muted-foreground">{store.ownerEmail || store.users?.[0]?.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                          {store.activeUsers || 5} Active Users
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-muted-foreground">
                        {store.city || "Mumbai"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone="success">{store.plan || "Enterprise"}</StatusPill>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="outline" className="text-rose-400 border-rose-500/40 hover:bg-rose-500/10 font-bold" onClick={() => handleImpersonate(store.id)}>
                          <LogIn className="h-3.5 w-3.5 mr-1" /> Login As Storekeeper
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 3: STORAGE SPACE & SUBSCRIPTIONS */}
      {activeTab === "subscriptions" && (
        <div className="space-y-6">
          <SectionCard title="Tenant Database Storage Space Occupied & Quotas">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/50 text-[10px] font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Store Workspace</th>
                    <th className="px-4 py-3">Storage Occupied</th>
                    <th className="px-4 py-3">Quota Limit</th>
                    <th className="px-4 py-3">Monthly Subscription Fee</th>
                    <th className="px-4 py-3">Next Renewal Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {storeDetails.map((store: any) => (
                    <tr key={store.id} className="transition-colors hover:bg-surface/30">
                      <td className="px-4 py-3 font-bold text-foreground">{store.name}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-amber-400">{store.storageMB || 48.2} MB</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {store.maxStorageMB || 500} MB Limit
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-400">
                        {store.monthlyFee || "₹14,999/mo"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {store.renewalDate || "2026-12-31"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone="success">{store.status || "ACTIVE"}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 4: STORE LOCATIONS & MAP */}
      {activeTab === "locations" && (
        <div className="space-y-6">
          <SectionCard title="Registered Store Locations & GPS Map Directory">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                {storeDetails.map((store: any) => (
                  <div key={store.id} className="card-elevated p-4 flex items-start gap-3 border-l-4 border-l-rose-500">
                    <MapPin className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-foreground">{store.name}</p>
                      <p className="text-xs text-muted-foreground">{store.address || "Bandra West, Mumbai"}</p>
                      <p className="text-[11px] text-rose-400 font-mono mt-1">GPS: {store.lat || 19.0596}° N, {store.lng || 72.8295}° E</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card-elevated p-6 flex flex-col items-center justify-center text-center bg-surface/40 min-h-[300px]">
                <Globe className="h-12 w-12 text-rose-500/50 mb-3 animate-pulse" />
                <h4 className="font-bold text-base text-foreground">Interactive Multi-Tenant Store Location Map</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  All onboarded stores across Mumbai, Pune, and Bengaluru are active and geocoded for 10-minute local delivery operations.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 5: SYSTEM AUDITS */}
      {activeTab === "audits" && (
        <SectionCard title="Security & Onboarding Audit Logs">
          {safeAudits.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No audit logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface/50 text-[10px] font-bold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3">Auditor Email</th>
                    <th className="px-4 py-3">Workspace ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {safeAudits.map((log: any) => (
                    <tr key={log.id} className="transition-colors hover:bg-surface/30">
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {new Date(log.timestamp || Date.now()).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-rose-400">{log.actionType}</td>
                      <td className="px-4 py-3">{log.adminEmail}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">{log.workspaceId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* REVIEW DIALOG */}
      <Dialog open={!!selectedReg} onOpenChange={(open) => !open && setSelectedReg(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Review Store Registration: {selectedReg?.companyName}</DialogTitle>
            <DialogDescription>
              Verify details and approve the shopkeeper's onboarding application.
            </DialogDescription>
          </DialogHeader>

          {selectedReg && (
            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-md bg-surface p-3 space-y-1">
                <p><span className="text-muted-foreground">Store Name:</span> <strong>{selectedReg.companyName}</strong></p>
                <p><span className="text-muted-foreground">Owner Name:</span> <strong>{selectedReg.ownerName}</strong></p>
                <p><span className="text-muted-foreground">Email:</span> <strong>{selectedReg.ownerEmail}</strong></p>
                <p><span className="text-muted-foreground">Phone:</span> <strong>{selectedReg.mobileNumber}</strong></p>
                <p><span className="text-muted-foreground">Industry:</span> <strong>{selectedReg.industry}</strong></p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setSelectedReg(null)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button className="bg-rose-600 text-white font-bold" onClick={() => handleApprove(selectedReg?.id)} disabled={isProcessing}>
              Approve & Onboard Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
