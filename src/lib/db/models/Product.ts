import { Schema, model, models, type InferSchemaType } from "mongoose";

const ProductSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },

    // Money: paise (integer) on the wire, never floats.
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },

    images: {
      type: [
        {
          publicId: { type: String, required: true },
          url: { type: String, required: true },
          alt: { type: String, default: "" },
        },
      ],
      default: [],
    },

    // Variants: size + color, each with its own SKU + stock.
    variants: {
      type: [
        new Schema(
          {
            sku: { type: String, required: true },
            size: { type: String, required: true },
            color: { type: String, required: true },
            stock: { type: Number, required: true, min: 0, default: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    tags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },

    // Creator content blocks tied to this product (UGC).
    creatorContent: {
      type: [
        new Schema(
          {
            creatorName: { type: String, required: true },
            platform: { type: String, required: true }, // 'instagram' | 'youtube' | ...
            url: { type: String, required: true },
            embedHtml: { type: String },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);

export type Product = InferSchemaType<typeof ProductSchema> & { _id: Schema.Types.ObjectId };
export const ProductModel = models.Product || model("Product", ProductSchema);
