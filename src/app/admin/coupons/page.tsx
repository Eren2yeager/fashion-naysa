import { requireAdmin } from "@/lib/auth";
import { connectDB, CouponModel } from "@/lib/db";
import { CouponTable } from "@/components/admin/coupons/CouponTable";

export default async function CouponsPage() {
  await requireAdmin();
  await connectDB();
  const coupons = await CouponModel.find()
    .sort({ createdAt: -1 })
    .select("-__v")
    .lean();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Coupons</h1>
      <CouponTable initialCoupons={JSON.parse(JSON.stringify(coupons))} />
    </div>
  );
}
