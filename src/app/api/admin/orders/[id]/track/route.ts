import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { connectDB, OrderModel } from "@/lib/db";
import { trackByAwb } from "@/lib/shipping";
import { badRequest, notFound } from "@/lib/errors/AppError";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export const GET = withApi(
  async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await ctx.params;
    if (!id.match(OBJECT_ID)) throw badRequest("Invalid id");
    await connectDB();
    const order = await OrderModel.findById(id).select("awb shipmentStatus trackingUrl");
    if (!order) throw notFound("Order not found");
    if (!order.awb) return ok({ status: "no-awb-yet" });

    const data = await trackByAwb(order.awb);
    const last = data.tracking_data.shipment_track.at(-1);
    order.shipmentStatus = data.tracking_data.shipment_status;
    if (data.tracking_data.shipment_status.toLowerCase().includes("delivered")) {
      order.status = "delivered";
      order.history.push({ status: "delivered", note: "admin track" });
    }
    await order.save();
    return ok({ status: data.tracking_data.shipment_status, last });
  },
);
