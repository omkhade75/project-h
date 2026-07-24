import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ShieldAlert,
  Building,
  Users,
  Brain,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Activity,
  Key,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Super Admin Console — OmniMind AI" },
      {
        name: "description",
        content:
          "Global system admin control center for company approvals, tenant onboarding, and platform security.",
      },
    ],
  }),
  component: AdminLandingPage,
});

function AdminLandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/system-admin" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] animate-pulse-slow rounded-full bg-rose-600/20 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] animate-pulse-slow rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(var(--color-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 sm:px-10 sm:py-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">OmniMind AI</p>
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Super Admin Console</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/30 transition-all border border-rose-500/30"
            >
              Super Admin Login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center sm:px-10 sm:pt-24 sm:pb-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-400">
            <ShieldCheck className="h-3.5 w-3.5" /> 🛡️ PLATFORM SUPER ADMIN CONTROL CENTER
          </p>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Global Tenant Onboarding & <span className="gradient-text">System Administration</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Approve registered companies, manage multi-tenant database access, monitor platform telemetry, and configure global system credentials.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-6 py-3 text-sm shadow-lg shadow-rose-600/30 transition-all"
            >
              Sign In to Super Admin Console <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Sign in with Super Admin email: <code className="rounded bg-surface px-1.5 py-0.5 text-foreground font-mono">khade8915@gmail.com</code> / password <code className="rounded bg-surface px-1.5 py-0.5 text-foreground font-mono">123456789</code>
          </p>
        </section>

        {/* Admin Capabilities grid */}
        <section className="mx-auto max-w-5xl px-6 pb-24 sm:px-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Building,
                title: "Company Approvals",
                desc: "Review and approve newly registered business tenants before granting active database access.",
              },
              {
                icon: Activity,
                title: "Platform Telemetry",
                desc: "Monitor system health, database connections, anomalies, and multi-tenant performance.",
              },
              {
                icon: Key,
                title: "Security & Role Access",
                desc: "Manage global user roles, impersonation overrides, and security configurations.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group glass rounded-xl border border-hairline p-6 transition-all hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/5"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-500/10 text-rose-500">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline bg-surface/30 py-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 OmniMind AI · Super Admin Control Portal
          </p>
        </footer>
      </div>
    </div>
  );
}
