// Single source of truth for "what does this order cost".
// Used by: POST /api/checkout, POST /api/admin/orders, GET /api/orders/:id (prepay view).
// Recalculated server-side at every gate — never trust client totals.
import { CouponModel, CouponRedemptionModel, ProductModel } from "@/lib/db";
import { badRequest, notFound } from "@/lib/errors/AppError";

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

const FLAT_SHIPPING_PAISE = 9900; // ₹99 — placeholder
const FREE_SHIPPING_THRESHOLD_PAISE = 150000; // ₹1500

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
    .select("name variants slug")
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
    const unitPrice = (p as unknown as { price: number }).price;
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

  let discount = 0;
  let applied: PricedOrder["coupon"] = null;
  if (couponCode) {
    const code = couponCode.toUpperCase();
    const coupon = await CouponModel.findOne({ code, isActive: true }).lean();
    if (!coupon) throw badRequest("Invalid coupon");
    if (coupon.startsAt && coupon.startsAt > now) throw badRequest("Coupon not yet active");
    if (coupon.endsAt && coupon.endsAt < now) throw badRequest("Coupon expired");
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      throw badRequest(`Minimum subtotal ₹${coupon.minSubtotal / 100}`);
    }
    if (coupon.usageLimit) {
      const total = await CouponRedemptionModel.countDocuments({ couponCode: code });
      if (total >= coupon.usageLimit) throw badRequest("Coupon usage limit reached");
    }

    if (coupon.kind === "percent") {
      discount = Math.floor((subtotal * coupon.amount) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      // flat
      discount = coupon.amount;
    }
    discount = Math.min(discount, subtotal);
    applied = { code, discount };
  }

  const shipping =
    subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : FLAT_SHIPPING_PAISE;

  return {
    lines: priced,
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    coupon: applied,
  };
}
