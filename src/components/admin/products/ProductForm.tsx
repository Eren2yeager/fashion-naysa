"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MediaUploader } from "@/components/admin/shared/MediaUploader";
import { apiFetch } from "@/lib/admin/apiFetch";
import { toPaise, toRupees } from "@/lib/format/rupees";
import { productCreateSchema, productUpdateSchema } from "@/lib/validation/schemas";
import { hasVariantDuplicates, toSlug } from "./variantUtils";
import { VariantManager, type VariantInput } from "./VariantManager";
import { CreatorContentManager, type CreatorInput } from "./CreatorContentManager";

// ─── Types ───────────────────────────────────────────────────────────────────

type ImageInput = { publicId: string; url: string; alt: string };

export interface AdminProduct {
  _id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: ImageInput[];
  variants: VariantInput[];
  tags: string[];
  isActive: boolean;
  creatorContent: CreatorInput[];
  createdAt: string;
}

interface ProductFormProps {
  initialProduct?: AdminProduct;
}

type ProductFormState = {
  name: string;
  slug: string;
  slugManuallyEdited: boolean;
  description: string;
  price: string;
  compareAtPrice: string;
  tags: string; // comma-separated string in UI
  isActive: boolean;
  variants: VariantInput[];
  creatorContent: CreatorInput[];
  images: ImageInput[];
};

type FormErrors = Partial<
  Record<"name" | "slug" | "description" | "price" | "compareAtPrice" | "tags" | "variant" | "form", string>
>;

// ─── Reducer ─────────────────────────────────────────────────────────────────

type FormAction =
  | { type: "SET_FIELD"; field: "name" | "description" | "price" | "compareAtPrice" | "tags"; value: string }
  | { type: "SET_BOOL"; field: "isActive"; value: boolean }
  | { type: "SET_SLUG"; value: string }
  | { type: "ADD_VARIANT"; payload: VariantInput }
  | { type: "UPDATE_VARIANT"; index: number; payload: Partial<VariantInput> }
  | { type: "REMOVE_VARIANT"; index: number }
  | { type: "ADD_CREATOR"; payload: CreatorInput }
  | { type: "MOVE_CREATOR"; fromIndex: number; toIndex: number }
  | { type: "REMOVE_CREATOR"; index: number }
  | { type: "ADD_IMAGE"; payload: ImageInput }
  | { type: "REMOVE_IMAGE"; index: number }
  | { type: "SET_IMAGE_ALT"; index: number; alt: string }
  | { type: "REORDER_IMAGES"; fromIndex: number; toIndex: number };

function formReducer(state: ProductFormState, action: FormAction): ProductFormState {
  switch (action.type) {
    case "SET_FIELD": {
      const next = { ...state, [action.field]: action.value };
      if (action.field === "name" && !state.slugManuallyEdited) {
        next.slug = toSlug(action.value);
      }
      return next;
    }
    case "SET_BOOL":
      return { ...state, [action.field]: action.value };
    case "SET_SLUG":
      return { ...state, slug: action.value, slugManuallyEdited: true };

    case "ADD_VARIANT":
      return { ...state, variants: [...state.variants, action.payload] };
    case "UPDATE_VARIANT":
      return {
        ...state,
        variants: state.variants.map((v, i) => (i === action.index ? { ...v, ...action.payload } : v)),
      };
    case "REMOVE_VARIANT":
      return { ...state, variants: state.variants.filter((_, i) => i !== action.index) };

    case "ADD_CREATOR":
      return { ...state, creatorContent: [...state.creatorContent, action.payload] };
    case "MOVE_CREATOR": {
      const items = [...state.creatorContent];
      const [moved] = items.splice(action.fromIndex, 1);
      items.splice(action.toIndex, 0, moved);
      return { ...state, creatorContent: items };
    }
    case "REMOVE_CREATOR":
      return { ...state, creatorContent: state.creatorContent.filter((_, i) => i !== action.index) };

    case "ADD_IMAGE":
      return { ...state, images: [...state.images, action.payload] };
    case "REMOVE_IMAGE":
      return { ...state, images: state.images.filter((_, i) => i !== action.index) };
    case "SET_IMAGE_ALT":
      return {
        ...state,
        images: state.images.map((img, i) => (i === action.index ? { ...img, alt: action.alt } : img)),
      };
    case "REORDER_IMAGES": {
      const imgs = [...state.images];
      const [moved] = imgs.splice(action.fromIndex, 1);
      imgs.splice(action.toIndex, 0, moved);
      return { ...state, images: imgs };
    }
  }
}

