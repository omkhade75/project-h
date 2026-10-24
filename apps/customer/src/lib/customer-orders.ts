/**
 * Centralized Customer Orders & 10-Minute Dispatch Synchronization Store
 * Synchronizes orders between Storefront, Order History, and Live GPS Logistics Tracking.
 */

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  mrp: number;
  imageUrl: string;
  unit: string;
  quantity: number;
}

export interface CustomerOrder {
  id: string;
  items: OrderItem[];
  total: number;
  address: string;
  status: "PENDING_ACCEPTANCE" | "ACCEPTED_BY_STORE" | "OUT_FOR_DELIVERY" | "DELIVERED";
  acceptedStore?: string;
  storePhone?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  otp: string;
  etaMinutes?: number;
  paymentMethod: string;
  createdAt: string;
}

export function getDeliveryOtp(orderNumber: string): string {
  const digits = orderNumber.replace(/\D/g, "");
  const num = parseInt(digits || "9021", 10);
  return ((num * 17 + 23) % 9000 + 1000).toString();
}

const STORAGE_KEY = "bizora_customer_orders";

const DEFAULT_ORDERS: CustomerOrder[] = [
  {
    id: "ORD-9021",
    items: [
      {
        id: "prod-001",
        name: "Amul Taaza Milk 1L",
        category: "Grocery",
        price: 68,
        mrp: 75,
        imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80",
        unit: "1L",
        quantity: 2,
      },
      {
        id: "prod-002",
        name: "Amul Butter 500g",
        category: "Grocery",
        price: 265,
        mrp: 285,
        imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
        unit: "500g",
        quantity: 1,
      },
    ],
    total: 401,
    address: "18th Road, Near Turner Road, Bandra West, Mumbai 400050",
    status: "ACCEPTED_BY_STORE",
    acceptedStore: "GrandSquare Kirana & Daily Fresh (#STR-104)",
    storePhone: "+91 98765 43210",
    driverName: "Vijay Yadav (Express 10-Min Partner)",
    driverPhone: "+91 98765 43211",
    vehicleNumber: "MH-02-EX-4491",
    otp: "8492",
    etaMinutes: 8,
    paymentMethod: "UPI (Google Pay / PhonePe)",
    createdAt: "Just now",
  },
];

export function getCustomerOrders(): CustomerOrder[] {
  if (typeof window === "undefined") return DEFAULT_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ORDERS));
      return DEFAULT_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ORDERS;
  } catch (e) {
    return DEFAULT_ORDERS;
  }
}

export function saveCustomerOrder(order: CustomerOrder): CustomerOrder[] {
  if (typeof window === "undefined") return [order];
  try {
    const current = getCustomerOrders();
    const filtered = current.filter((o) => o.id !== order.id);
    const updated = [order, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("bizora-orders-updated"));
    return updated;
  } catch (e) {
    return [order];
  }
}

export function updateCustomerOrderStatus(
  orderId: string,
  updates: Partial<CustomerOrder>,
): CustomerOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getCustomerOrders();
    const updated = current.map((o) => (o.id === orderId ? { ...o, ...updates } : o));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("bizora-orders-updated"));
    return updated;
  } catch (e) {
    return [];
  }
}

export function getActiveDelivery(): CustomerOrder | null {
  const orders = getCustomerOrders();
  // Find first active order in transit or accepted
  const active = orders.find(
    (o) => o.status === "PENDING_ACCEPTANCE" || o.status === "ACCEPTED_BY_STORE" || o.status === "OUT_FOR_DELIVERY",
  );
  return active || orders[0] || null;
}
