import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { connectDB, OrderModel } from "@/lib/db";
import type { NextRequest } from "next/server";

export const GET = withApi(async (req: NextRequest) => {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") ?? undefined;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 30)));

  await connectDB();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v -razorpaySignature")
      .lean(),
    OrderModel.countDocuments(filter),
  ]);
  return ok({ items, page, limit, total });
});
