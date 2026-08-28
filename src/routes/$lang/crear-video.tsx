import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, X, Check } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { makeT, isLang, type Lang } from "@/lib/i18n";
import { crearVideoJob } from "@/lib/crear-video.functions";
import { crearCheckout } from "@/lib/checkout.functions";
import {
  DURACION_MAX,
  DURACION_MIN,
  EXTRA_SIN_MARCA_USD,
  clampDuracion,
  precioBaseUsd,
  precioTotalUsd,
} from "@/lib/precio";

import cinematicImg from "@/assets/style-cinematic.jpg";
import zoomImg from "@/assets/style-zoom.jpg";

const PRECIO = { basico: 30, pro: 59 } as const;
const EXTRA_YT = 12;
const MAX_CAMBIOS = 3;

export const Route = createFileRoute("/$lang/crear-video")({
  head: ({ params }) => {
    const lang: Lang = isLang(params.lang) ? params.lang : "en";
    const t = makeT(lang);
    return {
      meta: [
        { title: t("wiz.meta.title") },
        { name: "description", content: t("wiz.meta.desc") },
        { property: "og:title", content: t("wiz.meta.title") },
        { property: "og:description", content: t("wiz.meta.desc") },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CrearVideoPage,
});

type Paso = "form" | "animar" | "generando" | "borrador" | "resumen";
type Tier = "basico" | "pro";
type Camara = "cinematic" | "zoom";
type Mood = "elegant" | "energetic" | "warm" | "minimal";

function CrearVideoPage() {
  const { lang } = Route.useRouteContext();
  const t = makeT(lang);

  const [paso, setPaso] = useState<Paso>("form");
  const [fotos, setFotos] = useState<File[]>([]);
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Tier>("basico");
  const [camara, setCamara] = useState<Camara>("cinematic");
  const [youtube, setYoutube] = useState(false);
  const [mood, setMood] = useState<Mood>("elegant");
  const [duracion, setDuracion] = useState(30);
  const [pagando, setPagando] = useState(false);
  const [cambios, setCambios] = useState(MAX_CAMBIOS);
  const [animadas, setAnimadas] = useState<number[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);


  const maxAnim = tier === "pro" ? 8 : 4;
  const valido = fotos.length >= 5 && fotos.length <= 20 && email.includes("@");
  const sinMarcaAgua = tier === "pro";
  const cfgPrecio = {
    duracionSegundos: duracion,
    sinMarcaAgua,
    incluyeHorizontal: youtube,
  };
  const base = precioBaseUsd(duracion);
  const total = precioTotalUsd(cfgPrecio);
  const pasoNum =
    paso === "form" ? 1 : paso === "animar" ? 2 : paso === "generando" ? 3 : paso === "borrador" ? 4 : 5;

  const urls = useMemo(() => fotos.map((f) => URL.createObjectURL(f)), [fotos]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  const preview = urls[0] ?? null;

  useEffect(() => {
    setAnimadas((prev) => prev.filter((i) => i < fotos.length).slice(0, maxAnim));
  }, [maxAnim, fotos.length]);

  function toggleAnim(i: number) {
    setAnimadas((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length >= maxAnim ? prev : [...prev, i],
    );
  }

  useEffect(() => {
    if (paso !== "generando") return;
    const id = window.setTimeout(() => setPaso("borrador"), 2600);
    return () => window.clearTimeout(id);
  }, [paso]);

  async function enviarTrabajo() {
    setError(null);
    setEnviando(true);
    setPaso("generando");
    try {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("tier", tier);
      fd.set("duracionSegundos", String(clampDuracion(duracion)));
      fd.set("sinMarcaAgua", String(sinMarcaAgua));
      fd.set("incluyeHorizontal", String(youtube));
      fd.set("estiloCamara", camara);
      fd.set("ambienteMusical", mood);
      fd.set("origin", window.location.origin);
      animadas.forEach((i) => {
        const f = fotos[i];
        if (f) fd.append("fotos", f);
      });
      const res = await crearVideoJob({ data: fd });
      setVideoId(res.videoId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setEnviando(false);
    }
  }

  async function pagar() {
    if (!videoId) {
      setError(t("wiz.pay.noOrder"));
      return;
    }
    setError(null);
    setPagando(true);
    try {
      const res = await crearCheckout({
        data: { videoId, origin: window.location.origin, lang },
      });
      // Stripe Checkout no se puede mostrar dentro de un iframe (vista previa
      // del editor): en ese caso abrimos la pasarela en una pestaña nueva.
      const dentroDeIframe = window.top !== window.self;
      if (dentroDeIframe) {
        const w = window.open(res.url, "_blank", "noopener,noreferrer");
        if (!w) {
          try {
            window.top!.location.href = res.url;
          } catch {
            window.location.href = res.url;
          }
        }
        setPagando(false);
        return;
      }
      window.location.href = res.url;

    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPagando(false);
    }
  }

  function agregar(files: FileList | null) {
    if (!files) return;
    setFotos((prev) => [...prev, ...Array.from(files)].slice(0, 20));
  }


  return (
    <div className="min-h-screen">
      <SiteHeader lang={lang} />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {t("wiz.step", { n: pasoNum })}
        </p>
        <h1 className="mt-5 font-display text-4xl tracking-tight">{t("wiz.title")}</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{t("wiz.subtitle")}</p>

        {paso === "form" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPaso("animar");
            }}
            className="mt-16 space-y-16"
          >
            {/* Fotos */}
            <section>
              <div className="flex items-baseline justify-between">
                <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  {t("upload.photos")}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {t("upload.count", { n: fotos.length })}
                </span>
              </div>
              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-border py-20 text-center transition-colors duration-300 hover:border-accent-foreground">
                <ImagePlus className="size-6 text-muted-foreground" />
                <span className="text-sm">{t("upload.drop")}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("upload.formats")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => agregar(e.target.files)}
                />
              </label>
              {fotos.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {fotos.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="group relative aspect-square overflow-hidden"
                    >
                      <img
                        src={urls[i]}
                        alt={t("upload.photoAlt", { n: i + 1 })}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <button
                        type="button"
                        aria-label={t("upload.remove")}
                        onClick={() => setFotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Tier */}
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {t("wiz.tier")}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["basico", t("wiz.tier.basic"), t("wiz.tier.basicDesc")],
                    ["pro", t("wiz.tier.pro"), t("wiz.tier.proDesc")],
                  ] as [Tier, string, string][]
                ).map(([id, nombre, desc]) => (
                  <Opcion key={id} activo={tier === id} onClick={() => setTier(id)}>
                    <div className="flex items-baseline justify-between">
                      <p className="font-display text-2xl">{nombre}</p>
                      <p className="font-display text-2xl">${PRECIO[id]}</p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                  </Opcion>
                ))}
              </div>
            </section>

            {/* Cámara */}
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {t("wiz.camera")}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    [
                      "cinematic",
                      cinematicImg,
                      t("wiz.camera.cinematic"),
                      t("wiz.camera.cinematicDesc"),
                    ],
                    ["zoom", zoomImg, t("wiz.camera.zoom"), t("wiz.camera.zoomDesc")],
                  ] as [Camara, string, string, string][]
                ).map(([id, img, nombre, desc]) => (
                  <Opcion key={id} activo={camara === id} onClick={() => setCamara(id)}>
                    <img
                      src={img}
                      alt={nombre}
                      width={768}
                      height={512}
                      loading="lazy"
                      className="aspect-video w-full object-cover"
                    />
                    <p className="mt-4 font-display text-xl">{nombre}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </Opcion>
                ))}
              </div>
            </section>

            {/* Duración */}
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {t("wiz.duration")}
              </h2>
              <div className="mt-6 max-w-sm">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-3xl">{duracion}s</p>
                  <p className="font-display text-2xl">${base}</p>
                </div>
                <Slider
                  className="mt-5"
                  min={DURACION_MIN}
                  max={DURACION_MAX}
                  step={1}
                  value={[duracion]}
                  onValueChange={(v) => setDuracion(clampDuracion(v[0] ?? 30))}
                  aria-label={t("wiz.duration")}
                />
                <p className="mt-3 text-sm text-muted-foreground">{t("wiz.duration.desc")}</p>
              </div>
            </section>

            {/* Formato */}
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {t("wiz.format")}
              </h2>
              <div className="mt-6 border-t border-border">
                <div className="flex items-center justify-between border-b border-border py-5">
                  <div>
                    <p>{t("wiz.format.ig")}</p>
                    <p className="text-sm text-muted-foreground">{t("wiz.format.igDesc")}</p>
                  </div>
                  <Check className="size-4 text-accent-foreground" />
                </div>
                <div className="flex items-center justify-between border-b border-border py-5">
                  <div>
                    <Label htmlFor="yt">{t("wiz.format.yt")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("wiz.format.ytDesc", { price: EXTRA_YT })}
                    </p>
                  </div>
                  <Switch id="yt" checked={youtube} onCheckedChange={setYoutube} />
                </div>
              </div>
            </section>

            {/* Música */}
            <section>
              <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                {t("wiz.mood")}
              </h2>
              <Select value={mood} onValueChange={(v) => setMood(v as Mood)}>
                <SelectTrigger className="mt-6 max-w-sm rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none">
                  <SelectValue placeholder={t("wiz.mood.placeholder")} />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="elegant">{t("wiz.mood.elegant")}</SelectItem>
                  <SelectItem value="energetic">{t("wiz.mood.energetic")}</SelectItem>
                  <SelectItem value="warm">{t("wiz.mood.warm")}</SelectItem>
                  <SelectItem value="minimal">{t("wiz.mood.minimal")}</SelectItem>
                </SelectContent>
              </Select>
            </section>

            {/* Email */}
            <section className="max-w-sm space-y-2">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em]">
                {t("upload.email")}
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder={t("upload.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none focus-visible:border-accent-foreground focus-visible:ring-0"
              />
            </section>

            <div className="flex flex-wrap items-center gap-6 border-t border-border pt-8">
              <Button type="submit" disabled={!valido} className="rounded-none px-10">
                {t("wiz.continue")}
              </Button>
              {!valido && <p className="text-sm text-muted-foreground">{t("wiz.needPhotos")}</p>}
              <span className="ml-auto font-display text-2xl">${total}</span>
            </div>
          </form>
        )}

        {paso === "animar" && (
          <div className="mt-16 animate-in fade-in duration-700">
            <h2 className="font-display text-3xl">{t("wiz.anim.title")}</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              {t("wiz.anim.desc", { max: maxAnim })}
            </p>
            <div className="mt-8 flex items-baseline justify-between border-b border-border pb-4">
              <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                {t("wiz.anim.counter", { n: animadas.length, max: maxAnim })}
              </span>
              {animadas.length >= maxAnim && (
                <span className="text-xs text-muted-foreground">{t("wiz.anim.max")}</span>
              )}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {fotos.map((f, i) => {
                const sel = animadas.includes(i);
                const bloqueada = !sel && animadas.length >= maxAnim;
                return (
                  <button
                    key={`${f.name}-anim-${i}`}
                    type="button"
                    aria-pressed={sel}
                    onClick={() => toggleAnim(i)}
                    className={`relative aspect-square overflow-hidden transition-opacity duration-300 ${
                      bloqueada ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <img
                      src={urls[i]}
                      alt={t("upload.photoAlt", { n: i + 1 })}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                    <span
                      className={`pointer-events-none absolute inset-0 border-2 transition-colors duration-300 ${
                        sel ? "border-accent-foreground bg-accent-foreground/10" : "border-transparent"
                      }`}
                    />
                    {sel && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 bg-background/90 px-2 py-1 text-[10px] uppercase tracking-[0.16em]">
                        <Check className="size-3 text-accent-foreground" />
                        {t("wiz.anim.badge")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">{t("wiz.anim.rest")}</p>
            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-border pt-8">
              <Button
                className="rounded-none px-10"
                disabled={animadas.length === 0 || enviando}
                onClick={() => void enviarTrabajo()}
              >
                {t("wiz.anim.continue")}
              </Button>
              {animadas.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("wiz.anim.needOne")}</p>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                variant="ghost"
                className="ml-auto rounded-none px-0 text-xs uppercase tracking-[0.18em] hover:bg-transparent"
                onClick={() => setPaso("form")}
              >
                {t("wiz.back")}
              </Button>
            </div>
          </div>
        )}

        {paso === "generando" && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="relative flex size-24 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent-foreground/10" />
              <Loader2 className="size-8 animate-spin text-accent-foreground" />
            </div>
            <p className="mt-10 font-display text-3xl">{t("wiz.gen.title")}</p>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
              {t("wiz.gen.desc")}
            </p>
          </div>
        )}

        {paso === "borrador" && (
          <div className="mt-16 animate-in fade-in duration-700">
            <h2 className="font-display text-3xl">{t("wiz.draft.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("wiz.draft.desc")}</p>
            <div className="mx-auto mt-10 flex aspect-[9/16] max-w-sm items-center justify-center overflow-hidden bg-secondary">
              {preview ? (
                <img
                  src={preview}
                  alt={t("wiz.draft.title")}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="mt-6 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {cambios > 0 ? t("wiz.draft.left", { n: cambios }) : t("wiz.draft.noLeft")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button className="rounded-none px-10" onClick={() => setPaso("resumen")}>
                {t("wiz.draft.approve")}
              </Button>
              <Button
                variant="ghost"
                disabled={cambios === 0}
                className="rounded-none px-6 text-xs uppercase tracking-[0.18em] hover:bg-transparent"
                onClick={() => {
                  setCambios((c) => Math.max(0, c - 1));
                  setCamara((c) => (c === "cinematic" ? "zoom" : "cinematic"));
                  setPaso("generando");
                }}
              >
                {t("wiz.draft.retry")}
              </Button>
            </div>
          </div>
        )}

        {paso === "resumen" && (
          <div className="mt-16 animate-in fade-in duration-700">
            <h2 className="font-display text-3xl">{t("wiz.sum.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("wiz.sum.desc")}</p>
            <dl className="mt-10 border-t border-border">
              <Fila label={t("wiz.sum.tier")} value={`${t(`wiz.tier.${tier === "basico" ? "basic" : "pro"}`)} — $${PRECIO[tier]}`} />
              <Fila
                label={t("wiz.sum.animated")}
                value={t("wiz.anim.counter", { n: animadas.length, max: maxAnim })}
              />
              <Fila label={t("wiz.sum.duration")} value={`${duracion}s — $${base}`} />
              {sinMarcaAgua && (
                <Fila label={t("wiz.sum.noWatermark")} value={`$${EXTRA_SIN_MARCA_USD}`} />
              )}
              <Fila label={t("wiz.sum.camera")} value={t(`wiz.camera.${camara}`)} />
              <Fila label={t("wiz.sum.mood")} value={t(`wiz.mood.${mood}`)} />
              <Fila
                label={t("wiz.sum.formats")}
                value={youtube ? `${t("wiz.format.ig")} + ${t("wiz.format.yt")}` : t("wiz.format.ig")}
              />
              {youtube && <Fila label={t("wiz.sum.extra")} value={`$${EXTRA_YT}`} />}
              <div className="flex items-baseline justify-between border-b border-border py-6">
                <dt className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  {t("wiz.sum.total")}
                </dt>
                <dd className="font-display text-4xl">${total}</dd>
              </div>
</dl>

            {!sinMarcaAgua && (
              <div className="mt-10 max-w-md">
                <h3 className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  {t("wiz.sum.watermark.title")}
                </h3>
                <div className="mt-4 overflow-hidden rounded-sm border border-border bg-black shadow-sm">
                  <div className="relative aspect-video w-full overflow-hidden">
                    <img
                      src={cinematicImg}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {/* Marca de agua discreta: logo + QR en la esquina inferior derecha */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/55 px-2.5 py-1.5 backdrop-blur-[2px]">
                      <span className="font-display text-sm italic tracking-tight text-white">
                        RealtorBoard
                      </span>
                      <svg width="22" height="22" viewBox="0 0 24 24" className="text-white" aria-hidden="true">
                        <rect x="2" y="2" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2" />
                        <rect x="13" y="2" width="9" height="9" fill="currentColor" />
                        <rect x="2" y="13" width="9" height="9" fill="currentColor" />
                        <rect x="13" y="13" width="4" height="4" fill="currentColor" />
                        <rect x="18" y="18" width="4" height="4" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("wiz.sum.watermark.desc")}
                </p>
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Button className="rounded-none px-10" onClick={pagar} disabled={pagando}>
                {pagando && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t("wiz.sum.pay")}
              </Button>
              <Button
                variant="ghost"
                className="rounded-none px-0 text-xs uppercase tracking-[0.18em] hover:bg-transparent"
                onClick={() => setPaso("borrador")}
              >
                {t("wiz.back")}
              </Button>
            </div>
            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            <p className="mt-4 text-sm text-muted-foreground">{t("wiz.sum.note")}</p>
          </div>
        )}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

function Opcion({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`border p-6 text-left transition-colors duration-300 ${
        activo ? "border-accent-foreground" : "border-border hover:border-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Fila({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border py-5">
      <dt className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
