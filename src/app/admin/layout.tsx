import { Toaster } from "sonner";
import { requireAdmin } from "@/lib/auth";
import { AppError } from "@/lib/errors/AppError";
import { AdminSidebar } from "@/components/admin/shell/AdminSidebar";
import { AdminHeader } from "@/components/admin/shell/AdminHeader";

function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-semibold">Access denied</h1>
        <p className="text-muted-foreground text-sm">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    </main>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireAdmin();
  } catch (err) {
    if (err instanceof AppError && err.status === 403) {
      return <AccessDeniedPage />;
    }
    throw err;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-800 md:flex-row">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden rounded-tl-2xl bg-background">
        <AdminHeader className="hidden md:flex" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <Toaster richColors />
    </div>
  );
}
