import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { connectDB, CouponModel } from "@/lib/db";
import { badRequest, notFound } from "@/lib/errors/AppError";
import { z } from "zod";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

const patchSchema = z.object({ isActive: z.boolean().optional() });

export const PATCH = withApi(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await ctx.params;
    if (!id.match(OBJECT_ID)) throw badRequest("Invalid id");
    const data = patchSchema.parse(await req.json());
    await connectDB();
    const updated = await CouponModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
    if (!updated) throw notFound("Coupon not found");
    return ok(updated);
  },
);
