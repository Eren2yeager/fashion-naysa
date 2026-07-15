import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB, UserModel } from "@/lib/db";

// NextAuth v5 (Auth.js) — App Router native.
// We keep our own User mirror in Mongo (see lib/db/models/User) to attach roles
// and other app data; NextAuth only stores identity + the JWT/session.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  callbacks: {
    // Surface our own user record id on the session so API routes can use it
    // as a stable foreign key (Order.userId, Wishlist.userId, ...).
    async jwt({ token, profile }) {
      if (profile?.sub) token.sub = profile.sub;
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  events: {
    // ponytail: eager user mirror on first sign-in. The session helper also
    // upserts lazily via requireUser, but doing it here means the user
    // appears in Mongo as soon as the OAuth callback lands — not only on the
    // first protected API call.
    async signIn({ user, profile, isNewUser }) {
      const accountId = profile?.sub ?? user.id;
      if (!accountId) return;
      await connectDB();
      await UserModel.findOneAndUpdate(
        { accountId },
        {
          $set: {
            email: user.email ?? "",
            name: user.name ?? undefined,
            imageUrl: user.image ?? undefined,
          },
          $setOnInsert: {
            accountId,
            role: "user",
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      ).lean();
      // isNewUser is purely advisory here — the upsert above is idempotent.
      void isNewUser;
    },
  },
  pages: {
    signIn: "/login",
  },
});
