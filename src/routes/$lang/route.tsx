import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { isLang } from "@/lib/i18n";

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
    return { lang: params.lang };
  },
  component: () => <Outlet />,
});
