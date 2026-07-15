import Image from "next/image";
import Link from "next/link";
import { getOptionalUser } from "@/lib/auth";
import { GoogleSignInButton } from "@/app/login/GoogleSignInButton";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Naysa Admin",
  description: "Admin CMS for Naysa",
};

export default async function AdminLandingPage() {
  const user = await getOptionalUser();

  const isAdmin = user?.role === "admin";
  const isLoggedIn = !!user;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(0.145_0_0/4%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.145_0_0/4%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,oklch(0.985_0_0/4%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.985_0_0/4%)_1px,transparent_1px)] bg-size-[48px_48px]"
      />

      {/* Top-right theme badge */}
      <div className="absolute right-6 top-6">
        <AnimatedShinyText className="text-xs tracking-widest uppercase font-mono text-muted-foreground">
          CMS
        </AnimatedShinyText>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <BorderBeam
          size={120}
          duration={10}
          colorFrom="oklch(0.708 0 0)"
          colorTo="oklch(0.439 0 0)"
        />

        {/* App icon + wordmark */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/icon0.svg"
            alt="Naysa"
            width={48}
            height={48}
            className="shrink-0"
            priority
          />
          <div className="text-center">
            <h1 className="font-heading text-2xl tracking-tight text-foreground">
              Naysa
            </h1>
            <p className="mt-0.5 text-xs font-mono tracking-widest uppercase text-muted-foreground">
              Admin Console
            </p>
          </div>
        </div>

        {/* Auth states */}
        {!isLoggedIn && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Sign in with your Google account to continue.
            </p>
            <div className="flex justify-center">
              <GoogleSignInButton callbackUrl="/admin" />
            </div>
          </div>
        )}

        {isLoggedIn && isAdmin && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="mt-0.5 truncate text-sm font-medium text-foreground">
                {user.email}
              </p>
            </div>
            <Link
              href="/admin/dashboard"
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg",
                "bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground",
                "transition-opacity hover:opacity-90"
              )}
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {isLoggedIn && !isAdmin && (
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-center">
              <p className="text-sm font-medium text-destructive">
                Admin credentials required
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your account ({user.email}) does not have admin access.
              </p>
            </div>
          </div>
        )}
      </div>


    </main>
  );
}
