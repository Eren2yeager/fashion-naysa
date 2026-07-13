import { Schema, model, models, type InferSchemaType } from "mongoose";

const WishlistSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true },
);

WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export type Wishlist = InferSchemaType<typeof WishlistSchema> & { _id: Schema.Types.ObjectId };
export const WishlistModel = models.Wishlist || model("Wishlist", WishlistSchema);