function buildInitialState(p?: AdminProduct): ProductFormState {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    slugManuallyEdited: !!p,
    description: p?.description ?? "",
    price: p ? toRupees(p.price).toFixed(2) : "",
    compareAtPrice: p?.compareAtPrice != null ? toRupees(p.compareAtPrice).toFixed(2) : "",
    tags: p ? p.tags.join(", ") : "",
    isActive: p?.isActive ?? true,
    variants: p?.variants ?? [],
    creatorContent: p?.creatorContent ?? [],
    images: p?.images ?? [],
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductForm({ initialProduct }: ProductFormProps) {
  const router = useRouter();
  const [state, dispatch] = React.useReducer(formReducer, initialProduct, buildInitialState);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [loading, setLoading] = React.useState(false);

  const isEdit = !!initialProduct;

  // Typed adapters so sub-components' action shapes flow into FormAction
  const variantDispatch = React.useCallback(
    (a: { type: "ADD_VARIANT"; payload: VariantInput } | { type: "UPDATE_VARIANT"; index: number; payload: Partial<VariantInput> } | { type: "REMOVE_VARIANT"; index: number }) =>
      dispatch(a),
    [],
  );
  const creatorDispatch = React.useCallback(
    (a: { type: "ADD_CREATOR"; payload: CreatorInput } | { type: "MOVE_CREATOR"; fromIndex: number; toIndex: number } | { type: "REMOVE_CREATOR"; index: number }) =>
      dispatch(a),
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!state.name.trim()) newErrors.name = "Name is required.";
    if (!state.slug.trim()) newErrors.slug = "Slug is required.";
    if (!state.description.trim()) newErrors.description = "Description is required.";

    const priceNum = parseFloat(state.price);
    if (isNaN(priceNum) || priceNum < 0) newErrors.price = "Enter a valid price.";

    let comparePaise: number | undefined;
    if (state.compareAtPrice.trim()) {
      const cmp = parseFloat(state.compareAtPrice);
      if (isNaN(cmp) || cmp < 0) {
        newErrors.compareAtPrice = "Enter a valid compare-at price.";
      } else if (!isNaN(priceNum) && cmp <= priceNum) {
        newErrors.compareAtPrice = "Compare-at price must be greater than price.";
      } else {
        comparePaise = toPaise(cmp);
      }
    }

    if (hasVariantDuplicates(state.variants)) {
      newErrors.variant = "Duplicate variant: same size + color combination exists.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const tags = state.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: state.name.trim(),
      slug: state.slug.trim(),
      description: state.description.trim(),
      price: toPaise(priceNum),
      ...(comparePaise !== undefined ? { compareAtPrice: comparePaise } : {}),
      images: state.images,
      variants: state.variants,
      tags,
      isActive: state.isActive,
      creatorContent: state.creatorContent,
    };

    const schema = isEdit ? productUpdateSchema : productCreateSchema;
    const result = schema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      if (Object.keys(fieldErrors).length === 0) fieldErrors.form = result.error.issues[0]?.message;
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await apiFetch(`/api/admin/products/${initialProduct._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Product updated");
      } else {
        await apiFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        router.push("/admin/products");
      }
    } catch (err) {
      const msg = (err as Error).message ?? "Something went wrong.";
      if (msg.toLowerCase().includes("slug")) {
        setErrors({ slug: "This slug is already in use." });
      } else {
        setErrors({ form: msg });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">{isEdit ? "Edit Product" : "New Product"}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{errors.form}</p>
        )}

        <section className="space-y-4">
          <Field label="Name" error={errors.name}>
            <input
              className={inputCls(!!errors.name)}
              value={state.name}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "name", value: e.target.value })}
              placeholder="Product name"
            />
          </Field>

          <Field label="Slug" error={errors.slug}>
            <input
              className={inputCls(!!errors.slug)}
              value={state.slug}
              onChange={(e) => dispatch({ type: "SET_SLUG", value: e.target.value })}
              placeholder="url-safe-slug"
            />
          </Field>

          <Field label="Description" error={errors.description}>
            <textarea
              className={inputCls(!!errors.description)}
              rows={4}
              value={state.description}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "description", value: e.target.value })}
              placeholder="Product description"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₹)" error={errors.price}>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputCls(!!errors.price)}
                value={state.price}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "price", value: e.target.value })}
                placeholder="499.00"
              />
            </Field>
            <Field label="Compare-at price (₹)" error={errors.compareAtPrice}>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputCls(!!errors.compareAtPrice)}
                value={state.compareAtPrice}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "compareAtPrice", value: e.target.value })}
                placeholder="Optional"
              />
            </Field>
          </div>

          <Field label="Tags (comma-separated)">
            <input
              className={inputCls(false)}
              value={state.tags}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "tags", value: e.target.value })}
              placeholder="cotton, summer, girls"
            />
          </Field>

          <div className="flex items-center gap-3">
            <input
              id="isActive"
              type="checkbox"
              className="h-4 w-4 rounded border-border accent-primary"
              checked={state.isActive}
              onChange={(e) => dispatch({ type: "SET_BOOL", field: "isActive", value: e.target.checked })}
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active (visible on storefront)
            </label>
          </div>
        </section>

        {/* Images */}
        <section className="space-y-3 rounded-md border border-border p-4">
          <h2 className="text-sm font-medium">Images</h2>
          {state.images.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {state.images.map((img, i) => (
                <div key={img.publicId} className="space-y-1">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt || "Product image"}
                      className="h-20 w-full rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "REMOVE_IMAGE", index: i })}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive/80 text-xs text-white"
                      aria-label="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    className="w-full rounded border border-border bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Alt text"
                    value={img.alt}
                    onChange={(e) => dispatch({ type: "SET_IMAGE_ALT", index: i, alt: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}
          <MediaUploader
            folder="products"
            max={10}
            onUpload={({ publicId, url }) =>
              dispatch({ type: "ADD_IMAGE", payload: { publicId, url, alt: "" } })
            }
          />
        </section>

        {/* Variants */}
        <section className="rounded-md border border-border p-4">
          <VariantManager
            variants={state.variants}
            dispatch={variantDispatch}
            error={errors.variant}
          />
        </section>

        {/* Creator Content */}
        <section className="rounded-md border border-border p-4">
          <CreatorContentManager
            items={state.creatorContent}
            dispatch={creatorDispatch}
          />
        </section>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/products")}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    "w-full rounded border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1",
    hasError
      ? "border-destructive focus:ring-destructive/40"
      : "border-border focus:ring-ring",
  ].join(" ");
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
