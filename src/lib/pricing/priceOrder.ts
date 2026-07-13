// Single source of truth for "what does this order cost".
// Used by: POST /api/checkout, POST /api/admin/orders, GET /api/orders/:id (prepay view).
// Recalculated server-side at every gate — never trust client totals.
//
// `computeOrderTotals` (./totals) is the pure-math half — split out so it
// can be unit tested without a DB. `priceOrder` does the DB lookups then
// calls into it.
import { CouponModel, ProductModel } from "@/lib/db";
import { badRequest, notFound } from "@/lib/errors/AppError";
import {
  computeOrderTotals,
  type CouponLike,
  FLAT_SHIPPING_PAISE,
  FREE_SHIPPING_THRESHOLD_PAISE,
} from "./totals";

export type CartLineInput = {
  productId: string;
  sku: string;
  qty: number;
};

export type PricedLine = {
  productId: string;
  sku: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number; // paise
  lineTotal: number; // paise
};

export type PricedOrder = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon: { code: string; discount: number } | null;
};

export { computeOrderTotals, FLAT_SHIPPING_PAISE, FREE_SHIPPING_THRESHOLD_PAISE, type CouponLike };

export async function priceOrder(
  lines: CartLineInput[],
  couponCode: string | undefined,
  now = new Date(),
): Promise<PricedOrder> {
  if (lines.length === 0) throw badRequest("Cart is empty");

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const products = await ProductModel.find({
    _id: { $in: productIds },
    isActive: true,
  })
    .select("name price variants slug")
    .lean();

  const byId = new Map(products.map((p) => [String(p._id), p]));
  for (const id of productIds) {
    if (!byId.has(id)) throw notFound(`Product ${id} not found`);
  }

  const priced: PricedLine[] = [];
  for (const line of lines) {
    if (line.qty < 1) throw badRequest("Invalid qty");
    const p = byId.get(line.productId)!;
    const variant = (p.variants as Array<{ sku: string; size: string; color: string; stock: number }>).find(
      (v) => v.sku === line.sku,
    );
    if (!variant) throw badRequest(`SKU ${line.sku} not available`);
    if (variant.stock < line.qty) throw badRequest(`Insufficient stock for ${line.sku}`);
    const unitPrice = (p as unknown as { price?: number }).price;
    if (typeof unitPrice !== "number" || !Number.isInteger(unitPrice) || unitPrice < 0) {
      throw badRequest(`Product ${line.productId} has no valid price`);
    }
    priced.push({
      productId: line.productId,
      sku: line.sku,
      name: p.name,
      size: variant.size,
      color: variant.color,
      qty: line.qty,
      unitPrice,
      lineTotal: unitPrice * line.qty,
    });
  }

  const subtotal = priced.reduce((s, l) => s + l.lineTotal, 0);

  let coupon: CouponLike | null = null;
  if (couponCode) {
    const code = couponCode.toUpperCase();
    const found = await CouponModel.findOne({ code, isActive: true }).lean();
    if (!found) throw badRequest("Invalid coupon");
    coupon = found as unknown as CouponLike;
  }

  const totals = computeOrderTotals({ subtotal, coupon, now });

  return {
    lines: priced,
    subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    coupon: totals.coupon,
  };
}
