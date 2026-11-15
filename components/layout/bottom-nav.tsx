"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Flame, MessageSquare, Compass, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/today", label: "Today", icon: Flame },
  { href: "/track", label: "Track", icon: CalendarDays },
  { href: "/ask", label: "Ask", icon: MessageSquare },
  { href: "/plan", label: "Plan", icon: Compass },
  { href: "/money", label: "Money", icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on onboarding or login pages
  if (pathname === "/login" || pathname === "/register" || pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-1 border-t border-border">
      <div className="max-w-md mx-auto h-16 flex items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-2 text-xs font-medium transition-transform active:scale-95",
                isActive
                  ? "text-accent font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive ? "stroke-[2.5]" : "stroke-[1.75]")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
