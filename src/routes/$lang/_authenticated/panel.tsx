import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Download, Loader2, Video } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { estadoPorCode } from "@/lib/estados";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { makeT, isLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/$lang/_authenticated/panel")({
  head: ({ params }) => {
    const lang: Lang = isLang(params.lang) ? params.lang : "en";
    const t = makeT(lang);
    return {
      meta: [
        { title: t("panel.meta.title") },
        { name: "description", content: t("panel.meta.desc") },
        { property: "og:title", content: t("panel.meta.title") },
        { property: "og:description", content: t("panel.meta.desc") },
      ],
    };
  },
  component: PanelPage,
});

function PanelPage() {
  const { user, lang } = Route.useRouteContext();
  const t = makeT(lang);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["panel", user.email],
    queryFn: async () => {
      const { data: realtor } = await supabase
        .from("realtors")
        .select("*")
        .eq("email", user.email!)
        .maybeSingle();
      if (!realtor) return { realtor: null, bids: [], videos: [], slots: [], posicion: null };

      const [{ data: bids }, { data: videos }, { data: slots }, { data: rivales }] =
        await Promise.all([
          supabase.from("bids").select("*").eq("realtor_id", realtor.id),
          supabase
            .from("videos")
            .select("*")
            .eq("realtor_id", realtor.id)
            .order("creado_en", { ascending: false }),
          supabase.from("billboard_slots").select("*").eq("realtor_id", realtor.id),
          supabase.from("bids").select("realtor_id, monto").eq("estado", realtor.estado),
        ]);

      const totales: Record<string, number> = {};
      for (const b of rivales ?? [])
        totales[b.realtor_id] = (totales[b.realtor_id] ?? 0) + Number(b.monto);
      const orden = Object.entries(totales).sort((a, b) => b[1] - a[1]);
      const posicion = orden.findIndex(([id]) => id === realtor.id);

      return {
        realtor,
        bids: bids ?? [],
        videos: videos ?? [],
        slots: slots ?? [],
        posicion: posicion >= 0 ? posicion + 1 : null,
      };
    },
    // Mientras haya pedidos en curso, refrescamos para reflejar el webhook de pago
    // y el avance del worker sin recargar la página.
    refetchInterval: (query) => {
      const d = query.state.data as { videos?: { estado_generacion: string }[] } | undefined;
      const enCurso = (d?.videos ?? []).some(
        (v) => v.estado_generacion === "pendiente_pago" || v.estado_generacion === "procesando",
      );
      return enCurso ? 5000 : false;
    },
  });

  async function salir() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/$lang/login", params: { lang }, replace: true });
  }

  const montoPagado = (data?.bids ?? []).reduce((a, b) => a + Number(b.monto), 0);
  const estadoNombre = data?.realtor ? estadoPorCode(data.realtor.estado)?.nombre : null;

  return (
    <div className="min-h-screen">
      <SiteHeader lang={lang} />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="font-display text-4xl tracking-tight">{t("panel.title")}</h1>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-none px-0 text-xs uppercase tracking-[0.18em] hover:bg-transparent"
            onClick={salir}
          >
            {t("panel.signout")}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t("panel.loading")}
          </div>
        ) : !data?.realtor ? (
          <div className="py-20">
            <p className="font-display text-2xl">{t("panel.noProfile")}</p>
            <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">
              {t("panel.noProfileDesc")}
            </p>
          </div>
        ) : (
          <Tabs defaultValue="ranking" className="mt-12">
            <TabsList className="rounded-none bg-transparent p-0">
              <TabsTrigger value="ranking" className="rounded-none">
                {t("panel.tab.ranking")}
              </TabsTrigger>
              <TabsTrigger value="videos" className="rounded-none">
                {t("panel.tab.videos")}
              </TabsTrigger>
              <TabsTrigger value="valla" className="rounded-none">
                {t("panel.tab.billboard")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ranking" className="mt-10">
              <div className="grid gap-12 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    {t("panel.position")} {estadoNombre}
                  </p>
                  <p className="mt-3 font-display text-6xl">
                    {data.posicion ? `#${data.posicion}` : "—"}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">{t("panel.byAmount")}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                    {t("panel.amount")}
                  </p>
                  <p className="mt-3 font-display text-6xl">
                    ${montoPagado.toLocaleString("en-US")}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {data.bids.length} {t("panel.bids")}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="videos" className="mt-10">
              {data.videos.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">{t("panel.noVideos")}</p>
              ) : (
                <div className="grid gap-10 sm:grid-cols-2">
                  {data.videos.map((v) => {
                    const listo = v.estado_generacion === "listo" || !!v.video_url;
                    const est = estadoPorCode(data.realtor!.estado);
                    return (
                      <div key={v.id}>
                        <div className="flex aspect-video items-center justify-center overflow-hidden bg-secondary">
                          {v.video_url ? (
                            <video src={v.video_url} className="size-full object-cover" controls />
                          ) : (
                            <Video className="size-7 text-muted-foreground" />
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em]">
                          <span className={listo ? "text-accent-foreground" : "text-muted-foreground"}>
                            {listo
                              ? t("panel.video.ready")
                              : v.estado_generacion === "pendiente_pago"
                                ? t("panel.video.pendingPayment")
                                : t("panel.video.processing")}
                          </span>

                          <span className="text-muted-foreground">{v.tier}</span>
                        </div>
                        {listo && (
                          <>
                            <a
                              href={v.video_url ?? "#"}
                              download
                              className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-accent-foreground transition-opacity duration-300 hover:opacity-60"
                            >
                              <Download className="size-3.5" />
                              {t("panel.video.download")}
                            </a>
                            {est && (
                              <div className="mt-6 border-t border-border pt-6">
                                <p className="font-display text-xl leading-snug">
                                  {t("panel.video.upsellTitle", { estado: est.nombre })}
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                  {t("panel.video.upsellDesc")}
                                </p>
                                <Link
                                  to="/$lang/estados/$slug"
                                  params={{ lang, slug: est.slug }}
                                  className="mt-4 inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-accent-foreground transition-opacity duration-300 hover:opacity-60"
                                >
                                  {t("panel.video.upsellCta", { estado: est.nombre })}
                                  <ArrowUpRight className="size-3.5" />
                                </Link>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>


            <TabsContent value="valla" className="mt-10">
              {data.slots.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">{t("panel.noSlot")}</p>
              ) : (
                <div className="grid gap-10 sm:grid-cols-2">
                  {data.slots.map((s) => {
                    const fin = s.fecha_fin ? new Date(s.fecha_fin) : null;
                    const dias = fin
                      ? Math.max(0, Math.ceil((fin.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                      : null;
                    return (
                      <div key={s.id}>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                          {estadoPorCode(s.estado)?.nombre}
                        </p>
                        <p className="mt-3 font-display text-4xl">
                          {dias !== null ? `${dias} ${t("panel.days")}` : t("panel.noEnd")}
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {t("panel.since")} {s.fecha_inicio} · {s.clics} {t("panel.clicks")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
