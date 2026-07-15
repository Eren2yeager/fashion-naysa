import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ORDER_STATUS } from "@/lib/constants/orderStatus";

export { ORDER_STATUS };
export type { OrderStatus } from "@/lib/constants/orderStatus";

const AddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "IN" },
  },
  { _id: false },
);

const LineSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: String, required: true },
    color: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // paise
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    userId: { type: String, required: true, index: true }, // auth provider sub (Google)
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: "created",
      index: true,
    },
    items: { type: [LineSchema], required: true },

    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    couponCode: { type: String, default: null },

    // True once stock has been decremented for this order; flipped back on
    // release. Makes decrement/release idempotent (webhook retries, sweeper).
    stockCommitted: { type: Boolean, default: false },

    // Total paise refunded so far (partial refunds accumulate here).
    refundedAmount: { type: Number, default: 0, min: 0 },

    shippingAddress: { type: AddressSchema, required: true },

    // Payment
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // Shipping
    shiprocketOrderId: { type: String },
    awb: { type: String, index: true },
    trackingUrl: { type: String },
    shipmentStatus: { type: String },

    // History snapshots for audit; append-only.
    history: {
      type: [
        new Schema(
          {
            at: { type: Date, default: Date.now },
            status: { type: String, required: true },
            note: { type: String, default: "" },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

OrderSchema.index({ userId: 1, createdAt: -1 });

export type Order = InferSchemaType<typeof OrderSchema> & { _id: Schema.Types.ObjectId };
export const OrderModel = models.Order || model("Order", OrderSchema);
