import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Realtor<span className="text-accent-foreground">Board</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Estados</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/subir">Subir propiedad</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/panel">Panel</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/login">Entrar</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 py-10">
      <div className="mx-auto max-w-6xl px-5 text-sm text-muted-foreground">
        RealtorBoard — marketplace de agentes inmobiliarios por estado.
      </div>
    </footer>
  );
}
