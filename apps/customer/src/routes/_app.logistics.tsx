import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomerDeliveryData = async () => {
    setLoading(true);
    try {
      const res = await getLogisticsDispatchesServer({ role: user?.role, email: user?.email });
      const safeData = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setDispatches(safeData);
    } catch (err) {
      console.warn("Failed to load delivery data:", err);
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerDeliveryData();
  }, [user]);

  const safeDispatches = Array.isArray(dispatches) ? dispatches : [];

  // Default demo delivery if no dispatches yet
  const activeDelivery = safeDispatches.length > 0 ? safeDispatches[0] : {
    id: "ORD-9021",
    orderNumber: "ORD-9021",
    customerName: user?.name || "Shopper Customer",
    destination: "18th Road, Bandra West, Mumbai 400050",
    driverName: "Ramesh Kumar (Express Partner)",
    driverPhone: "+91 98765 43211",
    storeName: "GrandSquare Supermart (800m away)",
    vehicleNumber: "MH-12-PQ-8841 (Electric Scooter)",
    itemsCount: 3,
    status: "In Transit",
    etaMinutes: 8,
    dispatchedAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Track Live 10-Minute Order Delivery"
        subtitle="Real-time GPS tracking of your express grocery & essentials order from your nearest neighborhood shop."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Delivery Tracker Card */}
          <div className="lg:col-span-2 space-y-6">
            <SectionCard title={`Active Delivery Status — Order #${activeDelivery.orderNumber || activeDelivery.id}`}>
              <div className="space-y-6">
                {/* ETA Banner */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-md flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-200">
                      <Clock className="h-3.5 w-3.5" /> Express 10-Min Dispatch
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight">
                      Arriving in ~8 Minutes
                    </h2>
                    <p className="text-xs text-emerald-100">
                      Rider Ramesh Kumar is on the way with your 3 items.
                    </p>
                  </div>
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white font-extrabold text-2xl">
                    ⚡
                  </div>
                </div>

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
                      <span className="text-[10px] text-muted-foreground">Just now</span>
                    </div>

                    <div className="h-1 flex-1 bg-emerald-500 mx-2" />

                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white font-bold">
                        <Store className="h-4 w-4" />
                      </div>
                      <span className="text-foreground">Store Packed</span>
                      <span className="text-[10px] text-muted-foreground">GrandSquare Shop</span>
                    </div>

                    <div className="h-1 flex-1 bg-emerald-500 mx-2" />

                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-400 text-slate-950 font-bold animate-bounce">
                        <Truck className="h-4 w-4" />
                      </div>
                      <span className="text-amber-400 font-bold">On The Way</span>
                      <span className="text-[10px] text-amber-300">In Transit</span>
                    </div>

                    <div className="h-1 flex-1 bg-hairline mx-2" />

                    {/* Step 4 */}
                    <div className="flex flex-col items-center gap-1 text-center">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-surface border border-hairline text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="text-muted-foreground">Doorstep</span>
                      <span className="text-[10px] text-muted-foreground">Pending</span>
                    </div>
                  </div>
                </div>

                {/* Hyperlocal Route Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-hairline bg-surface space-y-2">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Store className="h-4 w-4 text-emerald-500" />
                      <span>Fulfilling Local Shop</span>
                    </div>
                    <p className="text-muted-foreground font-semibold">
                      {activeDelivery.storeName || "GrandSquare Supermart (Nearest Store)"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Distance: <span className="font-bold text-foreground">800 meters</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-hairline bg-surface space-y-2">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      <span>Delivery Address</span>
                    </div>
                    <p className="text-muted-foreground font-semibold">
                      {activeDelivery.destination || "18th Road, Bandra West, Mumbai 400050"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Instructions: <span className="font-bold text-foreground">Leave at door</span>
                    </p>
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
                      {activeDelivery.driverName || "Ramesh Kumar"}
                    </h4>
                    <p className="text-muted-foreground">Bizora Express Delivery Partner</p>
                    <p className="font-mono text-[11px] text-emerald-400">
                      Vehicle: {activeDelivery.vehicleNumber || "MH-12-PQ-8841"}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-hairline space-y-2">
                  <Button
                    onClick={() => toast.success(`Calling rider ${activeDelivery.driverName}...`)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 h-9"
                  >
                    <PhoneCall className="h-4 w-4" /> Call Rider ({activeDelivery.driverPhone || "+91 98765 43211"})
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
                  If your order takes longer than 15 minutes, receive an instant ₹50 cashback to your Bizora Wallet!
                </p>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
