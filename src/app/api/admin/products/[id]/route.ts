import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { connectDB, ProductModel } from "@/lib/db";
import { productUpdateSchema } from "@/lib/validation/schemas";
import { badRequest, notFound } from "@/lib/errors/AppError";

export const PATCH = withApi(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await ctx.params;
    const data = productUpdateSchema.parse(await req.json());
    await connectDB();
    const updated = await ProductModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw notFound("Product not found");
    return ok(updated);
  },
);

export const DELETE = withApi(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await ctx.params;
    await connectDB();
    const deleted = await ProductModel.findByIdAndDelete(id);
    if (!deleted) throw notFound("Product not found");
    if (!id.match(/^[0-9a-fA-F]{24}$/)) throw badRequest("Invalid id");
    return ok({ ok: true });
  },
);
