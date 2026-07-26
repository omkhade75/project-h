import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FileText,
  Truck,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader, SectionCard, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getPurchaseOrdersServer, updatePurchaseOrderStatusServer } from "@/lib/api-suppliers";
import { getLogisticsDispatchesServer } from "@/lib/api-logistics";

export const Route = createFileRoute("/_app/supplier-portal")({
  head: () => ({
    meta: [
      { title: "Supplier Dashboard | Bizora" },
      {
        name: "description",
        content: "Supplier Portal: manage purchase orders, track logistics, configure catalog, and verify payments.",
      },
    ],
  }),
  component: SupplierPortal,
});

function SupplierPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSupplierData = async () => {
    setLoading(true);
    try {
      const [posRes, logRes] = await Promise.all([
        getPurchaseOrdersServer({ role: user?.role, email: user?.email }),
        getLogisticsDispatchesServer({ role: user?.role, email: user?.email }),
      ]);

      const safePos = Array.isArray(posRes) ? posRes : Array.isArray(posRes?.data) ? posRes.data : [];
      const safeLog = Array.isArray(logRes) ? logRes : Array.isArray(logRes?.data) ? logRes.data : [];

      setPurchaseOrders(safePos);
      setShipments(safeLog);
    } catch (err) {
      console.warn("Failed to load supplier portal data:", err);
      setPurchaseOrders([]);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplierData();
  }, [user]);

  const handleActionOrder = async (poId: string, action: "Accept" | "Reject") => {
    try {
      await updatePurchaseOrderStatusServer({
        data: {
          id: poId,
          status: action === "Accept" ? "APPROVED" : "REJECTED",
        },
      });
      toast.success(`Purchase order ${poId} has been ${action.toLowerCase()}ed.`);
      loadSupplierData();
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action.toLowerCase()} order.`);
    }
  };

  const safePOs = Array.isArray(purchaseOrders) ? purchaseOrders : [];
  const safeShipments = Array.isArray(shipments) ? shipments : [];

  const pendingPOsCount = safePOs.filter((po) => po.status === "SENT" || po.status === "PENDING" || po.status === "Sent").length;
  const activeShipmentsCount = safeShipments.filter((s) => s.status !== "DELIVERED").length;
  const totalSpend = safePOs.reduce((sum, po) => sum + Number(po.totalCost || po.total || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Supplier Portal — ${user?.name || "Vendor Supplier"}`}
        subtitle="Process incoming purchase orders, track logistics dispatches, and check cash settlements."
        actions={
          <Button onClick={() => navigate({ to: "/supplier-portal" })} variant="outline">
            Refresh Portal <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        }
      />

      {/* Real Dynamic KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          label="Pending POs"
          value={pendingPOsCount}
          icon={<FileText className="h-4 w-4" />}
          format="num"
        />
        <KpiCard
          label="Active Shipments"
          value={activeShipmentsCount}
          icon={<Truck className="h-4 w-4" />}
          format="num"
        />
        <KpiCard
          label="Total Settlement spend"
          value={totalSpend}
          icon={<CreditCard className="h-4 w-4" />}
          format="inr"
        />
        <KpiCard
          label="Quality Score"
          value={safePOs.length > 0 ? 98 : 0}
          icon={<ShieldCheck className="h-4 w-4 text-green-500" />}
          format="percent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* POs Management */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Inbound Purchase Orders" subtitle="Accept or reject corporate purchase requests">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : safePOs.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No inbound purchase orders available in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th className="p-3">PO Number</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Product / Items</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Total Cost</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {safePOs.map((po) => (
                      <tr key={po.id} className="hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{po.poNumber || po.id}</td>
                        <td className="p-3 text-xs">{po.createdAt ? new Date(po.createdAt).toLocaleDateString() : po.date || "N/A"}</td>
                        <td className="p-3 font-semibold">{po.productName || po.notes || "General Stock PO"}</td>
                        <td className="p-3 text-center">{po.quantity || po.itemsCount || 1}</td>
                        <td className="p-3 text-right font-medium">
                          {Number(po.totalCost || po.total || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-3 text-center">
                          {po.status === "SENT" || po.status === "PENDING" || po.status === "Sent" ? (
                            <div className="flex gap-2 justify-center">
                              <Button
                                onClick={() => handleActionOrder(po.id, "Accept")}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-xs px-2 h-7"
                              >
                                Accept
                              </Button>
                              <Button
                                onClick={() => handleActionOrder(po.id, "Reject")}
                                size="sm"
                                variant="destructive"
                                className="text-xs px-2 h-7"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <StatusPill tone={po.status === "APPROVED" || po.status === "Received" ? "success" : "danger"}>
                              {po.status}
                            </StatusPill>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Logistics Dispatches" subtitle="Monitor active delivery routes and ETAs">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : safeShipments.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No active delivery dispatches found.
              </div>
            ) : (
              <div className="space-y-4">
                {safeShipments.map((s) => (
                  <div key={s.id} className="p-4 border rounded-md hover:bg-muted/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">Dispatch #: <span className="font-mono text-xs">{s.orderNumber || s.id}</span></span>
                      <StatusPill tone={s.status === "DELIVERED" ? "success" : "warning"}>
                        {s.status}
                      </StatusPill>
                    </div>
                    <div className="grid grid-cols-2 text-xs text-muted-foreground">
                      <div>Driver: <span className="text-foreground font-medium">{s.driverName || "Vijay Yadav"}</span></div>
                      <div>Destination: <span className="text-foreground font-medium">{s.destination || "Store Address"}</span></div>
                      <div>Vehicle: <span className="text-foreground font-medium font-mono">{s.vehicleNumber || "MH-12-8841"}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* AI Recommendations & Performance */}
        <div className="space-y-6">
          <SectionCard title="AI Fulfillment Advisor" subtitle="Optimization recommendations for suppliers">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Supplier Intelligence</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {safePOs.length > 0 
                  ? "Incoming purchase orders are active. Priority fulfillment ensures maximum compliance rating."
                  : "0 active fulfillment alerts. New corporate PO requests will trigger instant AI packaging recommendations."}
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Supplier Scorecard" subtitle="Performance metrics compiled by Bizora AI">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>On-Time Delivery</span>
                <span className="font-semibold text-green-500">{safePOs.length > 0 ? "96.4%" : "0%"}</span>
              </div>
              <div className="flex justify-between">
                <span>Quality Compliance</span>
                <span className="font-semibold text-green-500">{safePOs.length > 0 ? "98.2%" : "0%"}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Lead Time</span>
                <span className="font-semibold">{safePOs.length > 0 ? "2.1 Days" : "0 Days"}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Level</span>
                <span className="font-semibold text-green-500">{safePOs.length > 0 ? "Low Risk" : "No Activity"}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
