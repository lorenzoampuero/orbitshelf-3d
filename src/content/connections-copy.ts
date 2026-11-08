import type { Locale } from "@/lib/types";

export type ConnectionId = "shopify" | "woocommerce" | "blender" | "unity" | "octoprint" | "klipper" | "bambulab" | "prusa" | "embed" | "webhooks";
export type ConnectionState = "connected" | "available" | "testing" | "soon";
export type ConnectionGroup = "stores" | "tools3d" | "printers" | "web";

type Item = { name: string; text: string };

export type ConnectionsCopy = {
  title: string;
  subtitle: string;
  groups: Record<ConnectionGroup, string>;
  states: Record<ConnectionState, string>;
  action: { manage: string; guide: string };
  items: Record<ConnectionId, Item>;
  note: string;
};

export const connectionsCopy: Record<Locale, ConnectionsCopy> = {
  es: {
    title: "Conexiones",
    subtitle: "Lleva tus modelos a la tienda, al motor de juego, a tu web o a la impresora.",
    groups: { stores: "Tiendas", tools3d: "Programas 3D", printers: "Impresoras 3D", web: "Tu web" },
    states: { connected: "Conectado", available: "Disponible", testing: "En pruebas", soon: "Próximamente" },
    action: { manage: "Administrar", guide: "Ver guía" },
    items: {
      shopify: { name: "Shopify", text: "Agrega el modelo aprobado a la ficha de tu producto." },
      woocommerce: { name: "WooCommerce", text: "Plugin con un shortcode para mostrar el visor." },
      blender: { name: "Blender", text: "Importa tus modelos aprobados con su origen." },
      unity: { name: "Unity", text: "Trae tus modelos al proyecto como GLB." },
      octoprint: { name: "OctoPrint", text: "Envía un trabajo a tu impresora desde el navegador." },
      klipper: { name: "Klipper", text: "Envía un trabajo por Moonraker desde el navegador." },
      bambulab: { name: "Bambu Lab", text: "Abre el modelo en Bambu Studio para laminarlo." },
      prusa: { name: "Prusa", text: "Descarga el archivo listo para PrusaSlicer." },
      embed: { name: "Visor incrustable", text: "Pega un visor 3D en cualquier página, con enlace revocable." },
      webhooks: { name: "Webhooks", text: "Avisos firmados cuando un trabajo termina." },
    },
    note: "Las marcas y logos pertenecen a sus dueños. OrbitShelf no está afiliado a ellos.",
  },
  en: {
    title: "Connections",
    subtitle: "Take your models to your store, game engine, website or printer.",
    groups: { stores: "Stores", tools3d: "3D software", printers: "3D printers", web: "Your website" },
    states: { connected: "Connected", available: "Available", testing: "In testing", soon: "Coming soon" },
    action: { manage: "Manage", guide: "View guide" },
    items: {
      shopify: { name: "Shopify", text: "Add the approved model to your product page." },
      woocommerce: { name: "WooCommerce", text: "A plugin with a shortcode that shows the viewer." },
      blender: { name: "Blender", text: "Import your approved models with their origin." },
      unity: { name: "Unity", text: "Bring your models into the project as GLB." },
      octoprint: { name: "OctoPrint", text: "Send a job to your printer from the browser." },
      klipper: { name: "Klipper", text: "Send a job through Moonraker from the browser." },
      bambulab: { name: "Bambu Lab", text: "Open the model in Bambu Studio to slice it." },
      prusa: { name: "Prusa", text: "Download a file ready for PrusaSlicer." },
      embed: { name: "Embeddable viewer", text: "Paste a 3D viewer into any page, with a revocable link." },
      webhooks: { name: "Webhooks", text: "Signed notices when a job finishes." },
    },
    note: "Brands and logos belong to their owners. OrbitShelf is not affiliated with them.",
  },
};
