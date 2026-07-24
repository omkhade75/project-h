import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  ShoppingBag,
  Store,
  Zap,
  Truck,
  Package,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Buy From Nearest Stores — Bizora Customer" },
      {
        name: "description",
        content:
          "Buy groceries, milk & daily products from your nearest local shopkeepers with 10-minute delivery.",
      },
    ],
  }),
  component: CustomerLandingPage,
});

function CustomerLandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/customer-portal" });
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
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[520px] w-[520px] animate-pulse-slow rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[520px] w-[520px] animate-pulse-slow rounded-full bg-orange-500/25 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(var(--color-foreground)_1px,transparent_1px),linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 sm:px-10 sm:py-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Bizora Local Shopper</p>
              <p className="text-[10px] text-muted-foreground">Buy From Nearest Stores</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-500 hover:bg-amber-500/30 transition-all"
            >
              Shop Local <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 text-center sm:px-10 sm:pt-24 sm:pb-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-amber-500">
            <Zap className="h-3 w-3" /> 🛍️ BUY FROM YOUR NEAREST LOCAL STORES
          </p>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Order groceries & daily items <span className="gradient-text">from local shopkeepers</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Shop real-time product stock from shopkeepers right in your neighborhood. Fast 10-minute express home delivery!
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 px-6 py-3 text-sm font-extrabold shadow-lg transition-all"
            >
              Start Shopping Local <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Sign in with <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">customer@gmail.com</code> / password <code className="rounded bg-surface px-1.5 py-0.5 text-foreground">123456789</code>
          </p>
        </section>

        {/* Features grid */}
        <section className="mx-auto max-w-5xl px-6 pb-24 sm:px-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Store,
                title: "Nearest Local Shops",
                desc: "Browse live products available right now in your local neighborhood stores.",
              },
              {
                icon: Zap,
                title: "10-Minute Express Delivery",
                desc: "Shopkeepers near you accept your order first and dispatch immediate delivery.",
              },
              {
                icon: Package,
                title: "Real Store Inventory",
                desc: "No static placeholders. Only products physically stocked in local shops are shown.",
              },
              {
                icon: Truck,
                title: "Live GPS Delivery Tracking",
                desc: "Track real-time delivery status and arrival times right to your doorstep.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group glass rounded-xl border border-hairline p-6 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
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
            © 2026 Bizora Local Shopper · Hyperlocal Storefront & Express Delivery
          </p>
        </footer>
      </div>
    </div>
  );
}
