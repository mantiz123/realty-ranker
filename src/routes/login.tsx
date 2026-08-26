import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar con enlace mágico | RealtorBoard" },
      {
        name: "description",
        content:
          "Accede a tu panel de agente inmobiliario con un enlace mágico enviado a tu email. Sin contraseñas.",
      },
      { property: "og:title", content: "Entrar con enlace mágico | RealtorBoard" },
      {
        property: "og:description",
        content: "Accede a tu panel de agente inmobiliario sin contraseña.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
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
      options: { emailRedirectTo: `${window.location.origin}/panel` },
    });
    setCargando(false);
    if (error) setError(error.message);
    else setEnviado(true);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-5 py-20">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Entrar</CardTitle>
            <CardDescription>
              Te enviamos un enlace mágico a tu email. No necesitas contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enviado ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle2 className="size-10 text-accent-foreground" />
                <p className="font-medium">Revisa tu bandeja de entrada</p>
                <p className="text-sm text-muted-foreground">
                  Enviamos un enlace de acceso a <strong>{email}</strong>.
                </p>
                <Button variant="ghost" size="sm" onClick={() => setEnviado(false)}>
                  Usar otro email
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="agente@inmobiliaria.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={cargando}>
                  <Mail className="size-4" />
                  {cargando ? "Enviando..." : "Enviar enlace mágico"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
