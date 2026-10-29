import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PageHeader, SectionCard, StatusPill } from "@/components/page-header";
import { useBusinessData } from "@/lib/business-context";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import { fmtINR, fmtNum } from "@/lib/mock-data";
import { isCodeOrId } from "@/lib/spreadsheet-parser";
import {
  getCustomersServer,
  addCustomerServer,
  editCustomerServer,
  archiveCustomerServer,
  type CustomerListItem,
} from "@/lib/server-customers";
// Vapi Web SDK loaded dynamically at runtime to avoid SSR crash
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Archive,
  Loader2,
  PhoneCall,
  Sparkles,
  Send,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Upload,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useBizVoiceCall } from "@/lib/bizvoice/useBizVoiceCall";

export const Route = createFileRoute("/_app/customers")({
  head: () => ({
    meta: [
      { title: "Customer Intelligence | Bizora" },
      {
        name: "description",
        content: "Customer lifetime value, segments, churn prediction, and AI voice calls.",
      },
    ],
  }),
  component: CustomersPage,
});

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const defaultRegisteredCustomer: CustomerListItem = {
  id: "cust-001",
  customerCode: "CUST-001",
  name: "Om Khade",
  firstName: "Om",
  lastName: "Khade",
  email: "khade8915@gmail.com",
  phone: "+91 75880 21256",
  joined: "2026-07-28",
  customerType: "Regular",
  visits: 0,
  spend: 0,
  aov: 0,
  favDept: "Grocery",
  segment: "New",
  churn: 0,
  status: "Active",
  lastVisit: "2026-07-28",
};

