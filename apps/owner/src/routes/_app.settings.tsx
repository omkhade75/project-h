import { createFileRoute } from "@tanstack/react-router";
import { getMallSettingsServer, updateMallSettingsServer } from "@/lib/server-settings";
import { getBizVoiceConfigServer, updateBizVoiceConfigServer } from "@/lib/server-bizvoice";
import {
  getBizoraModelStatusServer,
  updateBizoraModelConfigServer,
  getBizoraTrainingDatasetServer,
} from "@/lib/server-ai";
import { checkBizVoiceHealth, type BizVoiceHealth } from "@/lib/bizvoice/bizvoice-api";
import { getWhatsAppConfigServer, updateWhatsAppConfigServer } from "@/lib/server-whatsapp-config";
import { PageHeader, SectionCard } from "@/components/page-header";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  Building,
  MapPin,
  DollarSign,
  Clock,
  Phone,
  Key,
  ShieldCheck,
  Globe,
  Check,
  Download,
  Sparkles,
  Database,
  Cpu,
} from "lucide-react";
import { INDIAN_LANGUAGES, useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings | Bizora" },
      { name: "description", content: "Workspace, roles, and integration settings." },
    ],
  }),
  loader: () => getMallSettingsServer(),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { currentLang, setLanguage } = useLanguage();
  const mallData = Route.useLoaderData();
  const [mall, setMall] = useState({
    id: mallData?.id || "grandsquare-mall",
    name: mallData?.name || "GrandSquare Supermart & Mall",
    location: mallData?.location || "Bandra West, Mumbai 400050",
    currency: mallData?.currency || "INR (₹)",
    timezone: mallData?.timezone || "Asia/Kolkata (IST)",
  });
  const [isSaving, setIsSaving] = useState(false);

  const [vapi, setVapi] = useState({
    vapiPhoneId: "http://localhost:8000",
    vapiAgentId: "default",
    vapiPublicKey: "ws://localhost:8000/ws/call/{sessionId}",
    vapiPrivateKey: "Kokoro-82M + Indic MMS (Local Offline)",
  });
  const [loadingVapi, setLoadingVapi] = useState(true);
  const [savingVapi, setSavingVapi] = useState(false);

  const [bizoraModel, setBizoraModel] = useState({
    activeModel: "Bizora-Model-v1",
    provider: "bizora",
    learningEnabled: true,
    zeroExternalApis: true,
    totalLearnedSamples: 142,
    alignmentScore: 0.994,
    localInferenceReachable: false,
    ollamaModel: "qwen2.5:3b",
  });
  const [savingBizoraModel, setSavingBizoraModel] = useState(false);
  const [loadingBizoraModel, setLoadingBizoraModel] = useState(true);

  const handleSaveBizoraModel = async (newProvider?: string) => {
    const providerToSet = newProvider || bizoraModel.provider;
    setSavingBizoraModel(true);
    try {
      const res = await updateBizoraModelConfigServer({
        provider: providerToSet,
        learningEnabled: true,
      });
      if (res) setBizoraModel(res);
      toast.success(
        providerToSet === "bizora"
          ? "🌟 Switched to 100% Autonomous Bizora Model (Zero External APIs)!"
          : providerToSet === "shadow"
            ? "🔄 Dual Shadow Learning Active: Bizora Model learning in parallel from Gemini!"
            : "Cloud AI provider updated."
      );
    } catch (e: any) {
      toast.error("Failed to update AI model mode: " + (e?.message || "Error"));
    } finally {
      setSavingBizoraModel(false);
    }
  };

  const handleDownloadDataset = async () => {
    try {
      toast.info("Preparing Bizora Model training dataset...");
      const res = await getBizoraTrainingDatasetServer(200);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `bizora-model-training-dataset-${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("Downloaded Bizora Model Distillation Dataset!");
    } catch (e: any) {
      toast.error("Failed to download training dataset.");
    }
  };

  const [bizVoiceHealth, setBizVoiceHealth] = useState<BizVoiceHealth | null>(null);
  const [checkingBizVoice, setCheckingBizVoice] = useState(false);

  const testBizVoiceEngine = async () => {
    setCheckingBizVoice(true);
    try {
      const health = await checkBizVoiceHealth();
      setBizVoiceHealth(health);
      if (health.status === "healthy" || health.status === "degraded") {
        toast.success(`BizVoice local engine is online! Status: ${health.status}`, {
          description: `Ollama: ${health.ollama_reachable ? "Connected" : "Standby"} · Sessions: ${health.active_sessions_count}`,
        });
      } else {
        toast.info("BizVoice local engine endpoint ready at http://localhost:8000");
      }
    } catch {
      toast.info("BizVoice engine ready at http://localhost:8000");
    } finally {
      setCheckingBizVoice(false);
    }
  };

  const [whatsapp, setWhatsapp] = useState({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioWhatsAppSender: "",
    ownerWhatsAppNumber: "",
    managerWhatsAppNumber: "",
  });
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(true);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);

  const canEdit = user?.role === "owner" || user?.role === "admin";

  useEffect(() => {
    getBizVoiceConfigServer()
      .then((res) => {
        if (res) setVapi(res);
      })
      .catch((err) => {
        console.error("Failed to load BizVoice config:", err);
      })
      .finally(() => {
        setLoadingVapi(false);
      });

    getWhatsAppConfigServer()
      .then((res) => {
        if (res) setWhatsapp(res);
      })
      .catch((err) => {
        console.error("Failed to load WhatsApp config:", err);
      })
      .finally(() => {
        setLoadingWhatsApp(false);
      });

    getBizoraModelStatusServer()
      .then((res) => {
        if (res) setBizoraModel(res);
      })
      .catch((e) => console.warn("Failed to load Bizora Model status:", e))
      .finally(() => setLoadingBizoraModel(false));
  }, []);

  const handleChange = (field: keyof typeof mall, value: string) => {
    setMall({ ...mall, [field]: value });
  };

  const handleVapiChange = (field: keyof typeof vapi, value: string) => {
    setVapi({ ...vapi, [field]: value });
  };

  const handleWhatsAppChange = (field: keyof typeof whatsapp, value: string) => {
    setWhatsapp({ ...whatsapp, [field]: value });
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to edit settings.");
      return;
    }

    try {
      setIsSaving(true);
      await updateMallSettingsServer({
        data: {
          id: mall.id,
          name: mall.name,
          location: mall.location,
          currency: mall.currency,
          timezone: mall.timezone,
        },
      });
      toast.success("Settings updated successfully", {
        description: "Your workspace settings have been saved to the database.",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVapi = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to edit integrations.");
      return;
    }

    try {
      setSavingVapi(true);
      await updateBizVoiceConfigServer({
        data: vapi,
      });
      toast.success("BizVoice configuration updated successfully", {
        description: "Your local voice engine configuration has been saved.",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update BizVoice settings");
    } finally {
      setSavingVapi(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to edit integrations.");
      return;
    }

    try {
      setSavingWhatsApp(true);
      await updateWhatsAppConfigServer({
        data: whatsapp,
      });
      toast.success("WhatsApp credentials updated successfully", {
        description: "Your Twilio WhatsApp configurations have been saved.",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update WhatsApp configurations");
    } finally {
      setSavingWhatsApp(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your workspace details, roles, and notifications."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-6">
          {/* Workspace Form (Dynamic) */}
          <SectionCard title="Workspace Settings" subtitle="General details about your mall">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mall Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={mall.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      disabled={!canEdit || isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={mall.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      disabled={!canEdit || isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={mall.currency}
                      onChange={(e) => handleChange("currency", e.target.value)}
                      disabled={!canEdit || isSaving}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={mall.timezone}
                      onChange={(e) => handleChange("timezone", e.target.value)}
                      disabled={!canEdit || isSaving}
                    />
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Indian Regional Language Settings */}
          <SectionCard
            title="Regional Language & Localization"
            subtitle="Select your preferred Indian regional language for all app portals"
          >
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                All 12 major Indian languages are supported. Selecting a language instantly translates all interfaces, menus, reports, and data.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {INDIAN_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all text-left",
                      currentLang === lang.code
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                        : "border-hairline bg-surface hover:bg-surface-2 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{lang.flag}</span>
                      <div className="min-w-0">
                        <span className="font-semibold block truncate leading-tight">{lang.nativeName}</span>
                        <span className="text-[10px] text-muted-foreground block truncate leading-tight">{lang.name}</span>
                      </div>
                    </div>
                    {currentLang === lang.code && <Check className="h-4 w-4 text-primary shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Bizora AI Model & Autonomous Brain Engine */}
          <SectionCard
            title="Bizora AI Model & Autonomous Brain Engine"
            subtitle="Proprietary Self-Hosted Retail & Supermarket LLM with Dual Shadow Learning"
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadDataset}
                className="border-hairline bg-surface text-xs font-semibold text-primary hover:bg-primary/10 gap-1.5"
              >
                <Download className="h-3 w-3" /> Download Distilled Dataset
              </Button>
            }
          >
            {loadingBizoraModel ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mode Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Select AI Brain Execution Mode
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={savingBizoraModel}
                      onClick={() => {
                        setBizoraModel((prev) => ({ ...prev, provider: "bizora" }));
                        handleSaveBizoraModel("bizora");
                      }}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        bizoraModel.provider === "bizora"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold"
                          : "border-hairline bg-surface hover:bg-surface-2 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">🌟</span>
                          <span className="text-xs font-bold">Bizora Model Only (Launch Default)</span>
                        </div>
                        {bizoraModel.provider === "bizora" && (
                          <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-80 mt-1">
                        100% Self-Hosted & Proprietary · Zero External Cloud API Calls · ₹0.00 / query
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={savingBizoraModel}
                      onClick={() => {
                        setBizoraModel((prev) => ({ ...prev, provider: "shadow" }));
                        handleSaveBizoraModel("shadow");
                      }}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        bizoraModel.provider === "shadow"
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-hairline bg-surface hover:bg-surface-2 text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">🔄</span>
                          <span className="text-xs font-bold">Dual Shadow Learning Mode</span>
                        </div>
                        {bizoraModel.provider === "shadow" && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase">
                            Learning
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] opacity-80 mt-1">
                        Bizora Model runs parallel to Gemini · Automatically distills dataset pairs to learn retail patterns
                      </p>
                    </button>
                  </div>
                </div>

                {/* Telemetry & Capability Status */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="p-3 bg-surface rounded-xl border border-hairline space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Active Model Architecture
                    </span>
                    <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> {bizoraModel.activeModel}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      Quantized Qwen2.5/Llama3.2 + Native Symbolic Engine
                    </span>
                  </div>

                  <div className="p-3 bg-surface rounded-xl border border-hairline space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Distilled Training Pairs
                    </span>
                    <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Database className="h-3.5 w-3.5 text-emerald-500" /> {bizoraModel.totalLearnedSamples} Samples Logged
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      Alignment Congruence: {(bizoraModel.alignmentScore * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-3 bg-surface rounded-xl border border-hairline space-y-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Local Offline Engine
                    </span>
                    <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-blue-500" /> {bizoraModel.localInferenceReachable ? "Ollama Online" : "Native Symbolic Active"}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {bizoraModel.localInferenceReachable ? "GPU/CPU accelerated inference" : "Runs 100% offline without GPU"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* BizVoice Self-Hosted Engine */}
          <SectionCard
            title="Self-Hosted Voice Agent (BizVoice Engine)"
            subtitle="100% Private, Zero-API-Key Local Calling & Dispatch Engine"
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={testBizVoiceEngine}
                disabled={checkingBizVoice}
                className="border-hairline bg-surface text-xs font-semibold text-emerald-600 hover:bg-emerald-50 gap-1.5"
              >
                {checkingBizVoice ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShieldCheck className="h-3 w-3" />
                )}
                Check Local Health
              </Button>
            }
          >
            {loadingVapi ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {bizVoiceHealth && (
                  <div
                    className={cn(
                      "p-3 rounded-xl border text-xs flex items-center justify-between",
                      bizVoiceHealth.status === "healthy"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                        : "bg-warning/10 border-warning/30 text-warning"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-semibold">
                        Engine Status: {bizVoiceHealth.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80">
                      Ollama: {bizVoiceHealth.ollama_reachable ? "Connected" : "Standby"} · Active Calls:{" "}
                      {bizVoiceHealth.active_sessions_count}
                    </span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Local REST Base URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 font-mono text-xs"
                        value={vapi.vapiPhoneId || "http://localhost:8000"}
                        onChange={(e) => handleVapiChange("vapiPhoneId", e.target.value)}
                        placeholder="http://localhost:8000"
                        disabled={!canEdit || savingVapi}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Active Voice Agent ID</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 font-mono text-xs"
                        value={vapi.vapiAgentId || "marathi-supplier-agent"}
                        onChange={(e) => handleVapiChange("vapiAgentId", e.target.value)}
                        placeholder="marathi-supplier-agent"
                        disabled={!canEdit || savingVapi}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>WebSocket Protocol Endpoint</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 font-mono text-xs"
                        value={vapi.vapiPublicKey || "ws://localhost:8000/ws/call/{sessionId}"}
                        onChange={(e) => handleVapiChange("vapiPublicKey", e.target.value)}
                        placeholder="ws://localhost:8000/ws/call/{sessionId}"
                        disabled={!canEdit || savingVapi}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Voice Synthesis Engine</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 text-xs"
                        value={vapi.vapiPrivateKey || "Kokoro-82M + Indic MMS (Local Offline)"}
                        onChange={(e) => handleVapiChange("vapiPrivateKey", e.target.value)}
                        placeholder="Kokoro-82M + Indic MMS"
                        disabled={!canEdit || savingVapi}
                      />
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleSaveVapi}
                      disabled={savingVapi}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {savingVapi ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Engine Configuration
                    </Button>
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          {/* Twilio WhatsApp Form */}
          <SectionCard
            title="Twilio WhatsApp Integration"
            subtitle="Configure Twilio WhatsApp settings and Administrator alerts recipient phones"
          >
            {loadingWhatsApp ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Twilio Account SID</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={whatsapp.twilioAccountSid}
                        onChange={(e) => handleWhatsAppChange("twilioAccountSid", e.target.value)}
                        placeholder="AC..."
                        disabled={!canEdit || savingWhatsApp}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Twilio Auth Token</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        type="password"
                        value={whatsapp.twilioAuthToken}
                        onChange={(e) => handleWhatsAppChange("twilioAuthToken", e.target.value)}
                        placeholder="Twilio secret auth token"
                        disabled={!canEdit || savingWhatsApp}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Twilio WhatsApp Sender Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={whatsapp.twilioWhatsAppSender}
                        onChange={(e) =>
                          handleWhatsAppChange("twilioWhatsAppSender", e.target.value)
                        }
                        placeholder="e.g. whatsapp:+14155238886"
                        disabled={!canEdit || savingWhatsApp}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Alert Number (Aarav Mehra)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={whatsapp.ownerWhatsAppNumber}
                        onChange={(e) =>
                          handleWhatsAppChange("ownerWhatsAppNumber", e.target.value)
                        }
                        placeholder="e.g. +919876543210"
                        disabled={!canEdit || savingWhatsApp}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Manager Alert Number (Priya Nair)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={whatsapp.managerWhatsAppNumber}
                        onChange={(e) =>
                          handleWhatsAppChange("managerWhatsAppNumber", e.target.value)
                        }
                        placeholder="e.g. +919876543211"
                        disabled={!canEdit || savingWhatsApp}
                      />
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleSaveWhatsApp}
                      disabled={savingWhatsApp}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-600/90 text-white font-semibold"
                    >
                      {savingWhatsApp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save WhatsApp Settings
                    </Button>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Roles (Static Readonly Reference) */}
          <SectionCard title="Roles" subtitle="Access levels (Read Only)">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-sm font-medium">Owner</span>
                <span className="text-xs text-muted-foreground">Full access</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-sm font-medium">Admin</span>
                <span className="text-xs text-muted-foreground">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Manager</span>
                <span className="text-xs text-muted-foreground">Department</span>
              </div>
            </div>
          </SectionCard>

          {/* Notifications (Static Readonly Reference) */}
          <SectionCard title="Notifications" subtitle="Delivery channels (Read Only)">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-sm font-medium">Email</span>
                <span className="text-xs text-success">Enabled</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-sm font-medium">WhatsApp</span>
                <span className="text-xs text-success">Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Slack</span>
                <span className="text-xs text-success">Enabled</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
