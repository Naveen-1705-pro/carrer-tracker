"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Kanban,
  MessageSquare,
  Shield,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  FileCode,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/latex", label: "LaTeX Builder", icon: FileCode },
  { href: "/jobs", label: "Job Match", icon: Briefcase },
  { href: "/improve", label: "AI Improver", icon: Sparkles },
  { href: "/tracker", label: "Tracker", icon: Kanban },
  { href: "/chat", label: "Career AI", icon: MessageSquare },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  // Automatically close mobile menu when path changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent font-extrabold tracking-wide">
            AI ResumeIQ
          </span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Drawer Navigation Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[65px] bottom-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col border-t border-border">
          <div className="p-5 border-b border-border bg-card/20">
            <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Dashboard Workspace</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-purple-500/15 text-purple-400 font-medium border-l-2 border-purple-500 pl-2.5"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors",
                  pathname === "/admin"
                    ? "bg-amber-500/15 text-amber-400 font-medium border-l-2 border-amber-500 pl-2.5"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Shield className="w-5 h-5" />
                Admin Panel
              </Link>
            )}
          </nav>
          <div className="p-4 border-t border-border space-y-2 bg-card/20">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 h-11"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              Toggle Theme Mode
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 h-11 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl hidden lg:flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent font-extrabold tracking-wide">
              AI ResumeIQ
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-purple-500/15 text-purple-400 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                pathname === "/admin"
                  ? "bg-amber-500/15 text-amber-400 font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            Toggle theme
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-red-400"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

