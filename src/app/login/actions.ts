"use server";

import { signIn } from "@/auth";

export async function googleSignIn(callbackUrl?: string) {
  // Req 11.2: only allow relative paths; fall back to "/" for anything else
  const redirectTo =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";
  await signIn("google", { redirectTo });
}
