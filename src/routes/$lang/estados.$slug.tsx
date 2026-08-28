import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { estadoPorSlug } from "@/lib/estados";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { makeT, isLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/$lang/estados/$slug")({
  loader: ({ params }) => {
    const estado = estadoPorSlug(params.slug);
    if (!estado) throw notFound();
    return { estado };
  },
  head: ({ loaderData, params }) => {
    const lang: Lang = isLang(params.lang) ? params.lang : "en";
    const t = makeT(lang);
    const nombre = loaderData?.estado.nombre;
    if (!nombre) {
      return {
        meta: [
          { title: `${t("state.notFound")} | RealtorBoard` },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title =
      lang === "es" ? `Realtors en ${nombre} | RealtorBoard` : `Realtors in ${nombre} | RealtorBoard`;
    const description =
      lang === "es"
        ? `Ranking de agentes inmobiliarios y valla de video de las inmobiliarias activas en ${nombre}.`
        : `Real estate agent ranking and video billboard for brokerages active in ${nombre}.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: EstadoPage,
  errorComponent: () => (
    <div className="p-24 text-center text-muted-foreground">Error</div>
  ),
  notFoundComponent: () => (
    <div className="p-24 text-center">
      <p className="font-display text-2xl">404</p>
      <Link to="/" className="mt-3 inline-block text-sm underline">
        RealtorBoard
      </Link>
    </div>
  ),
});

type Fila = {
  realtor_id: string;
  nombre: string;
  foto_url: string | null;
  inmobiliaria: string | null;
  monto: number;
  clics: number;
};

function EstadoPage() {
  const { estado } = Route.useLoaderData();
  const { lang } = Route.useRouteContext();
  const t = makeT(lang);

  const [pujaAbierta, setPujaAbierta] = useState(false);
  const [oferta, setOferta] = useState("");

  const { data: ranking, isLoading } = useQuery({
    queryKey: ["ranking", estado.code],
    queryFn: async (): Promise<Fila[]> => {
      const [{ data: realtors, error: e1 }, { data: bids, error: e2 }, { data: slots, error: e3 }] =
        await Promise.all([
          supabase
            .from("realtors")
            .select("id, nombre, foto_url, inmobiliaria")
            .eq("estado", estado.code),
          supabase.from("bids").select("realtor_id, monto").eq("estado", estado.code),
          supabase.from("billboard_slots").select("realtor_id, clics").eq("estado", estado.code),
        ]);
      if (e1 || e2 || e3) throw e1 ?? e2 ?? e3;

      return (realtors ?? [])
        .map((r) => ({
          realtor_id: r.id,
          nombre: r.nombre,
          foto_url: r.foto_url,
          inmobiliaria: r.inmobiliaria,
          monto: (bids ?? [])
            .filter((b) => b.realtor_id === r.id)
            .reduce((a, b) => a + Number(b.monto), 0),
          clics: (slots ?? [])
            .filter((s) => s.realtor_id === r.id)
            .reduce((a, s) => a + (s.clics ?? 0), 0),
        }))
        .sort((a, b) => b.monto - a.monto);
    },
  });

  const { data: videos } = useQuery({
    queryKey: ["valla", estado.code],
    queryFn: async () => {
      const hoy = new Date().toISOString().slice(0, 10);
      const { data: slots, error } = await supabase
        .from("billboard_slots")
        .select("id, video_id, realtor_id, clics, fecha_inicio, fecha_fin")
        .eq("estado", estado.code);
      if (error) throw error;

      const vigentes = (slots ?? []).filter(
        (s) => s.video_id && s.fecha_inicio <= hoy && (!s.fecha_fin || s.fecha_fin >= hoy),
      );
      if (vigentes.length === 0) return [];

      const [{ data: vids }, { data: realtors }] = await Promise.all([
        supabase
          .from("videos")
          .select("id, video_url, estado_generacion")
          .in("id", vigentes.map((s) => s.video_id) as string[])
          .eq("estado_generacion", "listo"),
        supabase
          .from("realtors")
          .select("id, nombre, inmobiliaria")
          .in(
            "id",
            vigentes.map((s) => s.realtor_id),
          ),
      ]);

      return vigentes
        .map((s) => {
          const v = (vids ?? []).find((x) => x.id === s.video_id);
          const r = (realtors ?? []).find((x) => x.id === s.realtor_id);
          return {
            slotId: s.id,
            url: v?.video_url ?? null,
            inmobiliaria: r?.inmobiliaria ?? r?.nombre ?? "Brokerage",
          };
        })
        .filter((s) => !!s.url);
    },
  });


  const registrarVista = async (tipo: "ranking_click" | "billboard_view", realtorId?: string) => {
    await supabase
      .from("page_views")
      .insert({ estado: estado.code, tipo, realtor_id: realtorId ?? null });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader lang={lang} />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {t("state.eyebrow")} — {estado.code}
        </p>
        <h1 className="mt-5 font-display text-5xl tracking-tight">{estado.nombre}</h1>

        <section className="mt-24">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            {t("state.billboard")}
          </h2>
          <Billboard
            items={videos ?? []}
            lang={lang}
            onView={() => registrarVista("billboard_view")}
          />
        </section>

        <section className="mt-28">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            {t("state.ranking")}
          </h2>
          <div className="mt-8">
            <div className="grid grid-cols-[2.5rem_1fr_5rem_8rem_9rem] items-baseline border-b border-border pb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>#</span>
              <span>{t("state.col.agent")}</span>
              <span className="text-right">{t("state.col.clicks")}</span>
              <span className="text-right">{t("state.col.amount")}</span>
              <span className="text-right">{t("state.col.action")}</span>
            </div>

            {isLoading && (
              <p className="py-16 text-center text-muted-foreground">{t("state.loading")}</p>
            )}
            {!isLoading && (ranking?.length ?? 0) === 0 && (
              <p className="py-16 text-center text-muted-foreground">
                {t("state.empty")} {estado.nombre}.
              </p>
            )}

            {ranking?.map((f, i) => (
              <div
                key={f.realtor_id}
                className="grid grid-cols-[2.5rem_1fr_5rem_8rem_9rem] items-center border-b border-border/60 py-5 transition-colors duration-300 hover:border-accent-foreground"
              >
                <span className="font-display text-lg text-muted-foreground">{i + 1}</span>
                <div className="flex items-center gap-4">
                  {f.foto_url ? (
                    <img
                      src={f.foto_url}
                      alt={f.nombre}
                      className="size-12 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="flex size-12 items-center justify-center bg-secondary text-xs">
                      {f.nombre.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="font-display text-lg leading-tight">{f.nombre}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {f.inmobiliaria}
                    </p>
                  </div>
                </div>
                <span className="text-right tabular-nums text-muted-foreground">{f.clics}</span>
                <span className="text-right tabular-nums">${f.monto.toLocaleString("en-US")}</span>
                <div className="text-right">
                  <button
                    onClick={() => {
                      registrarVista("ranking_click", f.realtor_id);
                      setPujaAbierta(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-accent-foreground transition-opacity duration-300 hover:opacity-60"
                  >
                    {t("state.outbid")}
                    <ArrowUpRight className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <BidDialog
          open={pujaAbierta}
          onOpenChange={setPujaAbierta}
          lang={lang}
          estadoNombre={estado.nombre}
          maxMonto={ranking?.[0]?.monto ?? 0}
          oferta={oferta}
          setOferta={setOferta}
        />
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

function Billboard({
  items,
  lang,
  onView,
}: {
  items: { slotId: string; url: string | null; inmobiliaria: string }[];
  lang: Lang;
  onView: () => void;
}) {
  const t = makeT(lang);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const actual = useMemo(() => items[idx], [items, idx]);

  useEffect(() => {
    if (items.length > 0) onView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, items.length]);

  function cambiar(next: number) {
    setVisible(false);
    window.setTimeout(() => {
      setIdx(next);
      setVisible(true);
    }, 350);
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 flex aspect-[21/9] items-center justify-center bg-secondary">
        <p className="text-sm text-muted-foreground">{t("state.noVideos")}</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="relative aspect-[21/9] overflow-hidden bg-secondary">
        <div
          className={`size-full transition-opacity duration-700 ease-out ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {actual?.url ? (
            <video
              key={actual.slotId}
              src={actual.url}
              className="size-full object-cover"
              autoPlay
              muted
              playsInline
              onEnded={() => cambiar((idx + 1) % items.length)}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <Play className="size-8" />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-8">
          <p className="font-display text-2xl text-background">{actual?.inmobiliaria}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {t("state.videoOf", { n: idx + 1, total: items.length })}
        </p>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-none px-0 text-xs uppercase tracking-[0.18em] hover:bg-transparent"
          onClick={() => cambiar((idx + 1) % items.length)}
        >
          {t("state.next")}
        </Button>
      </div>
    </div>
  );
}

function BidDialog({
  open,
  onOpenChange,
  lang,
  estadoNombre,
  maxMonto,
  oferta,
  setOferta,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lang: Lang;
  estadoNombre: string;
  maxMonto: number;
  oferta: string;
  setOferta: (v: string) => void;
}) {
  const t = makeT(lang);
  const minimo = maxMonto + 1;
  const valido = Number(oferta) >= minimo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal tracking-tight">
            {t("bid.title")}
          </DialogTitle>
          <DialogDescription>{t("bid.desc", { estado: estadoNombre })}</DialogDescription>
        </DialogHeader>

        <div className="border-y border-border py-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            {t("bid.current")}
          </p>
          <p className="mt-2 font-display text-5xl">${maxMonto.toLocaleString("en-US")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="oferta" className="text-[11px] uppercase tracking-[0.2em]">
            {t("bid.your")}
          </Label>
          <Input
            id="oferta"
            type="number"
            min={minimo}
            value={oferta}
            onChange={(e) => setOferta(e.target.value)}
            placeholder={String(minimo)}
            className="rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none focus-visible:border-accent-foreground focus-visible:ring-0"
          />
          <p className="text-xs text-muted-foreground">{t("bid.min", { n: maxMonto })}</p>
        </div>

        <DialogFooter className="mt-4 flex-col items-stretch gap-3 sm:flex-col">
          <Button className="rounded-none" disabled={!valido}>
            {t("bid.pay")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t("bid.note")}</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
