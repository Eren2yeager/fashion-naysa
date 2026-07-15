import { GoogleSignInButton } from "./GoogleSignInButton";

type SearchParams = Promise<{ callbackUrl?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { callbackUrl } = await searchParams;
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-foreground/10 p-6">
        <h1 className="mb-1 text-2xl font-semibold">Sign in</h1>
        <p className="mb-6 text-sm text-foreground/60">
          Sign in to track orders, manage your wishlist, and check out faster.
        </p>
        <GoogleSignInButton callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}
