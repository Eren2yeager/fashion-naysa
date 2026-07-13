// Shiprocket push webhook.
// Auth model: Shiprocket sends an Authorization header with a token that
// must match what we configured in their dashboard. We don't HMAC-verify
// the body — they sign the channel, not the payload.
// Payload shape (sr_status_update / sr_shipment_update):
//   { awb, current_status, shipment_status, current_shipment_status, ... }
import { withApi, ok } from "@/lib/errors/handler";
import { connectDB, OrderModel } from "@/lib/db";
import { unauthorized } from "@/lib/errors/AppError";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";

type ShiprocketPush = {
  awb?: string;
  shipment_id?: number;
  current_status?: string;
  shipment_status?: string;
  current_shipment_status?: string;
  courier_name?: string;
};

function mapStatus(sr: string | undefined): "shipped" | "delivered" | "cancelled" | null {
  if (!sr) return null;
  const v = sr.toLowerCase();
  if (v.includes("delivered")) return "delivered";
  if (v.includes("cancelled") || v.includes("rto")) return "cancelled";
  if (v.includes("out for delivery") || v.includes("in transit") || v.includes("shipped")) {
    return "shipped";
  }
  return null;
}

export const POST = withApi(async (req: Request) => {
  // Verify Shiprocket push auth.
  const auth = req.headers.get("authorization") ?? "";
  const token = getEnv().SHIPROCKET_WEBHOOK_TOKEN;
  if (!token) {
    // ponytail: refuse to accept pushes if no token configured. No silent allow.
    throw unauthorized("Shiprocket webhook token not configured");
  }
  if (auth !== `Bearer ${token}`) throw unauthorized("Invalid Shiprocket auth");

  const data = (await req.json()) as ShiprocketPush;
  const awb = data.awb;
  if (!awb) return ok({ ignored: true });

  await connectDB();
  const order = await OrderModel.findOne({ awb });
  if (!order) return ok({ ignored: true });

  const next = mapStatus(data.shipment_status ?? data.current_shipment_status);
  if (!next) return ok({ ignored: true });

  if (next === "delivered" && order.status !== "delivered") {
    order.status = "delivered";
    order.shipmentStatus = "delivered";
    order.history.push({ status: "delivered", note: awb });
  } else if (next === "cancelled" && !["cancelled", "refunded"].includes(order.status)) {
    order.status = "cancelled";
    order.shipmentStatus = "cancelled";
    order.history.push({ status: "cancelled", note: awb });
  } else if (next === "shipped" && order.status === "fulfilled") {
    order.status = "shipped";
    order.shipmentStatus = data.shipment_status ?? "shipped";
    order.history.push({ status: "shipped", note: awb });
  } else {
    order.shipmentStatus = data.shipment_status ?? order.shipmentStatus;
  }
  if (data.courier_name) order.shipmentStatus = data.courier_name;
  await order.save();

  return ok({ ok: true });
});
