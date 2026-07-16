import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB, ProductModel, WishlistModel, type Product } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth";
import PDPClient, { type SerializedProduct } from "@/components/storefront/pdp/PDPClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const raw = await ProductModel.findOne({ slug, isActive: true })
    .select("name description images")
    .lean();
  if (!raw) return { title: "Product Not Found" };

  const firstImage = raw.images?.[0];
  return {
    title: raw.name,
    description: raw.description?.slice(0, 160) || `Shop ${raw.name} at Naysa.`,
    openGraph: {
      title: raw.name,
      description: raw.description?.slice(0, 160) || `Shop ${raw.name} at Naysa.`,
      url: `/shop/${slug}`,
      ...(firstImage && {
        images: [{ url: firstImage.url, alt: firstImage.alt || raw.name }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: raw.name,
      ...(firstImage && { images: [firstImage.url] }),
    },
  };
}

export default async function PDPPage({ params }: Props) {
  const { slug } = await params;

  await connectDB();

  const [raw, user] = await Promise.all([
    ProductModel.findOne({ slug }).select("-__v").lean(),
    getOptionalUser(),
  ]);

  if (!raw || !raw.isActive) notFound();

  const product: SerializedProduct = {
    _id: String(raw._id),
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    price: raw.price,
    compareAtPrice: raw.compareAtPrice ?? undefined,
    images: (raw.images ?? []).map((img: Product["images"][number]) => ({ url: img.url, alt: img.alt ?? "" })),
    variants: (raw.variants ?? []).map((v: Product["variants"][number]) => ({
      sku: v.sku,
      size: v.size,
      color: v.color,
      stock: v.stock,
    })),
    tags: raw.tags ?? [],
    creatorContent: (raw.creatorContent ?? []).map((cc: Product["creatorContent"][number]) => ({
      creatorName: cc.creatorName,
      platform: cc.platform,
      url: cc.url,
      embedHtml: cc.embedHtml ?? undefined,
    })),
  };

  let initialWishlisted = false;
  if (user) {
    const entry = await WishlistModel.findOne({
      userId: user.id,
      productId: raw._id,
    })
      .select("_id")
      .lean();
    initialWishlisted = !!entry;
  }

  return <PDPClient product={product} initialWishlisted={initialWishlisted} />;
}
