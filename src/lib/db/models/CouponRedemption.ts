import { Schema, model, models, type InferSchemaType } from "mongoose";

// One row per (coupon, order) pair. Insert is idempotent via unique index.
// If two webhook deliveries race, the second insert fails with E11000 and
// we know not to bump anything.
const CouponRedemptionSchema = new Schema(
  {
    couponCode: { type: String, required: true, uppercase: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: String, required: true, index: true },
    discount: { type: Number, required: true, min: 0 }, // paise at time of redemption
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

CouponRedemptionSchema.index({ couponCode: 1, orderId: 1 }, { unique: true });
CouponRedemptionSchema.index({ couponCode: 1, userId: 1 });

export type CouponRedemption = InferSchemaType<typeof CouponRedemptionSchema> & {
  _id: Schema.Types.ObjectId;
};
export const CouponRedemptionModel =
  models.CouponRedemption || model("CouponRedemption", CouponRedemptionSchema);
