import Image from "next/image";
import { auth } from "@/auth";
import type { SessionUser } from "@/lib/auth";

interface Props {
  user: SessionUser;
}

export async function ProfileCard({ user }: Props) {
  const session = await auth();
  const imageUrl = session?.user?.image ?? null;

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-5 rounded border border-border bg-muted/30 px-5 py-5">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={user.name ?? "Profile picture"}
          width={56}
          height={56}
          className="rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground tracking-widest border border-border"
        >
          {initials}
        </div>
      )}
      <div className="min-w-0 space-y-0.5">
        {user.name && (
          <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
        )}
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
    </div>
  );
}
