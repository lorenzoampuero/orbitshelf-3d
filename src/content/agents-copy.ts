import type { Locale } from "@/lib/types";

export type AgentClientId = "claude-code" | "cursor" | "vscode" | "desktop" | "cli";
export type AgentToolName = "list_models" | "quote_generation" | "create_generation" | "get_generation" | "list_assets" | "export_asset" | "get_credit_balance";

export type AgentsCopy = {
  title: string;
  subtitle: string;
  tabsLabel: string;
  tabs: { mcp: string; api: string; webhooks: string };
  mcp: {
    serverTitle: string;
    serverText: string;
    urlLabel: string;
    copy: string;
    copied: string;
    clientsLabel: string;
    clients: Record<AgentClientId, { name: string; where: string; status: string }>;
    soonTitle: string;
    soon: { name: string; why: string }[];
    tokenTitle: string;
    tokenText: string;
    createToken: string;
    creating: string;
    tokenShown: string;
    tokenFailed: string;
    placeholder: string;
    toolsTitle: string;
    toolsText: string;
    tools: Record<AgentToolName, string>;
    kinds: { read: string; quote: string; spends: string };
    spendsOff: string;
    promptsTitle: string;
    promptsText: string;
    copyPrompt: string;
    prompts: string[];
    limits: string;
  };
  api: { intro: string };
};

