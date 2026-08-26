import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, MapPin, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS } from "@/lib/estados";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RealtorBoard — Agentes inmobiliarios por estado de EE.UU." },
      {
        name: "description",
        content:
          "Marketplace de agentes inmobiliarios organizado por estado: ranking de realtors y valla de video por cada estado de EE.UU.",
      },
      { property: "og:title", content: "RealtorBoard — Agentes inmobiliarios por estado" },
      {
        property: "og:description",
        content: "Explora el ranking de realtors activos en cada estado de EE.UU.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [q, setQ] = useState("");

  const { data: activos } = useQuery({
    queryKey: ["estados-activos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("realtors").select("estado");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const r of data ?? []) counts[r.estado] = (counts[r.estado] ?? 0) + 1;
      return counts;
    },
  });

  const lista = useMemo(
    () =>
      ESTADOS.filter((e) => e.nombre.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="border-b border-border/70 bg-secondary/40">
          <div className="mx-auto max-w-6xl px-5 py-20 text-center">
            <Badge variant="secondary" className="mb-5">
              <Trophy className="size-3.5" /> Ranking por estado
            </Badge>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              El marketplace de agentes inmobiliarios de EE.UU.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Elige un estado para ver el ranking de realtors y la valla de video con las
              inmobiliarias destacadas.
            </p>
            <div className="relative mx-auto mt-8 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar estado..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="font-display text-xl font-semibold">Estados</h2>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((e) => {
              const n = activos?.[e.code] ?? 0;
              return (
                <Link
                  key={e.code}
                  to="/estados/$slug"
                  params={{ slug: e.slug }}
                  className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <MapPin className="size-4 text-muted-foreground" />
                    {e.nombre}
                  </span>
                  {n > 0 ? (
                    <Badge>{n} activos</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Sin realtors
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
