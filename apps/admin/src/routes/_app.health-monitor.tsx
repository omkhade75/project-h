import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Activity,
  Database,
  HardDrive,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Mail,
  Shield,
} from "lucide-react";
import { PageHeader, SectionCard, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/health-monitor")({
  head: () => ({
    meta: [
      { title: "Health Monitor | Bizora Admin" },
      { name: "description", content: "Real-time system health monitoring with automated alerts." },
    ],
  }),
  component: HealthMonitor,
});

interface HealthReport {
  timestamp: string;
  uptime: number;
  dbStatus: string;
  dbError: string | null;
  responseTimeMs: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
  system: {
    freeMem: number;
    totalMem: number;
  };
}

function HealthMonitor() {
  const { user } = useAuth();
  const [report, setReport] = useState<HealthReport | null>(null);
  const [history, setHistory] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const API_BASE = typeof window !== "undefined"
    ? (window as any).__BIZORA_API_URL || "https://bizora-backend-gtoe.onrender.com"
    : "";

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      const json = await res.json();
      if (json.data) {
        setReport(json.data);
        setHistory((prev) => [json.data, ...prev].slice(0, 50));
      }
    } catch (err: any) {
      toast.error("Failed to fetch health status: " + (err.message || "Network error"));
      setReport({
        timestamp: new Date().toISOString(),
        uptime: 0,
        dbStatus: "unreachable",
        dbError: err.message || "Backend unreachable",
        responseTimeMs: 0,
        memory: { rss: 0, heapTotal: 0, heapUsed: 0 },
        system: { freeMem: 0, totalMem: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0s";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const isHealthy = report?.dbStatus === "up";
  const memPercent = report?.memory?.heapTotal
    ? Math.round((report.memory.heapUsed / report.memory.heapTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health Monitor"
        subtitle="Real-time backend health checks with automated email alerts every 5 minutes."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "gap-1.5 text-xs font-medium",
                autoRefresh && "border-success text-success"
              )}
            >
              <Activity className={cn("h-3.5 w-3.5", autoRefresh && "animate-pulse")} />
              {autoRefresh ? "Live" : "Paused"}
            </Button>
            <Button
              onClick={fetchHealth}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Run Check Now
            </Button>
          </div>
        }
      />

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className={cn(
          "rounded-xl border p-4 flex flex-col gap-2",
          isHealthy
            ? "border-success/30 bg-success/5"
            : "border-destructive/30 bg-destructive/5"
        )}>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {isHealthy ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
            System Status
          </div>
          <p className={cn("text-lg font-bold", isHealthy ? "text-success" : "text-destructive")}>
            {report ? (isHealthy ? "All Systems Go" : "Issues Detected") : "Checking..."}
          </p>
        </div>

        <div className="rounded-xl border border-hairline bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Database className="h-4 w-4" />
            Database
          </div>
          <p className="text-lg font-bold">
            {report?.dbStatus === "up" ? "Connected" : report?.dbStatus || "..."}
          </p>
          {report?.responseTimeMs !== undefined && (
            <p className="text-[10px] text-muted-foreground">{report.responseTimeMs}ms response</p>
          )}
        </div>

        <div className="rounded-xl border border-hairline bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            Memory Usage
          </div>
          <p className="text-lg font-bold">{memPercent}%</p>
          <p className="text-[10px] text-muted-foreground">
            {formatBytes(report?.memory?.heapUsed || 0)} / {formatBytes(report?.memory?.heapTotal || 0)}
          </p>
        </div>

        <div className="rounded-xl border border-hairline bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            Uptime
          </div>
          <p className="text-lg font-bold">{formatUptime(report?.uptime || 0)}</p>
          <p className="text-[10px] text-muted-foreground">
            Since {report ? new Date(Date.now() - (report.uptime || 0) * 1000).toLocaleString() : "..."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Monitoring Features */}
        <SectionCard title="Automated Monitoring" subtitle="Active health checks and alerting">
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-hairline">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Scheduled Health Checks</p>
                <p className="text-muted-foreground">Every 5 minutes, the backend automatically runs a full health check</p>
              </div>
              <StatusPill tone="success">Active</StatusPill>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-hairline">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Email Alerts</p>
                <p className="text-muted-foreground">Admin receives detailed error emails when DB is down or response &gt; 5s</p>
              </div>
              <StatusPill tone="success">Enabled</StatusPill>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-hairline">
              <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
                <Database className="h-4 w-4 text-info" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Database Connectivity</p>
                <p className="text-muted-foreground">Tests PostgreSQL connection via Prisma $queryRaw every cycle</p>
              </div>
              <StatusPill tone={report?.dbStatus === "up" ? "success" : "danger"}>
                {report?.dbStatus === "up" ? "Healthy" : "Check"}
              </StatusPill>
            </div>
          </div>
        </SectionCard>

        {/* Recent Check History */}
        <SectionCard title="Check History" subtitle={`Last ${history.length} checks`}>
          <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-1">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                No check history yet. Run a check to start.
              </p>
            ) : (
              history.map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-xs border",
                    h.dbStatus === "up"
                      ? "border-hairline bg-card"
                      : "border-destructive/20 bg-destructive/5"
                  )}
                >
                  {h.dbStatus === "up" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <span className="text-muted-foreground min-w-[120px]">
                    {new Date(h.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="font-medium">
                    DB: {h.dbStatus}
                  </span>
                  <span className="text-muted-foreground ml-auto">
                    {h.responseTimeMs}ms · {formatBytes(h.memory?.heapUsed || 0)}
                  </span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* Error Details */}
      {report?.dbError && (
        <SectionCard title="Error Details">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-xs font-mono text-destructive whitespace-pre-wrap">
              {report.dbError}
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
