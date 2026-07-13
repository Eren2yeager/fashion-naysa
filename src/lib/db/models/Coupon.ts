import { Schema, model, models, type InferSchemaType } from "mongoose";

export const DISCOUNT_KIND = ["percent", "flat"] as const;
export type DiscountKind = (typeof DISCOUNT_KIND)[number];

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    kind: { type: String, enum: DISCOUNT_KIND, required: true },
    // For percent: 0-100. For flat: paise.
    amount: { type: Number, required: true, min: 0 },
    minSubtotal: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 }, // cap for percent coupons
    usageLimit: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, min: 0 },

    // Valid window.
    startsAt: { type: Date },
    endsAt: { type: Date },

    isActive: { type: Boolean, default: true, index: true },

    // Coupons that cannot stack with this one.
    stacksWith: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type Coupon = InferSchemaType<typeof CouponSchema> & { _id: Schema.Types.ObjectId };
export const CouponModel = models.Coupon || model("Coupon", CouponSchema);
