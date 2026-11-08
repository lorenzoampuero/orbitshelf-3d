import type { Locale } from "@/lib/types";

/** Copy for the owner's admin panel. Only administrators (ADMIN_EMAILS) can open it. */
export type AdminCopy = {
  nav: { overview: string; workspaces: string; payments: string; label: string };
  overview: {
    title: string;
    subtitle: string;
    stats: { workspaces: string; users: string; models: string; ready: string; failed: string; processing: string; paymentsCredited: string; needsAttention: string; creditsGranted: string };
    attentionTitle: string;
    attentionEmpty: string;
    attentionAll: string;
    enginesTitle: string;
    enginesNote: string;
    enginesEmpty: string;
    cols: { engine: string; jobs: string; ready: string; failed: string; approved: string; rejected: string; cost: string };
    envNote: string;
  };
  workspaces: { title: string; subtitle: string; cols: { workspace: string; email: string; balance: string; models: string; created: string; activity: string }; empty: string; open: string; back: string };
  detail: { title: string; ledgerTitle: string; ledgerEmpty: string; cols: { date: string; change: string; reason: string }; reasons: Record<string, string>; balance: string; email: string; models: string; created: string; adjustTitle: string };
  payments: {
    title: string;
    subtitle: string;
    filterAll: string;
    filterPending: string;
    empty: string;
    cols: { date: string; kind: string; payment: string; workspace: string; credits: string; outcome: string; detail: string };
    kinds: Record<string, string>;
    outcomes: Record<string, string>;
    toolTitle: string;
    toolText: string;
  };
  form: { workspaceId: string; change: string; changeHint: string; reason: string; reasonHint: string; paymentId: string; paymentHint: string; submit: string; sending: string; done: string; error: string };
};

