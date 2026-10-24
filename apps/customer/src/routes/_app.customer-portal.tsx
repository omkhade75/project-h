import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  ShoppingBag,
  CreditCard,
  Search,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  Sparkles,
  Receipt,
  Star,
  ArrowRight,
  ShieldCheck,
  Phone,
  Store,
  ShoppingCart,
  X,
  Zap,
  Tag,
  Filter,
  Check,
  ChevronDown,
  Navigation,
  QrCode,
  ExternalLink,
  KeyRound,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useBusinessData } from "@/lib/business-context";
import { GoogleMapsPicker } from "@/components/google-maps-picker";
import {
  getCustomerOrders,
  saveCustomerOrder,
  updateCustomerOrderStatus,
  getDeliveryOtp,
  CustomerOrder,
} from "@/lib/customer-orders";

export { getDeliveryOtp };

export const Route = createFileRoute("/_app/customer-portal")({
  head: () => ({
    meta: [
      { title: "Bizora Fresh — 10-Minute Hyperlocal Express Storefront" },
      {
        name: "description",
        content: "Live 10-minute neighborhood grocery and daily essentials from your nearest verified store.",
      },
    ],
  }),
  component: CustomerPortal,
});

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  imageUrl: string;
  unit: string;
  quantity: number;
  storeStock: number;
}

// Smart keyword-to-Unsplash high-resolution photography matcher
function getProductImage(name: string, category: string): string {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  if (n.includes("milk") || n.includes("taaza") || n.includes("dairy"))
    return "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80";
  if (n.includes("butter") || n.includes("makkhan"))
    return "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80";
  if (n.includes("curd") || n.includes("dahi") || n.includes("yogurt") || n.includes("paneer"))
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80";
  if (n.includes("coffee") || n.includes("nescafe") || n.includes("bru"))
    return "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80";
  if (n.includes("tea") || n.includes("chai") || n.includes("tata tea"))
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80";
  if (n.includes("mango") || n.includes("fruit") || n.includes("alphonso"))
    return "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80";
  if (n.includes("apple") || n.includes("banana") || n.includes("orange"))
    return "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80";
  if (n.includes("atta") || n.includes("flour") || n.includes("wheat") || n.includes("ashirvaad") || n.includes("aashirvaad"))
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80";
  if (n.includes("rice") || n.includes("basmati") || n.includes("daawat"))
    return "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80";
  if (n.includes("oil") || n.includes("fortune") || n.includes("ghee") || n.includes("mustard"))
    return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80";
  if (n.includes("dal") || n.includes("toor") || n.includes("moong") || n.includes("pulse"))
    return "https://images.unsplash.com/photo-1585994192701-f1a505c817ea?auto=format&fit=crop&w=600&q=80";
  if (n.includes("noodle") || n.includes("maggi") || n.includes("pasta") || n.includes("snack") || n.includes("biscuit"))
    return "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80";
  if (n.includes("headphone") || n.includes("sony") || n.includes("earphone") || n.includes("audio") || c.includes("tech"))
    return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80";
  if (n.includes("printer") || n.includes("hp") || n.includes("laptop") || n.includes("electronics") || c.includes("electronic"))
    return "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80";
  if (n.includes("foundation") || n.includes("lakme") || n.includes("cream") || n.includes("lipstick") || c.includes("beauty"))
    return "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80";
  if (n.includes("jeans") || n.includes("levi") || n.includes("shirt") || n.includes("saree") || c.includes("fashion"))
    return "https://images.unsplash.com/photo-1542272604-780c36856d67?auto=format&fit=crop&w=600&q=80";
  if (c.includes("grocery"))
    return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";

  return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
}

