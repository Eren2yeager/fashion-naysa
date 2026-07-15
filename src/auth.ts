import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

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
  pages: {
    signIn: "/login",
  },
});
