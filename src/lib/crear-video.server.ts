import { z } from "zod";
import { precioTotalCentavos } from "./precio";


const BUCKET = "property-photos";
const MAX_FILES = 8;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const metaSchema = z.object({
  email: z.string().email().max(200),
  tier: z.enum(["basico", "pro"]),
  duracionSegundos: z.coerce.number().int().min(15).max(60).default(30),
  sinMarcaAgua: z.enum(["true", "false"]).transform((v) => v === "true"),
  incluyeHorizontal: z.enum(["true", "false"]).transform((v) => v === "true"),
  estiloCamara: z.enum(["cinematic", "zoom"]).optional(),
  ambienteMusical: z.enum(["elegant", "energetic", "warm", "minimal"]).optional(),
  origin: z
    .string()
    .max(200)
    .regex(/^https?:\/\/[A-Za-z0-9._:-]+$/)
    .optional(),
});


function extFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/avif") return "avif";
  return "jpg";
}

export async function procesarCreacionVideo(form: FormData) {
  const meta = metaSchema.parse({
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    tier: String(form.get("tier") ?? ""),
    duracionSegundos: String(form.get("duracionSegundos") ?? "30"),
    sinMarcaAgua: String(form.get("sinMarcaAgua") ?? "false"),
    incluyeHorizontal: String(form.get("incluyeHorizontal") ?? "false"),
    estiloCamara: form.get("estiloCamara") ? String(form.get("estiloCamara")) : undefined,
    ambienteMusical: form.get("ambienteMusical") ? String(form.get("ambienteMusical")) : undefined,
    origin: form.get("origin") ? String(form.get("origin")) : undefined,
  });


  const files = form.getAll("fotos").filter((f): f is File => f instanceof File);
  const maxForTier = meta.tier === "pro" ? MAX_FILES : 4;
  if (files.length === 0) throw new Error("No photos provided");
  if (files.length > maxForTier) throw new Error("Too many photos for this tier");
  for (const f of files) {
    if (!ALLOWED.has(f.type)) throw new Error("Unsupported image type");
    if (f.size > MAX_BYTES) throw new Error("Image too large");
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Find or create the realtor by email (minimal record; profile completed later).
  const { data: existing } = await supabaseAdmin
    .from("realtors")
    .select("id")
    .eq("email", meta.email)
    .maybeSingle();

  let realtorId = existing?.id ?? null;
  if (!realtorId) {
    const { data: created, error: createError } = await supabaseAdmin
      .from("realtors")
      .insert({ email: meta.email, nombre: meta.email.split("@")[0]!, estado: "" })
      .select("id")
      .single();
    if (createError) throw new Error(createError.message);
    realtorId = created.id;
  }

  // Create the video row first so photos live under a stable folder.
  // El pedido queda a la espera del pago: el worker solo ve 'procesando'.
  const montoCentavos = precioTotalCentavos({
    duracionSegundos: meta.duracionSegundos,
    sinMarcaAgua: meta.sinMarcaAgua,
    incluyeHorizontal: meta.incluyeHorizontal,
  });
  const { data: video, error: videoError } = await supabaseAdmin
    .from("videos")
    .insert({
      realtor_id: realtorId,
      tier: meta.tier,
      estado_generacion: "pendiente_pago",
      fotos_urls: [],
      duracion_segundos: meta.duracionSegundos,
      sin_marca_agua: meta.sinMarcaAgua,
      incluye_horizontal: meta.incluyeHorizontal,
      estilo_camara: meta.estiloCamara ?? null,
      ambiente_musical: meta.ambienteMusical ?? null,
      monto_centavos: montoCentavos,
    })
    .select("id")
    .single();
  if (videoError) throw new Error(videoError.message);


  const urls: string[] = [];
  for (const [i, file] of files.entries()) {
    const path = `${realtorId}/${video.id}/${String(i + 1).padStart(2, "0")}.${extFor(file.type)}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    // Store a domain-agnostic path; the worker endpoint resolves it to the
    // deployed app origin at read time (editor preview domains don't serve files).
    urls.push(`/api/public/photo-file/${path}`);
  }

  const { error: updateError } = await supabaseAdmin
    .from("videos")
    .update({ fotos_urls: urls })
    .eq("id", video.id);
  if (updateError) throw new Error(updateError.message);

  return {
    videoId: video.id as string,
    realtorId: realtorId as string,
    fotosUrls: urls,
    montoCentavos,
  };

}
