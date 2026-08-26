import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { makeT, isLang, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/$lang/login")({
  head: ({ params }) => {
    const lang: Lang = isLang(params.lang) ? params.lang : "en";
    const t = makeT(lang);
    return {
      meta: [
        { title: t("login.meta.title") },
        { name: "description", content: t("login.meta.desc") },
        { property: "og:title", content: t("login.meta.title") },
        { property: "og:description", content: t("login.meta.desc") },
      ],
    };
  },
  component: LoginPage,
});

function LoginPage() {
  const { lang } = Route.useRouteContext();
  const t = makeT(lang);
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/${lang}/panel` },
    });
    setCargando(false);
    if (error) setError(error.message);
    else setEnviado(true);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader lang={lang} />
      <main className="mx-auto flex max-w-md flex-col px-6 py-24">
        <h1 className="font-display text-4xl tracking-tight">{t("login.title")}</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">{t("login.desc")}</p>

        {enviado ? (
          <div className="mt-12 flex flex-col items-start gap-3 border-t border-border pt-8">
            <CheckCircle2 className="size-6 text-accent-foreground" />
            <p>{t("login.check")}</p>
            <p className="text-sm text-muted-foreground">
              {t("login.sentTo")} <strong className="font-normal text-foreground">{email}</strong>.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="px-0 hover:bg-transparent"
              onClick={() => setEnviado(false)}
            >
              {t("login.other")}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-12 space-y-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] uppercase tracking-[0.2em]">
                {t("login.email")}
              </Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="agent@brokerage.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none focus-visible:border-accent-foreground focus-visible:ring-0"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full rounded-none" disabled={cargando}>
              {cargando ? t("login.sending") : t("login.send")}
            </Button>
          </form>
        )}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
