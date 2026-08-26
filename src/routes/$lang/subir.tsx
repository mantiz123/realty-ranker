import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeT, isLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/$lang/subir")({
  head: ({ params }) => {
    const lang: Lang = isLang(params.lang) ? params.lang : "en";
    const t = makeT(lang);
    return {
      meta: [
        { title: t("upload.meta.title") },
        { name: "description", content: t("upload.meta.desc") },
        { property: "og:title", content: t("upload.meta.title") },
        { property: "og:description", content: t("upload.meta.desc") },
      ],
    };
  },
  component: SubirPage,
});

function SubirPage() {
  const { lang } = Route.useRouteContext();
  const t = makeT(lang);
  const [fotos, setFotos] = useState<File[]>([]);
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "generando">("idle");

  const valido = fotos.length >= 5 && fotos.length <= 15 && email.includes("@");

  function agregar(files: FileList | null) {
    if (!files) return;
    setFotos((prev) => [...prev, ...Array.from(files)].slice(0, 15));
  }

  return (
    <div className="min-h-screen">
      <SiteHeader lang={lang} />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="font-display text-4xl tracking-tight">{t("upload.title")}</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
          {t("upload.subtitle")}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setEstado("generando");
          }}
          className="mt-14 space-y-10"
        >
          <div>
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
                disabled={estado === "generando"}
                onChange={(e) => agregar(e.target.files)}
              />
            </label>
          </div>

          {fotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {fotos.map((f, i) => (
                <div key={`${f.name}-${i}`} className="group relative aspect-square overflow-hidden">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={t("upload.photoAlt", { n: i + 1 })}
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

          <div className="max-w-sm space-y-2">
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
              disabled={estado === "generando"}
              className="rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none focus-visible:border-accent-foreground focus-visible:ring-0"
            />
          </div>

          {estado === "generando" ? (
            <div className="flex items-center gap-4 border-t border-border pt-6">
              <Loader2 className="size-4 animate-spin text-accent-foreground" />
              <div>
                <p>{t("upload.generating")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("upload.notify", { email })}
                </p>
              </div>
              <span className="ml-auto text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {t("upload.processing")}
              </span>
            </div>
          ) : (
            <Button type="submit" disabled={!valido} className="rounded-none px-10">
              {t("upload.submit")}
            </Button>
          )}
        </form>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
