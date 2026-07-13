// Shiprocket client — token-cached, narrow surface.
// Endpoints are best-effort against the published v1 paths; if any single
// call fails on a real account, fix at the call site, not the caller.
import { getEnv } from "@/lib/env";
import { upstream } from "@/lib/errors/AppError";

const BASE = "https://apiv2.shiprocket.in/v1/external";

type Token = { value: string; exp: number };
let cached: Token | undefined;

async function getToken(): Promise<string> {
  const e = getEnv();
  if (cached && cached.exp > Date.now() + 30_000) return cached.value;
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: e.SHIPROCKET_EMAIL, password: e.SHIPROCKET_PASSWORD }),
  });
  if (!r.ok) throw upstream(`Shiprocket auth failed: ${r.status}`);
  const data = (await r.json()) as { token: string };
  cached = { value: data.token, exp: Date.now() + 23 * 60 * 60 * 1000 };
  return data.token;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw upstream(`Shiprocket ${path} ${r.status}`, { body: text.slice(0, 500) });
  }
  return (await r.json()) as T;
}

export type ShipmentItem = {
  name: string;
  sku: string;
  units: number;
  selling_price: number; // rupees
  qty?: never;
};

export type CreateShipmentInput = {
  orderId: string; // our DB order _id
  orderDate: string; // ISO
  channelId?: string;
  paymentMethod: "Prepaid" | "COD";
  shipping: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    email?: string;
  };
  billing?: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  items: ShipmentItem[];
  subTotal: number; // rupees
  length?: number;
  breadth?: number;
  height?: number;
  weight: number; // kg
};

export type CreateShipmentResponse = {
  order_id: number;
  shipment_id: number;
  status: string;
  awb_data?: { awb: string; courier_company_id: number; courier_name: string };
};

export async function createShipment(input: CreateShipmentInput) {
  const body = {
    order_id: input.orderId,
    order_date: input.orderDate,
    channel_id: input.channelId ?? "",
    payment_method: input.paymentMethod,
    customer_first_name: input.shipping.fullName.split(" ")[0] ?? input.shipping.fullName,
    customer_last_name:
      input.shipping.fullName.split(" ").slice(1).join(" ") || ".",
    customer_email: input.shipping.email ?? "noreply@naysa.example",
    customer_phone: input.shipping.phone,
    shipping_customer_name: input.shipping.fullName,
    shipping_address: input.shipping.line1,
    shipping_address_2: input.shipping.line2 ?? "",
    shipping_city: input.shipping.city,
    shipping_state: input.shipping.state,
    shipping_country: input.shipping.country ?? "India",
    shipping_pincode: input.shipping.pincode,
    shipping_phone: input.shipping.phone,
    billing_customer_name: input.billing?.fullName ?? input.shipping.fullName,
    billing_address: input.billing?.line1 ?? input.shipping.line1,
    billing_address_2: input.billing?.line2 ?? input.shipping.line2 ?? "",
    billing_city: input.billing?.city ?? input.shipping.city,
    billing_state: input.billing?.state ?? input.shipping.state,
    billing_country: input.billing?.country ?? input.shipping.country ?? "India",
    billing_pincode: input.billing?.pincode ?? input.shipping.pincode,
    billing_phone: input.billing?.phone ?? input.shipping.phone,
    order_items: input.items.map((i) => ({
      name: i.name,
      sku: i.sku,
      units: i.units,
      selling_price: i.selling_price,
    })),
    sub_total: input.subTotal,
    length: input.length ?? 10,
    breadth: input.breadth ?? 10,
    height: input.height ?? 5,
    weight: input.weight,
  };
  return call<CreateShipmentResponse>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function generateAwb(shipmentId: number) {
  return call<{ awb_code: string; courier_company_id: number; courier_name: string }>(
    "/courier/assign/awb",
    { method: "POST", body: JSON.stringify({ shipment_id: shipmentId }) },
  );
}

export async function trackByAwb(awb: string) {
  return call<{
    tracking_data: {
      track_status: number;
      shipment_status: string;
      shipment_track: Array<{ date: string; status: string; activity: string; location: string }>;
    };
  }>(`/courier/track/awb/${encodeURIComponent(awb)}`);
}

export async function cancelShipment(orderIds: number[]) {
  return call<{ order_id: number; status: string }>("/orders/cancel", {
    method: "POST",
    body: JSON.stringify({ order_ids: orderIds }),
  });
}
