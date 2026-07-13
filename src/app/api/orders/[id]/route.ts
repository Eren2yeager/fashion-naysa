import { withApi, ok } from "@/lib/errors/handler";
import { requireUser } from "@/lib/auth";
import { connectDB, OrderModel } from "@/lib/db";
import { badRequest, notFound } from "@/lib/errors/AppError";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export const GET = withApi(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    if (!id.match(OBJECT_ID)) throw badRequest("Invalid id");
    await connectDB();
    const order = await OrderModel.findOne({ _id: id, userId: user.clerkId })
      .select("-__v -razorpaySignature")
      .lean();
    if (!order) throw notFound("Order not found");
    return ok(order);
  },
);
