import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB, UserModel } from "@/lib/db";
import { forbidden, unauthorized } from "@/lib/errors/AppError";

export type SessionUser = {
  clerkId: string;
  email: string;
  role: "user" | "admin";
  name?: string;
};

async function getOrCreateUser(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  await connectDB();
  let user = await UserModel.findOne({ clerkId: userId }).lean();
  if (!user) {
    const cu = await currentUser();
    if (!cu) return null;
    const created = await UserModel.findOneAndUpdate(
      { clerkId: userId },
      {
        $setOnInsert: {
          clerkId: userId,
          email: cu.emailAddresses[0]?.emailAddress ?? "",
          name: [cu.firstName, cu.lastName].filter(Boolean).join(" ") || undefined,
          imageUrl: cu.imageUrl || undefined,
          role: "user",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    user = created!.toObject();
  }
  return {
    clerkId: user!.clerkId,
    email: user!.email,
    role: user!.role as "user" | "admin",
    name: user!.name ?? undefined,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getOrCreateUser();
  if (!u) throw unauthorized();
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "admin") throw forbidden("Admin role required");
  return u;
}

export async function getOptionalUser(): Promise<SessionUser | null> {
  return getOrCreateUser();
}
