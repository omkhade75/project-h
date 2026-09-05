import { fetchApi } from './api-client';

type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __bizoraErrorTrackingInstalled?: boolean;
  }
}

const reportedErrors = new Set<string>();

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const errObj = error instanceof Error ? error : new Error(String(error));
  const errorMessage = errObj.message || String(error);
  const errorStack = errObj.stack || "";

  try {
    window.__lovableEvents?.captureException?.(
      error,
      {
        source: "react_error_boundary",
        route: window.location.pathname,
        ...context,
      },
      {
        mechanism: "react_error_boundary",
        handled: false,
        severity: "error",
      },
    );
  } catch (_) {}

  const errorKey = `${errorMessage}:${window.location.pathname}`;
  if (reportedErrors.has(errorKey)) return;
  reportedErrors.add(errorKey);
  setTimeout(() => reportedErrors.delete(errorKey), 30000);

  try {
    let userEmail: string | undefined;
    try {
      const stored = window.localStorage.getItem('bizora_auth_user');
      if (stored) {
        const u = JSON.parse(stored);
        userEmail = u.email;
      }
    } catch (_) {}

    fetchApi('/api/health/report-error', {
      method: 'POST',
      body: JSON.stringify({
        app: 'supplier',
        message: errorMessage,
        stack: errorStack,
        url: window.location.href,
        userEmail,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  } catch (_) {}
}

if (typeof window !== 'undefined' && !window.__bizoraErrorTrackingInstalled) {
  window.__bizoraErrorTrackingInstalled = true;

  window.addEventListener('error', (event) => {
    if (!event.error && !event.message) return;
    if (event.message?.includes('ResizeObserver') || event.message?.includes('Script error')) return;

    reportLovableError(event.error || new Error(event.message), {
      source: 'window_onerror',
      lineno: event.lineno,
      colno: event.colno,
      filename: event.filename,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!event.reason) return;
    reportLovableError(event.reason, {
      source: 'unhandled_promise_rejection',
    });
  });
}
