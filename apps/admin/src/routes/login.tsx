import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, TrendingUp, Zap, Loader2, ArrowLeft, Building2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { z } from "zod";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => loginSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Admin Portal Sign In — Bizora OS" },
      {
        name: "description",
        content: "Sign in to the Bizora Admin Portal for system administration and mall operations.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("admin@gmail.com");
  const [pass, setPass] = useState("123456789");
  const [submitting, setSubmitting] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const getRedirectTarget = (u?: any) => {
    const activeUser = u || user;
    if (!redirect) {
      if (activeUser?.isSystemAdmin) {
        return "/system-admin";
      }
      return "/command-center";
    }
    try {
      const url = new URL(redirect);
      return url.pathname + url.search;
    } catch {
      return redirect;
    }
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Enter your email");
    setSubmitting(true);
    try {
      const loggedIn = await login(email, pass);
      toast.success("Welcome back to Admin Portal");
      navigate({ to: getRedirectTarget(loggedIn) });
    } catch (err: any) {
      toast.error(err.message || "Admin login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail("admin@gmail.com");
    setPass("123456789");
    toast.info("Loaded Admin demo credentials");
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail !== "admin@gmail.com" && adminEmail !== "khade8915@gmail.com") {
      toast.error("Incorrect admin credentials");
      return;
    }
    setAdminSubmitting(true);
    try {
      const loggedIn = await login(adminEmail, adminPassword);
      setShowAdminModal(false);
      setAdminEmail("");
      setAdminPassword("");
      toast.success("System Admin authorized");
      navigate({ to: getRedirectTarget(loggedIn) });
    } catch (err: any) {
      toast.error(err.message || "Admin login failed");
    } finally {
      setAdminSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Back button */}
      <div className="absolute left-6 top-6 z-50">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(var(--color-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left: brand story */}
        <div className="hidden flex-col justify-between p-10 lg:flex xl:p-14 border-r border-border/40 bg-purple-950/10">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-foreground">Bizora OS</p>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Admin Control Portal</p>
            </div>
          </div>

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Building2 className="h-3.5 w-3.5" /> Mall & Tenant Administration
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
              Central Operations <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">& Admin Control</span>.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Welcome to the Administrative Management Console. Oversee tenant onboarding, workspace permissions, System Admin audit logs, and mall operations in real-time.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, label: "System Admin Tools" },
                { icon: TrendingUp, label: "Tenant Auditing" },
                { icon: Zap, label: "Mall Analytics" },
              ].map((f) => (
                <div key={f.label} className="glass rounded-xl p-3.5 border border-purple-500/20 bg-purple-500/5">
                  <f.icon className="h-4 w-4 text-purple-400" />
                  <p className="mt-2 text-xs font-semibold text-foreground">{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-4">
            <span>Enterprise Admin Portal</span>
            <span className="font-medium text-purple-400">admin@gmail.com</span>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-purple-600 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Bizora OS</p>
                <p className="text-xs text-purple-400">Admin Portal</p>
              </div>
            </div>

            <div className="card-elevated p-6 sm:p-8 border border-purple-500/20 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Admin Sign In</h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Admin Portal
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your administrative credentials to manage operations.
              </p>

              {/* Demo quick fill button */}
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="mt-4 w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-all"
              >
                <span className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-purple-400" />
                  Quick Fill Admin Credentials
                </span>
                <span className="font-mono text-[10px] bg-purple-950/60 px-2 py-0.5 rounded text-purple-200">
                  admin@gmail.com / 123456789
                </span>
              </button>

              <form className="mt-6 space-y-4" onSubmit={handleFormLogin}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={show ? "text" : "password"}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      className="bg-background pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" defaultChecked />
                  <Label htmlFor="remember" className="text-xs text-muted-foreground">
                    Remember session for 30 days
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-purple-600/20"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Sign In to Admin Portal
                </Button>
              </form>

              <div className="mt-6 text-center border-t border-border/40 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="text-xs text-muted-foreground hover:text-purple-400 transition-colors font-medium hover:underline"
                >
                  Authorize System Super Admin Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADMIN LOGIN DIALOG */}
      <Dialog open={showAdminModal} onOpenChange={(open) => !open && setShowAdminModal(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>System Super Admin Authorization</DialogTitle>
            <DialogDescription>
              Super Admin override for <span className="font-semibold text-purple-400">admin@gmail.com</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4 my-4">
            <div className="space-y-1.5">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@gmail.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adminPassword">Password</Label>
              <Input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowAdminModal(false); setAdminEmail(""); setAdminPassword(""); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={adminSubmitting} className="bg-purple-600 text-white">
                {adminSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Authorize Super Admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
