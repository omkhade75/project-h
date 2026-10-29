import { LanguageProvider } from "../lib/language-context";

if (typeof window !== "undefined") {
  const origError = console.error;
  console.error = function (...args: any[]) {
    const msg = String(args[0] || "");
    if (
      msg.includes("Minified React error #418") ||
      msg.includes("Hydration failed") ||
      msg.includes("Text content does not match")
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { BusinessDataProvider } from "../lib/business-context";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The screen you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to Bizora
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root error caught:", error);
  const router = useRouter();
  const errorMsg = (error?.message || "").toLowerCase();

  useEffect(() => {
    // 🛡️ Auto-healing: If error is caused by Google Translate DOM mutations or stale chunk imports, recover automatically!
    if (
      errorMsg.includes("removechild") ||
      errorMsg.includes("insertbefore") ||
      errorMsg.includes("replacechild") ||
      errorMsg.includes("not a child") ||
      errorMsg.includes("node to be removed") ||
      errorMsg.includes("failed to fetch dynamically imported module") ||
      errorMsg.includes("loading chunk")
    ) {
      console.warn("🛡️ [Auto-Healing] Absorbed DOM mutation / chunk error. Recovering view...");
      const timer = setTimeout(() => {
        router.invalidate();
        reset();
      }, 60);
      return () => clearTimeout(timer);
    }
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error, errorMsg, reset, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message || "An unexpected system error occurred. Please try refreshing."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-hairline bg-surface px-4 py-2 text-sm font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      { name: "theme-color", content: "#0f172a" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Bizora AI — Business Intelligence & Decision OS" },
      {
        name: "description",
        content:
          "Bizora AI transforms business operations data into predictive insights, AI recommendations, and evidence-backed decisions for owners, admins, and managers.",
      },
      { name: "author", content: "Bizora AI" },
      { property: "og:title", content: "Bizora AI — Business Intelligence & Decision OS" },
      {
        property: "og:description",
        content:
          "From business data to intelligent decisions. Analytics, forecasting, and AI decisions for modern businesses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Bizora AI — Business Intelligence & Decision OS" },
      {
        name: "description",
        content:
          "Bizora Insights is an AI-powered business intelligence platform for decision-making.",
      },
      {
        property: "og:description",
        content:
          "Bizora Insights is an AI-powered business intelligence platform for decision-making.",
      },
      {
        name: "twitter:description",
        content:
          "Bizora Insights is an AI-powered business intelligence platform for decision-making.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // 1. Monkey-patch Node DOM mutation methods to prevent Google Translate from crashing React
                if (typeof Node === 'function' && Node.prototype) {
                  var originalRemoveChild = Node.prototype.removeChild;
                  Node.prototype.removeChild = function(child) {
                    if (child.parentNode !== this) {
                      if (child.parentNode) {
                        try { return child.parentNode.removeChild(child); } catch (_) {}
                      }
                      return child;
                    }
                    return originalRemoveChild.apply(this, arguments);
                  };

                  var originalInsertBefore = Node.prototype.insertBefore;
                  Node.prototype.insertBefore = function(newNode, referenceNode) {
                    if (referenceNode && referenceNode.parentNode !== this) {
                      if (referenceNode.parentNode) {
                        try { return referenceNode.parentNode.insertBefore(newNode, referenceNode); } catch (_) {}
                      }
                      return newNode;
                    }
                    return originalInsertBefore.apply(this, arguments);
                  };

                  var originalReplaceChild = Node.prototype.replaceChild;
                  Node.prototype.replaceChild = function(newChild, oldChild) {
                    if (oldChild && oldChild.parentNode !== this) {
                      if (oldChild.parentNode) {
                        try { return oldChild.parentNode.replaceChild(newChild, oldChild); } catch (_) {}
                      }
                      return oldChild;
                    }
                    return originalReplaceChild.apply(this, arguments);
                  };
                }

                // 2. Theme initialization — read from localStorage, default to light
                var theme = 'light';
                try { theme = localStorage.getItem('bizora-theme') || 'light'; } catch(e) {}
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }

                function isIgnorableError(arg) {
                  if (!arg) return false;
                  var str = '';
                  if (typeof arg === 'string') str = arg;
                  else if (arg instanceof Error) str = (arg.message || '') + ' ' + (arg.stack || '') + ' ' + String(arg);
                  else str = JSON.stringify(arg) || String(arg);
                  return str.indexOf('removeChild') !== -1 ||
                         str.indexOf('insertBefore') !== -1 ||
                         str.indexOf('replaceChild') !== -1 ||
                         str.indexOf('not a child of this node') !== -1 ||
                         str.indexOf('node to be removed') !== -1 ||
                         str.indexOf('418') !== -1 ||
                         str.indexOf('Hydration') !== -1 ||
                         str.indexOf('hydration') !== -1 ||
                         str.indexOf('react.dev/errors/418') !== -1;
                }

                var origError = console.error;
                console.error = function() {
                  for (var i = 0; i < arguments.length; i++) {
                    if (isIgnorableError(arguments[i])) {
                      return;
                    }
                  }
                  origError.apply(console, arguments);
                };

                window.addEventListener('error', function(e) {
                  if (isIgnorableError(e.error) || isIgnorableError(e.message)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(e) {
                  if (isIgnorableError(e.reason)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
              })();
            `,
          }}
        />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BusinessDataProvider>
            {mounted ? (
              <Outlet />
            ) : (
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}
            <Toaster />
          </BusinessDataProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
