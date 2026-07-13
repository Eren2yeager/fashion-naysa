import { withApi, ok } from "@/lib/errors/handler";
import { requireUser } from "@/lib/auth";
import { connectDB, OrderModel } from "@/lib/db";

export const GET = withApi(async () => {
  const user = await requireUser();
  await connectDB();
  const items = await OrderModel.find({ userId: user.clerkId })
    .sort({ createdAt: -1 })
    .select("-__v -razorpaySignature")
    .lean();
  return ok({ items });
});
