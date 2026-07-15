import { withApi, ok } from "@/lib/errors/handler";
import { requireUser } from "@/lib/auth";
import { connectDB, WishlistModel } from "@/lib/db";
import { wishlistToggleSchema } from "@/lib/validation/schemas";

export const GET = withApi(async () => {
  const user = await requireUser();
  await connectDB();
  const items = await WishlistModel.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .populate("productId", "name slug price images")
    .lean();
  return ok({ items });
});

export const POST = withApi(async (req: Request) => {
  const user = await requireUser();
  const { productId } = wishlistToggleSchema.parse(await req.json());
  await connectDB();
  try {
    await WishlistModel.create({ userId: user.id, productId });
  } catch (err) {
    // duplicate key = already wishlisted; anything else rethrow so withApi -> 500
    if ((err as { code?: number }).code !== 11000) throw err;
  }
  return ok({ ok: true });
});

export const DELETE = withApi(async (req: Request) => {
  const user = await requireUser();
  const { productId } = wishlistToggleSchema.parse(await req.json());
  await connectDB();
  await WishlistModel.deleteOne({ userId: user.id, productId });
  return ok({ ok: true });
});