export const adminCopy: Record<Locale, AdminCopy> = {
  es: {
    nav: { overview: "Resumen", workspaces: "Espacios", payments: "Pagos", label: "Administración" },
    overview: {
      title: "Administración",
      subtitle: "Vista del dueño: espacios, pagos y motores. Solo la ven las cuentas de ADMIN_EMAILS.",
      stats: { workspaces: "Espacios", users: "Usuarios", models: "Modelos", ready: "Listos", failed: "Fallidos", processing: "En proceso", paymentsCredited: "Pagos acreditados", needsAttention: "Por revisar", creditsGranted: "Créditos vendidos" },
      attentionTitle: "Por revisar",
      attentionEmpty: "Nada pendiente. Todos los pagos registrados se acreditaron o se resolvieron.",
      attentionAll: "Ver todos los pagos",
      enginesTitle: "Motores",
      enginesNote: "Los costos son precios publicados por cada motor, no facturas. Cuando haya facturas, se corrigen los supuestos.",
      enginesEmpty: "Todavía no hay trabajos con motor de IA. Los motores siguen apagados.",
      cols: { engine: "Motor", jobs: "Trabajos", ready: "Listos", failed: "Fallidos", approved: "Aprobados", rejected: "Rechazados", cost: "Costo publicado" },
      envNote: "Para agregar o quitar administradores, edita ADMIN_EMAILS en el servidor y reinicia.",
    },
    workspaces: { title: "Espacios de trabajo", subtitle: "Cada espacio es un cliente. El saldo es la suma de su libro de créditos.", cols: { workspace: "Espacio", email: "Correo", balance: "Saldo", models: "Modelos", created: "Creado", activity: "Última actividad" }, empty: "Aún no hay espacios.", open: "Abrir", back: "Volver a espacios" },
    detail: { title: "Espacio", ledgerTitle: "Últimos movimientos", ledgerEmpty: "Sin movimientos.", cols: { date: "Fecha", change: "Cambio", reason: "Motivo" }, reasons: { local_cap_grant: "Crédito inicial", plan_grant: "Plan o recarga", job_debit: "Trabajo", job_capture: "Trabajo", job_refund: "Devolución", adjustment: "Ajuste", expiry: "Vencimiento" }, balance: "Saldo", email: "Correo", models: "Modelos", created: "Creado", adjustTitle: "Ajustar créditos de este espacio" },
    payments: {
      title: "Pagos y créditos",
      subtitle: "Lo que hizo el cobro con cada aviso de Whop y cada ajuste manual. Un pago que no se acreditó o un reembolso sin revertir queda marcado como pendiente.",
      filterAll: "Todos",
      filterPending: "Por revisar",
      empty: "No hay eventos todavía.",
      cols: { date: "Fecha", kind: "Tipo", payment: "Pago", workspace: "Espacio", credits: "Créditos", outcome: "Resultado", detail: "Detalle" },
      kinds: { payment: "Pago", refund: "Reembolso", dispute: "Disputa", admin_adjustment: "Ajuste manual" },
      outcomes: { credited: "Acreditado", duplicate: "Repetido", ignored: "Ignorado", adjusted: "Ajustado", resolved: "Resuelto", manual_review: "Revertir a mano", no_metadata: "Sin datos del espacio", unknown_item: "Artículo desconocido", underpaid: "Monto menor al precio", unknown_org: "Espacio inexistente", no_payment_id: "Sin id de pago", insufficient: "Saldo insuficiente" },
      toolTitle: "Ajustar créditos",
      toolText: "Para revertir un reembolso, acreditar un pago a mano o dar créditos de cortesía. Usa un número negativo para quitar. Queda registrado con tu correo y el motivo. El saldo nunca baja de cero.",
    },
    form: { workspaceId: "Id del espacio", change: "Cambio de créditos", changeHint: "Entero distinto de 0, por ejemplo 150 o -150", reason: "Motivo", reasonHint: "Obligatorio. Queda en el registro", paymentId: "Pago que resuelve (opcional)", paymentHint: "Id de pago de Whop; marca el evento como resuelto", submit: "Aplicar cambio", sending: "Aplicando…", done: "Listo. Saldo nuevo:", error: "No se pudo aplicar" },
  },
  en: {
    nav: { overview: "Overview", workspaces: "Workspaces", payments: "Payments", label: "Admin" },
    overview: {
      title: "Admin",
      subtitle: "Owner view: workspaces, payments and engines. Only accounts in ADMIN_EMAILS can see it.",
      stats: { workspaces: "Workspaces", users: "Users", models: "Models", ready: "Ready", failed: "Failed", processing: "Processing", paymentsCredited: "Payments credited", needsAttention: "To review", creditsGranted: "Credits sold" },
      attentionTitle: "To review",
      attentionEmpty: "Nothing pending. Every recorded payment was credited or resolved.",
      attentionAll: "See all payments",
      enginesTitle: "Engines",
      enginesNote: "Costs are the prices each engine publishes, not invoices. Once there are invoices, the assumptions get corrected.",
      enginesEmpty: "No jobs with an AI engine yet. The engines are still off.",
      cols: { engine: "Engine", jobs: "Jobs", ready: "Ready", failed: "Failed", approved: "Approved", rejected: "Rejected", cost: "Published cost" },
      envNote: "To add or remove admins, edit ADMIN_EMAILS on the server and restart.",
    },
    workspaces: { title: "Workspaces", subtitle: "Each workspace is a customer. The balance is the sum of its credit ledger.", cols: { workspace: "Workspace", email: "Email", balance: "Balance", models: "Models", created: "Created", activity: "Last activity" }, empty: "No workspaces yet.", open: "Open", back: "Back to workspaces" },
    detail: { title: "Workspace", ledgerTitle: "Latest movements", ledgerEmpty: "No movements.", cols: { date: "Date", change: "Change", reason: "Reason" }, reasons: { local_cap_grant: "Starting credit", plan_grant: "Plan or top-up", job_debit: "Job", job_capture: "Job", job_refund: "Refund", adjustment: "Adjustment", expiry: "Expiry" }, balance: "Balance", email: "Email", models: "Models", created: "Created", adjustTitle: "Adjust this workspace's credits" },
    payments: {
      title: "Payments and credits",
      subtitle: "What billing did with each Whop notice and each manual change. A payment that was not credited, or a refund not yet reversed, is marked pending.",
      filterAll: "All",
      filterPending: "To review",
      empty: "No events yet.",
      cols: { date: "Date", kind: "Type", payment: "Payment", workspace: "Workspace", credits: "Credits", outcome: "Result", detail: "Detail" },
      kinds: { payment: "Payment", refund: "Refund", dispute: "Dispute", admin_adjustment: "Manual change" },
      outcomes: { credited: "Credited", duplicate: "Repeated", ignored: "Ignored", adjusted: "Adjusted", resolved: "Resolved", manual_review: "Reverse by hand", no_metadata: "No workspace data", unknown_item: "Unknown item", underpaid: "Below the price", unknown_org: "No such workspace", no_payment_id: "No payment id", insufficient: "Not enough balance" },
      toolTitle: "Adjust credits",
      toolText: "To reverse a refund, credit a payment by hand or give courtesy credits. Use a negative number to remove. It is recorded with your email and the reason. The balance never goes below zero.",
    },
    form: { workspaceId: "Workspace id", change: "Credit change", changeHint: "A whole number other than 0, e.g. 150 or -150", reason: "Reason", reasonHint: "Required. Kept in the record", paymentId: "Payment this settles (optional)", paymentHint: "Whop payment id; marks the event as resolved", submit: "Apply change", sending: "Applying…", done: "Done. New balance:", error: "Could not apply" },
  },
};
