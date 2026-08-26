import { createFileRoute, redirect } from "@tanstack/react-router";
import { detectLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/$lang", params: { lang: detectLang() } });
  },
  component: () => null,
});
