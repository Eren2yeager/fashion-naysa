import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { SettingsClient } from "@/components/admin/settings/SettingsClient";

export const metadata: Metadata = {
  title: "Settings — Naysa Admin",
  description: "Manage your admin account settings.",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const user = await requireAdmin();
  return <SettingsClient user={user} />;
}
