"use client";

import { usePathname } from "next/navigation";

/** Error boundary for the dashboard: the shell around it stays, only the page area is replaced. */
export default function DashboardError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const es = (usePathname() ?? "").startsWith("/es");
  return (
    <div role="alert" className="card mx-auto max-w-lg space-y-4 p-8 text-center">
      <h1 className="font-display text-xl font-semibold">{es ? "Algo salió mal en esta pantalla" : "Something went wrong on this screen"}</h1>
      <p className="text-sm text-muted">{es ? "Tus modelos y créditos no se tocaron. Prueba de nuevo." : "Your models and credits were not touched. Try again."}</p>
      <button type="button" onClick={() => unstable_retry()} className="btn-pill btn-solid">
        {es ? "Reintentar" : "Try again"}
      </button>
    </div>
  );
}
