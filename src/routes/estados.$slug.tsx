import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, MousePointerClick, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { estadoPorSlug } from "@/lib/estados";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/estados/$slug")({
  loader: ({ params }) => {
    const estado = estadoPorSlug(params.slug);
    if (!estado) throw notFound();
    return { estado };
  },
  head: ({ loaderData }) => {
    const nombre = loaderData?.estado.nombre;
    if (!nombre) {
      return {
        meta: [
          { title: "Estado no encontrado | RealtorBoard" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `Realtors en ${nombre} | RealtorBoard`;
    const description = `Ranking de agentes inmobiliarios y valla de video de las inmobiliarias activas en ${nombre}.`;
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
    <div className="p-20 text-center text-muted-foreground">No se pudo cargar el estado.</div>
  ),
  notFoundComponent: () => (
    <div className="p-20 text-center">
      <p className="font-display text-xl">Estado no encontrado</p>
      <Link to="/" className="mt-3 inline-block text-sm underline">
        Ver todos los estados
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
      const { data: slots, error } = await supabase
        .from("billboard_slots")
        .select("id, video_id, realtor_id, clics")
        .eq("estado", estado.code);
      if (error) throw error;
      const videoIds = (slots ?? []).map((s) => s.video_id).filter(Boolean) as string[];
      if (videoIds.length === 0) return [];
      const [{ data: vids }, { data: realtors }] = await Promise.all([
        supabase.from("videos").select("id, video_url").in("id", videoIds),
        supabase
          .from("realtors")
          .select("id, nombre, inmobiliaria")
          .in("id", (slots ?? []).map((s) => s.realtor_id)),
      ]);
      return (slots ?? []).map((s) => ({
        slotId: s.id,
        url: (vids ?? []).find((v) => v.id === s.video_id)?.video_url ?? null,
        inmobiliaria:
          (realtors ?? []).find((r) => r.id === s.realtor_id)?.inmobiliaria ??
          (realtors ?? []).find((r) => r.id === s.realtor_id)?.nombre ??
          "Inmobiliaria",
      }));
    },
  });

  const registrarVista = async (tipo: "ranking_click" | "billboard_view", realtorId?: string) => {
    await supabase
      .from("page_views")
      .insert({ estado: estado.code, tipo, realtor_id: realtorId ?? null });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Estado de EE.UU.</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {estado.nombre}
            </h1>
          </div>
          <Badge variant="secondary">{estado.code}</Badge>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Ranking de realtors</h2>
          <Card className="mt-4 overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">#</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead className="text-right">Clics</TableHead>
                  <TableHead className="text-right">Monto pagado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Cargando ranking...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && (ranking?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Todavía no hay realtors activos en {estado.nombre}.
                    </TableCell>
                  </TableRow>
                )}
                {ranking?.map((f, i) => (
                  <TableRow key={f.realtor_id}>
                    <TableCell className="font-medium text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={f.foto_url ?? undefined} alt={f.nombre} />
                          <AvatarFallback>{f.nombre.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{f.nombre}</p>
                          <p className="text-xs text-muted-foreground">{f.inmobiliaria}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <MousePointerClick className="size-3.5" />
                        {f.clics}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      ${f.monto.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => registrarVista("ranking_click", f.realtor_id)}
                      >
                        Superar posición
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-xl font-semibold">Valla de video</h2>
          <Billboard
            items={videos ?? []}
            onView={() => registrarVista("billboard_view")}
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Billboard({
  items,
  onView,
}: {
  items: { slotId: string; url: string | null; inmobiliaria: string }[];
  onView: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const actual = useMemo(() => items[idx], [items, idx]);

  useEffect(() => {
    if (items.length > 0) onView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, items.length]);

  if (items.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base font-medium text-muted-foreground">
            Aún no hay videos en la valla de este estado.
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4 overflow-hidden p-0">
      <CardContent className="p-0">
        <div className="relative aspect-video bg-primary">
          {actual?.url ? (
            <video
              ref={videoRef}
              key={actual.slotId}
              src={actual.url}
              className="size-full object-cover"
              autoPlay
              muted
              playsInline
              onEnded={() => setIdx((i) => (i + 1) % items.length)}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-primary-foreground/70">
              <Play className="size-10" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/90 to-transparent p-5">
            <p className="font-display text-lg text-primary-foreground">
              {actual?.inmobiliaria}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border p-4">
          <p className="text-sm text-muted-foreground">
            Video {idx + 1} de {items.length}
          </p>
          <Button size="sm" variant="ghost" onClick={() => setIdx((i) => (i + 1) % items.length)}>
            Siguiente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
