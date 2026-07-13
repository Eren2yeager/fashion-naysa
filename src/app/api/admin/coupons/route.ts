import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { connectDB, CouponModel } from "@/lib/db";
import { couponCreateSchema } from "@/lib/validation/schemas";
import { badRequest } from "@/lib/errors/AppError";

export const GET = withApi(async () => {
  await requireAdmin();
  await connectDB();
  const items = await CouponModel.find().sort({ createdAt: -1 }).select("-__v").lean();
  return ok({ items });
});

export const POST = withApi(async (req: Request) => {
  await requireAdmin();
  const data = couponCreateSchema.parse(await req.json());
  if (data.kind === "percent" && data.amount > 100) {
    throw badRequest("Percent coupon amount must be <= 100");
  }
  await connectDB();
  try {
    const coupon = await CouponModel.create({ ...data, code: data.code.toUpperCase() });
    return ok(coupon, { status: 201 });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw badRequest("Coupon code already exists");
    }
    throw err;
  }
});
