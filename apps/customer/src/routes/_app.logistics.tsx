import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, SectionCard, StatusPill } from "@/components/page-header";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getLogisticsDispatchesServer } from "@/lib/api-logistics";
import {
  Loader2,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  PhoneCall,
  Store,
  Navigation,
  ShieldCheck,
  Package,
  KeyRound,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActiveDelivery, getCustomerOrders, CustomerOrder } from "@/lib/customer-orders";
import { fmtINR } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/logistics")({
  head: () => ({
    meta: [
      { title: "Track My Order & Delivery — Bizora Customer" },
      { name: "description", content: "Track live 10-minute neighborhood delivery rider position and ETA." },
    ],
  }),
  component: CustomerLogisticsPage,
});

function CustomerLogisticsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCustomerDeliveryData = async () => {
    setLoading(true);
    try {
      // 1. First check local active orders placed by customer
      const localActive = getActiveDelivery();
      if (localActive) {
        setActiveOrder(localActive);
        setLoading(false);
        return;
      }

      // 2. Fallback to remote server dispatches
      const res = await getLogisticsDispatchesServer({ role: user?.role, email: user?.email });
      const safeData = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      if (safeData.length > 0) {
        const first = safeData[0];
        setActiveOrder({
          id: first.orderNumber || first.id || "ORD-9021",
          items: first.items || [],
          total: first.total || 401,
          address: first.destination || "Saved Customer Address",
          status: "ACCEPTED_BY_STORE",
          acceptedStore: first.storeName || "GrandSquare Kirana & Daily Fresh (#STR-104)",
          storePhone: "+91 98765 43210",
          driverName: first.driverName || "Vijay Yadav (Express Partner)",
          driverPhone: first.driverPhone || "+91 98765 43211",
          vehicleNumber: first.vehicleNumber || "MH-02-EX-4491",
          otp: "8492",
          etaMinutes: first.etaMinutes || 8,
          paymentMethod: "UPI",
          createdAt: "10 mins ago",
        });
      } else {
        // If completely empty, seed with the verified demo order
        const fallback = getCustomerOrders()[0];
        setActiveOrder(fallback || null);
      }
    } catch (err) {
      console.warn("Failed to load delivery data:", err);
      const fallback = getCustomerOrders()[0];
      setActiveOrder(fallback || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerDeliveryData();

    // Listen to real-time order placement events across tabs/components
    const handleUpdate = () => {
      const active = getActiveDelivery();
      if (active) setActiveOrder(active);
    };

    window.addEventListener("bizora-orders-updated", handleUpdate);
    return () => {
      window.removeEventListener("bizora-orders-updated", handleUpdate);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!activeOrder) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Track Live 10-Minute Order Delivery"
          subtitle="Real-time GPS tracking of your express grocery & essentials order from your nearest neighborhood shop."
        />
        <div className="rounded-2xl border border-hairline bg-surface p-12 text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400 font-extrabold text-3xl">
            🚚
          </div>
          <h3 className="text-lg font-bold text-foreground">No Active Deliveries in Transit</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            You have no active 10-minute express deliveries right now. Place an order from your neighborhood storefront to track live rider dispatch in real time!
          </p>
          <Button
            onClick={() => navigate({ to: "/customer-portal" })}
            className="gradient-primary text-primary-foreground text-xs font-bold"
          >
            Go to Storefront & Order
          </Button>
        </div>
      </div>
    );
  }

  const isDelivered = activeOrder.status === "DELIVERED";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Track Live 10-Minute Order Delivery"
          subtitle="Real-time GPS tracking of your express grocery & essentials order from your nearest neighborhood shop."
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-8 gap-1.5"
            onClick={() => navigate({ to: "/transactions" })}
          >
            <ShoppingBag className="h-3.5 w-3.5" /> View All Orders
          </Button>
          <Button
            size="sm"
            className="gradient-primary text-primary-foreground text-xs h-8 gap-1.5"
            onClick={() => navigate({ to: "/customer-portal" })}
          >
            Shop More Items
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Delivery Tracker Card */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title={`Active Delivery Status — Order #${activeOrder.id}`}>
            <div className="space-y-6">
              {/* ETA Banner */}
              <div className="rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-md flex items-center justify-between">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-200">
                    <Clock className="h-3.5 w-3.5" /> Express 10-Min Dispatch
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {isDelivered ? "Delivered Successfully!" : `Arriving in ~${activeOrder.etaMinutes || 8} Minutes`}
                  </h2>
                  <p className="text-xs text-emerald-100">
                    {isDelivered
                      ? "Your package was handed over and verified via OTP at doorstep."
                      : `Rider ${activeOrder.driverName || "Express Partner"} is on the way with your ${activeOrder.items?.length || 2} items.`}
                  </p>
                </div>
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white font-extrabold text-2xl shrink-0">
                  ⚡
                </div>
              </div>

              {/* 🔐 Prominent Doorstep OTP Card */}
              {!isDelivered && (
                <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-sm">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                          Doorstep Security Code
                        </span>
                        <span className="text-[11px] text-slate-500">Share only after inspecting goods</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                        Tell rider this code to confirm delivery:
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-auto bg-white px-5 py-2 rounded-xl border border-amber-300 shadow-sm">
                    <span className="text-xs uppercase font-bold text-slate-400">OTP</span>
                    <span className="font-mono text-2xl font-black tracking-widest text-amber-700">
                      {activeOrder.otp || "8492"}
                    </span>
                  </div>
                </div>
              )}

              {/* Live Step Progress Timeline */}
              <div className="p-4 rounded-xl border border-hairline bg-surface/50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Live Delivery Timeline
                </h4>

                <div className="relative flex items-center justify-between text-xs font-semibold">
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white font-bold">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-foreground">Order Placed</span>
                    <span className="text-[10px] text-muted-foreground">Done</span>
                  </div>

                  <div className="h-1 flex-1 bg-emerald-500 mx-2" />

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white font-bold">
                      <Store className="h-4 w-4" />
                    </div>
                    <span className="text-foreground">Store Packed</span>
                    <span className="text-[10px] text-muted-foreground">Local Shop</span>
                  </div>

                  <div className="h-1 flex-1 bg-emerald-500 mx-2" />

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-full font-bold ${
                        isDelivered
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-400 text-slate-950 animate-bounce"
                      }`}
                    >
                      <Truck className="h-4 w-4" />
                    </div>
                    <span className={isDelivered ? "text-foreground" : "text-amber-500 font-bold"}>
                      {isDelivered ? "Dispatched" : "On The Way"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Express Rider</span>
                  </div>

                  <div className={`h-1 flex-1 mx-2 ${isDelivered ? "bg-emerald-500" : "bg-hairline"}`} />

                  {/* Step 4 */}
                  <div className="flex flex-col items-center gap-1 text-center">
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-full border ${
                        isDelivered
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-surface border-hairline text-muted-foreground"
                      }`}
                    >
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className={isDelivered ? "text-emerald-500 font-bold" : "text-muted-foreground"}>
                      {isDelivered ? "Delivered" : "Doorstep"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {isDelivered ? "Complete" : "Pending OTP"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items in this Delivery */}
              <div className="p-4 rounded-xl border border-hairline bg-surface space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <Package className="h-4 w-4 text-emerald-500" />
                    <span>Items in this Delivery ({activeOrder.items?.length || 0})</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-foreground">
                    Total: {fmtINR(activeOrder.total)}
                  </span>
                </div>

                <div className="divide-y divide-hairline">
                  {activeOrder.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover bg-slate-100"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Qty: {item.quantity} · {item.category}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-foreground">
                        {fmtINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hyperlocal Route Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-hairline bg-surface space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Store className="h-4 w-4 text-emerald-500" />
                    <span>Fulfilling Local Shop</span>
                  </div>
                  <p className="text-foreground font-semibold">
                    {activeOrder.acceptedStore || "GrandSquare Kirana & Daily Fresh (#STR-104)"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Contact: {activeOrder.storePhone || "+91 98765 43210"}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-hairline bg-surface space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <span>Delivery Address</span>
                  </div>
                  <p className="text-foreground font-semibold">
                    {activeOrder.address || "18th Road, Near Turner Road, Bandra West, Mumbai"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">10-Minute Express Zone</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Delivery Rider & Store Contact Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Delivery Rider Info">
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-lg">
                  🚴
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {activeOrder.driverName || "Vijay Yadav (Express Partner)"}
                  </h4>
                  <p className="text-muted-foreground">Bizora Express Partner</p>
                  <p className="font-mono text-[11px] text-emerald-500 font-semibold">
                    Vehicle: {activeOrder.vehicleNumber || "MH-02-EX-4491"}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-hairline space-y-2">
                <Button
                  onClick={() => toast.success(`Calling rider ${activeOrder.driverName || "Vijay Yadav"}...`)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 h-9"
                >
                  <PhoneCall className="h-4 w-4" /> Call Rider ({activeOrder.driverPhone || "+91 98765 43211"})
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Need Delivery Support?">
            <div className="p-3 rounded-lg bg-surface border border-hairline text-xs space-y-2 text-muted-foreground leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>100% On-Time Guarantee</span>
              </div>
              <p>
                If your order takes longer than 15 minutes, receive an instant ₹50 cashback credited directly to your Bizora Wallet!
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
