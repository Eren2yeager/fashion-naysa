import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoogleSignInButton } from "./GoogleSignInButton";

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (session) redirect("/");

  const { callbackUrl, error } = await searchParams;

  // Req 11.2: only allow relative paths as callbackUrl
  const safeCallback =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logotype */}
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mb-1">
            Est. 2019
          </p>
          <h1 className="text-4xl font-bold tracking-[0.15em] uppercase text-foreground">
            Naysa
          </h1>
        </div>
 
        {/* Brand statement — Req 11.3 */}
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sign in to track your orders, manage your wishlist,
            <br />
            and check out faster.
          </p>
        </div>

        {/* OAuth error — Req 11.5 */}
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            Sign-in was unsuccessful. Please try again.
          </p>
        )}

        <GoogleSignInButton callbackUrl={safeCallback} />
      </div>
    </main>
  );
}
