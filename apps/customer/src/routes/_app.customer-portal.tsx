import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, StatusPill } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/customer-portal")({
  head: () => ({
    meta: [
      { title: "Blinkit / Amazon Quick Store — Bizora Customer" },
      {
        name: "description",
        content: "Order grocery, electronics, beauty & fashion with 10-minute hyperlocal shopkeeper delivery dispatch.",
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
  image: string;
  unit: string;
  quantity: number;
}

interface ProductCatalogItem {
  id: string;
  name: string;
  category: string;
  dept: string;
  price: number;
  mrp: number;
  unit: string;
  rating: number;
  reviews: number;
  badge?: string;
  image: string;
}

export function CustomerPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock catalog matching Amazon / Blinkit quick-commerce
  const initialProducts: ProductCatalogItem[] = [
    {
      id: "prod-001",
      name: "Amul Taaza Fresh Toned Milk 1L",
      category: "Dairy & Eggs",
      dept: "Grocery",
      price: 68,
      mrp: 75,
      unit: "1 Litre Pouch",
      rating: 4.9,
      reviews: 1420,
      badge: "⚡ 10 MIN DELIVERY",
      image: "🥛",
    },
    {
      id: "prod-002",
      name: "Amul Pasteurised Butter 500g",
      category: "Dairy & Eggs",
      dept: "Grocery",
      price: 265,
      mrp: 285,
      unit: "500g Pack",
      rating: 4.8,
      reviews: 890,
      badge: "🔥 POPULAR",
      image: "🧈",
    },
    {
      id: "prod-003",
      name: "Sony WH-1000XM5 Wireless ANC Headphones",
      category: "Electronics",
      dept: "Electronics",
      price: 29990,
      mrp: 34990,
      unit: "1 Unit (Black)",
      rating: 4.9,
      reviews: 512,
      badge: "⭐ BESTSELLER",
      image: "🎧",
    },
    {
      id: "prod-004",
      name: "Lakmé Perfecting Liquid Foundation 27ml",
      category: "Beauty & Cosmetics",
      dept: "Beauty",
      price: 185,
      mrp: 225,
      unit: "27ml Glass Bottle",
      rating: 4.6,
      reviews: 320,
      badge: "15% OFF",
      image: "💄",
    },
    {
      id: "prod-005",
      name: "Nescafé Gold Blend Premium Coffee 200g",
      category: "Beverages",
      dept: "Grocery",
      price: 649,
      mrp: 750,
      unit: "200g Jar",
      rating: 4.8,
      reviews: 950,
      badge: "⚡ 10 MIN DELIVERY",
      image: "☕",
    },
    {
      id: "prod-006",
      name: "Organic Ratnagiri Alphonso Mangoes 1kg",
      category: "Fresh Fruits",
      dept: "Grocery",
      price: 499,
      mrp: 650,
      unit: "1kg (approx 4-5 pcs)",
      rating: 4.9,
      reviews: 2100,
      badge: "🥭 FRESH HARVEST",
      image: "🥭",
    },
    {
      id: "prod-007",
      name: "Levi's 511 Slim Fit Stretch Denim Jeans",
      category: "Apparel & Fashion",
      dept: "Fashion",
      price: 3499,
      mrp: 4299,
      unit: "Size 32/32",
      rating: 4.7,
      reviews: 430,
      badge: "🔥 20% OFF",
      image: "👖",
    },
    {
      id: "prod-008",
      name: "HP LaserJet Pro Wireless Monochrome Printer",
      category: "Electronics",
      dept: "Electronics",
      price: 16999,
      mrp: 19999,
      unit: "1 Printer Set",
      rating: 4.7,
      reviews: 180,
      badge: "OFFICE ESSENTIAL",
      image: "🖨️",
    },
  ];

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [address, setAddress] = useState("Flat 402, Sunshine Heights, Bandra West, Mumbai 400050");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "COD" | "Wallet">("UPI");

  // Hyperlocal Order Grab Simulation State
  const [placedOrders, setPlacedOrders] = useState<Array<{
    id: string;
    items: CartItem[];
    total: number;
    address: string;
    status: "PENDING_ACCEPTANCE" | "ACCEPTED_BY_STORE" | "OUT_FOR_DELIVERY" | "DELIVERED";
    acceptedStore?: string;
    storePhone?: string;
    driverName?: string;
    driverPhone?: string;
    createdAt: string;
  }>>([
    {
      id: "ORD-9021",
      items: [
        { id: "prod-001", name: "Amul Taaza Fresh Toned Milk 1L", category: "Dairy", price: 68, mrp: 75, image: "🥛", unit: "1L", quantity: 2 },
        { id: "prod-002", name: "Amul Pasteurised Butter 500g", category: "Dairy", price: 265, mrp: 285, image: "🧈", unit: "500g", quantity: 1 }
      ],
      total: 401,
      address: "Bandra West, Mumbai 400050",
      status: "ACCEPTED_BY_STORE",
      acceptedStore: "GrandSquare Supermart (Store ID: #STR-104)",
      storePhone: "+91 98765 43210",
      driverName: "Ramesh Kumar",
      driverPhone: "+91 98765 43211",
      createdAt: "10 mins ago"
    }
  ]);

  const [activeTab, setActiveTab] = useState<"STORE" | "ORDERS">("STORE");

  // Add / Remove from Cart
  const handleAddToCart = (product: ProductCatalogItem) => {
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
          image: product.image,
          unit: product.unit,
          quantity: 1,
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

  // Handle Hyperlocal Order Placement
  const handlePlaceOrder = () => {
    if (cart.length === 0) return toast.error("Your cart is empty!");

    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: newOrderId,
      items: [...cart],
      total: cartTotal,
      address,
      status: "PENDING_ACCEPTANCE" as const,
      createdAt: "Just now"
    };

    setPlacedOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setIsCheckoutOpen(false);
    setActiveTab("ORDERS");

    toast.success(`🎉 Order ${newOrderId} placed! Searching nearest shopkeepers...`);

    // Simulate Shopkeeper Grabbing Order First (within 3.5 seconds)
    setTimeout(() => {
      setPlacedOrders((prev) =>
        prev.map((o) => {
          if (o.id === newOrderId) {
            return {
              ...o,
              status: "ACCEPTED_BY_STORE",
              acceptedStore: "GrandSquare Supermart (Store ID: #STR-104)",
              storePhone: "+91 98765 43210",
              driverName: "Ramesh Kumar (Express Delivery)",
              driverPhone: "+91 98765 43211",
            };
          }
          return o;
        })
      );
      toast.success(
        `🚨 Shopkeeper "GrandSquare Supermart" grabbed & accepted your order first! Express delivery dispatched!`,
        { duration: 6000 }
      );
    }, 3500);
  };

  const categories = ["All", "Grocery & Dairy", "Electronics", "Beauty & Cosmetics", "Apparel & Fashion"];

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category.includes(selectedCategory) || p.dept.includes(selectedCategory);
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                <Zap className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" /> Blinkit 10-Min Storefront
              </span>
              <span className="text-xs text-white/80">· Powered by Bizora AI</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Order Fresh Grocery, Tech & Fashion
            </h1>
            <p className="text-sm text-cyan-100 flex items-center gap-1.5 pt-1">
              <MapPin className="h-4 w-4 text-yellow-300" />
              <span>Delivering to: <strong className="text-white">{address}</strong></span>
              <button onClick={() => setAddress(prompt("Enter delivery address:", address) || address)} className="underline text-xs ml-1 hover:text-white">Change</button>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/20 text-center">
              <p className="text-[10px] uppercase tracking-wider text-cyan-200">Customer Wallet</p>
              <p className="text-lg font-bold">₹24,500</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/20 text-center">
              <p className="text-[10px] uppercase tracking-wider text-cyan-200">VIP Loyalty</p>
              <p className="text-lg font-bold flex items-center justify-center gap-1">
                <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" /> 1,250 Pts
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search 5,000+ products (e.g. Amul Milk, Sony ANC, Lakmé, Coffee, Jeans...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-0 bg-white/95 px-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("STORE")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "STORE" ? "bg-white text-blue-700 shadow-md" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              🛍️ Shop Storefront
            </button>
            <button
              onClick={() => setActiveTab("ORDERS")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "ORDERS" ? "bg-white text-blue-700 shadow-md" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              📦 Track Orders ({placedOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === "STORE" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                    : "bg-surface border border-hairline hover:bg-muted text-muted-foreground"
                }`}
              >
                {cat === "All" ? "✨ All Products" : cat}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProducts.map((p) => {
              const inCart = cart.find((item) => item.id === p.id);
              return (
                <div
                  key={p.id}
                  className="group glass rounded-2xl border border-hairline p-4 transition-all hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Badge & Visual */}
                    <div className="relative grid h-36 w-full place-items-center rounded-xl bg-gradient-to-br from-surface to-muted/40 border border-hairline overflow-hidden">
                      {p.badge && (
                        <span className="absolute left-2 top-2 rounded-full bg-cyan-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-sm">
                          {p.badge}
                        </span>
                      )}
                      <span className="text-5xl transition-transform group-hover:scale-110 duration-300">
                        {p.image}
                      </span>
                    </div>

                    {/* Meta */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{p.category}</span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                          <Star className="h-3 w-3 fill-amber-500" /> {p.rating} ({p.reviews})
                        </span>
                      </div>
                      <h3 className="mt-1 font-semibold text-sm line-clamp-2 group-hover:text-cyan-500 transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.unit}</p>
                    </div>
                  </div>

                  {/* Pricing & Add Button */}
                  <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-extrabold text-foreground">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{p.mrp.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500">
                        Save ₹{(p.mrp - p.price).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-2 rounded-lg bg-cyan-600 px-2 py-1 text-white shadow-sm">
                        <button onClick={() => handleUpdateQuantity(p.id, -1)} className="p-1 hover:bg-cyan-700 rounded">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{inCart.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(p.id, 1)} className="p-1 hover:bg-cyan-700 rounded">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(p)}
                        className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20"
                      >
                        <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> ADD TO CART
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Track Orders View */}
      {activeTab === "ORDERS" && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 text-cyan-500" /> Live Hyperlocal Dispatch Tracking
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {placedOrders.map((ord) => (
              <div key={ord.id} className="rounded-2xl border border-hairline bg-surface p-6 shadow-md space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-hairline pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-cyan-500">{ord.id}</span>
                      <span className="text-xs text-muted-foreground">· Placed {ord.createdAt}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Delivery Address: {ord.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold">₹{ord.total.toLocaleString("en-IN")}</p>
                    <StatusPill
                      status={ord.status === "ACCEPTED_BY_STORE" ? "ok" : "warn"}
                      label={ord.status === "ACCEPTED_BY_STORE" ? "ACCEPTED BY NEARBY STORE" : "SEARCHING SHOPKEEPERS..."}
                    />
                  </div>
                </div>

                {/* Hyperlocal Grab Result Banner */}
                {ord.status === "ACCEPTED_BY_STORE" ? (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white font-bold">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                          ⚡ Shopkeeper Accepted First!
                        </p>
                        <h4 className="font-bold text-sm text-foreground">{ord.acceptedStore}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {ord.storePhone}</span>
                          <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Driver: {ord.driverName} ({ord.driverPhone})</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => toast.info(`Calling store owner at ${ord.storePhone}...`)}>
                        <Phone className="mr-1.5 h-3.5 w-3.5" /> Call Store
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Live ETA: 8 Mins
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-center gap-3 animate-pulse">
                    <Clock className="h-6 w-6 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-sm text-amber-400">Searching Nearby Shopkeepers in Bandra West...</h4>
                      <p className="text-xs text-muted-foreground">The first store owner to grab this order will deliver it within 10 minutes!</p>
                    </div>
                  </div>
                )}

                {/* Items Summary */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Items:</p>
                  <div className="flex flex-wrap gap-2">
                    {ord.items.map((it) => (
                      <span key={it.id} className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-muted/40 px-3 py-1 text-xs">
                        <span>{it.image}</span>
                        <span className="font-medium">{it.name}</span>
                        <span className="text-muted-foreground">x{it.quantity}</span>
                        <span className="font-bold">₹{it.price * it.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl rounded-2xl bg-slate-900 p-4 text-white shadow-2xl border border-slate-700 flex items-center justify-between animate-bounce-short">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500 text-white font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
            <div>
              <p className="text-xs text-slate-300">
                {cart.length} SKUs · Total: <strong className="text-white text-base">₹{cartTotal.toLocaleString("en-IN")}</strong>
              </p>
              <p className="text-[11px] text-emerald-400 font-semibold">Saved ₹{cartSavings.toLocaleString("en-IN")} with store discounts!</p>
            </div>
          </div>

          <Button
            onClick={() => setIsCheckoutOpen(true)}
            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold px-6 py-2.5 text-xs shadow-lg shadow-cyan-500/25"
          >
            VIEW CART & CHECKOUT <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Checkout Drawer / Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-hairline bg-background p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-cyan-500" />
                <h3 className="font-bold text-lg">Hyperlocal Express Checkout</h3>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-surface p-3 border border-hairline">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{item.image}</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">₹{item.price} × {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 hover:bg-muted rounded">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-1 hover:bg-muted rounded">
                      <Plus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold text-foreground min-w-[50px] text-right">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Address & Payment Method */}
            <div className="space-y-3 pt-2 border-t border-hairline text-xs">
              <div>
                <label className="font-bold block mb-1">Delivery Address (Blinkit 10-Min Radius)</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-surface text-xs focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["UPI", "COD", "Wallet"] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === method
                          ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                          : "border-hairline bg-surface hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {method === "UPI" ? "📱 Instant UPI" : method === "COD" ? "💵 Cash on Delivery" : "💳 Customer Wallet"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="rounded-xl bg-muted/40 p-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span>Item Subtotal</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span>Store Discount Savings</span>
                <span>-₹{cartSavings.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>10-Min Express Delivery Fee</span>
                <span className="text-emerald-500 font-bold">FREE</span>
              </div>
              <div className="flex justify-between border-t border-hairline pt-2 text-sm font-extrabold text-foreground">
                <span>Grand Total</span>
                <span>₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Button
              onClick={handlePlaceOrder}
              className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold py-3 text-sm shadow-lg shadow-cyan-600/30"
            >
              🚀 PLACE ORDER & BROADCAST TO NEARBY SHOPS
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