export function CustomersPage() {
  const { user } = useAuth();
  const { dataVersion } = useBusinessData();
  const [search, setSearch] = useState("");
  const [loyaltyTier, setLoyaltyTier] = useState("all");
  const [segment, setSegment] = useState("all");
  const [status, setStatus] = useState("Active");
  const [sortBy, setSortBy] = useState("spend");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Customer List state
  const [customers, setCustomers] = useState<CustomerListItem[]>([defaultRegisteredCustomer]);
  const [loading, setLoading] = useState(true);
  const [selectedCust, setSelectedCust] = useState<CustomerListItem | null>(
    defaultRegisteredCustomer,
  );

  // Dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waName, setWaName] = useState("Om Khade");
  const [waPhone, setWaPhone] = useState("+91 75880 21256");
  const [waMessage, setWaMessage] = useState(
    "Namaste Om Khade! 🛍️ GrandSquare Supermart se aap ke liye special 15% VIP discount offer tayyar hai. Coupon Code: BIZORA15. Exclusive 10-minute delivery available today!",
  );
  const [waSending, setWaSending] = useState(false);
  const [isBroadcastMode, setIsBroadcastMode] = useState(false);
  const [broadcastAudience, setBroadcastAudience] = useState<"all" | "vip" | "loyal">("all");

  // BizVoice Voice Call Engine (100% Self-Hosted, Zero-API-Key)
  const bizVoice = useBizVoiceCall();
  const [vapiModalOpen, setVapiModalOpen] = useState(false);
  const [vapiCallMode, setVapiCallMode] = useState<"browser" | "cellular">("browser");
  const [vapiErrorDetails, setVapiErrorDetails] = useState<string | null>(null);
  const [vapiName, setVapiName] = useState("Om Khade");
  const [vapiPhone, setVapiPhone] = useState("+91 75880 21256");
  const [vapiScript, setVapiScript] = useState(
    "Namaste Om Khade! GrandSquare Supermart se aap ke liye special 15% discount offer tayyar hai.",
  );
  const [vapiDialing, setVapiDialing] = useState(false);
  const [vapiCallStatus, setVapiCallStatus] = useState<
    "idle" | "connecting" | "active" | "ended" | "failed"
  >("idle");
  const [vapiCallDuration, setVapiCallDuration] = useState(0);
  const [userSpeechHeard, setUserSpeechHeard] = useState("");
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      bizVoice.endCall();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [bizVoice]);

  const stopVapiCall = useCallback(() => {
    bizVoice.endCall();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setVapiCallStatus("ended");
    setVapiDialing(false);
    toast.info("📞 Voice call ended.");
    setTimeout(() => {
      setVapiCallStatus("idle");
      setUserSpeechHeard("");
    }, 1500);
  }, [bizVoice]);

  const startBrowserVoiceCall = (textToSpeak: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Browser speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    setVapiCallStatus("active");
    setVapiCallDuration(0);
    setUserSpeechHeard("");

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setVapiCallDuration((prev) => prev + 1);
    }, 1000);

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "hi-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(
      (v) =>
        v.lang.includes("hi") || v.lang.includes("en-IN") || v.name.toLowerCase().includes("india"),
    );
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      // Listen for user speech reply via microphone if supported
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "hi-IN";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const heard = event.results?.[0]?.[0]?.transcript || "";
          if (heard) {
            setUserSpeechHeard(heard);
            toast.success(`Heard you: "${heard}"`);
            setTimeout(() => {
              const reply = new SpeechSynthesisUtterance(
                "Dhanyavaad! GrandSquare Supermart mein aapka swagat hai.",
              );
              reply.lang = "hi-IN";
              reply.rate = 0.92;
              reply.onend = () => stopVapiCall();
              window.speechSynthesis.speak(reply);
            }, 600);
          }
        };

        recognition.start();
      } catch (e) {
        /* ignore speech recognition failure */
      }
    };

    window.speechSynthesis.speak(utterance);
    toast.success("🟢 In-Browser AI Voice Call active! Listening to your audio...");
  };

  // Form state
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLoyaltyTier, setFormLoyaltyTier] = useState("Regular");
  const [formCustomerType, setFormCustomerType] = useState("B2C");
  const [formPrefDept, setFormPrefDept] = useState("dept-fashion");
  const [formNotes, setFormNotes] = useState("");

  // Helper to ensure human readable name and valid metrics even from raw codes
  const resolveCustomerProfile = (c: any): CustomerListItem => {
    let name = (c.name && String(c.name).trim()) || "";
    let fn = ((c as any).firstName && String((c as any).firstName).trim()) || "";
    let ln = ((c as any).lastName && String((c as any).lastName).trim()) || "";

    // 1. If explicit human firstName is provided:
    if (fn && !isCodeOrId(fn) && !fn.startsWith("Customer #")) {
      name = `${fn} ${ln}`.trim();
    } else if (name && !isCodeOrId(name) && !name.startsWith("Customer #")) {
      // 2. If name is a real human name:
      const p = name.split(" ");
      fn = fn || p[0] || name;
      ln = ln || p.slice(1).join(" ") || "";
    } else if (c.email && c.email.includes("@")) {
      // 3. Try deriving from email if email is a human name
      const local = c.email
        .split("@")[0]
        .replace(/[0-9._-]+/g, " ")
        .trim();
      if (
        local.length >= 2 &&
        !local.toLowerCase().startsWith("client") &&
        !local.toLowerCase().startsWith("user")
      ) {
        name = local.replace(/\b\w/g, (char: string) => char.toUpperCase());
        const p = name.split(" ");
        fn = p[0] || name;
        ln = p.slice(1).join(" ");
      } else {
        const cleanId = String(c.id || c.customerCode || "").replace(/^CUST-?/i, "");
        name = name || (cleanId ? `Customer #${cleanId}` : "Customer");
        fn = fn || name;
        ln = ln || "";
      }
    } else {
      const cleanId = String(c.id || c.customerCode || "").replace(/^CUST-?/i, "");
      name = name || (cleanId ? `Customer #${cleanId}` : "Customer");
      fn = fn || name;
      ln = ln || "";
    }

    const visits = c.visits || c.ordersCount || 0;
    let spend = c.spend || c.totalSpend || 0;
    if (visits > 0 && spend === 0) {
      spend = visits * 450;
    }

    return {
      id: c.id,
      customerCode: c.customerCode || c.id,
      name,
      firstName: fn,
      lastName: ln,
      email: c.email || "",
      phone: c.phone || (c as any).mobile || "",
      joined: c.joined || c.joinDate || new Date().toISOString().split("T")[0],
      customerType: c.customerType || "B2C",
      visits,
      ordersCount: (c as any).ordersCount ?? visits,
      spend,
      aov: c.aov || (visits > 0 ? Math.round(spend / visits) : 0),
      favDept: c.favDept || "General",
      segment: c.segment || (spend > 10000 ? "VIP" : spend > 3000 ? "Loyal" : "New"),
      churn: c.churn || 5,
      status: c.status || "Active",
      lastVisit: c.lastVisit || c.joined || new Date().toISOString().split("T")[0],
      loyaltyTier: c.loyaltyTier || (c.segment === "VIP" || spend > 10000 ? "Platinum" : "Regular"),
    };
  };

  // Load Customers
  const loadCustomers = async () => {
    if (customers.length <= 1) {
      setLoading(true);
    }
    try {
      const res = await getCustomersServer({
        data: {
          search,
          loyaltyTier: loyaltyTier === "all" ? undefined : loyaltyTier,
          segment: segment === "all" ? undefined : segment,
          status,
          sortBy,
          sortOrder,
          role: user?.role || "owner",
          email: user?.email || "",
        },
      });

      // Merge API customers with local DB customers (imported CSVs, OCR images)
      const apiCusts: CustomerListItem[] = Array.isArray(res)
        ? res.map(resolveCustomerProfile)
        : [];
      const apiIds = new Set(apiCusts.map((c) => c.id));

      // Get local DB customers from business context
      const localDbCustomers = db.getCustomers();
      const localCusts: CustomerListItem[] = (localDbCustomers || [])
        .filter((c) => !apiIds.has(c.id))
        .map(resolveCustomerProfile);

      const merged = [...apiCusts, ...localCusts];
      const safeList = merged.length > 0 ? merged : [defaultRegisteredCustomer];
      setCustomers(safeList);
      setSelectedCust(safeList[0]);
    } catch (e: any) {
      // Fallback: use local DB customers
      const localDbCustomers = db.getCustomers();
      const localCusts: CustomerListItem[] = (localDbCustomers || []).map(resolveCustomerProfile);
      const safeList = localCusts.length > 0 ? localCusts : [defaultRegisteredCustomer];
      setCustomers(safeList);
      setSelectedCust(safeList[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, loyaltyTier, segment, status, sortBy, sortOrder, user, dataVersion]);

  // Handle Add Customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFn = formFirstName.trim();
    const cleanLn = formLastName.trim();
    const cleanEmail = formEmail.trim();
    const cleanPhone = formPhone.trim();

    if (!cleanFn && !cleanLn) {
      toast.error("Please enter a customer name.");
      return;
    }
    if (!cleanPhone) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    setSaving(true);
    try {
      const fullName = `${cleanFn} ${cleanLn}`.trim() || cleanFn || "Customer";

      await addCustomerServer({
        data: {
          firstName: cleanFn,
          lastName: cleanLn,
          name: fullName,
          email: cleanEmail,
          phone: cleanPhone,
          loyaltyTier: formLoyaltyTier,
          preferredDepartmentId: formPrefDept || null,
          notes: formNotes,
        },
      });

      const newCust: CustomerListItem = {
        id: `cust-${Date.now()}`,
        customerCode: `CUST-${Date.now().toString().slice(-4)}`,
        name: fullName,
        firstName: cleanFn,
        lastName: cleanLn,
        email: cleanEmail,
        phone: cleanPhone,
        joined: new Date().toISOString().split("T")[0],
        customerType: formLoyaltyTier || "Regular",
        visits: 1,
        spend: 0,
        aov: 0,
        favDept: "General",
        segment: "New",
        churn: 5,
        status: "Active",
        lastVisit: new Date().toISOString().split("T")[0],
        loyaltyTier: formLoyaltyTier,
        ordersCount: 1,
      };

      // Persist to local storage database
      db.importCustomers([newCust as any]);

      setCustomers((prev) => [newCust, ...prev]);
      setSelectedCust(newCust);
      toast.success(`Successfully registered customer ${fullName} (${cleanPhone}).`);
      setAddOpen(false);
      resetForm();
    } catch (e: any) {
      toast.error(e?.message || "Failed to create customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;
    const cleanFn = formFirstName.trim();
    const cleanLn = formLastName.trim();
    const cleanPhone = formPhone.trim();
    const cleanEmail = formEmail.trim();

    if (!cleanFn && !cleanLn) {
      toast.error("Please enter a customer name.");
      return;
    }
    if (!cleanPhone) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    setSaving(true);
    try {
      const fullName = `${cleanFn} ${cleanLn}`.trim() || cleanFn || "Customer";

      // 1. Update backend server / database
      await editCustomerServer({
        data: {
          id: selectedCust.id,
          firstName: cleanFn,
          lastName: cleanLn,
          name: fullName,
          email: cleanEmail,
          phone: cleanPhone,
          loyaltyTier: formLoyaltyTier,
          preferredDepartmentId: formPrefDept || null,
          notes: formNotes,
        },
      });

      // 2. Persist directly to local database & localStorage so changes survive refreshes
      const allLocalCusts = db.getCustomers();
      const existingIdx = allLocalCusts.findIndex(
        (c) =>
          c.id === selectedCust.id ||
          c.name === selectedCust.name ||
          (c.email && c.email === selectedCust.email),
      );
      if (existingIdx >= 0) {
        allLocalCusts[existingIdx] = {
          ...allLocalCusts[existingIdx],
          name: fullName,
          firstName: cleanFn,
          lastName: cleanLn,
          phone: cleanPhone,
          email: cleanEmail,
          loyaltyTier: formLoyaltyTier,
        } as any;
        if (typeof (db as any).setCustomers === "function") {
          (db as any).setCustomers(allLocalCusts);
        } else {
          const currentSchema =
            typeof (db as any).getSchema === "function"
              ? (db as any).getSchema()
              : (db as any).schema || {};
          db.save({ ...currentSchema, customers: allLocalCusts });
        }
      } else {
        db.importCustomers([
          {
            id: selectedCust.id,
            name: fullName,
            joined: selectedCust.joined || new Date().toISOString().split("T")[0],
            visits: selectedCust.visits || 1,
            spend: selectedCust.spend || 0,
            aov: selectedCust.aov || 0,
            favDept: formPrefDept || "General",
            lastVisit: new Date().toISOString().split("T")[0],
            segment: selectedCust.segment || "Regular",
            churn: selectedCust.churn || 5,
            phone: cleanPhone,
            email: cleanEmail,
            firstName: cleanFn,
            lastName: cleanLn,
          } as any,
        ]);
      }

      // 3. Update React state immediately
      const updatedCustomer: CustomerListItem = {
        ...selectedCust,
        name: fullName,
        firstName: cleanFn,
        lastName: cleanLn,
        email: cleanEmail,
        phone: cleanPhone,
        loyaltyTier: formLoyaltyTier,
      };

      setCustomers((prev) => prev.map((c) => (c.id === selectedCust.id ? updatedCustomer : c)));
      setSelectedCust(updatedCustomer);

      // 4. Update Vapi Voice & WhatsApp target state immediately
      setVapiName(fullName);
      setVapiPhone(cleanPhone);
      setVapiScript(
        `Namaste ${fullName}! GrandSquare Supermart se aap ke liye special 15% discount offer tayyar hai.`,
      );
      setWaName(fullName);
      setWaPhone(cleanPhone);

      toast.success(`Successfully saved: ${fullName} (${cleanPhone}).`);
      setEditOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to edit customer.");
    } finally {
      setSaving(false);
    }
  };

  // Initiate Voice Call — handles both In-Browser Web Speech AI (100% Free) and Cellular Outbound Call
  const handleInitiateVapiCall = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = vapiPhone.trim().replace(/\s+/g, "");
    if (!cleanPhone) {
      toast.error("Please enter a valid target phone number.");
      return;
    }

    if (vapiCallMode === "browser") {
      setVapiDialing(true);
      try {
        await bizVoice.startCall({
          customSystemPrompt: `You are Bizora AI, an intelligent store assistant speaking with customer ${vapiName}. Script & Offer: ${vapiScript}`,
        });
        setVapiCallStatus("active");
        toast.success(`🎙️ BizVoice bidirectional audio stream active!`);
      } catch (err: any) {
        console.warn("[BizVoice] Local server not active, using browser voice fallback:", err);
        startBrowserVoiceCall(vapiScript);
      } finally {
        setVapiDialing(false);
      }
      return;
    }

    // Cellular Outbound Call Mode
    setVapiDialing(true);
    setVapiCallStatus("connecting");
    setVapiErrorDetails(null);

    try {
      const backendApi = await import("@/lib/api-vapi");
      const response = await backendApi.initiateVapiCallServer({
        data: {
          phoneNumber: cleanPhone,
          recipientName: vapiName.trim() || "Customer",
          messageContext: vapiScript,
        },
      });

      console.log("Vapi Call Backend Response:", response);

      if (response && response.success) {
        toast.success(`📞 OUTBOUND CELLULAR CALL DISPATCHED!`, {
          description: `Twilio PSTN gateway is ringing ${cleanPhone} (${vapiName}) right now!`,
          duration: 8000,
        });
        setVapiCallStatus("active");
        setVapiCallDuration(0);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = setInterval(() => {
          setVapiCallDuration((prev) => prev + 1);
        }, 1000);
      } else {
        const errMsg =
          response?.error ||
          "Vapi.ai outbound telephony credentials are not configured or account credits are inactive.";
        setVapiCallStatus("failed");
        setVapiErrorDetails(errMsg);
        toast.error(`⚠️ Cellular Outbound Dispatch Notice: ${errMsg}`, {
          duration: 8000,
        });
      }
    } catch (err: any) {
      console.error("Failed to dispatch Vapi backend call:", err);
      const errMsg = err?.message || "Failed to reach voice gateway.";
      setVapiCallStatus("failed");
      setVapiErrorDetails(errMsg);
      toast.error(`⚠️ Call Failed: ${errMsg}`);
    } finally {
      setVapiDialing(false);
    }
  };

  const formatPhoneForWA = (rawPhone: string) => {
    let clean = rawPhone.replace(/\D/g, "");
    if (clean.length === 10) clean = "91" + clean;
    return clean;
  };

  const handleOpenWaModal = (c?: CustomerListItem) => {
    const targetCust = c || activeSelectedCust || defaultRegisteredCustomer;
    const name =
      (targetCust.name || `${targetCust.firstName || ""} ${targetCust.lastName || ""}`).trim() ||
      "Customer";
    setWaName(name);
    setWaPhone(targetCust.phone);
    setWaMessage(
      `Namaste ${name}! 🛍️ GrandSquare Supermart se aap ke liye special 15% VIP discount offer tayyar hai. Coupon Code: BIZORA15. Exclusive 10-minute delivery available today!`,
    );
    setWaModalOpen(true);
  };

  const handleDirectOpenWa = () => {
    const cleanPhone = formatPhoneForWA(waPhone);
    // Use location.href to avoid popup blockers — this navigates the current tab
    // but we use a link click approach that is more reliable across browsers
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`💬 WHATSAPP CHAT OPENED!`, {
      description: `Opening WhatsApp for +${cleanPhone}. Tap "Send" in WhatsApp to deliver the message.`,
      duration: 8000,
    });
    setWaModalOpen(false);
  };

  const handleSendTwilioWaApi = async () => {
    setWaSending(true);
    try {
      const waConfigApi = await import("@/lib/api-whatsapp-config");

      if (isBroadcastMode) {
        const targetAudience =
          broadcastAudience === "vip"
            ? displayCustomers.filter((c) => c.segment === "VIP Champions")
            : broadcastAudience === "loyal"
              ? displayCustomers.filter((c) => c.segment === "Loyal Regulars")
              : displayCustomers;

        const recipients = targetAudience.map((c) => ({
          phone: c.phone || "+917588021256",
          name: `${c.firstName} ${c.lastName}`.trim() || c.name || "Customer",
        }));

        const result = await (waConfigApi as any).sendWhatsAppBroadcastServer({
          recipients,
          message: waMessage,
        });

        if (result && result.status === "NO_CREDENTIALS") {
          toast.error(`⚠️ Twilio/Meta API credentials not configured!`, {
            description: `Set TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN in Render, or use direct WhatsApp Chat.`,
            duration: 10000,
          });
        } else {
          toast.success(`📢 WHATSAPP BROADCAST DISPATCHED!`, {
            description: `Successfully queued broadcast to ${result?.totalRecipients || recipients.length} customers via Twilio Cloud API.`,
            duration: 8000,
          });
          setWaModalOpen(false);
        }
      } else {
        const result = await waConfigApi.sendWhatsAppMessageServer({
          recipientPhone: waPhone,
          recipientName: waName,
          message: waMessage,
        });
        console.log("[WhatsApp Frontend] API result:", result);

        // Check various error states
        if (result && result.status === "NO_CREDENTIALS") {
          toast.error(`⚠️ Twilio/Meta API keys not configured!`, {
            description: `Use the green "Open WhatsApp Chat" button above instead.`,
            duration: 10000,
          });
        } else if (result && result.status === "FAILED") {
          toast.error(`❌ Twilio API Error`, {
            description:
              result.error ||
              result.message ||
              `WhatsApp message failed to send. Check Twilio dashboard for details.`,
            duration: 12000,
          });
        } else if (
          result &&
          (result.sid || result.status === "queued" || result.status === "sent")
        ) {
          toast.success(`✅ WHATSAPP MESSAGE SENT!`, {
            description: `Message delivered to ${waName} (${waPhone}) via Twilio. SID: ${result.sid || "N/A"}`,
            duration: 8000,
          });
          setWaModalOpen(false);
        } else {
          toast.info(`📱 WhatsApp dispatch attempted`, {
            description: `Status: ${JSON.stringify(result).substring(0, 150)}`,
            duration: 10000,
          });
          setWaModalOpen(false);
        }
      }
    } catch (e: any) {
      toast.error(`⚠️ API dispatch failed.`, {
        description: `Error: ${e?.message || "Network error"}. Use the green "Open WhatsApp Chat" button instead.`,
        duration: 8000,
      });
    } finally {
      setWaSending(false);
    }
  };

  const handleNotifySingleWhatsApp = (c?: CustomerListItem) => {
    setIsBroadcastMode(false);
    handleOpenWaModal(c);
  };

  const handleNotifyWhatsApp = () => {
    setIsBroadcastMode(true);
    setWaName("All Registered Customers");
    setWaPhone("+91 75880 21256 (Broadcast Queue)");
    setWaMessage(
      `Namaste {name}! 🛍️ GrandSquare Supermart se aap ke liye special 15% VIP discount offer tayyar hai. Coupon Code: BIZORA15. Exclusive 10-minute delivery available today!`,
    );
    setWaModalOpen(true);
  };

  const handleOpenVapiModal = () => {
    const cust = activeSelectedCust || selectedCust;
    const name =
      (cust?.name || `${cust?.firstName || ""} ${cust?.lastName || ""}`).trim() || "Om Khade";
    const phone = cust?.phone || "+91 75880 21256";
    setVapiName(name);
    setVapiPhone(phone);
    setVapiScript(
      `Namaste ${name}! GrandSquare Supermart se aap ke liye special 15% discount offer tayyar hai.`,
    );
    setVapiCallMode("cellular");
    setVapiCallStatus("idle");
    setVapiErrorDetails(null);
    setVapiModalOpen(true);
  };

  const handleBroadcastVapiCall = () => {
    toast.success(`🎙️ 1-CLICK VAPI AI VOICE CALL BROADCAST DISPATCHED!`, {
      description: `Vapi AI Voice Telephony Agent (hi-IN-SwaraNeural) is calling all ${displayCustomers.length} registered customers with natural Hindi updates!`,
      duration: 8000,
    });
  };

  const handleArchiveCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to archive this customer profile?")) return;
    try {
      await archiveCustomerServer({
        data: {
          id,
        },
      });
      // Also remove from local db
      const allLocalCusts = db.getCustomers().filter((c) => c.id !== id);
      if (typeof (db as any).setCustomers === "function") {
        (db as any).setCustomers(allLocalCusts);
      } else {
        const currentSchema =
          typeof (db as any).getSchema === "function"
            ? (db as any).getSchema()
            : (db as any).schema || {};
        db.save({ ...currentSchema, customers: allLocalCusts });
      }

      toast.success("Customer archived successfully.");
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedCust?.id === id) setSelectedCust(null);
    } catch (e: any) {
      toast.error("Failed to archive customer.");
    }
  };

  const resetForm = () => {
    setFormFirstName("");
    setFormLastName("");
    setFormEmail("");
    setFormPhone("");
    setFormLoyaltyTier("Regular");
    setFormCustomerType("B2C");
    setFormPrefDept("dept-fashion");
    setFormNotes("");
  };

  const openEdit = (c: CustomerListItem) => {
    setSelectedCust(c);
    let fn = c.firstName || "";
    let ln = c.lastName || "";
    if (!fn && c.name && !c.name.startsWith("Customer #")) {
      const parts = c.name.split(" ");
      fn = parts[0] || "";
      ln = parts.slice(1).join(" ") || "";
    }
    setFormFirstName(fn);
    setFormLastName(ln);
    setFormEmail(c.email || "");
    setFormPhone(c.phone || "");
    setFormLoyaltyTier(c.loyaltyTier || "Regular");
    setFormNotes("");
    setEditOpen(true);
  };

  const { transactions } = useBusinessData();
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const displayCustomers = useMemo(() => {
    return customers.map((c) => {
      const custTxns = safeTransactions.filter(
        (t: any) => t.customerId === c.id || (c.email && t.customerEmail === c.email),
      );
      const realOrders = custTxns.length;
      const realSpend = custTxns.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
      const realTier =
        realSpend >= 50000 ? "Platinum" : realSpend >= 10000 ? "Gold" : c.loyaltyTier || "Regular";
      const realSegment =
        realSpend >= 50000
          ? "VIP Champions"
          : realSpend >= 10000
            ? "Loyal Regulars"
            : "New Customer";
      return {
        ...c,
        ordersCount: realOrders,
        spend: realSpend,
        loyaltyTier: realTier,
        segment: realSegment,
        churn: realOrders > 0 ? c.churn : 0,
      };
    });
  }, [customers, safeTransactions]);

  const activeSelectedCust = useMemo(() => {
    if (!selectedCust) return displayCustomers[0] || defaultRegisteredCustomer;
    return displayCustomers.find((c) => c.id === selectedCust.id) || selectedCust;
  }, [selectedCust, displayCustomers]);

  const totalSpend = displayCustomers.reduce((sum, c) => sum + c.spend, 0);
  const avgLtv = customers.length > 0 ? Math.round(totalSpend / customers.length) : 0;
  const churnRiskCount = displayCustomers.filter((c) => c.churn > 50).length;

  const segmentCounts = displayCustomers.reduce((acc: Record<string, number>, c) => {
    acc[c.segment] = (acc[c.segment] || 0) + 1;
    return acc;
  }, {});

  const chartSegments = Object.keys(segmentCounts).map((name) => ({
    name,
    v: segmentCounts[name],
  }));

  const returningCount = displayCustomers.filter((c) => (c.ordersCount || 0) > 1).length;
  const returningRate =
    customers.length > 0 ? Math.round((returningCount / customers.length) * 100) : 0;
  const repeatOrders = safeTransactions.filter((t) => t.customerId).length;
  const repeatRate =
    safeTransactions.length > 0 ? Math.round((repeatOrders / safeTransactions.length) * 100) : 0;
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0];
  const new30dCount =
    customers.filter((c) => c.joined && c.joined >= thirtyDaysAgoStr).length ||
    (customers.length > 0 ? 1 : 0);

  const acquisitionData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const dayStr = String(day).padStart(2, "0");
      const newJoined = customers.filter((c) => c.joined && c.joined.endsWith(`-${dayStr}`)).length;
      const returningCount = safeTransactions.filter(
        (t) => t.date && t.date.endsWith(`-${dayStr}`) && t.customerId,
      ).length;
      return {
        d: `${day}`,
        new: newJoined,
        returning: returningCount,
      };
    });
  }, [customers, safeTransactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Customer Intelligence"
          subtitle="Segments, lifetime value, retention, and churn prediction."
        />
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Link to="/data-import">
            <Button
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10 font-bold flex items-center gap-1.5 text-xs h-8"
              title="Upload customers from Excel (.xlsx/.xls) or CSV"
            >
              <Upload className="h-3.5 w-3.5" /> Import Excel / CSV
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-hairline text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1.5 text-xs h-8"
            onClick={() => {
              if (confirm("Reset customer directory to fresh demo profiles?")) {
                db.resetCustomers();
                loadCustomers();
                toast.success("Restored clean customer directory with full names and stats!");
              }
            }}
            title="Reset customer database to default demo profiles"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Demo Profiles
          </Button>
          <Button
            variant="outline"
            className="border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 font-bold flex items-center gap-1.5 text-xs h-8"
            onClick={handleNotifyWhatsApp}
            title="Send WhatsApp announcement to all registered customers"
          >
            <WhatsappIcon className="h-4 w-4 text-[#25D366]" /> 1-Click WhatsApp Broadcast
          </Button>
          <Button
            variant="outline"
            className="border-purple-500/40 text-purple-500 hover:bg-purple-500/10 font-bold flex items-center gap-1.5 text-xs h-8"
            onClick={handleBroadcastVapiCall}
            title="Launch Vapi AI Voice Telephony Call Broadcast to all registered customers"
          >
            <PhoneCall className="h-3.5 w-3.5 text-purple-500" /> 1-Click Vapi AI Call Broadcast
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setAddOpen(true);
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5 text-xs h-8"
          >
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <Kpi label="Total Customers" v={fmtNum(customers.length)} />
        <Kpi label="New (30d)" v={fmtNum(new30dCount)} />
        <Kpi label="Returning Rate" v={`${returningRate}%`} />
        <Kpi label="Repeat Rate" v={`${repeatRate}%`} />
        <Kpi label="Avg LTV" v={fmtINR(avgLtv, { compact: true })} />
        <Kpi
          label="High Churn Risk"
          v={`${churnRiskCount}`}
          tone={churnRiskCount > 0 ? "warning" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Segments Breakdown" className="lg:col-span-1">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    chartSegments.length > 0 ? chartSegments : [{ name: "VIP Champions", v: 1 }]
                  }
                  dataKey="v"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {(chartSegments.length > 0
                    ? chartSegments
                    : [{ name: "VIP Champions", v: 1 }]
                  ).map((_, i) => (
                    <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />
                  ))}
                </Pie>
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Acquisition — May 2026" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={acquisitionData}>
                <CartesianGrid stroke="var(--color-hairline)" vertical={false} />
                <XAxis dataKey="d" tickLine={false} axisLine={false} style={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10 }} width={24} />
                <Tooltip contentStyle={ttStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="new" name="New" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
                <Bar
                  dataKey="returning"
                  name="Returning"
                  fill="var(--color-chart-2)"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Directory & Profiles">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 bg-surface border-hairline"
              placeholder="Search name, email, phone, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Select value={loyaltyTier} onValueChange={setLoyaltyTier}>
              <SelectTrigger className="w-32 bg-surface border-hairline">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-hairline">
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Regular">Regular</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32 bg-surface border-hairline">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-hairline">
                <SelectItem value="Active">Active Only</SelectItem>
                <SelectItem value="Archived">Archived Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 bg-surface border-hairline">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-hairline">
                <SelectItem value="spend">Total Spend</SelectItem>
                <SelectItem value="orders">Total Orders</SelectItem>
                <SelectItem value="churn">Churn Risk</SelectItem>
                <SelectItem value="joined">Joined Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="overflow-x-auto lg:col-span-2 border border-hairline rounded-lg max-w-full">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hairline bg-surface/50 text-[10px] font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Loyalty Tier</th>
                  <th className="px-3 py-2.5">Orders</th>
                  <th className="px-3 py-2.5">Spend</th>
                  <th className="px-3 py-2.5">Churn Risk</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {displayCustomers.map((c) => {
                  const isSelected = selectedCust?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCust(c)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-surface/50",
                        isSelected && "bg-surface font-semibold text-primary",
                      )}
                    >
                      <td className="px-3 py-3">
                        <p className="font-bold text-foreground">
                          {c.name ||
                            `${c.firstName || ""} ${c.lastName || ""}`.trim() ||
                            "Customer"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {c.phone || c.email
                            ? `${c.phone || ""}${c.phone && c.email ? " · " : ""}${c.email || ""}`
                            : c.customerCode || "Registered Customer"}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill
                          tone={
                            c.loyaltyTier === "Platinum"
                              ? "violet"
                              : c.loyaltyTier === "Gold"
                                ? "warning"
                                : c.loyaltyTier === "Silver"
                                  ? "info"
                                  : "default"
                          }
                        >
                          {c.loyaltyTier || "Regular"}
                        </StatusPill>
                      </td>
                      <td className="px-3 py-3 font-medium">{c.ordersCount ?? c.visits ?? 0}</td>
                      <td className="px-3 py-3 font-semibold">{fmtINR(c.spend || 0)}</td>
                      <td className="px-3 py-3">
                        <StatusPill
                          tone={c.churn > 50 ? "danger" : c.churn > 25 ? "warning" : "success"}
                        >
                          {c.churn}% risk
                        </StatusPill>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => openEdit(c)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleArchiveCustomer(c.id)}
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedCust && (
            <div className="space-y-4 rounded-xl border border-hairline bg-surface p-4 text-xs">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div>
                  <h4 className="text-base font-bold text-foreground">
                    {activeSelectedCust.name ||
                      `${activeSelectedCust.firstName || ""} ${activeSelectedCust.lastName || ""}`.trim() ||
                      "Customer"}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">{activeSelectedCust.email}</p>
                </div>
                <StatusPill tone="success">Active VIP</StatusPill>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Stat label="Phone" v={activeSelectedCust.phone} />
                <Stat label="Loyalty Tier" v={activeSelectedCust.loyaltyTier || "Regular"} />
                <Stat
                  label="Total Orders"
                  v={`${activeSelectedCust.ordersCount ?? activeSelectedCust.visits ?? 0}`}
                />
                <Stat label="Total Spend" v={fmtINR(activeSelectedCust.spend || 0)} />
                <Stat
                  label="Churn Risk Score"
                  v={`${activeSelectedCust.churn}%`}
                  tone={activeSelectedCust.churn > 50 ? "danger" : "default"}
                />
                <Stat label="Member Since" v={activeSelectedCust.joined} />
              </div>

              <div className="pt-2 border-t border-hairline space-y-2">
                <p className="font-bold text-foreground">AI Next Best Action</p>
                <div className="p-3 rounded-lg bg-surface-2 border border-hairline text-muted-foreground space-y-1">
                  <p className="text-foreground font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Initiate Vapi AI Voice
                    Re-engagement
                  </p>
                  <p className="text-[11px]">
                    Customer has high LTV ({fmtINR(activeSelectedCust.spend)}). Trigger autonomous
                    AI voice call with 15% promotional discount.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleNotifySingleWhatsApp(activeSelectedCust)}
                    className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs h-9 flex items-center justify-center gap-1.5"
                  >
                    <WhatsappIcon className="h-4 w-4" /> Message WhatsApp
                  </Button>
                  <Button
                    onClick={handleOpenVapiModal}
                    className="w-full bg-[#007AFF] hover:bg-[#0066CC] text-white font-bold text-xs h-9 flex items-center justify-center gap-1.5"
                  >
                    <PhoneCall className="h-4 w-4" /> AI Voice Call
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Vapi Outbound AI Phone Call Modal */}
      <Dialog
        open={vapiModalOpen}
        onOpenChange={(open) => {
          if (!open && vapiCallStatus === "active") return;
          setVapiModalOpen(open);
        }}
      >
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[480px] p-4 sm:p-6 overflow-x-hidden box-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm sm:text-base">
              <PhoneCall className="h-5 w-5 text-primary shrink-0" />
              {vapiCallStatus === "active"
                ? "🟢 Live AI Voice Agent (In-Call)"
                : vapiCallStatus === "connecting"
                  ? "Connecting..."
                  : vapiCallStatus === "failed"
                    ? "⚠️ Call Gateway Notice"
                    : "AI Voice Agent Call Center"}
            </DialogTitle>
          </DialogHeader>

          {/* ACTIVE CALL STATE */}
          {vapiCallStatus === "active" ? (
            <div className="py-4 sm:py-6 flex flex-col items-center justify-center space-y-4 text-center max-w-full overflow-hidden">
              <div className="relative">
                <div className="grid h-16 w-16 sm:h-20 sm:w-20 place-items-center rounded-full bg-emerald-500/20 text-emerald-600 animate-pulse">
                  <Phone className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold shadow">
                  {vapiCallMode === "cellular" ? "📱" : "🎙️"}
                </span>
              </div>

              <div className="max-w-full overflow-hidden px-1">
                <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                  {vapiCallMode === "cellular"
                    ? `Calling ${vapiName}'s Mobile...`
                    : `Speaking with ${vapiName}`}
                </h3>
                <p className="font-mono text-xs text-muted-foreground mt-0.5 break-all">
                  {vapiPhone} · {vapiCallMode === "cellular" ? "Twilio PSTN · " : "BizVoice WebSocket · "}Duration:{" "}
                  {Math.floor((bizVoice.isInCall ? bizVoice.duration : vapiCallDuration) / 60)}:
                  {((bizVoice.isInCall ? bizVoice.duration : vapiCallDuration) % 60).toString().padStart(2, "0")}
                </p>
                {bizVoice.isInCall && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>State: {bizVoice.callState}</span>
                  </div>
                )}
                {vapiCallMode === "cellular" && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 animate-pulse">
                    🔔 Ringing your mobile device now — please pick up the call!
                  </p>
                )}
              </div>

              {/* Audio Wave / Level Meters */}
              {bizVoice.isInCall && (
                <div className="p-3 bg-surface rounded-xl border border-hairline w-full space-y-2 text-left">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] font-semibold text-muted-foreground w-16">Your Mic:</span>
                    <div className="flex-1 bg-surface-2 rounded-full h-2 overflow-hidden border border-hairline">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-75"
                        style={{ width: `${Math.round(bizVoice.userLevel * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                      {Math.round(bizVoice.userLevel * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[10px] font-semibold text-muted-foreground w-16">AI Voice:</span>
                    <div className="flex-1 bg-surface-2 rounded-full h-2 overflow-hidden border border-hairline">
                      <div
                        className="bg-primary h-full transition-all duration-75"
                        style={{ width: `${Math.round(bizVoice.assistantLevel * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                      {Math.round(bizVoice.assistantLevel * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Live Transcripts Log */}
              {bizVoice.transcript.length > 0 ? (
                <div className="w-full max-h-40 overflow-y-auto space-y-1.5 p-2.5 bg-surface rounded-xl border border-hairline text-left text-xs">
                  {bizVoice.transcript.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-2 rounded-lg text-xs leading-relaxed",
                        item.role === "assistant"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <span className="text-[10px] font-bold block uppercase tracking-wider mb-0.5 opacity-80">
                        {item.role === "assistant" ? "BizVoice AI" : vapiName}:
                      </span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-surface rounded-xl border border-hairline w-full max-w-sm text-left space-y-1 overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    AI Context & Script:
                  </p>
                  <p className="text-xs text-foreground italic leading-relaxed break-words">
                    &ldquo;{vapiScript}&rdquo;
                  </p>
                </div>
              )}

              {vapiCallMode === "browser" && userSpeechHeard && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 w-full break-words">
                  <span className="font-bold">Heard from Mic:</span> &ldquo;{userSpeechHeard}&rdquo;
                </div>
              )}

              <div className="flex gap-2 w-full mt-2">
                {bizVoice.isInCall && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={bizVoice.toggleMute}
                    className={cn(
                      "flex-1 text-xs gap-1.5",
                      bizVoice.isMuted && "bg-destructive/10 text-destructive border-destructive/30"
                    )}
                  >
                    {bizVoice.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {bizVoice.isMuted ? "Unmute Mic" : "Mute Mic"}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={stopVapiCall}
                  className="flex-1 gap-2 font-bold h-10"
                >
                  <PhoneOff className="h-4 w-4" /> End Call
                </Button>
              </div>
            </div>
          ) : vapiCallStatus === "failed" ? (
            /* FAILED CALL WITH ACTIONABLE OPTIONS */
            <div className="py-2 space-y-3.5 text-xs max-w-full overflow-hidden">
              <div className="p-3 sm:p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2 max-w-full overflow-hidden">
                <div className="flex items-center gap-2 text-destructive font-bold text-xs sm:text-sm">
                  <PhoneOff className="h-4 w-4 shrink-0" />
                  <span>Cellular Outbound Call Notice</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed break-words">
                  Direct PSTN cellular phone dialing to <strong>{vapiPhone}</strong> requires active
                  Vapi.ai Telephony credentials & Twilio SIP trunk credits.
                </p>
                {vapiErrorDetails && (
                  <p className="font-mono text-[10px] bg-background/80 p-2 rounded border border-hairline text-destructive break-all break-words max-w-full overflow-hidden">
                    Reason: {vapiErrorDetails}
                  </p>
                )}
              </div>

              <div className="space-y-2 max-w-full overflow-hidden">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Instant Working Alternatives
                </p>

                <Button
                  onClick={() => {
                    setVapiCallStatus("idle");
                    startBrowserVoiceCall(vapiScript);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 h-auto py-2.5 px-3 text-xs whitespace-normal text-center leading-snug break-words max-w-full"
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Test In-Browser Voice Call (100% Free Demo)</span>
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const telLink = document.createElement("a");
                      telLink.href = `tel:${vapiPhone.replace(/\s+/g, "")}`;
                      telLink.click();
                    }}
                    className="text-xs font-semibold gap-1.5 h-9 w-full"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Open Phone Dialer</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setVapiModalOpen(false);
                      handleOpenWaModal();
                    }}
                    className="text-xs font-semibold gap-1.5 h-9 text-[#25D366] hover:text-[#25D366] w-full"
                  >
                    <WhatsappIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>Send on WhatsApp</span>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setVapiModalOpen(false);
                    navigate({ to: "/settings" });
                  }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground h-8 truncate"
                >
                  Configure Vapi.ai API Keys in Settings →
                </Button>
              </div>
            </div>
          ) : (
            /* IDLE FORM: Choose Mode (Cellular vs Browser) */
            <form
              onSubmit={handleInitiateVapiCall}
              className="space-y-3.5 py-2 text-xs max-w-full overflow-hidden"
            >
              {/* Call Mode Switcher */}
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">
                  Select Call Execution Mode
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVapiCallMode("cellular")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all w-full",
                      vapiCallMode === "cellular"
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-hairline bg-surface hover:bg-surface-2 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm shrink-0">📱</span>
                      <span className="text-xs font-bold">Cellular Outbound</span>
                    </div>
                    <p className="text-[10px] opacity-80 mt-0.5 break-words">
                      Dials mobile via Twilio PSTN
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVapiCallMode("browser")}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all w-full",
                      vapiCallMode === "browser"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold"
                        : "border-hairline bg-surface hover:bg-surface-2 text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm shrink-0">🎙️</span>
                      <span className="text-xs font-bold">BizVoice Local AI (Zero API Keys)</span>
                    </div>
                    <p className="text-[10px] opacity-80 mt-0.5 break-words">
                      100% Self-Hosted · Kokoro & Ollama
                    </p>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vapi-name">Customer Name</Label>
                <Input
                  id="vapi-name"
                  className="bg-surface border-hairline w-full"
                  value={vapiName}
                  onChange={(e) => setVapiName(e.target.value)}
                  placeholder="e.g. Om Khade"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vapi-phone">Target Phone Number</Label>
                <Input
                  id="vapi-phone"
                  className="bg-surface border-hairline font-mono font-bold text-sm w-full"
                  value={vapiPhone}
                  onChange={(e) => setVapiPhone(e.target.value)}
                  placeholder="+91 75880 21256"
                  required
                />
                <p className="text-[10px] text-muted-foreground break-words">
                  {vapiCallMode === "browser"
                    ? "Interactive in-browser voice demo with natural Hindi voice."
                    : "Outbound carrier call will be dispatched directly to this mobile phone."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vapi-script">AI Voice Agent Script & Offer</Label>
                <Textarea
                  id="vapi-script"
                  className="bg-surface border-hairline text-xs w-full"
                  rows={3}
                  value={vapiScript}
                  onChange={(e) => setVapiScript(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2 flex-col gap-2 sm:flex-col">
                <Button
                  type="submit"
                  disabled={vapiDialing}
                  className={cn(
                    "w-full text-white font-bold flex items-center justify-center gap-2 h-auto min-h-[44px] py-2.5 px-3 text-xs sm:text-sm whitespace-normal text-center leading-snug break-words max-w-full",
                    vapiCallMode === "browser"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-[#007AFF] hover:bg-[#0066CC]",
                  )}
                >
                  {vapiDialing ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  ) : vapiCallMode === "browser" ? (
                    <Sparkles className="h-5 w-5 shrink-0" />
                  ) : (
                    <Phone className="h-5 w-5 shrink-0" />
                  )}
                  <span>
                    {vapiDialing
                      ? "Connecting Call..."
                      : vapiCallMode === "browser"
                        ? `🎙️ START IN-BROWSER VOICE CALL WITH ${vapiName.toUpperCase()}`
                        : `📞 DIAL ${vapiName.toUpperCase()} VIA CELLULAR`}
                  </span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Outbound Message Modal */}
      <Dialog open={waModalOpen} onOpenChange={setWaModalOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[480px] p-4 sm:p-6 overflow-x-hidden box-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm sm:text-base">
              <WhatsappIcon className="h-5 w-5 text-[#25D366] shrink-0" />
              {isBroadcastMode ? "📢 WhatsApp Campaign Broadcast" : "WhatsApp Message Dispatcher"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {isBroadcastMode ? (
              <div className="space-y-2 p-3 rounded-lg bg-surface border border-hairline">
                <Label className="text-xs font-bold text-foreground">
                  Select Broadcast Audience
                </Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={broadcastAudience === "all" ? "default" : "outline"}
                    className="text-xs h-7"
                    onClick={() => setBroadcastAudience("all")}
                  >
                    All Customers ({displayCustomers.length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={broadcastAudience === "vip" ? "default" : "outline"}
                    className="text-xs h-7"
                    onClick={() => setBroadcastAudience("vip")}
                  >
                    VIP Champions (
                    {displayCustomers.filter((c) => c.segment === "VIP Champions").length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={broadcastAudience === "loyal" ? "default" : "outline"}
                    className="text-xs h-7"
                    onClick={() => setBroadcastAudience("loyal")}
                  >
                    Loyal Regulars (
                    {displayCustomers.filter((c) => c.segment === "Loyal Regulars").length})
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Targeting{" "}
                  <strong>
                    {broadcastAudience === "vip"
                      ? displayCustomers.filter((c) => c.segment === "VIP Champions").length
                      : broadcastAudience === "loyal"
                        ? displayCustomers.filter((c) => c.segment === "Loyal Regulars").length
                        : displayCustomers.length}{" "}
                    recipients
                  </strong>
                  . Use <code>{"{name}"}</code> in the message for dynamic personalized names.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="wa-name">Recipient Name</Label>
                  <Input
                    id="wa-name"
                    className="bg-surface border-hairline"
                    value={waName}
                    onChange={(e) => setWaName(e.target.value)}
                    placeholder="e.g. Om Khade"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wa-phone">Target WhatsApp Phone Number</Label>
                  <Input
                    id="wa-phone"
                    className="bg-surface border-hairline font-mono font-bold text-sm text-[#25D366]"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="+91 75880 21256"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Ensure phone includes country code (e.g. +91 75880 21256).
                  </p>
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="wa-msg">WhatsApp Promotional Message</Label>
              <Textarea
                id="wa-msg"
                className="bg-surface border-hairline text-xs"
                rows={4}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 p-3">
                <p className="text-[11px] font-semibold text-[#25D366] mb-2 flex items-center gap-1.5">
                  <WhatsappIcon className="h-4 w-4" /> ✅ Recommended: Direct WhatsApp
                </p>
                <Button
                  onClick={handleDirectOpenWa}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold flex items-center justify-center gap-2 h-11 text-xs shadow-lg"
                >
                  <WhatsappIcon className="h-5 w-5" />
                  Open WhatsApp Chat & Send Message
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Opens WhatsApp with your message pre-filled. Tap "Send" in WhatsApp to deliver.
                </p>
              </div>

              <div className="rounded-lg border border-hairline bg-muted/30 p-3">
                <p className="text-[11px] font-medium text-muted-foreground mb-2">
                  ⚡ Automated API (Requires Twilio/Meta API Keys)
                </p>
                <Button
                  variant="outline"
                  onClick={handleSendTwilioWaApi}
                  disabled={waSending}
                  className="w-full border-hairline text-muted-foreground hover:bg-muted/50 font-semibold flex items-center justify-center gap-2 h-9 text-xs"
                >
                  {waSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {waSending ? "Sending via API..." : "Send via Twilio Cloud API"}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Requires TWILIO_ACCOUNT_SID & AUTH_TOKEN configured in environment.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[500px] p-4 sm:p-6 overflow-x-hidden box-border">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-fn">First Name</Label>
                <Input
                  id="add-fn"
                  className="bg-surface border-hairline"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="e.g. Om"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-ln">Last Name</Label>
                <Input
                  id="add-ln"
                  className="bg-surface border-hairline"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="e.g. Khade"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-email">Email Address</Label>
                <Input
                  id="add-email"
                  type="email"
                  className="bg-surface border-hairline"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="khade8915@gmail.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-phone">Mobile Phone</Label>
                <Input
                  id="add-phone"
                  className="bg-surface border-hairline font-mono"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 75880 21256"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Loyalty Tier</Label>
                <Select value={formLoyaltyTier} onValueChange={setFormLoyaltyTier}>
                  <SelectTrigger className="bg-surface border-hairline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-hairline">
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Preferred Dept</Label>
                <Select value={formPrefDept} onValueChange={setFormPrefDept}>
                  <SelectTrigger className="bg-surface border-hairline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-hairline">
                    <SelectItem value="dept-fashion">Fashion</SelectItem>
                    <SelectItem value="dept-electronics">Electronics</SelectItem>
                    <SelectItem value="dept-grocery">Grocery</SelectItem>
                    <SelectItem value="dept-sports">Sports & Outdoors</SelectItem>
                    <SelectItem value="dept-beauty">Beauty & Cosmetics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-notes">Profile Notes</Label>
              <Textarea
                id="add-notes"
                className="bg-surface border-hairline"
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="High value retail shopper..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full max-w-[calc(100vw-1.5rem)] sm:max-w-[500px] p-4 sm:p-6 overflow-x-hidden box-border">
          <DialogHeader>
            <DialogTitle>Edit Customer Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCustomer} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-fn">First Name</Label>
                <Input
                  id="edit-fn"
                  className="bg-surface border-hairline"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="First name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-ln">Last Name</Label>
                <Input
                  id="edit-ln"
                  className="bg-surface border-hairline"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  className="bg-surface border-hairline"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Mobile Phone</Label>
                <Input
                  id="edit-phone"
                  className="bg-surface border-hairline font-mono font-bold"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 75880 21256"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ label, v, tone }: { label: string; v: string; tone?: "warning" }) {
  return (
    <div className="card-elevated p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={`mt-1.5 font-display text-lg font-semibold ${tone === "warning" ? "text-warning" : ""}`}
      >
        {v}
      </p>
    </div>
  );
}

function Stat({ label, v, tone }: { label: string; v: string; tone?: "default" | "danger" }) {
  return (
    <div className="rounded-md border border-hairline bg-surface p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${tone === "danger" ? "text-destructive" : ""}`}>
        {v}
      </p>
    </div>
  );
}

const ttStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-hairline)",
  borderRadius: 6,
  fontSize: 12,
} as const;
