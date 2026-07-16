import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().regex(/^\d{10}$/),
  line1: z.string().min(1),
  line2: z.string().optional().default(""),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  country: z.string().length(2).default("IN"),
});

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  qty: z.number().int().min(1).max(99),
});

export const createOrderSchema = z.object({
  items: z.array(cartLineSchema).min(1),
  shippingAddress: addressSchema,
  couponCode: z.string().optional(),
});

export const productCreateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "lowercase, digits, dashes only"),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().min(0), // paise
  compareAtPrice: z.number().int().min(0).optional(),
  images: z
    .array(
      z.object({
        publicId: z.string(),
        url: z.string().url(),
        alt: z.string().optional().default(""),
      }),
    )
    .default([]),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1),
        size: z.string().min(1),
        color: z.string().min(1),
        stock: z.number().int().min(0),
      }),
    )
    .default([]),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  creatorContent: z
    .array(
      z.object({
        creatorName: z.string().min(1),
        platform: z.string().min(1),
        url: z.string().url(),
        embedHtml: z.string().optional(),
      }),
    )
    .default([]),
});

export const productUpdateSchema = productCreateSchema.partial();

export const couponCreateSchema = z.object({
  code: z.string().min(1).max(32),
  kind: z.enum(["percent", "flat"]),
  amount: z.number().int().min(0),
  minSubtotal: z.number().int().min(0).default(0),
  maxDiscount: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(0).optional(),
  perUserLimit: z.number().int().min(0).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  stacksWith: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().min(1),
});
