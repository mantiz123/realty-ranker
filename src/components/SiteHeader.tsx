import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { makeT, type Lang } from "@/lib/i18n";

function LangSwitcher({ lang }: { lang: Lang }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const rest = pathname.replace(/^\/(es|en)/, "");

  return (
    <div className="ml-2 flex items-center gap-1 text-xs tracking-[0.14em] uppercase">
      {(["es", "en"] as Lang[]).map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted-foreground/50">/</span>}
          <a
            href={`/${l}${rest}`}
            aria-current={l === lang ? "true" : undefined}
            className={
              l === lang
                ? "text-foreground"
                : "text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {l}
          </a>
        </span>
      ))}
    </div>
  );
}

export function SiteHeader({ lang }: { lang: Lang }) {
  const t = makeT(lang);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const link =
    "text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground";

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        <Link to="/$lang" params={{ lang }} className="flex flex-col leading-none">
          <span className="font-display text-xl tracking-tight">RealtorBoard</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Est. 2026
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/$lang" params={{ lang }} className={link}>
            {t("nav.states")}
          </Link>
          <Link to="/$lang/subir" params={{ lang }} className={link}>
            {t("nav.upload")}
          </Link>
          <Link to="/$lang/crear-video" params={{ lang }} className={link}>
            {t("nav.create")}
          </Link>
          <Link to="/$lang/panel" params={{ lang }} className={link}>
            {t("nav.panel")}
          </Link>
          <Link
            to="/$lang/login"
            params={{ lang }}
            className="text-sm text-accent-foreground transition-colors duration-300 hover:text-foreground"
          >
            {t("nav.login")}
          </Link>
          <LangSwitcher lang={lang} />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = makeT(lang);
  return (
    <footer className="mt-28 py-12">
      <div className="mx-auto max-w-6xl px-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {t("footer.tagline")}
      </div>
    </footer>
  );
}
