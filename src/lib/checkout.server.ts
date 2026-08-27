import { precioTotalCentavos } from "./precio";

export type CrearCheckoutInput = {
  videoId: string;
  origin: string;
  lang: string;
};

export async function crearCheckoutSession(input: CrearCheckoutInput) {
  const secretKey = process.env["STRIPE_SECRET_KEY"];
  if (!secretKey) throw new Error("Stripe no está configurado (falta STRIPE_SECRET_KEY).");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: video, error } = await supabaseAdmin
    .from("videos")
    .select(
      "id, estado_generacion, duracion_segundos, sin_marca_agua, incluye_horizontal, realtor_id",
    )
    .eq("id", input.videoId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!video) throw new Error("Pedido no encontrado.");
  if (video.estado_generacion !== "pendiente_pago") {
    throw new Error("Este pedido ya no está pendiente de pago.");
  }

  // El precio SIEMPRE se calcula en el servidor desde la configuración guardada.
  const amount = precioTotalCentavos({
    duracionSegundos: video.duracion_segundos,
    sinMarcaAgua: video.sin_marca_agua,
    incluyeHorizontal: video.incluye_horizontal,
  });

  let email: string | undefined;
  if (video.realtor_id) {
    const { data: realtor } = await supabaseAdmin
      .from("realtors")
      .select("email")
      .eq("id", video.realtor_id)
      .maybeSingle();
    email = realtor?.email ?? undefined;
  }

  const lang = input.lang === "es" ? "es" : "en";
  const nombre =
    lang === "es"
      ? `Video de propiedad (${video.duracion_segundos}s${video.sin_marca_agua ? ", sin marca de agua" : ""}${video.incluye_horizontal ? ", + YouTube" : ""})`
      : `Property video (${video.duracion_segundos}s${video.sin_marca_agua ? ", no watermark" : ""}${video.incluye_horizontal ? ", + YouTube" : ""})`;

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${input.origin}/${lang}/panel?pago=ok&video=${video.id}`);
  params.set("cancel_url", `${input.origin}/${lang}/crear-video?pago=cancelado`);
  params.set("client_reference_id", video.id);
  params.set("metadata[video_id]", video.id);
  params.set("payment_intent_data[metadata][video_id]", video.id);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(amount));
  params.set("line_items[0][price_data][product_data][name]", nombre);
  if (email) params.set("customer_email", email);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const payload = (await response.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.url || !payload.id) {
    console.error("[stripe] checkout session failed", payload.error?.message);
    throw new Error("No se pudo iniciar el pago. Inténtalo de nuevo.");
  }

  await supabaseAdmin
    .from("videos")
    .update({ stripe_session_id: payload.id, monto_centavos: amount })
    .eq("id", video.id);

  return { url: payload.url, amount };
}
