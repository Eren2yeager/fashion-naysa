import { auth } from "@/auth";
import { connectDB, UserModel } from "@/lib/db";
import { forbidden, unauthorized } from "@/lib/errors/AppError";

export type SessionUser = {
  id: string; // Google `sub` — stable per account
  email: string;
  role: "user" | "admin";
  name?: string;
};

async function loadOrCreateSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  // We attached `id` to session.user in the NextAuth callbacks.
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;

  await connectDB();
  const user = await UserModel.findOneAndUpdate(
    { accountId: id },
    {
      $setOnInsert: {
        accountId: id,
        email: session?.user?.email ?? "",
        name: session?.user?.name ?? undefined,
        imageUrl: session?.user?.image ?? undefined,
        role: "user",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  if (!user) return null;
  return {
    id: user.accountId,
    email: user.email,
    role: user.role as "user" | "admin",
    name: user.name ?? undefined,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await loadOrCreateSessionUser();
  if (!u) throw unauthorized();
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "admin") throw forbidden("Admin role required");
  return u;
}

export async function getOptionalUser(): Promise<SessionUser | null> {
  return loadOrCreateSessionUser();
}