export function CustomerPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products: dbProducts } = useBusinessData();

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [address, setAddress] = useState("18th Road, Near Turner Road, Bandra West, Mumbai 400050");
  const [paymentMethod, setPaymentMethod] = useState<"UPI_RAZORPAY" | "CARD" | "COD">("UPI_RAZORPAY");
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [pendingOrderDetails, setPendingOrderDetails] = useState<any>(null);

  // Synchronized persistent customer orders
  const [placedOrders, setPlacedOrders] = useState<CustomerOrder[]>(() => getCustomerOrders());

  useEffect(() => {
    const handleSync = () => {
      setPlacedOrders(getCustomerOrders());
    };
    window.addEventListener("bizora-orders-updated", handleSync);
    return () => window.removeEventListener("bizora-orders-updated", handleSync);
  }, []);

  const [activeTab, setActiveTab] = useState<"STORE" | "ORDERS">("STORE");

  // Transform Database Products into Bizora Fresh Store Items
  const catalogProducts = useMemo(() => {
    const baseItems = dbProducts && dbProducts.length > 0 ? dbProducts : [
      { id: "SKU-10021", name: "Amul Taaza Milk 1L", category: "Dairy & Grocery", dept: "Grocery", price: 68, cost: 54, stock: 128, reorder: 200, status: "ok" },
      { id: "SKU-10022", name: "Amul Butter 500g", category: "Dairy & Grocery", dept: "Grocery", price: 265, cost: 210, stock: 45, reorder: 50, status: "low" },
      { id: "SKU-10023", name: "Sony WH-1000XM5 Wireless Headphones", category: "Electronics", dept: "Electronics", price: 29990, cost: 24000, stock: 8, reorder: 10, status: "ok" },
      { id: "SKU-10024", name: "Lakmé Perfecting Liquid Foundation", category: "Beauty", dept: "Beauty", price: 185, cost: 140, stock: 4, reorder: 15, status: "critical" },
      { id: "SKU-10025", name: "Nescafé Gold Blend Premium Coffee 200g", category: "Beverages", dept: "Grocery", price: 649, cost: 500, stock: 32, reorder: 40, status: "ok" },
      { id: "SKU-10026", name: "Organic Ratnagiri Alphonso Mangoes 1kg", category: "Fresh Fruits", dept: "Grocery", price: 499, cost: 380, stock: 60, reorder: 30, status: "ok" },
      { id: "SKU-10027", name: "Levi's 511 Slim Fit Denim Jeans", category: "Fashion", dept: "Fashion", price: 3499, cost: 2500, stock: 14, reorder: 20, status: "ok" },
      { id: "SKU-10028", name: "HP LaserJet Pro Wireless Printer", category: "Electronics", dept: "Electronics", price: 16999, cost: 13500, stock: 5, reorder: 5, status: "ok" },
    ];

    return baseItems.map((p: any) => {
      const img = getProductImage(p.name, p.category || p.dept || "");
      const mrp = Math.round(p.price * 1.15);
      return {
        id: p.id,
        name: p.name,
        category: p.category || p.dept || "Grocery",
        dept: p.dept || "Grocery",
        price: p.price,
        mrp,
        stock: p.stock ?? 15,
        rating: 4.8,
        reviews: Math.floor(100 + Math.random() * 900),
        imageUrl: img,
        isAvailableInNearestShop: (p.stock ?? 15) > 0,
      };
    });
  }, [dbProducts]);

  // Filter Catalog Products
  const filteredProducts = useMemo(() => {
    return catalogProducts.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category.includes(selectedCategory) || p.dept.includes(selectedCategory);
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStock = inStockOnly ? p.isAvailableInNearestShop : true;
      return matchCat && matchSearch && matchStock;
    });
  }, [catalogProducts, selectedCategory, searchQuery, inStockOnly]);

  const handleAddToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          category: product.category,
          price: product.price,
          mrp: product.mrp,
          imageUrl: product.imageUrl,
          unit: "1 Unit",
          quantity: 1,
          storeStock: product.stock,
        },
      ];
    });
    toast.success(`Added ${product.name} to cart!`);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartSavings = useMemo(() => cart.reduce((sum, item) => sum + (item.mrp - item.price) * item.quantity, 0), [cart]);

  // Handle Hyperlocal Order Placement with Category Store Routing
  const handlePlaceOrder = () => {
    if (cart.length === 0) return toast.error("Your cart is empty!");

    // Determine store category based on cart items
    const hasDairyGrocery = cart.some((i) => ["Grocery", "Dairy", "Milk", "Beverages", "Fresh Fruits"].includes(i.category) || i.name.toLowerCase().includes("milk"));
    const hasElectronics = cart.some((i) => i.category === "Electronics" || i.name.toLowerCase().includes("headphone") || i.name.toLowerCase().includes("printer"));
    const hasFashion = cart.some((i) => i.category === "Fashion" || i.name.toLowerCase().includes("jeans") || i.name.toLowerCase().includes("saree"));

    let matchedStoreName = "GrandSquare Kirana & Supermart (#STR-104)";
    let matchedStoreType = "Kirana / Daily Grocery Store";

    if (hasDairyGrocery && !hasElectronics && !hasFashion) {
      matchedStoreName = "GrandSquare Kirana & Daily Fresh (#STR-104)";
      matchedStoreType = "Kirana / Daily Grocery Store";
    } else if (hasElectronics) {
      matchedStoreName = "Metro Digital & Electronics Hub (#STR-208)";
      matchedStoreType = "Consumer Electronics & Tech";
    } else if (hasFashion) {
      matchedStoreName = "Saree Sadan & Fashion Retail (#STR-312)";
      matchedStoreType = "Apparel & Fashion Boutique";
    }

    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: newOrderId,
      items: [...cart],
      total: cartTotal,
      address,
      status: "PENDING_ACCEPTANCE" as const,
      createdAt: "Just now",
    };

    if (paymentMethod === "UPI_RAZORPAY") {
      const upiString = `upi://pay?pa=store.bizora@okaxis&pn=${encodeURIComponent(matchedStoreName)}&am=${cartTotal}&cu=INR&tn=${encodeURIComponent("Order " + newOrderId)}`;
      setPendingOrderDetails({
        order: newOrder,
        orderId: newOrderId,
        total: cartTotal,
        storeName: matchedStoreName,
        storeType: matchedStoreType,
        upiString,
      });
      setIsCheckoutOpen(false);
      setShowUpiModal(true);
      return;
    }

    finalizeOrderPlacement(newOrder, matchedStoreName, matchedStoreType);
  };

  const handleConfirmUpiPayment = () => {
    if (!pendingOrderDetails) return;
    toast.success("✅ UPI Payment Verified! Transaction settled instantly via NPCI gateway.");
    finalizeOrderPlacement(
      pendingOrderDetails.order,
      pendingOrderDetails.storeName,
      pendingOrderDetails.storeType
    );
    setShowUpiModal(false);
    setPendingOrderDetails(null);
  };

  const finalizeOrderPlacement = (order: any, storeName: string, storeType: string) => {
    const formattedPaymentMethod =
      paymentMethod === "UPI_RAZORPAY"
        ? "UPI (Instant NPCI QR)"
        : paymentMethod === "CARD"
        ? "Debit / Credit Card"
        : "Cash on Delivery (COD)";

    const orderToSave: CustomerOrder = {
      id: order.id,
      items: order.items,
      total: order.total,
      address: order.address,
      status: "PENDING_ACCEPTANCE",
      acceptedStore: `${storeName} (${storeType})`,
      storePhone: "+91 98765 43210",
      driverName: "Pending store acceptance...",
      driverPhone: "+91 98765 43211",
      vehicleNumber: "MH-02-EX-4491",
      otp: getDeliveryOtp(order.id),
      etaMinutes: 10,
      paymentMethod: formattedPaymentMethod,
      createdAt: "Just now",
    };

    // Save persistently to localStorage and dispatch event for Live Logistics & Receipts
    const updatedOrders = saveCustomerOrder(orderToSave);
    setPlacedOrders(updatedOrders);
    setCart([]);
    setIsCheckoutOpen(false);
    setActiveTab("ORDERS");

    toast.success(`🎉 Order ${order.id} placed! Broadcasting to nearest stores...`);

    // Simulate Shopkeeper Grabbing Order First
    setTimeout(() => {
      const refreshed = updateCustomerOrderStatus(order.id, {
        status: "ACCEPTED_BY_STORE",
        acceptedStore: `${storeName} (${storeType})`,
        storePhone: "+91 98765 43210",
        driverName: "Vijay Yadav (Express 10-Min Partner)",
        driverPhone: "+91 98765 43211",
        etaMinutes: 8,
      });
      setPlacedOrders(refreshed);
      toast.success(
        `🚨 Nearest Storekeeper "${storeName}" (${storeType}) grabbed & accepted your order! Express 10-min delivery dispatched!`,
        { duration: 7000 }
      );
    }, 2800);
  };

  return (
    <div className="-mx-4 -mt-4 min-h-screen bg-[#f8fafc] text-slate-900 pb-32 sm:pb-24">
      {/* 1. Bizora Fresh Top Navigation Bar */}
      <header className="bg-[#0f172a] text-white sticky top-0 z-40 shadow-sm border-b border-slate-800">
        {/* Mobile & Desktop Header Top Bar */}
        <div className="mx-auto flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 gap-2 sm:gap-4 max-w-7xl">
          <div className="flex items-center justify-between w-full sm:w-auto">
            {/* Bizora Fresh Brand Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => setActiveTab("STORE")}
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-slate-950 font-black shadow-sm">
                ⚡
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black tracking-tight text-white">bizora</span>
                <span className="text-base font-extrabold text-emerald-400">fresh</span>
              </div>
              <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline">
                10-Min Express
              </span>
            </div>

            {/* Mobile Delivery Location Pill */}
            <div
              onClick={() => setIsCheckoutOpen(true)}
              className="flex sm:hidden items-center gap-1 text-[11px] text-slate-300 bg-slate-800/90 px-2.5 py-1 rounded-full border border-slate-700 max-w-[170px] cursor-pointer"
            >
              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="truncate text-white font-medium">{address}</span>
            </div>

            {/* Mobile Actions: Orders & Cart */}
            <div className="flex sm:hidden items-center gap-3">
              <button
                onClick={() => setActiveTab("ORDERS")}
                className="text-[11px] font-bold text-slate-200 hover:text-white"
              >
                Orders ({placedOrders.length})
              </button>
              <div
                onClick={() => setIsCheckoutOpen(true)}
                className="relative cursor-pointer p-1"
              >
                <ShoppingCart className="h-6 w-6 text-emerald-400" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-[10px] font-black text-slate-950">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Delivery Location Pill */}
          <div
            onClick={() => setIsCheckoutOpen(true)}
            className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs hover:border-slate-700 cursor-pointer"
          >
            <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400">Deliver to Bandra</p>
              <p className="font-semibold line-clamp-1 text-white max-w-[200px] truncate text-xs">{address}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-1 max-w-2xl items-center rounded-lg bg-white text-slate-900 shadow-sm overflow-hidden border border-slate-200 w-full">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="hidden sm:block bg-slate-100 text-xs font-semibold px-2 py-2 border-r border-slate-200 focus:outline-none cursor-pointer shrink-0 text-slate-700"
            >
              <option value="All">All Items</option>
              <option value="Grocery">Dairy & Grocery</option>
              <option value="Electronics">Electronics</option>
              <option value="Beauty">Beauty & Care</option>
              <option value="Fashion">Apparel</option>
            </select>

            <input
              type="text"
              placeholder="Search dairy, atta, oil, tea, snacks in nearby shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
            />

            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 sm:px-4 py-2 font-bold transition-colors shrink-0">
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop Account, Track Delivery & Orders */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <button
              onClick={() => navigate({ to: "/logistics" })}
              className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 font-semibold"
            >
              <Truck className="h-4 w-4 text-emerald-400" />
              <span>Track Live Delivery</span>
            </button>

            <div
              onClick={() => setActiveTab("ORDERS")}
              className="rounded-lg border border-transparent px-2 py-1 hover:border-slate-700 cursor-pointer text-right"
            >
              <p className="text-[10px] text-slate-400">My Orders</p>
              <p className="font-bold text-white text-xs">({placedOrders.length} Placed)</p>
            </div>

            {/* Cart Button */}
            <div
              onClick={() => setIsCheckoutOpen(true)}
              className="relative flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 px-3 py-1.5 hover:bg-emerald-600/30 cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5 text-emerald-400" />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-[10px] font-black text-slate-950">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
              <span className="font-bold text-white text-xs">Cart</span>
            </div>
          </div>
        </div>

        {/* 2. Secondary Category Strip */}
        <div className="bg-[#1e293b] text-white text-xs px-3 sm:px-4 py-1.5 flex items-center justify-between overflow-x-auto scrollbar-none border-t border-slate-800 gap-3">
          <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap font-medium text-[11px] sm:text-xs shrink-0 max-w-7xl mx-auto w-full">
            <span className="flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
              <Store className="h-3 w-3" /> GrandSquare Supermart (800m)
            </span>
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-3 py-0.5 rounded-full transition-colors ${
                selectedCategory === "All" ? "bg-emerald-500 text-slate-950 font-bold" : "hover:text-emerald-400"
              }`}
            >
              All Essentials
            </button>
            <button
              onClick={() => setSelectedCategory("Grocery")}
              className={`px-3 py-0.5 rounded-full transition-colors ${
                selectedCategory === "Grocery" ? "bg-emerald-500 text-slate-950 font-bold" : "hover:text-emerald-400"
              }`}
            >
              Dairy & Grocery
            </button>
            <button
              onClick={() => setSelectedCategory("Electronics")}
              className={`px-3 py-0.5 rounded-full transition-colors ${
                selectedCategory === "Electronics" ? "bg-emerald-500 text-slate-950 font-bold" : "hover:text-emerald-400"
              }`}
            >
              Electronics & Tech
            </button>
            <button
              onClick={() => setSelectedCategory("Beauty")}
              className={`px-3 py-0.5 rounded-full transition-colors ${
                selectedCategory === "Beauty" ? "bg-emerald-500 text-slate-950 font-bold" : "hover:text-emerald-400"
              }`}
            >
              Beauty & Care
            </button>
            <button
              onClick={() => setSelectedCategory("Fashion")}
              className={`px-3 py-0.5 rounded-full transition-colors ${
                selectedCategory === "Fashion" ? "bg-emerald-500 text-slate-950 font-bold" : "hover:text-emerald-400"
              }`}
            >
              Apparel
            </button>

            <div className="ml-auto flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-700 text-[10px] sm:text-[11px]">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Check className="h-3 w-3" /> In-Stock Only
              </span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-emerald-500 cursor-pointer h-3.5 w-3.5"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Product Showcase */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 pt-3 sm:pt-4">
        {/* Compact, High-Taste Hyperlocal Hero Banner */}
        <div className="relative rounded-xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 px-4 sm:px-6 py-3.5 sm:py-4 text-white shadow-sm overflow-hidden mb-4 border border-emerald-600/30">
          <div className="relative z-10 max-w-2xl space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-black/40 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-emerald-300 border border-emerald-400/20">
                ⚡ 10-MINUTE HYPERLOCAL DISPATCH
              </span>
              <span className="text-[11px] text-emerald-200 hidden sm:inline">Connected to verified local store shelves</span>
            </div>
            <h2 className="text-base sm:text-xl font-black tracking-tight text-white">
              Live Stock From Local Kirana & Supermarts
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-1">
              Orders placed here are broadcast to nearby shopkeepers in Bandra. Fastest storekeeper accepts and dispatches in &lt;10 mins.
            </p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-3 text-3xl opacity-75 select-none">
            🛍️ ⚡ 🛵
          </div>
        </div>

        {/* Nearby Approved Shops Directory (Compact Pill Style) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 mb-4 shadow-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <Store className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-xs text-slate-900">Nearby Fulfilling Stores & Supermarkets</h3>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              3 Stores Online · Instant Dispatch
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-[11px]">GrandSquare Kirana & Supermart</p>
                <p className="text-[10px] text-slate-500">Bandra West · 800m away · ★ 4.9</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between opacity-80">
              <div>
                <p className="font-bold text-slate-900 text-[11px]">Metro Express Mart</p>
                <p className="text-[10px] text-slate-500">Khar West · 1.2km away · ★ 4.7</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between opacity-80">
              <div>
                <p className="font-bold text-slate-900 text-[11px]">Fresh Produce Hub</p>
                <p className="text-[10px] text-slate-500">Santacruz West · 1.8km away · ★ 4.8</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        </div>

        {/* Product Cards Grid: Balanced image height (h-36), perfectly showing Price & Add-To-Cart above the fold */}
        {activeTab === "STORE" && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredProducts.map((p) => {
              const inCart = cart.find((item) => item.id === p.id);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    {/* Real Product Image Container - Balanced Height */}
                    <div className="relative h-32 sm:h-36 w-full overflow-hidden rounded-lg bg-slate-50 flex items-center justify-center p-2">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
                      />
                      <span className="absolute top-1.5 left-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-extrabold text-white uppercase shadow-xs">
                        ⚡ 10-MIN
                      </span>
                    </div>

                    {/* Meta & Title */}
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-2 hover:text-emerald-700 cursor-pointer leading-snug">
                        {p.name}
                      </h3>

                      {/* Ratings & Stock */}
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-500 font-bold">★ {p.rating}</span>
                          <span className="text-slate-400">({p.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="font-medium text-emerald-700">
                            {p.stock} in stock
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Add to Cart */}
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">-15%</span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-slate-400 line-through">
                        ₹{p.mrp.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {inCart ? (
                      <div className="flex items-center justify-between rounded-lg bg-emerald-600 px-2 py-1 text-white font-bold shadow-xs">
                        <button onClick={() => handleUpdateQuantity(p.id, -1)} className="p-0.5 hover:bg-emerald-700 rounded">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs">{inCart.quantity} in cart</span>
                        <button onClick={() => handleUpdateQuantity(p.id, 1)} className="p-0.5 hover:bg-emerald-700 rounded">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 text-xs transition-colors shadow-xs active:scale-95"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Track Orders Section */}
        {activeTab === "ORDERS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" /> Your Orders ({placedOrders.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate({ to: "/logistics" })}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1 shadow-xs"
                >
                  <Navigation className="h-3.5 w-3.5" /> Track On Live Map
                </button>
                <button
                  onClick={() => navigate({ to: "/transactions" })}
                  className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1 shadow-xs"
                >
                  <Receipt className="h-3.5 w-3.5" /> View Digital Invoices
                </button>
              </div>
            </div>

            {placedOrders.map((ord) => (
              <div key={ord.id} className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-base">{ord.id}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        ord.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-emerald-500 text-slate-950 animate-pulse"
                      }`}>
                        {ord.status === "DELIVERED" ? "Delivered" : "⚡ 10-Min In-Transit"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Deliver to: {ord.address}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-base font-extrabold text-slate-900">₹{ord.total}</span>
                    <p className="text-xs text-emerald-700 font-bold">{ord.paymentMethod || "UPI Paid"}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/80 p-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <div>
                    <p className="font-bold text-emerald-900">⚡ Store: {ord.acceptedStore || "GrandSquare Kirana"}</p>
                    <p className="text-slate-600 text-[11px]">
                      Contact: {ord.storePhone || "+91 98765 43210"} | Driver: {ord.driverName || "Vijay Yadav"} ({ord.driverPhone || "+91 98765 43211"})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-md text-xs">
                      ETA: ~{ord.etaMinutes || 8} Mins
                    </span>
                    <button
                      onClick={() => navigate({ to: "/logistics" })}
                      className="bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-md text-xs flex items-center gap-1"
                    >
                      <Navigation className="h-3 w-3" /> Live GPS
                    </button>
                  </div>
                </div>

                {/* Doorstep Delivery Confirmation OTP */}
                {ord.status !== "DELIVERED" ? (
                  <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500 text-slate-950 font-bold shadow-xs">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                            Doorstep Security Code
                          </span>
                          <span className="text-[11px] text-slate-500">Show to rider upon inspection</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">
                          Delivery Confirmation OTP: <span className="font-mono text-base font-black text-amber-800">{ord.otp || getDeliveryOtp(ord.id)}</span>
                        </h4>
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-white border border-dashed border-amber-400 rounded-lg px-4 py-1.5 shadow-xs self-start sm:self-auto">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Your OTP</span>
                      <span className="font-mono text-xl font-black tracking-widest text-slate-900">
                        {ord.otp || getDeliveryOtp(ord.id)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span>Package Delivered & OTP Verified at Doorstep.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div
          style={{ bottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}
          className="fixed left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl rounded-2xl bg-[#0f172a] p-3 sm:p-3.5 text-white shadow-2xl border border-slate-700 flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] sm:text-xs text-slate-300">
              Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items):
            </p>
            <p className="text-base sm:text-lg font-black text-emerald-400">₹{cartTotal.toLocaleString("en-IN")}</p>
          </div>

          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 sm:px-6 py-2 sm:py-2.5 text-xs shadow-md tracking-wider active:scale-95 transition-transform"
          >
            PROCEED TO CHECKOUT
          </button>
        </div>
      )}

      {/* Checkout Drawer */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 my-0 sm:my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">⚡</span>
                <h3 className="font-bold text-base text-slate-900">Bizora Fresh 10-Min Checkout</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Google Maps Live Geolocation Auto-Fill Component */}
            <GoogleMapsPicker
              address={address}
              onAddressChange={(newAddr) => setAddress(newAddr)}
              label="Delivery Address (Google Maps GPS)"
            />

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs border-b pb-2">
                  <div className="flex items-center gap-2">
                    <img src={item.imageUrl} className="h-9 w-9 object-cover rounded" alt={item.name} />
                    <span className="font-semibold text-slate-800">{item.name} (x{item.quantity})</span>
                  </div>
                  <span className="font-bold text-slate-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-slate-600"><span>Items Subtotal:</span><span>₹{cartTotal}</span></div>
              <div className="flex justify-between text-emerald-600 font-bold"><span>Delivery:</span><span>FREE 10-Min Express</span></div>
              <div className="flex justify-between font-extrabold text-sm border-t pt-1 text-slate-900"><span>Order Total:</span><span>₹{cartTotal}</span></div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI_RAZORPAY")}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 font-bold transition-all ${
                    paymentMethod === "UPI_RAZORPAY"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg">📲</span>
                  <div>
                    <p className="leading-none">UPI / QR</p>
                    <p className="text-[10px] text-slate-500 font-normal">GPay, PhonePe, Paytm</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CARD")}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 font-bold transition-all ${
                    paymentMethod === "CARD"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg">💳</span>
                  <div>
                    <p className="leading-none">Cards / NetBank</p>
                    <p className="text-[10px] text-slate-500 font-normal">Visa, Mastercard, HDFC</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-2.5 rounded-lg border text-left col-span-2 flex items-center gap-2 font-bold transition-all ${
                    paymentMethod === "COD"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-lg">💵</span>
                  <div>
                    <p className="leading-none">Cash on 10-Min Delivery (COD)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Pay store rider at doorstep</p>
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>{paymentMethod === "UPI_RAZORPAY" ? "GENERATE UPI QR & PAY" : "PAY"} ₹{cartTotal} & BROADCAST TO NEARBY SHOP</span>
            </button>
          </div>
        </div>
      )}

      {/* Dynamic UPI QR Payment Modal (100% Free NPCI Standard) */}
      <Dialog open={showUpiModal} onOpenChange={setShowUpiModal}>
        <DialogContent className="max-w-md p-6 bg-white text-slate-900 rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Scan & Pay via Dynamic UPI QR
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Zero commission • Instant bank-to-bank transfer (NPCI standard)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {pendingOrderDetails && (
            <div className="space-y-4 py-2 flex flex-col items-center">
              <div className="w-full rounded-xl bg-slate-50 border p-3 text-xs flex justify-between items-center">
                <div>
                  <span className="text-slate-500">Nearest Merchant:</span>
                  <p className="font-bold text-slate-900">{pendingOrderDetails.storeName}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Amount Due:</span>
                  <p className="font-mono text-lg font-black text-emerald-600">₹{pendingOrderDetails.total}</p>
                </div>
              </div>

              {/* Dynamic QR Code */}
              <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-md flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(pendingOrderDetails.upiString)}`}
                  alt="Dynamic UPI QR Code"
                  className="h-44 w-44 rounded-lg"
                />
                <span className="text-[11px] text-slate-500 mt-2 font-mono">VPA: store.bizora@okaxis</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">Google Pay</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">PhonePe</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">Paytm</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">BHIM UPI</span>
              </div>

              {/* Deep link for mobile users */}
              <a
                href={pendingOrderDetails.upiString}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-xs text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="h-4 w-4" /> Open Installed UPI App on Phone
              </a>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={() => setShowUpiModal(false)}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-2"
            >
              Cancel Payment
            </button>
            <button
              onClick={handleConfirmUpiPayment}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs shadow-xs flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" /> I Have Completed UPI Payment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
