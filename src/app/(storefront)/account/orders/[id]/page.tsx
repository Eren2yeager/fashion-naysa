import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth";
import { OrderDetailLoader } from "@/components/storefront/account/OrderDetailLoader";

type Props = { params: Promise<{ id: string }> };

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id.slice(-8).toUpperCase()}`,
    robots: { index: false, follow: false },
  };
}

export default async function AccountOrderDetailPage({ params }: Props) {
  const { id } = await params;

  const user = await getOptionalUser();
  if (!user) redirect(`/login?callbackUrl=/account/orders/${id}`);

  if (!OBJECT_ID.test(id)) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <OrderDetailLoader id={id} user={user} />
    </div>
  );
}
