import { z } from "zod";
import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { connectDB, OrderModel, ORDER_STATUS } from "@/lib/db";
import { notFound } from "@/lib/errors/AppError";

const patchSchema = z.object({
  status: z.enum(ORDER_STATUS).optional(),
  trackingUrl: z.string().url().optional(),
  awb: z.string().optional(),
  shipmentStatus: z.string().optional(),
});

export const PATCH = withApi(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await ctx.params;
    const data = patchSchema.parse(await req.json());
    await connectDB();
    const order = await OrderModel.findById(id);
    if (!order) throw notFound("Order not found");
    if (data.status) {
      order.status = data.status;
      order.history.push({ status: data.status, note: "admin update" });
    }
    if (data.trackingUrl !== undefined) order.trackingUrl = data.trackingUrl;
    if (data.awb !== undefined) order.awb = data.awb;
    if (data.shipmentStatus !== undefined) order.shipmentStatus = data.shipmentStatus;
    await order.save();
    return ok(order);
  },
);
