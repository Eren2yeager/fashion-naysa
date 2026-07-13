import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { connectDB, ProductModel } from "@/lib/db";
import { productCreateSchema } from "@/lib/validation/schemas";
import { badRequest } from "@/lib/errors/AppError";

export const GET = withApi(async () => {
  await requireAdmin();
  await connectDB();
  const items = await ProductModel.find().sort({ createdAt: -1 }).select("-__v").lean();
  return ok({ items });
});

export const POST = withApi(async (req: Request) => {
  await requireAdmin();
  const data = productCreateSchema.parse(await req.json());
  await connectDB();
  try {
    const created = await ProductModel.create(data);
    return ok(created, { status: 201 });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw badRequest("Slug already exists");
    }
    throw err;
  }
});
