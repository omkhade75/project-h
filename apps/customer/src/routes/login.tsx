import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, ShoppingBag, Gift, Receipt, Loader2, ArrowLeft, UserCheck, Sparkles, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { z } from "zod";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => loginSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Customer Portal Sign In — Bizora OS" },
      {
        name: "description",
        content: "Sign in to your Bizora Customer Portal to view orders, digital invoices, and member rewards.",
      },
    ],
  }),
  component: CustomerLoginPage,
});

function CustomerLoginPage() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const getRedirectTarget = (u?: any) => {
    const activeUser = u || user;
    if (!redirect) {
      if (activeUser?.isSystemAdmin) {
        return "/system-admin";
      }
      return "/customer-portal";
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
      toast.success("Welcome to your Customer Hub");
      navigate({ to: getRedirectTarget(loggedIn) });
    } catch (err: any) {
      toast.error(err.message || "Customer login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCustomer = () => {
    setEmail("khade8915@gmail.com");
    setPass("123456789");
    toast.info("Loaded Customer demo credentials");
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
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-cyan-600/15 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(var(--color-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* Left: brand story */}
        <div className="hidden flex-col justify-between p-10 lg:flex xl:p-14 border-r border-border/40 bg-blue-950/10">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-cyan-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-foreground">Bizora Hub</p>
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Customer Portal</p>
            </div>
          </div>

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Shopper & Member Loyalty
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
              Track Orders, Receipts & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Member Rewards</span>.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Access all your digital invoices, track active order dispatches, redeem loyalty point balance, and receive instant WhatsApp receipt copies for all your purchases.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: Receipt, label: "Digital Receipts" },
                { icon: Package, label: "Order Tracking" },
                { icon: Gift, label: "Loyalty Cashback" },
              ].map((f) => (
                <div key={f.label} className="glass rounded-xl p-3.5 border border-cyan-500/20 bg-cyan-500/5">
                  <f.icon className="h-4 w-4 text-cyan-400" />
                  <p className="mt-2 text-xs font-semibold text-foreground">{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-4">
            <span>Customer Loyalty Hub</span>
            <span className="font-medium text-cyan-400">Instant Receipts</span>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Bizora OS</p>
                <p className="text-xs text-cyan-400">Customer Portal</p>
              </div>
            </div>

            <div className="card-elevated p-6 sm:p-8 border border-cyan-500/20 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Customer Sign In</h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Customer Portal
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sign in to view your orders, digital receipts, and rewards.
              </p>

              {/* Demo quick fill button */}
              <button
                type="button"
                onClick={fillDemoCustomer}
                className="mt-4 w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/20 transition-all"
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                  Quick Fill Customer Credentials
                </span>
                <span className="font-mono text-[10px] bg-cyan-950/60 px-2 py-0.5 rounded text-cyan-200">
                  khade8915@gmail.com
                </span>
              </button>

              <form className="mt-6 space-y-4" onSubmit={handleFormLogin}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Customer Email / Phone</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
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
                    Remember me on this device
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium shadow-lg shadow-blue-600/20"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Sign In to Customer Hub
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-muted-foreground">
                New shopper?{" "}
                <Link to="/register" className="text-cyan-400 hover:underline font-semibold">
                  Create Member Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
