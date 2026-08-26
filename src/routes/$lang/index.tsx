import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS } from "@/lib/estados";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { makeT, isLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/$lang/")({
  head: ({ params }) => {
    const lang: Lang = isLang(params.lang) ? params.lang : "en";
    const t = makeT(lang);
    return {
      meta: [
        { title: t("home.meta.title") },
        { name: "description", content: t("home.meta.desc") },
        { property: "og:title", content: t("home.meta.title") },
        { property: "og:description", content: t("home.meta.desc") },
      ],
    };
  },
  component: Home,
});

function Home() {
  const { lang } = Route.useRouteContext();
  const t = makeT(lang);
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
    () => ESTADOS.filter((e) => e.nombre.toLowerCase().includes(q.trim().toLowerCase())),
    [q],
  );

  return (
    <div className="min-h-screen">
      <SiteHeader lang={lang} />
      <main>
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-24 text-center">
          <p className="text-[11px] uppercase tracking-[0.35em] text-accent-foreground">
            {t("home.badge")}
          </p>
          <h1 className="mx-auto mt-8 max-w-3xl font-display text-5xl font-normal leading-[1.08] tracking-tight sm:text-6xl">
            {t("home.title")}
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("home.subtitle")}
          </p>
          <div className="relative mx-auto mt-12 max-w-sm">
            <Search className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="rounded-none border-0 border-b border-border bg-transparent pl-7 shadow-none focus-visible:border-accent-foreground focus-visible:ring-0"
              placeholder={t("home.search")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            {t("home.states")}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((e) => {
              const n = activos?.[e.code] ?? 0;
              return (
                <Link
                  key={e.code}
                  to="/$lang/estados/$slug"
                  params={{ lang, slug: e.slug }}
                  className="group flex items-baseline justify-between border-b border-border/60 py-5 transition-colors duration-300 hover:border-accent-foreground"
                >
                  <span className="font-display text-lg transition-transform duration-300 group-hover:translate-x-1">
                    {e.nombre}
                  </span>
                  <span
                    className={
                      n > 0
                        ? "text-xs uppercase tracking-[0.18em] text-accent-foreground"
                        : "text-xs uppercase tracking-[0.18em] text-muted-foreground/70"
                    }
                  >
                    {n > 0 ? `${n} ${t("home.active")}` : t("home.none")}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
