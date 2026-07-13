import { z } from "zod";
import { withApi, ok } from "@/lib/errors/handler";
import { requireAdmin } from "@/lib/auth";
import { refundOrder } from "@/lib/payments";

const bodySchema = z.object({
  amount: z.number().int().positive().optional(),
  reason: z.string().max(200).optional(),
});

export const POST = withApi(
  async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = bodySchema.parse(await req.json().catch(() => ({})));
    const r = await refundOrder({ orderId: id, amount: body.amount, reason: body.reason });
    return ok(r);
  },
);
