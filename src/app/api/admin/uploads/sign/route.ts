import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { signUpload } from "@/lib/media";
import { badRequest } from "@/lib/errors/AppError";
import { z } from "zod";

const bodySchema = z.object({
  folder: z.string().min(1).default("products"),
  eager: z
    .array(
      z.object({
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        crop: z.enum(["fill", "fit"]),
      }),
    )
    .optional(),
});

export const POST = withApi(async (req: Request) => {
  await requireAdmin();
  const body = bodySchema.parse(await req.json());
  if (!["products", "creator", "banners"].includes(body.folder)) {
    throw badRequest("Invalid folder");
  }
  return ok(signUpload({ folder: body.folder, eager: body.eager }));
});
