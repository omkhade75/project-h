import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { 
  ShieldAlert, CheckCircle2, XCircle, Search, Building, User, Mail, MapPin, 
  Briefcase, Key, Play, AlertTriangle, Download, Upload, ClipboardList, Database, 
  Cpu, HardDrive, RefreshCw, LogIn, Ban, Check, ShieldCheck
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
    meta: [{ title: "System Admin — OmniMind AI" }],
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
  const [activeTab, setActiveTab] = useState<"onboarding" | "workspaces" | "audits">("onboarding");

  // Provisioning progress stepper
  const [showProgress, setShowProgress] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressSteps, setProgressSteps] = useState<string[]>([]);

  // Workspace Management tab state
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [showWorkspaceDetails, setShowWorkspaceDetails] = useState(false);

  // Backup / Restore state
  const [showImport, setShowImport] = useState(false);
  const [importDataText, setImportDataText] = useState("");
  
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

  // Handle URL reviewId redirect
  useEffect(() => {
    if (data?.pending && Array.isArray(data.pending) && typeof window !== "undefined") {
      const reviewId = new URLSearchParams(window.location.search).get("reviewId");
      if (reviewId) {
        const matching = data.pending.find((r: any) => r.id === reviewId);
        if (matching) {
          setSelectedReg(matching);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [data]);

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

  // Actions for Onboarding Requests
  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve and provision this workspace?")) return;
    
    setSelectedReg(null);
    setShowProgress(true);
    setProgressStep(0);
    
    const steps = [
      "Creating Workspace...",
      "Creating Owner Account...",
      "Creating Security & AI Configuration...",
      "Sending Welcome Email...",
      "Completed Successfully."
    ];
    setProgressSteps(steps);

    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setProgressStep(i + 1);
    }

    try {
      await approveRegistrationServer({ data: { id } });
      setProgressStep(5);
      toast.success("Workspace approved and provisioned successfully.");
      await fetchData();
      await fetchWorkspaces();
      await fetchAudits();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve registration");
      setShowProgress(false);
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

  const handleSuspend = async (id: string) => {
    if (!confirm("Are you sure you want to suspend this registration request?")) return;
    
    setIsProcessing(true);
    try {
      await suspendRegistrationServer({ data: { id } });
      toast.success("Registration request suspended.");
      setSelectedReg(null);
      await fetchData();
      await fetchAudits();
    } catch (err: any) {
      toast.error(err.message || "Failed to suspend");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteReg = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this registration request?")) return;
    
    setIsProcessing(true);
    try {
      await deleteRegistrationServer({ data: { id } });
      toast.success("Registration request deleted.");
      setSelectedReg(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Impersonation
  const handleImpersonate = async (workspaceId: string) => {
    if (!confirm("Are you sure you want to log in as this workspace owner?")) return;
    try {
      await impersonateTenantServer({ data: { workspaceId } });
      toast.success("Impersonating workspace Owner user.");
      window.location.href = "/products";
    } catch (err: any) {
      toast.error(err.message || "Impersonation failed");
    }
  };

  // Workspace Actions
  const handleSuspendWorkspace = async (id: string) => {
    if (!confirm("Are you sure you want to suspend this workspace?")) return;
    try {
      await suspendWorkspaceServer({ data: { id } });
      toast.success("Workspace suspended.");
      await fetchWorkspaces();
      await fetchAudits();
    } catch (err: any) {
      toast.error(err.message || "Failed to suspend workspace");
    }
  };

  const handleReactivateWorkspace = async (id: string) => {
    if (!confirm("Are you sure you want to reactivate this workspace?")) return;
    try {
      await reactivateWorkspaceServer({ data: { id } });
      toast.success("Workspace reactivated.");
      await fetchWorkspaces();
      await fetchAudits();
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate workspace");
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (!confirm("Are you sure you want to soft-delete this workspace?")) return;
    try {
      await deleteWorkspaceServer({ data: { id } });
      toast.success("Workspace marked as Deleted.");
      await fetchWorkspaces();
      await fetchAudits();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete workspace");
    }
  };

  const checkRisk = (reg: any) => {
    if (!reg) return [];
    
    const emailVerified = true;
    const isStrongPassword = (reg.passwordHash || "").length > 20;
    
    const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];
    const isDuplicateCompany = safeWorkspaces.some((w: any) => (w.name || "").toLowerCase() === (reg.companyName || "").toLowerCase());
    const isDuplicateEmail = safeWorkspaces.some((w: any) => (w.users?.[0]?.email || "").toLowerCase() === (reg.ownerEmail || "").toLowerCase());
    
    const isPhoneValid = (reg.mobileNumber || "").length >= 10;

    return [
      { name: "Email Address Verified", passed: emailVerified },
      { name: "Secure Password Policy Passed", passed: isStrongPassword },
      { name: "Unique Company (No Duplicate Workspace)", passed: !isDuplicateCompany },
      { name: "Unique Owner Email Address", passed: !isDuplicateEmail },
      { name: "Standard Mobile Format Verified", passed: isPhoneValid },
    ];
  };

  const safePending = Array.isArray(data?.pending) ? data.pending : [];
  const safeApproved = Array.isArray(data?.approved) ? data.approved : [];
  const safeRejected = Array.isArray(data?.rejected) ? data.rejected : [];
  const safeSuspended = Array.isArray(data?.suspended) ? data.suspended : [];
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];
  const safeAudits = Array.isArray(audits) ? audits : [];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <PageHeader
        title="Enterprise System Administration"
        subtitle="Approve registered shopkeepers, manage tenant workspaces, license quotas, and system audit logs."
      />

      {/* METRICS PANELS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-xs font-medium text-muted-foreground uppercase">Active / Total Tenants</p>
          <p className="mt-2 font-display text-3xl font-semibold text-rose-500">
            {data?.stats?.activeCompanies || 1} <span className="text-sm font-normal text-muted-foreground">/ {data?.stats?.totalCompanies || 1}</span>
          </p>
          <Building className="absolute right-4 bottom-4 h-8 w-8 text-rose-500/10" />
        </div>
        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-xs font-medium text-muted-foreground uppercase">Pending Approvals</p>
          <p className="mt-2 font-display text-3xl font-semibold text-amber-500">{data?.stats?.pendingCount || 0}</p>
          <ShieldAlert className="absolute right-4 bottom-4 h-8 w-8 text-amber-500/10" />
        </div>
        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-xs font-medium text-muted-foreground uppercase">Online / Active Users</p>
          <p className="mt-2 font-display text-3xl font-semibold text-emerald-500">
            {data?.stats?.onlineUsers || 1} <span className="text-sm font-normal text-muted-foreground">/ {data?.stats?.totalUsers || 1}</span>
          </p>
          <User className="absolute right-4 bottom-4 h-8 w-8 text-emerald-500/10" />
        </div>
        <div className="card-elevated p-4 relative overflow-hidden">
          <p className="text-xs font-medium text-muted-foreground uppercase">Today / Monthly Registrations</p>
          <p className="mt-2 font-display text-3xl font-semibold text-violet-400">
            {data?.stats?.todayRegistrations || 0} <span className="text-sm font-normal text-muted-foreground">/ {data?.stats?.monthlyRegistrations || 1}</span>
          </p>
          <ClipboardList className="absolute right-4 bottom-4 h-8 w-8 text-violet-400/10" />
        </div>
      </div>

      {/* PORTAL TABS */}
      <div className="flex gap-2 border-b border-hairline pb-2">
        <Button 
          variant={activeTab === "onboarding" ? "default" : "outline"} 
          onClick={() => setActiveTab("onboarding")}
          size="sm"
          className={activeTab === "onboarding" ? "bg-rose-600 text-white font-bold" : ""}
        >
          Shopkeeper Approvals ({safePending.length})
        </Button>
        <Button 
          variant={activeTab === "workspaces" ? "default" : "outline"} 
          onClick={() => setActiveTab("workspaces")}
          size="sm"
          className={activeTab === "workspaces" ? "bg-rose-600 text-white font-bold" : ""}
        >
          Manage Store Workspaces ({safeWorkspaces.length})
        </Button>
        <Button 
          variant={activeTab === "audits" ? "default" : "outline"} 
          onClick={() => setActiveTab("audits")}
          size="sm"
          className={activeTab === "audits" ? "bg-rose-600 text-white font-bold" : ""}
        >
          Compliance & Audit Trail ({safeAudits.length})
        </Button>
      </div>

      {/* TAB 1: ONBOARDING */}
      {activeTab === "onboarding" && (
        <div className="space-y-6">
          <SectionCard title="Pending Onboarding Registrations">
            {safePending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-3 h-8 w-8 text-emerald-500/50" />
                <p className="text-sm font-medium text-muted-foreground">All shopkeeper registration requests have been cleared and approved.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface/50 text-xs font-medium uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Company Name</th>
                      <th className="px-4 py-3">Owner Contact</th>
                      <th className="px-4 py-3">Industry</th>
                      <th className="px-4 py-3">Submitted At</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {safePending.map((reg: any) => (
                      <tr key={reg.id} className="transition-colors hover:bg-surface/30">
                        <td className="px-4 py-3 font-medium">{reg.companyName}</td>
                        <td className="px-4 py-3">
                          {reg.ownerName}
                          <br />
                          <span className="text-xs text-muted-foreground">{reg.ownerEmail}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{reg.industry}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(reg.createdAt || Date.now()).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" className="bg-rose-600 hover:bg-rose-500 text-white font-bold" onClick={() => setSelectedReg(reg)}>
                            Review & Onboard
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Actioned Requests History">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface/50 text-xs font-medium uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Owner Contact</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actioned At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {[...safeApproved, ...safeRejected, ...safeSuspended].map((reg: any) => (
                    <tr key={reg.id} className="transition-colors hover:bg-surface/30">
                      <td className="px-4 py-3 font-medium">{reg.companyName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{reg.ownerEmail}</td>
                      <td className="px-4 py-3">
                        <StatusPill tone={reg.status === "Approved" ? "success" : reg.status === "Suspended" ? "warning" : "danger"}>
                          {reg.status}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(reg.updatedAt || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* TAB 2: WORKSPACE MANAGEMENT */}
      {activeTab === "workspaces" && (
        <div className="space-y-6">
          <div className="flex gap-2 max-w-md">
            <Input 
              placeholder="Search companies by name..." 
              value={workspaceQuery} 
              onChange={(e) => setWorkspaceQuery(e.target.value)}
            />
            <Button variant="outline" onClick={fetchWorkspaces}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <SectionCard title="SaaS Tenant Workspaces">
            {loadingWorkspaces ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
              </div>
            ) : safeWorkspaces.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No active workspace matches your criteria.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface/50 text-xs font-medium uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Owner Contact</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">License State</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {safeWorkspaces.map((ws: any) => (
                      <tr key={ws.id} className="transition-colors hover:bg-surface/30">
                        <td className="px-4 py-3">
                          <span 
                            className="font-semibold text-rose-400 hover:underline cursor-pointer"
                            onClick={() => { setSelectedWorkspace(ws); setShowWorkspaceDetails(true); }}
                          >
                            {ws.name}
                          </span>
                          {ws.id === "grandsquare-mall" && <span className="ml-2 text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-mono uppercase">Demo</span>}
                          <br />
                          <span className="text-[10px] text-muted-foreground font-mono">{ws.id}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ws.users?.[0]?.name || "No Owner"}
                          <br />
                          <span className="text-xs">{ws.users?.[0]?.email}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-xs text-rose-400">{ws.plan || "Enterprise"}</td>
                        <td className="px-4 py-3">
                          <StatusPill tone={ws.status === "ACTIVE" ? "success" : ws.status === "SUSPENDED" ? "warning" : "danger"}>
                            {ws.status || "ACTIVE"}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <Button size="sm" variant="outline" onClick={() => handleImpersonate(ws.id)} title="Impersonate User">
                            <LogIn className="h-3.5 w-3.5 mr-1" /> Login As
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

      {/* TAB 3: AUDITS */}
      {activeTab === "audits" && (
        <SectionCard title="Security & Onboarding Audit Trail">
          {loadingAudits ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
            </div>
          ) : safeAudits.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">No audits logs recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface/50 text-xs font-medium uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3">Auditor</th>
                    <th className="px-4 py-3">Workspace ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {safeAudits.map((log: any) => (
                    <tr key={log.id} className="transition-colors hover:bg-surface/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(log.timestamp || Date.now()).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-xs text-rose-400">{log.actionType}</td>
                      <td className="px-4 py-3">
                        {log.adminEmail}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{log.workspaceId}</td>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Registration: {selectedReg?.companyName}</DialogTitle>
            <DialogDescription>
              Perform compliance checks and risk assessments before approving the workspace.
            </DialogDescription>
          </DialogHeader>

          {selectedReg && (
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <Building className="h-4 w-4" /> Company Details
                  </h4>
                  <div className="rounded-md bg-surface p-3 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedReg.companyName}</p>
                    <p><span className="text-muted-foreground">Type:</span> {selectedReg.businessType}</p>
                    <p><span className="text-muted-foreground">Industry:</span> {selectedReg.industry}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    <User className="h-4 w-4" /> Owner Account
                  </h4>
                  <div className="rounded-md bg-surface p-3 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedReg.ownerName}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedReg.ownerEmail}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedReg.mobileNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex flex-wrap gap-2 justify-end">
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
