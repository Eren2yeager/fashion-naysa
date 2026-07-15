import { requireAdmin } from "@/lib/auth";
import { SettingsClient } from "@/components/admin/settings/SettingsClient";

export const metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  return <SettingsClient user={user} />;
}
