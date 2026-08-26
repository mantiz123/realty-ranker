import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, MousePointerClick, Trophy, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { estadoPorCode } from "@/lib/estados";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Panel del realtor | RealtorBoard" },
      {
        name: "description",
        content: "Consulta tu posición en el ranking, tus videos generados y tu slot en la valla.",
      },
      { property: "og:title", content: "Panel del realtor | RealtorBoard" },
      {
        property: "og:description",
        content: "Ranking, videos y slot de valla de tu cuenta de agente.",
      },
    ],
  }),
  component: PanelPage,
});

function PanelPage() {
  const { user } = Route.useRouteContext();
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
  });

  async function salir() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const montoPagado = (data?.bids ?? []).reduce((a, b) => a + Number(b.monto), 0);
  const estadoNombre = data?.realtor ? estadoPorCode(data.realtor.estado)?.nombre : null;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Panel</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={salir}>
            Cerrar sesión
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-20 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando tu información...
          </div>
        ) : !data?.realtor ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-base">Todavía no tienes perfil de realtor</CardTitle>
              <CardDescription>
                Cuando tu cuenta de agente esté registrada, aquí verás tu ranking, tus videos y tu
                slot en la valla.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Tabs defaultValue="ranking" className="mt-8">
            <TabsList>
              <TabsTrigger value="ranking">Ranking</TabsTrigger>
              <TabsTrigger value="videos">Mis videos</TabsTrigger>
              <TabsTrigger value="valla">Mi valla</TabsTrigger>
            </TabsList>

            <TabsContent value="ranking" className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardDescription>Posición en {estadoNombre}</CardDescription>
                    <CardTitle className="font-display text-4xl">
                      {data.posicion ? `#${data.posicion}` : "—"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <Trophy className="mr-1 inline size-4" /> Ranking por monto pagado
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Monto pagado</CardDescription>
                    <CardTitle className="font-display text-4xl">
                      ${montoPagado.toLocaleString("en-US")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {data.bids.length} puja(s) registradas
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="videos" className="mt-6">
              {data.videos.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  Aún no has generado videos.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.videos.map((v) => (
                    <Card key={v.id} className="overflow-hidden p-0">
                      <div className="flex aspect-video items-center justify-center bg-secondary">
                        {v.video_url ? (
                          <video src={v.video_url} className="size-full object-cover" controls />
                        ) : (
                          <Video className="size-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex items-center justify-between p-4">
                        <Badge variant={v.estado_generacion === "listo" ? "default" : "secondary"}>
                          {v.estado_generacion}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{v.tier}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="valla" className="mt-6">
              {data.slots.length === 0 ? (
                <p className="py-10 text-center text-muted-foreground">
                  No tienes un slot activo en la valla.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.slots.map((s) => {
                    const fin = s.fecha_fin ? new Date(s.fecha_fin) : null;
                    const dias = fin
                      ? Math.max(
                          0,
                          Math.ceil((fin.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                        )
                      : null;
                    return (
                      <Card key={s.id}>
                        <CardHeader>
                          <CardDescription>{estadoPorCode(s.estado)?.nombre}</CardDescription>
                          <CardTitle className="font-display text-3xl">
                            {dias !== null ? `${dias} días` : "Sin fecha fin"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            <CalendarDays className="mr-1 inline size-4" />
                            Desde {s.fecha_inicio}
                          </span>
                          <span>
                            <MousePointerClick className="mr-1 inline size-4" />
                            {s.clics} clics
                          </span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
