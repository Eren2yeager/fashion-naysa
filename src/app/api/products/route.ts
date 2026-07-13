import { connectDB, ProductModel } from "@/lib/db";
import { withApi, ok } from "@/lib/errors/handler";
import { badRequest } from "@/lib/errors/AppError";
import type { NextRequest } from "next/server";

export const GET = withApi(async (req: NextRequest) => {
  await connectDB();
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? 20)));
  const tag = sp.get("tag") ?? undefined;
  const q = sp.get("q") ?? undefined;

  if (Number.isNaN(page) || Number.isNaN(limit)) {
    throw badRequest("page and limit must be numbers");
  }

  const filter: Record<string, unknown> = { isActive: true };
  if (tag) filter.tags = tag;
  if (q) filter.name = { $regex: q, $options: "i" };

  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v")
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return ok({ items, page, limit, total });
});
