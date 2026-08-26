import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/subir")({
  head: () => ({
    meta: [
      { title: "Subir propiedad y generar video | RealtorBoard" },
      {
        name: "description",
        content:
          "Sube de 5 a 15 fotos de tu propiedad y genera un video para la valla de tu estado.",
      },
      { property: "og:title", content: "Subir propiedad | RealtorBoard" },
      {
        property: "og:description",
        content: "Sube fotos de tu propiedad y genera un video para la valla.",
      },
    ],
  }),
  component: SubirPage,
});

type Estado = "idle" | "generando";

function SubirPage() {
  const [fotos, setFotos] = useState<File[]>([]);
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");

  const valido = fotos.length >= 5 && fotos.length <= 15 && email.includes("@");

  function agregar(files: FileList | null) {
    if (!files) return;
    setFotos((prev) => [...prev, ...Array.from(files)].slice(0, 15));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("generando");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Subir propiedad</h1>
        <p className="mt-2 text-muted-foreground">
          Sube entre 5 y 15 fotos. Generaremos un video para la valla de tu estado.
        </p>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Fotos de la propiedad</CardTitle>
            <CardDescription>
              {fotos.length} de 15 seleccionadas (mínimo 5)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={enviar} className="space-y-6">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 py-12 text-center transition-colors hover:border-ring">
                <ImagePlus className="size-7 text-muted-foreground" />
                <span className="text-sm font-medium">Arrastra o selecciona tus fotos</span>
                <span className="text-xs text-muted-foreground">JPG o PNG</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={estado === "generando"}
                  onChange={(e) => agregar(e.target.files)}
                />
              </label>

              {fotos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {fotos.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="group relative aspect-square overflow-hidden rounded-md border border-border"
                    >
                      <img
                        src={URL.createObjectURL(f)}
                        alt={`Foto ${i + 1} de la propiedad`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Quitar foto"
                        onClick={() => setFotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Tu email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="agente@inmobiliaria.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={estado === "generando"}
                />
              </div>

              {estado === "generando" ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  <div>
                    <p className="font-medium">Generando video...</p>
                    <p className="text-sm text-muted-foreground">
                      Te avisaremos a {email} cuando esté listo.
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    procesando
                  </Badge>
                </div>
              ) : (
                <Button type="submit" disabled={!valido} className="w-full">
                  Generar video
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
