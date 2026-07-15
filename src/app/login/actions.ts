"use server";

import { signIn } from "@/auth";

export async function googleSignIn(callbackUrl = "/") {
  await signIn("google", { redirectTo: callbackUrl });
}
