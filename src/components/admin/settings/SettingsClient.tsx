"use client";

import { signOut } from "next-auth/react";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth";

export function SettingsClient({ user }: { user: SessionUser }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Profile
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold uppercase text-muted-foreground">
              {(user.name ?? user.email).charAt(0)}
            </div>
            <div className="min-w-0">
              {user.name && (
                <p className="font-medium truncate text-card-foreground">{user.name}</p>
              )}
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground capitalize">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Appearance
        </h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-medium text-card-foreground mb-3">Theme</p>
          <div className="flex gap-3">
            <button
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${
                theme === "light"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              Dark
            </button>
          </div>
        </div>
      </section>

      {/* Sign out */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Account
        </h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={() => signOut({ redirectTo: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}
