import { BizoraLogo } from "@/components/bizora-logo";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Building, TrendingUp, Loader2, ArrowLeft, Crown, DollarSign, PieChart, Sparkles, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  token: z.string().optional(),
  impersonate: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => loginSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Business Owner Portal — Bizora OS" },
      {
        name: "description",
        content: "Sign in to the Bizora Business Owner Portal for executive intelligence and financial decision making.",
      },
    ],
  }),
  component: OwnerLoginPage,
});

function OwnerLoginPage() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  // Smart User Experience Modals
  const [unregisteredModalOpen, setUnregisteredModalOpen] = useState(false);
  const [unregisteredEmail, setUnregisteredEmail] = useState("");
  const [unregisteredName, setUnregisteredName] = useState("");
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [rejectedModalOpen, setRejectedModalOpen] = useState(false);

  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { redirect, token, impersonate } = Route.useSearch();

  useEffect(() => {
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const qToken = token || urlParams?.get("token");
    const isImpersonate = impersonate === "true" || urlParams?.get("impersonate") === "true";

    if (qToken) {
      try {
        localStorage.setItem("bizora_access_token", qToken);
        const base64Url = qToken.split(".")[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const payloadStr = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const parsed = JSON.parse(payloadStr);
          const userObj = {
            id: parsed.userId || parsed.id || "usr_store",
            email: parsed.email,
            name: parsed.name || parsed.email?.split("@")[0] || "Store Owner",
            role: parsed.role || "OWNER",
            departmentId: null,
            workspaceId: parsed.workspaceId || parsed.companyId || "grandsquare-mall",
            companyId: parsed.companyId || parsed.workspaceId || "grandsquare-mall",
            companyName: parsed.companyName || `${parsed.name || "Store"}'s Store`,
            businessType: parsed.businessType || "Retail",
            plan: parsed.plan || "ENTERPRISE",
            isSystemAdmin: !!parsed.isSystemAdmin,
            isImpersonating: isImpersonate,
            setupCompleted: true,
          };
          localStorage.setItem("bizora_user_session", JSON.stringify(userObj));
          if (userObj.companyName && userObj.workspaceId) {
            localStorage.setItem(`bizora_company_name_${userObj.workspaceId}`, userObj.companyName);
          }
        }
      } catch (e) {
        console.warn("Failed to parse impersonation token payload:", e);
      }
      toast.success(isImpersonate ? "Super Admin: Impersonating Store Owner" : "Owner authenticated successfully");
      window.location.href = "/command-center";
    }
  }, [token, impersonate]);

  const parseGoogleJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleGoogleAccountSelect = async (gEmail: string, gName?: string) => {
    const cleanEmail = (gEmail || "").toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return toast.error("Please enter a valid Google email address");
    }
    const cleanName = gName || cleanEmail.split("@")[0].replace(/[^a-zA-Z]/g, " ") || "Store Owner";
    setSubmitting(true);
    try {
      const loggedIn = await loginWithGoogle({ email: cleanEmail, name: cleanName });
      toast.success(`Authenticated with Google: ${cleanEmail}`);
      setGoogleModalOpen(false);
      navigate({ to: getRedirectTarget(loggedIn) });
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("NOT_REGISTERED") || msg.includes("No registered store") || msg.includes("No account or registered store")) {
        setUnregisteredEmail(cleanEmail);
        setUnregisteredName(cleanName);
        setUnregisteredModalOpen(true);
        setGoogleModalOpen(false);
      } else if (msg.includes("PENDING_APPROVAL") || msg.includes("pending review and approval")) {
        setPendingEmail(cleanEmail);
        setPendingModalOpen(true);
        setGoogleModalOpen(false);
      } else if (msg.includes("REJECTED") || msg.includes("rejected by the System Admin")) {
        setRejectedModalOpen(true);
        setGoogleModalOpen(false);
      } else {
        toast.error(err.message || "Google Sign-In failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNativeGoogleGIS = () => {
    const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId && typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => {
            if (response?.credential) {
              const profile = parseGoogleJwt(response.credential);
              if (profile?.email) {
                handleGoogleAccountSelect(profile.email, profile.name);
                return;
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setGoogleModalOpen(true);
          }
        });
        return;
      } catch (err) {
        console.warn("[Google GIS Error]", err);
      }
    }
    setGoogleModalOpen(true);
  };

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
      toast.success("Welcome back, Business Owner");
      navigate({ to: getRedirectTarget(loggedIn) });
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("NOT_REGISTERED") || msg.includes("No registered store") || msg.includes("No account or registered store")) {
        setUnregisteredEmail(email.trim());
        setUnregisteredName("");
        setUnregisteredModalOpen(true);
      } else if (msg.includes("PENDING_APPROVAL") || msg.includes("pending review and approval")) {
        setPendingEmail(email.trim());
        setPendingModalOpen(true);
      } else if (msg.includes("REJECTED") || msg.includes("rejected by the System Admin")) {
        setRejectedModalOpen(true);
      } else {
        toast.error(err.message || "Owner login failed");
      }
    } finally {
      setSubmitting(false);
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
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-amber-600/15 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-yellow-600/15 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(var(--color-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left: brand story */}
        <div className="hidden flex-col justify-between p-10 lg:flex xl:p-14 border-r border-border/40 bg-amber-950/10">
          <BizoraLogo variant="owner" size="lg" />

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Building className="h-3.5 w-3.5" /> Executive Decision Suite
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
              Executive Profitability & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">Financial Growth</span>.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Designed exclusively for company founders and business owners. Access real-time P&L insights, corporate cash investments, double-entry GL ledger, and automated AI growth recommendations.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: DollarSign, label: "Cash & Investments" },
                { icon: TrendingUp, label: "Revenue & P&L" },
                { icon: PieChart, label: "GL Ledger Balances" },
              ].map((f) => (
                <div key={f.label} className="glass rounded-xl p-3.5 border border-amber-500/20 bg-amber-500/5">
                  <f.icon className="h-4 w-4 text-amber-400" />
                  <p className="mt-2 text-xs font-semibold text-foreground">{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-4">
            <span>Executive Business Suite</span>
            <span className="font-medium text-muted-foreground font-mono">Business Owner</span>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-600 text-white">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Bizora OS</p>
                <p className="text-xs text-amber-400">Owner Portal</p>
              </div>
            </div>

            <div className="card-elevated p-6 sm:p-8 border border-amber-500/20 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Owner Sign In</h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Owner Portal
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sign in to view your executive business dashboard and financial ledger.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleFormLogin}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Owner Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@company.com"
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
                  className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-medium shadow-lg shadow-amber-600/20"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Sign In to Owner Portal
                </Button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
                  <span className="relative bg-background px-3 text-[11px] font-semibold uppercase text-muted-foreground">Or continue with</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNativeGoogleGIS}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-foreground font-medium py-2.5 rounded-lg transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.29c-.8 1.6-1.29 3.4-1.29 5.38s.49 3.78 1.29 5.38l3.99-3.14z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="pt-3 border-t border-border/40 flex flex-col gap-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Fill Demo Accounts:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs border-amber-500/30 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 font-medium"
                      onClick={() => {
                        setEmail("owner@gmail.com");
                        setPass("123456789");
                      }}
                    >
                      GrandSquare Mall
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs border-amber-500/30 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 font-medium"
                      onClick={() => {
                        setEmail("priya@gmail.com");
                        setPass("123456789");
                      }}
                    >
                      Priyansh Store
                    </Button>
                  </div>
                </div>
              </form>

              <div className="mt-6 text-center text-xs text-muted-foreground">
                Want to register a new business?{" "}
                <Link to="/register" className="text-amber-400 hover:underline font-semibold">
                  Register Company
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Google One-Click Sign-In Modal */}
      <Dialog open={googleModalOpen} onOpenChange={setGoogleModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 bg-card border-border/60">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface/80 border border-hairline shadow-sm">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.29c-.8 1.6-1.29 3.4-1.29 5.38s.49 3.78 1.29 5.38l3.99-3.14z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"/>
              </svg>
            </div>
            <DialogTitle className="text-xl font-display font-semibold">Sign In with Google</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sign in securely to your business store using your verified Google account
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGoogleAccountSelect(customGoogleEmail, customGoogleName);
            }}
            className="space-y-3 pt-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="google-email" className="text-xs font-medium">Google Account Email</Label>
              <Input
                id="google-email"
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="bg-background text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="google-name" className="text-xs font-medium">Full Name (Optional)</Label>
              <Input
                id="google-name"
                placeholder="e.g. Store Owner"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                className="bg-background text-sm"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !customGoogleEmail.trim()}
              className="w-full mt-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-medium shadow-md flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.29c-.8 1.6-1.29 3.4-1.29 5.38s.49 3.78 1.29 5.38l3.99-3.14z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"/>
                </svg>
              )}
              Continue with Google
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 1. Unregistered Account Modal -> 1-Click Register Flow */}
      <Dialog open={unregisteredModalOpen} onOpenChange={setUnregisteredModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 bg-card border-border/60">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <Building className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl font-display font-semibold">No Registered Store Found</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              We couldn't find an approved business store registered under <strong className="text-foreground">{unregisteredEmail}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-surface p-4 rounded-xl border border-hairline my-2 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Ready to start with Bizora AI?</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Register your retail store, supermarket, or enterprise in under 60 seconds to get your own isolated POS and intelligent business dashboard.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-semibold flex items-center justify-center gap-2"
              onClick={() => {
                setUnregisteredModalOpen(false);
                navigate({ to: "/register" });
              }}
            >
              <span>Register My Store (1-Click)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full border-hairline text-xs"
              onClick={() => setUnregisteredModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Pending Super Admin Approval Modal */}
      <Dialog open={pendingModalOpen} onOpenChange={setPendingModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 bg-card border-amber-500/40">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl font-display font-semibold">Store Pending Super Admin Approval</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Your store registration for <strong className="text-foreground">{pendingEmail}</strong> is currently in the review queue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200/90 leading-relaxed">
              <p className="font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                <span>🛡️ Status: ⏳ Pending Review</span>
              </p>
              The Platform Super Admin has been notified via Email &amp; WhatsApp. Access is granted as soon as the store is approved.
            </div>

            <div className="p-3 rounded-xl bg-surface border border-hairline space-y-1.5 text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>What happens next?</span>
              </div>
              <p className="leading-relaxed">
                1. Super Admin verifies your business details.<br />
                2. Your isolated workspace &amp; clean dashboard are provisioned.<br />
                3. You will receive an instant approval notification.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={() => setPendingModalOpen(false)}
            >
              Got It, I'll Wait for Approval
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Registration Rejected Modal */}
      <Dialog open={rejectedModalOpen} onOpenChange={setRejectedModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 bg-card border-destructive/40">
          <DialogHeader className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive border border-destructive/30">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl font-display font-semibold text-destructive">Registration Not Approved</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Your store registration was not approved by the System Admin. Please contact support or re-register with valid credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-3">
            <Button
              className="w-full gradient-primary text-primary-foreground font-semibold"
              onClick={() => {
                setRejectedModalOpen(false);
                navigate({ to: "/register" });
              }}
            >
              Re-Register Store
            </Button>
            <Button
              variant="outline"
              className="w-full border-hairline text-xs"
              onClick={() => setRejectedModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
