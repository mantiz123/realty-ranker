import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  videoId: z.string().uuid(),
  origin: z
    .string()
    .max(200)
    .regex(/^https?:\/\/[A-Za-z0-9._:-]+$/),
  lang: z.enum(["es", "en"]),
});

export const crearCheckout = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { crearCheckoutSession } = await import("./checkout.server");
    return crearCheckoutSession(data);
  });
