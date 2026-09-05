import { cn } from "@/lib/utils";

interface BizoraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  subtitle?: string;
  variant?: "default" | "admin" | "owner" | "supplier" | "customer" | "web";
}

export function BizoraLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full drop-shadow-sm select-none", className)}
    >
      <defs>
        <linearGradient id="bz-icon-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="bz-icon-accent" x1="14" y1="18" x2="30" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>

      {/* High-definition rounded badge base */}
      <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#bz-icon-bg)" />
      <rect x="1.5" y="1.5" width="37" height="37" rx="9.5" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="1" />

      {/* Crisp White Bold Geometric B */}
      <path
        d="M10 9H15.5V31H10C9.44772 31 9 30.5523 9 30V10C9 9.44772 9.44772 9 10 9Z"
        fill="#FFFFFF"
      />

      {/* Top Loop */}
      <path
        d="M15.5 9H22.5C25.5376 9 28 11.4624 28 14.5C28 17.5376 25.5376 20 22.5 20H15.5V9Z"
        fill="#FFFFFF"
      />
      <rect x="15.5" y="12.5" width="6.5" height="4" rx="2" fill="#5B21B6" />

      {/* Bottom Loop with vibrant cyan accent */}
      <path
        d="M15.5 19.5H23.5C26.8137 19.5 29.5 22.1863 29.5 25.5C29.5 28.8137 26.8137 31.5 23.5 31.5H15.5V19.5Z"
        fill="#FFFFFF"
      />
      <rect x="15.5" y="22.5" width="7.5" height="5.5" rx="2.75" fill="url(#bz-icon-accent)" />

      {/* AI Center Luminescence Node */}
      <circle cx="21" cy="20" r="1.75" fill="#38BDF8" />
    </svg>
  );
}

export function BizoraLogo({
  className,
  size = "md",
  subtitle,
  variant = "default",
}: BizoraLogoProps) {
  const iconSizes = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
    xl: "h-14 w-14",
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
  };

  const variantBadges = {
    default: { text: "AI Decision OS", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    admin: { text: "SUPER ADMIN CONSOLE", color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20" },
    owner: { text: "BUSINESS OWNER PORTAL", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" },
    supplier: { text: "SUPPLIER NETWORK HUB", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20" },
    customer: { text: "SHOPPER EXPERIENCE PORTAL", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    web: { text: "ENTERPRISE INTELLIGENCE", color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
  };

  const badge = variantBadges[variant] || variantBadges.default;
  const sub = subtitle || badge.text;

  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <div className={cn("shrink-0 rounded-xl shadow-sm transition-transform hover:scale-105", iconSizes[size])}>
        <BizoraLogoIcon />
      </div>
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1">
          <span className={cn("font-display font-black tracking-tight text-foreground", titleSizes[size])}>
            Bizora
          </span>
          <span className={cn("font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500", titleSizes[size])}>
            AI
          </span>
        </div>
        {sub && (
          <span className={cn("mt-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-md border w-fit leading-none truncate max-w-[170px] sm:max-w-none inline-block", badge.color)}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
