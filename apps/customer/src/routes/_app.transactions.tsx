import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader, SectionCard, StatusPill } from "@/components/page-header";
import { useAuth } from "@/lib/auth-context";
import { fmtINR } from "@/lib/mock-data";
import { useState, useEffect } from "react";
import {
  Loader2,
  Receipt,
  Truck,
  CheckCircle2,
  Clock,
  Store,
  Printer,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Package,
  KeyRound,
  FileText,
  MapPin,
  ArrowRight,
  QrCode,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import {
  getCustomerOrders,
  CustomerOrder,
  getDeliveryOtp,
  OrderItem,
} from "@/lib/customer-orders";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/transactions")({
  head: () => ({
    meta: [
      { title: "My Orders & Digital Receipts — Bizora Customer" },
      {
        name: "description",
        content: "Track past orders, view doorstep OTP, and download official itemized GST receipts.",
      },
    ],
  }),
  component: CustomerTransactions,
});

function CustomerTransactions() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<CustomerOrder[]>(() => getCustomerOrders());
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "DELIVERED">("ALL");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<CustomerOrder | null>(null);

  // Sync state dynamically if user places an order in another tab or component
  useEffect(() => {
    const handleSync = () => {
      setOrders(getCustomerOrders());
    };
    window.addEventListener("bizora-orders-updated", handleSync);
    return () => window.removeEventListener("bizora-orders-updated", handleSync);
  }, []);

  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status !== "DELIVERED");
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeOtp = activeOrders[0]?.otp || (activeOrders[0] ? getDeliveryOtp(activeOrders[0].id) : null);

  const filteredOrders =
    filter === "ACTIVE"
      ? activeOrders
      : filter === "DELIVERED"
      ? deliveredOrders
      : orders;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="My Orders & Digital Receipts"
        description="Official itemized GST digital invoices, doorstep verification OTP, and live order tracking."
        badge={
          <StatusPill status={activeOrders.length > 0 ? "healthy" : "normal"}>
            {activeOrders.length > 0
              ? `${activeOrders.length} Order In Transit · Live GPS`
              : `${totalOrders} Orders Placed`}
          </StatusPill>
        }
        action={
          <Button
            size="sm"
            onClick={() => navigate({ to: "/customer-portal" })}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Order Essentials (10-Min)</span>
          </Button>
        }
      />

      {/* 2. Customer Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Total Orders Placed"
          value={totalOrders}
          format="num"
          icon={<ShoppingBag className="h-4 w-4 text-emerald-600" />}
        />
        <KpiCard
          label="Active In-Transit"
          value={activeOrders.length}
          format="num"
          icon={<Truck className="h-4 w-4 text-emerald-600" />}
        />
        <KpiCard
          label="Total Amount Spent"
          value={totalSpent}
          format="inr"
          icon={<Receipt className="h-4 w-4 text-emerald-600" />}
        />

        {/* Doorstep OTP Card */}
        <div className="card-elevated group relative w-full overflow-hidden p-4 text-left border-amber-300 bg-amber-50/40">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Active Doorstep OTP
              </p>
              <p className="mt-1 font-mono text-2xl font-black tracking-wider text-slate-900">
                {activeOtp ? activeOtp : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {activeOtp ? "Share with rider at doorstep" : "No active deliveries"}
              </p>
            </div>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500 text-slate-950 font-bold">
              <KeyRound className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-hairline pb-2">
        <button
          onClick={() => setFilter("ALL")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === "ALL"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-surface"
          }`}
        >
          All Orders ({totalOrders})
        </button>
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === "ACTIVE"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-surface"
          }`}
        >
          In-Transit / Live ({activeOrders.length})
        </button>
        <button
          onClick={() => setFilter("DELIVERED")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filter === "DELIVERED"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-surface"
          }`}
        >
          Delivered & Invoices ({deliveredOrders.length})
        </button>
      </div>

      {/* 4. Orders & Receipts List */}
      {filteredOrders.length === 0 ? (
        <SectionCard>
          <div className="py-16 text-center space-y-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500 mx-auto">
              <Receipt className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">No orders found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You don&apos;t have any orders under this filter. Browse Bizora Fresh to get groceries delivered in 10 minutes.
            </p>
            <Button
              size="sm"
              onClick={() => navigate({ to: "/customer-portal" })}
              className="bg-emerald-600 hover:bg-emerald-500 text-white mt-2"
            >
              Start Shopping Now
            </Button>
          </div>
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isDelivered = order.status === "DELIVERED";
            const currentOtp = order.otp || getDeliveryOtp(order.id);

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header: Order ID, Date, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {order.id}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isDelivered
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-emerald-500 text-slate-950 animate-pulse"
                        }`}
                      >
                        {isDelivered ? "Delivered" : "⚡ In Transit (10-Min)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Placed {order.createdAt || "Recently"}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-700">
                        <Store className="h-3 w-3 text-emerald-600" />
                        {order.acceptedStore || "GrandSquare Supermart"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline sm:flex-col sm:items-end gap-2 sm:gap-0">
                    <span className="text-base font-extrabold text-slate-900">
                      {fmtINR(order.total)}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {order.paymentMethod || "UPI Paid"}
                    </span>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Items in Order ({order.items?.length || 0})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {order.items?.map((item: OrderItem, idx: number) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-8 w-8 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-slate-200 grid place-items-center text-[10px]">
                              📦
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Qty: {item.quantity} · ₹{item.price} each
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-800 ml-2">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doorstep OTP & Rider Contact if Active */}
                {!isDelivered && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500 text-slate-950 font-bold">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          Doorstep Security OTP:{" "}
                          <span className="font-mono text-base font-black text-amber-800">
                            {currentOtp}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Rider: {order.driverName || "Vijay Yadav"} ({order.driverPhone || "+91 98765 43211"})
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate({ to: "/logistics" })}
                      className="border-amber-400 text-amber-900 hover:bg-amber-100 text-xs gap-1.5 h-8 shrink-0"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      Track Live Rider Map
                    </Button>
                  </div>
                )}

                {/* Action Buttons: Invoice, Reorder, Details */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[280px] sm:max-w-md">
                      {order.address}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Digital GST Invoice</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate({ to: "/customer-portal" })}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1 h-8"
                    >
                      <span>Reorder Items</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Official Digital GST Tax Invoice Dialog */}
      <Dialog
        open={Boolean(selectedInvoiceOrder)}
        onOpenChange={(open) => !open && setSelectedInvoiceOrder(null)}
      >
        <DialogContent className="max-w-xl p-6 bg-white text-slate-900 rounded-2xl max-h-[92vh] overflow-y-auto">
          {selectedInvoiceOrder && (
            <div className="space-y-4" id="printable-gst-invoice">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <div className="flex items-center gap-1.5 font-black text-lg text-slate-900">
                    <span className="text-emerald-600">⚡</span>
                    <span>BIZORA HYPERLOCAL EXPRESS</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Fulfilling Partner: {selectedInvoiceOrder.acceptedStore || "GrandSquare Supermart"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    GSTIN: 27AABCB1234F1Z5 · FSSAI Lic: 11521018000412
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                    Tax Invoice
                  </span>
                  <p className="font-mono text-xs font-bold text-slate-800 mt-1">
                    INV-2026-{selectedInvoiceOrder.id}
                  </p>
                  <p className="text-[10px] text-slate-400">{selectedInvoiceOrder.createdAt || "Today"}</p>
                </div>
              </div>

              {/* Customer & Delivery Details */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Billed To:
                  </span>
                  <p className="font-bold text-slate-900">{user?.name || "Verified Customer"}</p>
                  <p className="text-slate-500 text-[11px] line-clamp-2">
                    {selectedInvoiceOrder.address}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Payment Status:
                  </span>
                  <p className="font-bold text-emerald-700">
                    {selectedInvoiceOrder.paymentMethod || "UPI Instant (NPCI)"}
                  </p>
                  <p className="text-slate-500 text-[11px]">Settlement Ref: TXN-{selectedInvoiceOrder.id}-OKAXIS</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border-b">
                    <tr>
                      <th className="p-2">Item Description</th>
                      <th className="p-2 text-center">HSN</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Taxable</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {selectedInvoiceOrder.items?.map((item, idx) => {
                      const taxable = Math.round((item.price * item.quantity) / 1.05);
                      return (
                        <tr key={idx}>
                          <td className="p-2 font-medium text-slate-900">{item.name}</td>
                          <td className="p-2 text-center text-slate-500 font-mono text-[10px]">0401</td>
                          <td className="p-2 text-center text-slate-700">{item.quantity}</td>
                          <td className="p-2 text-right text-slate-700">₹{item.price}</td>
                          <td className="p-2 text-right text-slate-500">₹{taxable}</td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            ₹{item.price * item.quantity}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tax & Total Calculation */}
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span>₹{Math.round(selectedInvoiceOrder.total * 0.95)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (2.5%):</span>
                  <span>₹{Math.round(selectedInvoiceOrder.total * 0.025)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST (2.5%):</span>
                  <span>₹{Math.round(selectedInvoiceOrder.total * 0.025)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>10-Minute Express Delivery Charge:</span>
                  <span>FREE</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm border-t pt-2 text-slate-900">
                  <span>Grand Total (Incl. all taxes):</span>
                  <span className="font-mono text-base text-emerald-700">
                    {fmtINR(selectedInvoiceOrder.total)}
                  </span>
                </div>
              </div>

              {/* Digital Verification & Security Seal */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-700 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-900">Digitally Verified GST Tax Invoice</p>
                    <p className="text-[10px] text-emerald-700">
                      Generated under Section 31 of CGST Act, 2017. Valid for ITC input tax credit.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded border border-emerald-300 text-emerald-800">
                  OTP VERIFIED: {selectedInvoiceOrder.otp || getDeliveryOtp(selectedInvoiceOrder.id)}
                </span>
              </div>

              {/* Footer Buttons */}
              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save as PDF</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
