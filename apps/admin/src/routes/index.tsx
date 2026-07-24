import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { getCurrentSessionServer } = await import("@/lib/server-auth");
    const res = await getCurrentSessionServer();
    if (!res.user) {
      throw redirect({ to: "/login" });
    } else {
      throw redirect({ to: "/system-admin" });
    }
  },
  component: AdminRedirect,
});

function AdminRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate({ to: "/system-admin", replace: true });
      } else {
        navigate({ to: "/login", replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
          Redirecting to Super Admin Console...
        </p>
      </div>
    </div>
  );
}
