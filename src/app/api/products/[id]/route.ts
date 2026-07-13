import { connectDB, ProductModel } from "@/lib/db";
import { withApi, ok } from "@/lib/errors/handler";
import { notFound } from "@/lib/errors/AppError";

export const GET = withApi(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    await connectDB();

    const product = await ProductModel.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }],
      isActive: true,
    })
      .select("-__v")
      .lean();

    if (!product) throw notFound("Product not found");
    return ok(product);
  },
);