export const agentsCopy: Record<Locale, AgentsCopy> = {
  es: {
    title: "Agentes y API",
    subtitle: "Conecta Claude Code, Cursor o tu propio programa a tu espacio, con los mismos permisos, límites y saldo que la web.",
    tabsLabel: "Secciones",
    tabs: { mcp: "MCP", api: "API y tokens", webhooks: "Webhooks" },
    mcp: {
      serverTitle: "Servidor MCP",
      serverText: "Un agente puede ver tus modelos y tu saldo, y pedir cotizaciones. No puede comprar ni publicar en tiendas.",
      urlLabel: "Dirección del servidor",
      copy: "Copiar",
      copied: "Copiado",
      clientsLabel: "Cliente",
      clients: {
        "claude-code": { name: "Claude Code", where: "Un comando en tu terminal.", status: "Según su documentación; sin probar con la aplicación." },
        cursor: { name: "Cursor", where: "Archivo .cursor/mcp.json.", status: "Según su documentación; sin probar con la aplicación." },
        vscode: { name: "VS Code", where: "Archivo .vscode/mcp.json.", status: "Según su documentación; sin probar con la aplicación." },
        desktop: { name: "Claude Desktop", where: "Archivo de configuración, con el puente mcp-remote.", status: "Según su documentación; sin probar con la aplicación." },
        cli: { name: "curl", where: "Una llamada directa, para comprobar la conexión.", status: "Probado de punta a punta." },
      },
      soonTitle: "Próximamente",
      soon: [
        { name: "ChatGPT", why: "Pide inicio de sesión con OAuth, que todavía no tenemos." },
        { name: "claude.ai", why: "Pide inicio de sesión con OAuth, que todavía no tenemos." },
      ],
      tokenTitle: "Token de acceso",
      tokenText: "Se crea con permisos de lectura y de cotización. No gasta saldo. Lo ves una sola vez: cópialo ahora.",
      createToken: "Crear token y rellenar",
      creating: "Creando…",
      tokenShown: "Token creado. Ya está puesto en el comando de abajo; no volverá a mostrarse.",
      tokenFailed: "No se pudo crear el token.",
      placeholder: "os_TU_TOKEN",
      toolsTitle: "Qué puede hacer tu agente",
      toolsText: "Cada herramienta usa la API pública, con los permisos de tu token.",
      tools: {
        list_models: "Ver los motores disponibles y qué puede hacer cada uno.",
        quote_generation: "Calcular el costo de un modelo antes de crearlo.",
        create_generation: "Crear un modelo desde texto. Gasta saldo y pide tu confirmación antes.",
        get_generation: "Ver el estado y el historial de un modelo.",
        list_assets: "Listar los modelos de tu espacio.",
        export_asset: "Dar la dirección para descargar un modelo listo, en GLB.",
        get_credit_balance: "Ver tu saldo y los trabajos activos.",
      },
      kinds: { read: "Lectura", quote: "Cotiza", spends: "Gasta saldo" },
      spendsOff: "Apagado en este servidor",
      promptsTitle: "Pídele esto a tu agente",
      promptsText: "Ejemplos para empezar, cuando ya esté conectado.",
      copyPrompt: "Copiar prompt",
      prompts: [
        "Muéstrame mis modelos de OrbitShelf y dime cuáles están listos para descargar.",
        "¿Cuánto saldo me queda en OrbitShelf y cuántos trabajos tengo activos?",
        "Cotiza un modelo desde texto con el motor más barato disponible. No lo inicies.",
        "Dame la dirección de descarga del último modelo que esté listo.",
      ],
      limits: "Iniciar modelos por API está apagado en este servidor, así que ningún agente puede gastar tu saldo todavía. Cuando se encienda, la herramienta pedirá tu confirmación antes de cada inicio; un programa que use la API directamente con este token no la pide, así que no lo compartas.",
    },
    api: { intro: "Tokens para usar OrbitShelf desde tus programas, con tus mismos límites y saldo." },
  },
  en: {
    title: "Agents and API",
    subtitle: "Connect Claude Code, Cursor or your own program to your workspace, with the same permissions, limits and balance as the web.",
    tabsLabel: "Sections",
    tabs: { mcp: "MCP", api: "API and tokens", webhooks: "Webhooks" },
    mcp: {
      serverTitle: "MCP server",
      serverText: "An agent can see your models and your balance, and ask for quotes. It cannot buy anything or publish to a store.",
      urlLabel: "Server address",
      copy: "Copy",
      copied: "Copied",
      clientsLabel: "Client",
      clients: {
        "claude-code": { name: "Claude Code", where: "One command in your terminal.", status: "Per its documentation; not tried with the app." },
        cursor: { name: "Cursor", where: "The .cursor/mcp.json file.", status: "Per its documentation; not tried with the app." },
        vscode: { name: "VS Code", where: "The .vscode/mcp.json file.", status: "Per its documentation; not tried with the app." },
        desktop: { name: "Claude Desktop", where: "Its config file, with the mcp-remote bridge.", status: "Per its documentation; not tried with the app." },
        cli: { name: "curl", where: "A direct call, to check the connection.", status: "Tried end to end." },
      },
      soonTitle: "Coming soon",
      soon: [
        { name: "ChatGPT", why: "It asks for an OAuth sign-in, which we do not have yet." },
        { name: "claude.ai", why: "It asks for an OAuth sign-in, which we do not have yet." },
      ],
      tokenTitle: "Access token",
      tokenText: "It is created with read and quote permissions. It spends no balance. You see it once: copy it now.",
      createToken: "Create token and fill in",
      creating: "Creating…",
      tokenShown: "Token created. It is already in the command below; it will not be shown again.",
      tokenFailed: "The token could not be created.",
      placeholder: "os_YOUR_TOKEN",
      toolsTitle: "What your agent can do",
      toolsText: "Each tool uses the public API, with your token's permissions.",
      tools: {
        list_models: "See the engines available and what each can do.",
        quote_generation: "Work out what a model costs before creating it.",
        create_generation: "Create a model from text. It spends balance and asks for your confirmation.",
        get_generation: "See a model's state and history.",
        list_assets: "List your workspace's models.",
        export_asset: "Give the address to download a finished model, as GLB.",
        get_credit_balance: "See your balance and the jobs in progress.",
      },
      kinds: { read: "Read", quote: "Quote", spends: "Spends balance" },
      spendsOff: "Off on this server",
      promptsTitle: "Ask your agent this",
      promptsText: "Examples to start with, once it is connected.",
      copyPrompt: "Copy prompt",
      prompts: [
        "Show me my OrbitShelf models and tell me which ones are ready to download.",
        "How much balance do I have left in OrbitShelf, and how many jobs are active?",
        "Quote a text-to-3D model with the cheapest engine available. Do not start it.",
        "Give me the download address of the latest model that is ready.",
      ],
      limits: "Starting models through the API is off on this server, so no agent can spend your balance yet. When it is switched on, the tool will ask for your confirmation before each start; a program that calls the API directly with this token will not, so do not share it.",
    },
    api: { intro: "Tokens to use OrbitShelf from your programs, with your same limits and balance." },
  },
};
