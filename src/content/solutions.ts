import type { Locale } from "@/lib/types";

/**
 * Copy for the "Who it is for" pages (/solutions and /solutions/[slug]).
 * Plain TypeScript, no server-only import. Every visible string exists in Spanish and English.
 *
 * Product truth lives in the brief, not here: only things that work today are described as working.
 * Shopify, WooCommerce, Unity and Unreal are never presented as available.
 */

export type SolutionSlug = "stores" | "games" | "design";
export const SOLUTION_SLUGS: readonly SolutionSlug[] = ["stores", "games", "design"];
export const isSolutionSlug = (v: string): v is SolutionSlug => (SOLUTION_SLUGS as readonly string[]).includes(v);

/** Keys of the icons the page components can draw (mapped to lucide-react in the components). */
export type IconKey =
  | "image"
  | "type"
  | "clipboard"
  | "store"
  | "triangle"
  | "layers"
  | "blocks"
  | "upload"
  | "grid"
  | "compare"
  | "download"
  | "gamepad"
  | "pen"
  | "shirt"
  | "armchair"
  | "footprints"
  | "lamp"
  | "building"
  | "box"
  | "package"
  | "code"
  | "coins"
  | "plug"
  | "bot"
  | "webhook"
  | "mountain";

export type VisualKey = "views" | "textToModel" | "review" | "versions" | "formats" | "metrics" | "projects" | "chain" | "viewer";

export type FlowItem = { icon: IconKey; label: string; result?: boolean };
export type Step = { icon: IconKey; title: string; text: string };
export type Feature = {
  tag: string;
  title: string;
  text: string;
  icon: IconKey;
  /** Columns out of 6 on desktop. A row always adds up to 6. */
  span: 2 | 3 | 4 | 6;
  visual?: VisualKey;
  points?: string[];
  /** Honest caveat shown under the text. */
  note?: string;
  /** Tiles for the "chain" visual. */
  chain?: { icon: IconKey; label: string }[];
};

export type IntegrationId = "embed" | "glb" | "shopify" | "woocommerce" | "blender" | "api" | "mcp" | "engines";
export type IntegrationStatus = "available" | "testing" | "soon" | "planned";

export type Solution = {
  slug: SolutionSlug;
  icon: IconKey;
  name: string;
  card: { line: string; text: string; points: string[]; cta: string };
  meta: { title: string; description: string };
  hero: { pill: string; title: string; text: string };
  flow: FlowItem[];
  workflow: { title: string; sub: string; steps: Step[] };
  features: { title: string; sub: string; items: Feature[] };
  viewerAlt: string;
  expect: { title: string; sub: string; hardTitle: string; hard: string[]; missingTitle: string; missing: string[] };
  integrations: { title: string; sub: string; items: { id: IntegrationId; span: 2 | 3 | 4 }[] };
  faq: { title: string; items: { q: string; a: string }[] };
  closing: { titleA: string; titleB: string; cta: string; note: string };
};

export type SolutionsCopy = {
  ui: {
    primaryCta: string;
    secondaryCta: string;
    seeIntegrations: string;
    demoCaption: string;
    generatedPhotos: string;
    generatedText: string;
    breadcrumbAll: string;
  };
  index: {
    meta: { title: string; description: string };
    pill: string;
    title: string;
    text: string;
    cardsTitle: string;
    sharedTitle: string;
    sharedSub: string;
    shared: {
      review: { tag: string; title: string; text: string };
      versions: { tag: string; title: string; text: string };
      cost: { tag: string; title: string; text: string };
      integrations: { tag: string; title: string; text: string; cta: string };
    };
    closing: { titleA: string; titleB: string; cta: string; note: string };
  };
  statusLabels: Record<IntegrationStatus, string>;
  integrations: Record<IntegrationId, { icon: IconKey; name: string; text: string; status: IntegrationStatus }>;
  /** The six first integrations, in the order of the plan. */
  firstSix: IntegrationId[];
  visual: {
    views: { front: string; left: string; back: string; right: string };
    text: string;
    model: string;
    original: string;
    optimized: string;
    formats: { name: string; note: string }[];
    metrics: string[];
    projects: { projects: string; tags: string; favorites: string; trash: string };
  };
  solutions: Record<SolutionSlug, Solution>;
};

const en: SolutionsCopy = {
  ui: {
    primaryCta: "Create a model",
    secondaryCta: "How it works",
    seeIntegrations: "See all integrations",
    demoCaption: "Demo sample, not AI-generated. Drag to rotate.",
    generatedPhotos: "AI-generated from {n} photos, unretouched.",
    generatedText: "AI-generated from a text description, unretouched.",
    breadcrumbAll: "All trades",
  },
  index: {
    meta: {
      title: "Who it is for: stores, games and 3D design | OrbitShelf 3D",
      description:
        "OrbitShelf 3D for online stores, game studios and 3D artists. Create from photos or text, review every model, optimize and export GLB, OBJ or STL.",
    },
    pill: "Who it is for",
    title: "Made for how you work with 3D",
    text: "Online stores, game builders and 3D artists use the same review and export tools, in different ways.",
    cardsTitle: "Choose your trade",
    sharedTitle: "Same checks, whatever your trade",
    sharedSub: "Under every workflow sits the same review, versioning and export.",
    shared: {
      review: {
        tag: "Review",
        title: "You approve every model",
        text: "A five-point checklist and an approval step. Nothing is approved without you.",
      },
      versions: {
        tag: "Versions",
        title: "The original is kept",
        text: "Optimizing makes a new version. Compare them and switch.",
      },
      cost: {
        tag: "Cost",
        title: "See the cost first",
        text: "Credits are shown before you generate, and returned if the provider refuses the job.",
      },
      integrations: {
        tag: "Integrations",
        title: "Six integrations, in this order",
        text: "Unity and Unreal come later, once there is demand for them.",
        cta: "See integrations",
      },
    },
    closing: {
      titleA: "Pick a trade.",
      titleB: "Try one product.",
      cta: "Create a model",
      note: "The cost in credits is shown before you generate.",
    },
  },
  statusLabels: { available: "Available", testing: "In testing", soon: "Coming soon", planned: "Planned" },
  integrations: {
    embed: {
      icon: "code",
      name: "Web embed",
      text: "A hosted viewer you add with an iframe link. It stays live only while the model is approved and not revoked.",
      status: "available",
    },
    glb: {
      icon: "download",
      name: "GLB, OBJ and STL export",
      text: "GLB keeps materials and textures. OBJ (metres) and STL (millimetres) carry geometry only.",
      status: "available",
    },
    shopify: {
      icon: "store",
      name: "Shopify",
      text: "One-click publishing is built, but it has only been tried against a test store. Not live yet.",
      status: "soon",
    },
    woocommerce: {
      icon: "store",
      name: "WooCommerce",
      text: "A viewer plugin for your product page. Never installed on a real store yet.",
      status: "testing",
    },
    blender: {
      icon: "blocks",
      name: "Blender add-on",
      text: "Imports your models into Blender. It only imports, and it has not been run inside Blender yet.",
      status: "testing",
    },
    api: {
      icon: "webhook",
      name: "Public API and webhooks",
      text: "Scoped tokens and signed webhooks for model.ready and model.failed. Starting generations through the API is switched off for now.",
      status: "testing",
    },
    mcp: {
      icon: "bot",
      name: "MCP server",
      text: "Tested only with our own test client, not yet with other MCP clients.",
      status: "testing",
    },
    engines: {
      icon: "gamepad",
      name: "Unity and Unreal",
      text: "Planned once demand is validated. Today you take the GLB into your engine yourself.",
      status: "planned",
    },
  },
  firstSix: ["embed", "shopify", "blender", "api", "mcp", "woocommerce"],
  visual: {
    views: { front: "Front", left: "Left", back: "Back", right: "Right" },
    text: "Text",
    model: "3D",
    original: "Original, kept",
    optimized: "Optimized",
    formats: [
      { name: "GLB", note: "Materials and textures" },
      { name: "OBJ", note: "Geometry, in metres" },
      { name: "STL", note: "Geometry, in millimetres" },
    ],
    metrics: ["Triangles", "Vertices", "Meshes", "Materials", "Textures", "UV", "Normals"],
    projects: { projects: "Projects", tags: "Tags", favorites: "Favorites", trash: "Trash" },
  },
  solutions: {
    stores: {
      slug: "stores",
      icon: "store",
      name: "Stores",
      card: {
        line: "Product pages with a model people can turn",
        text: "Clothing, furniture, footwear and decor, reviewed by you before anything goes live.",
        points: ["1 to 4 photos of the same product", "Hosted viewer you can embed", "GLB export for your own tools"],
        cta: "See stores",
      },
      meta: {
        title: "3D models for online stores | OrbitShelf 3D",
        description:
          "Show your product in 3D without hiring a modeler. Upload 1 to 4 photos of clothing, furniture, footwear or decor, review the model and embed it on your product page.",
      },
      hero: {
        pill: "Stores",
        title: "Show your product in 3D without hiring a modeler",
        text: "Upload 1 to 4 photos of the same product, review the result and embed it on your product page.",
      },
      flow: [
        { icon: "image", label: "Photos or text" },
        { icon: "clipboard", label: "You review" },
        { icon: "box", label: "GLB", result: true },
        { icon: "code", label: "Your page" },
      ],
      workflow: {
        title: "Four steps from photo to product page",
        sub: "No modeling software and no back and forth with an outside modeler.",
        steps: [
          {
            icon: "image",
            title: "Upload your photos",
            text: "From 1 to 4 photos of the same product: front, left, back and right. Extra views are optional. No photos? Describe it in at least 10 characters.",
          },
          {
            icon: "coins",
            title: "See the cost, then generate",
            text: "The cost in credits shows before you start. If the provider refuses the job, the credits come back.",
          },
          {
            icon: "clipboard",
            title: "Review and approve",
            text: "Turn the model, run the five-point checklist and approve it. Nothing is approved without you.",
          },
          {
            icon: "code",
            title: "Embed or export",
            text: "Add the hosted viewer to your page with an iframe link, or download the GLB.",
          },
        ],
      },
      features: {
        title: "Built for a catalog",
        sub: "Apparel comes first, because it is the hardest and the one that matters most to us.",
        items: [
          {
            tag: "Apparel",
            title: "Hoodies, jackets and tees, with honest limits",
            text: "Upload front, left, back and right photos of the same piece. Soft cloth, folds and prints are hard for any generator, so you review the result before it goes anywhere.",
            icon: "shirt",
            span: 4,
            visual: "views",
            points: ["Cost in credits shown before you generate", "Generate again if the result is not right"],
            note: "Expect to look closely and to retry. Cloth is the hardest case.",
          },
          {
            tag: "Furniture",
            title: "Chairs, tables and shelves",
            text: "Clear shapes and matte finishes give the generator more to work with. Glass and very thin legs are the hard cases.",
            icon: "armchair",
            span: 2,
          },
          {
            tag: "Footwear",
            title: "Sneakers, boots and sandals",
            text: "Shoot front, left, back and right on a plain surface. Check soles and thin straps in the mesh view, since thin parts are the hard cases.",
            icon: "footprints",
            span: 3,
          },
          {
            tag: "Decor",
            title: "Vases, lamps and objects for the home",
            text: "Transparent shades and glossy glazes are hard cases, so review before you approve.",
            icon: "lamp",
            span: 3,
          },
          {
            tag: "Your product page",
            title: "A model your customers can turn",
            text: "Add the hosted viewer with an iframe link. It lives only while the model is approved and not revoked.",
            icon: "code",
            span: 4,
            visual: "viewer",
            points: ["GLB export if you use your own viewer"],
          },
          {
            tag: "Review",
            title: "Nothing goes live without you",
            text: "A five-point checklist and an approval step. Switching versions sends the review back to pending.",
            icon: "clipboard",
            span: 2,
            visual: "review",
          },
          {
            tag: "Agencies",
            title: "Delivering 3D to several clients",
            text: "Keep each client apart today with projects and tags. Favorites and a trash help you tidy the library.",
            icon: "building",
            span: 6,
            visual: "projects",
            note: "Client roles and shared access are planned. They are not available yet.",
          },
        ],
      },
      viewerAlt: "Interactive 3D sample of a vase. Drag to rotate.",
      expect: {
        title: "What to expect",
        sub: "A model is a starting point you check, not a finished promise.",
        hardTitle: "Hard cases",
        hard: [
          "Soft cloth, folds and prints on hoodies, jackets and tees",
          "Reflective and transparent surfaces, such as glass and polished metal",
          "Very thin parts, such as straps, laces and chair legs",
          "Results depend on your photos: plain background, even light, every view",
        ],
        missingTitle: "Not available yet",
        missing: [
          "Shopify one-click publishing (coming soon)",
          "WooCommerce (coming soon)",
          "Client roles for agencies (planned)",
          "AI engine: planned for the pilot (today demo samples and GLB import work)",
          "Payments: none is active yet",
        ],
      },
      integrations: {
        title: "Where it plugs in",
        sub: "The embed works today. The store connectors are on the way, and we say so.",
        items: [
          { id: "embed", span: 4 },
          { id: "shopify", span: 2 },
          { id: "woocommerce", span: 3 },
          { id: "api", span: 3 },
        ],
      },
      faq: {
        title: "Questions from stores",
        items: [
          {
            q: "Does it work for clothing?",
            a: "You can try it, and you decide if it is good enough. Soft cloth, folds and prints are hard for any generator, so expect to review closely and to retry. Approve a model only when it matches your product.",
          },
          {
            q: "How many photos do I need?",
            a: "From 1 to 4 photos of the same product: front, left, back and right. Extra views are optional. You can also describe the product in text, with at least 10 characters. The cost in credits is shown before you generate.",
          },
          {
            q: "Can I publish to Shopify with one click?",
            a: "Not yet. The flow is built, but it has only been tried against a test store, so it is marked coming soon. Today you can embed the hosted viewer with an iframe link or export a GLB.",
          },
          {
            q: "What happens to the location data in my photos?",
            a: "Location data (EXIF) is stripped from every photo. SVG uploads are rejected.",
          },
          {
            q: "I work with several clients. Is that covered?",
            a: "Projects and tags keep each client's models apart today. Client roles and shared access are planned, not available.",
          },
        ],
      },
      closing: {
        titleA: "Start with one product.",
        titleB: "Review it before it ships.",
        cta: "Create a model",
        note: "The cost in credits is shown before you generate.",
      },
    },

    games: {
      slug: "games",
      icon: "gamepad",
      name: "Games",
      card: {
        line: "Props with the geometry in plain sight",
        text: "Triangle and UV numbers, a lighter version on demand, and a GLB for Blender and your engine.",
        points: ["Diagnostics for every model", "Optimize without losing the original", "No rigging or animation"],
        cta: "See games",
      },
      meta: {
        title: "3D assets for game studios and indie developers | OrbitShelf 3D",
        description:
          "From concept to asset with the geometry in plain sight. Read triangles, vertices and UV, optimize to a lighter version and export a GLB for Blender and your engine.",
      },
      hero: {
        pill: "Games",
        title: "From concept to asset, with the geometry in plain sight",
        text: "Describe a prop or start from photos, read the triangle and UV numbers, then take a GLB into Blender and your engine.",
      },
      flow: [
        { icon: "type", label: "Description" },
        { icon: "triangle", label: "Diagnostics" },
        { icon: "layers", label: "Optimize" },
        { icon: "box", label: "GLB", result: true },
        { icon: "gamepad", label: "Blender, engine" },
      ],
      workflow: {
        title: "Four steps from concept to GLB",
        sub: "Built for static props and environment pieces.",
        steps: [
          {
            icon: "type",
            title: "Describe or photograph it",
            text: "Write at least 10 characters about the asset, or upload 1 to 4 photos of a reference object.",
          },
          {
            icon: "triangle",
            title: "Read the geometry",
            text: "Diagnostics list triangles, vertices, meshes, materials, textures, UV and normals.",
          },
          {
            icon: "layers",
            title: "Optimize a lighter version",
            text: "Optimizing creates a new version and keeps the original. Compare them and switch.",
          },
          {
            icon: "download",
            title: "Export the GLB",
            text: "Take it into Blender and your engine. Materials and textures travel inside the GLB.",
          },
        ],
      },
      features: {
        title: "What matters when you build",
        sub: "The numbers and the mesh are on screen, not hidden behind a render.",
        items: [
          {
            tag: "Concept to asset",
            title: "Describe a prop or start from photos",
            text: "The cost in credits shows before you generate, and credits come back if the provider refuses the job. Location data is stripped from every photo.",
            icon: "type",
            span: 4,
            visual: "textToModel",
          },
          {
            tag: "Props and scenery",
            title: "Props and environment pieces",
            text: "Crates, lamps, furniture, rocks and set dressing: static pieces you place in a scene.",
            icon: "package",
            span: 2,
          },
          {
            tag: "Mesh view",
            title: "See the wireframe before you import",
            text: "Switch between surface and wireframe on any model, so topology problems show up before they reach your engine.",
            icon: "grid",
            span: 4,
            visual: "viewer",
          },
          {
            tag: "Diagnostics",
            title: "Triangles, UV and normals, as numbers",
            text: "Every model lists what is inside it, so you can judge it yourself.",
            icon: "triangle",
            span: 2,
            visual: "metrics",
          },
          {
            tag: "Optimize",
            title: "Make a lighter version",
            text: "A new version is created and the original is kept. Compare them and pick the one you want.",
            icon: "layers",
            span: 3,
            visual: "versions",
          },
          {
            tag: "Export",
            title: "GLB for Blender and your engine",
            text: "GLB carries materials and textures. OBJ and STL carry geometry only.",
            icon: "download",
            span: 3,
            visual: "chain",
            chain: [
              { icon: "box", label: "GLB" },
              { icon: "blocks", label: "Blender" },
              { icon: "gamepad", label: "Your engine" },
            ],
          },
        ],
      },
      viewerAlt: "Interactive 3D sample of a chair. Drag to rotate and use the button to see the mesh.",
      expect: {
        title: "What to expect",
        sub: "Generated geometry is a starting point. Check it the way you would check any asset.",
        hardTitle: "Hard cases",
        hard: [
          "Check triangles and UV before you import, and clean up in Blender if you need to",
          "Reflective, transparent or very thin props are the hard cases",
          "Texture detail depends on your photos or your description",
        ],
        missingTitle: "Not available",
        missing: [
          "Rigging",
          "Animation",
          "Characters and avatars",
          "Retexturing and partial editing",
          "Unity and Unreal plugins (planned)",
        ],
      },
      integrations: {
        title: "Where it plugs in",
        sub: "The GLB is the bridge today. The rest is in testing or planned.",
        items: [
          { id: "glb", span: 4 },
          { id: "blender", span: 2 },
          { id: "engines", span: 3 },
          { id: "api", span: 3 },
        ],
      },
      faq: {
        title: "Questions from game builders",
        items: [
          {
            q: "Is the geometry ready for a game?",
            a: "Treat it as a starting point. Diagnostics show triangles, vertices, meshes, materials, textures, UV and normals so you can judge it, and you can optimize into a lighter version. Plan to check it in Blender or your engine.",
          },
          {
            q: "Does it rig or animate?",
            a: "No. There is no rigging, animation or character pipeline. It fits static props and environment pieces.",
          },
          {
            q: "Which formats can I export?",
            a: "GLB with materials and textures, and OBJ and STL with geometry only. OBJ is in metres and STL in millimetres.",
          },
          {
            q: "Is there a Unity or Unreal plugin?",
            a: "Not yet. They are planned once demand is validated. Today you export a GLB and import it yourself.",
          },
          {
            q: "Do I lose the original when I optimize?",
            a: "No. Optimizing creates a new version and keeps the original. You can compare them and switch.",
          },
        ],
      },
      closing: {
        titleA: "Start with one prop.",
        titleB: "Read its geometry.",
        cta: "Create a model",
        note: "The cost in credits is shown before you generate.",
      },
    },

    design: {
      slug: "design",
      icon: "pen",
      name: "3D design",
      card: {
        line: "Bring a GLB, leave with the format you need",
        text: "Mesh view, version compare and GLB, OBJ or STL export, to continue in your own software.",
        points: ["Import an existing GLB", "Compare versions side by side", "Add-on to import into Blender"],
        cta: "See 3D design",
      },
      meta: {
        title: "3D design: import, optimize and export | OrbitShelf 3D",
        description:
          "Start from a description or a GLB, check the mesh, compare versions and export GLB, OBJ or STL to carry on in Blender or your own software.",
      },
      hero: {
        pill: "3D design",
        title: "Start from a description or a GLB, then carry on in your own software",
        text: "Import a GLB to analyse it, check the mesh, compare versions and export GLB, OBJ or STL.",
      },
      flow: [
        { icon: "upload", label: "Your GLB" },
        { icon: "grid", label: "Mesh view" },
        { icon: "compare", label: "Versions" },
        { icon: "download", label: "Export", result: true },
        { icon: "pen", label: "Your software" },
      ],
      workflow: {
        title: "Four steps from file to export",
        sub: "Use it as a bench for the model, then go back to your own tools.",
        steps: [
          {
            icon: "upload",
            title: "Import or create",
            text: "Import a GLB you already have, or create one from a description or 1 to 4 photos.",
          },
          {
            icon: "grid",
            title: "Inspect the mesh",
            text: "Switch between surface and wireframe, and read the diagnostics: triangles, vertices, meshes, materials, textures, UV and normals.",
          },
          {
            icon: "compare",
            title: "Optimize and compare",
            text: "Optimizing makes a new version and keeps the original. Switch between them whenever you like.",
          },
          {
            icon: "download",
            title: "Export and continue",
            text: "Download GLB, OBJ or STL and carry on in Blender or the software you already use.",
          },
        ],
      },
      features: {
        title: "The tools you reach for",
        sub: "Small, direct and honest about what each format carries.",
        items: [
          {
            tag: "Mesh view",
            title: "Surface or wireframe, one click",
            text: "Check topology on your own GLB or on a generated one. The diagnostics list triangles, vertices, meshes, materials, textures, UV and normals.",
            icon: "grid",
            span: 4,
            visual: "viewer",
          },
          {
            tag: "Import",
            title: "Bring a GLB you already have",
            text: "Import it to analyse and optimize it. Your file stays as the original.",
            icon: "upload",
            span: 2,
          },
          {
            tag: "Versions",
            title: "Compare, then choose",
            text: "Every optimize adds a version. Switching sends the review back to pending.",
            icon: "compare",
            span: 2,
            visual: "versions",
          },
          {
            tag: "Export",
            title: "GLB, OBJ and STL",
            text: "GLB keeps materials and textures. OBJ and STL carry geometry only, ready for the next tool.",
            icon: "download",
            span: 4,
            visual: "formats",
          },
          {
            tag: "Blender",
            title: "Import into Blender with the add-on",
            text: "The add-on only imports models into Blender. It has not been run inside Blender yet, so treat it as in testing.",
            icon: "blocks",
            span: 3,
            visual: "chain",
            chain: [
              { icon: "box", label: "Your model" },
              { icon: "plug", label: "Add-on" },
              { icon: "blocks", label: "Blender" },
            ],
          },
          {
            tag: "Start",
            title: "No file yet? Create one",
            text: "Describe the piece in words (10 characters or more) or upload 1 to 4 photos of a physical object. Then carry on like any other model.",
            icon: "type",
            span: 3,
            visual: "textToModel",
          },
        ],
      },
      viewerAlt: "Interactive 3D sample of a lamp. Drag to rotate and use the button to see the mesh.",
      expect: {
        title: "What to expect",
        sub: "OrbitShelf analyses, optimizes and exports. It does not replace your modeling software.",
        hardTitle: "Hard cases",
        hard: [
          "Check an optimized version against the original before you switch to it",
          "OBJ and STL carry geometry only: no materials or textures",
          "Reflective, transparent or very thin shapes are the hard cases",
        ],
        missingTitle: "Not available yet",
        missing: [
          "Partial editing and retexturing",
          "Exporting from Blender: the add-on only imports",
          "A tested Blender add-on: it has not been run inside Blender yet",
          "AI engine: planned for the pilot (today demo samples and GLB import work)",
        ],
      },
      integrations: {
        title: "Where it plugs in",
        sub: "Files first. Add-ons and agents are in testing.",
        items: [
          { id: "blender", span: 4 },
          { id: "glb", span: 2 },
          { id: "mcp", span: 3 },
          { id: "api", span: 3 },
        ],
      },
      faq: {
        title: "Questions from 3D artists",
        items: [
          {
            q: "Can I bring my own model?",
            a: "Yes. Import an existing GLB to analyse it and optimize it. Optimizing creates a new version and the original is kept.",
          },
          {
            q: "What happens when I switch versions?",
            a: "The review goes back to pending, so nothing is approved without you.",
          },
          {
            q: "Which units do OBJ and STL use?",
            a: "OBJ is in metres and STL is in millimetres. Both carry geometry only.",
          },
          {
            q: "Does the Blender add-on send models out of Blender?",
            a: "No. It only imports models into Blender, and it has not been run inside Blender yet, so it is marked in testing.",
          },
          {
            q: "Can I edit part of a model or retexture it?",
            a: "Not yet. Partial editing and retexturing are not available. Make those changes in your own software.",
          },
        ],
      },
      closing: {
        titleA: "Start with one file.",
        titleB: "Keep your own tools.",
        cta: "Create a model",
        note: "The cost in credits is shown before you generate.",
      },
    },
  },
};

const es: SolutionsCopy = {
  ui: {
    primaryCta: "Crear un modelo",
    secondaryCta: "Cómo funciona",
    seeIntegrations: "Ver todas las integraciones",
    demoCaption: "Muestra de demostración, no generada con IA. Arrastra para girar.",
    generatedPhotos: "Generado con IA a partir de {n} fotos, sin retoques.",
    generatedText: "Generado con IA a partir de una descripción, sin retoques.",
    breadcrumbAll: "Todos los oficios",
  },
  index: {
    meta: {
      title: "Para quién es: tiendas, juegos y diseño 3D | OrbitShelf 3D",
      description:
        "OrbitShelf 3D para tiendas online, estudios de juegos y artistas 3D. Crea desde fotos o texto, revisa cada modelo, optimiza y exporta GLB, OBJ o STL.",
    },
    pill: "Para quién es",
    title: "Hecho para cómo trabajas con 3D",
    text: "Tiendas online, creadores de juegos y artistas 3D usan las mismas herramientas de revisión y exportación, cada uno a su manera.",
    cardsTitle: "Elige tu oficio",
    sharedTitle: "Las mismas revisiones, trabajes en lo que trabajes",
    sharedSub: "Debajo de cada flujo están la misma revisión, las mismas versiones y la misma exportación.",
    shared: {
      review: {
        tag: "Revisión",
        title: "Tú apruebas cada modelo",
        text: "Una lista de cinco puntos y un paso de aprobación. Nada se aprueba sin ti.",
      },
      versions: {
        tag: "Versiones",
        title: "El original se conserva",
        text: "Optimizar crea una versión nueva. Compáralas y cambia entre ellas.",
      },
      cost: {
        tag: "Costo",
        title: "Ves el costo primero",
        text: "Los créditos se muestran antes de generar y se devuelven si el proveedor rechaza el trabajo.",
      },
      integrations: {
        tag: "Integraciones",
        title: "Seis integraciones, en este orden",
        text: "Unity y Unreal vienen después, cuando haya demanda.",
        cta: "Ver integraciones",
      },
    },
    closing: {
      titleA: "Elige un oficio.",
      titleB: "Prueba un producto.",
      cta: "Crear un modelo",
      note: "El costo en créditos se muestra antes de generar.",
    },
  },
  statusLabels: { available: "Disponible", testing: "En pruebas", soon: "Próximamente", planned: "Planeado" },
  integrations: {
    embed: {
      icon: "code",
      name: "Embed web",
      text: "Un visor alojado que agregas con un enlace iframe. Solo está activo mientras el modelo esté aprobado y sin revocar.",
      status: "available",
    },
    glb: {
      icon: "download",
      name: "Exportación GLB, OBJ y STL",
      text: "El GLB conserva materiales y texturas. OBJ (metros) y STL (milímetros) llevan solo la geometría.",
      status: "available",
    },
    shopify: {
      icon: "store",
      name: "Shopify",
      text: "La publicación en un clic está construida, pero solo se probó contra una tienda de prueba. Aún no está activa.",
      status: "soon",
    },
    woocommerce: {
      icon: "store",
      name: "WooCommerce",
      text: "Un plugin del visor para tu ficha de producto. Todavía sin instalar en una tienda real.",
      status: "testing",
    },
    blender: {
      icon: "blocks",
      name: "Add-on de Blender",
      text: "Importa tus modelos a Blender. Solo importa, y todavía no se ha ejecutado dentro de Blender.",
      status: "testing",
    },
    api: {
      icon: "webhook",
      name: "API pública y webhooks",
      text: "Tokens con alcance y webhooks firmados para model.ready y model.failed. Iniciar generaciones por la API está apagado por ahora.",
      status: "testing",
    },
    mcp: {
      icon: "bot",
      name: "Servidor MCP",
      text: "Probado solo con nuestro propio cliente de prueba, todavía no con otros clientes MCP.",
      status: "testing",
    },
    engines: {
      icon: "gamepad",
      name: "Unity y Unreal",
      text: "Planeado cuando se valide la demanda. Hoy llevas tú mismo el GLB a tu motor.",
      status: "planned",
    },
  },
  firstSix: ["embed", "shopify", "blender", "api", "mcp", "woocommerce"],
  visual: {
    views: { front: "Frente", left: "Izquierda", back: "Atrás", right: "Derecha" },
    text: "Texto",
    model: "3D",
    original: "Original, conservado",
    optimized: "Optimizada",
    formats: [
      { name: "GLB", note: "Materiales y texturas" },
      { name: "OBJ", note: "Geometría, en metros" },
      { name: "STL", note: "Geometría, en milímetros" },
    ],
    metrics: ["Triángulos", "Vértices", "Mallas", "Materiales", "Texturas", "UV", "Normales"],
    projects: { projects: "Proyectos", tags: "Etiquetas", favorites: "Favoritos", trash: "Papelera" },
  },
  solutions: {
    stores: {
      slug: "stores",
      icon: "store",
      name: "Tiendas",
      card: {
        line: "Páginas de producto con un modelo que se puede girar",
        text: "Ropa, muebles, calzado y decoración, revisados por ti antes de que nada salga en vivo.",
        points: ["De 1 a 4 fotos del mismo producto", "Visor alojado que puedes insertar", "Exportación GLB para tus propias herramientas"],
        cta: "Ver tiendas",
      },
      meta: {
        title: "Modelos 3D para tiendas online | OrbitShelf 3D",
        description:
          "Muestra tu producto en 3D sin contratar a un modelador. Sube de 1 a 4 fotos de ropa, muebles, calzado o decoración, revisa el modelo e insértalo en tu página de producto.",
      },
      hero: {
        pill: "Tiendas",
        title: "Muestra tu producto en 3D sin contratar a un modelador",
        text: "Sube de 1 a 4 fotos del mismo producto, revisa el resultado e insértalo en tu página de producto.",
      },
      flow: [
        { icon: "image", label: "Fotos o texto" },
        { icon: "clipboard", label: "Tú revisas" },
        { icon: "box", label: "GLB", result: true },
        { icon: "code", label: "Tu página" },
      ],
      workflow: {
        title: "Cuatro pasos de la foto a tu página de producto",
        sub: "Sin software de modelado y sin idas y vueltas con un modelador externo.",
        steps: [
          {
            icon: "image",
            title: "Sube tus fotos",
            text: "De 1 a 4 fotos del mismo producto: frente, izquierda, atrás y derecha. Las vistas extra son opcionales. ¿Sin fotos? Descríbelo con al menos 10 caracteres.",
          },
          {
            icon: "coins",
            title: "Mira el costo y genera",
            text: "El costo en créditos aparece antes de empezar. Si el proveedor rechaza el trabajo, los créditos se devuelven.",
          },
          {
            icon: "clipboard",
            title: "Revisa y aprueba",
            text: "Gira el modelo, recorre la lista de cinco puntos y apruébalo. Nada se aprueba sin ti.",
          },
          {
            icon: "code",
            title: "Inserta o exporta",
            text: "Agrega el visor alojado a tu página con un enlace iframe, o descarga el GLB.",
          },
        ],
      },
      features: {
        title: "Pensado para un catálogo",
        sub: "La ropa va primero, porque es lo más difícil y lo que más nos importa.",
        items: [
          {
            tag: "Ropa",
            title: "Polerones, chaquetas y poleras, con límites honestos",
            text: "Sube fotos de frente, izquierda, atrás y derecha de la misma prenda. La tela blanda, los pliegues y las estampas son difíciles para cualquier generador, así que revisas el resultado antes de usarlo.",
            icon: "shirt",
            span: 4,
            visual: "views",
            points: ["Costo en créditos visible antes de generar", "Vuelve a generar si el resultado no es el que esperabas"],
            note: "Espera mirar con lupa y reintentar. La tela es el caso más difícil.",
          },
          {
            tag: "Muebles",
            title: "Sillas, mesas y estantes",
            text: "Las formas claras y los acabados mate le dan más a qué agarrarse al generador. El vidrio y las patas muy finas son los casos difíciles.",
            icon: "armchair",
            span: 2,
          },
          {
            tag: "Calzado",
            title: "Zapatillas, botas y sandalias",
            text: "Fotografía frente, izquierda, atrás y derecha sobre una superficie lisa. Revisa suelas y correas finas en la vista de malla, porque las partes finas son casos difíciles.",
            icon: "footprints",
            span: 3,
          },
          {
            tag: "Decoración",
            title: "Jarrones, lámparas y objetos para el hogar",
            text: "Las pantallas transparentes y los esmaltes brillantes son casos difíciles, así que revisa antes de aprobar.",
            icon: "lamp",
            span: 3,
          },
          {
            tag: "Tu página de producto",
            title: "Un modelo que tus clientes pueden girar",
            text: "Agrega el visor alojado con un enlace iframe. Vive solo mientras el modelo esté aprobado y sin revocar.",
            icon: "code",
            span: 4,
            visual: "viewer",
            points: ["Exportación GLB si usas tu propio visor"],
          },
          {
            tag: "Revisión",
            title: "Nada sale en vivo sin ti",
            text: "Una lista de cinco puntos y un paso de aprobación. Al cambiar de versión, la revisión vuelve a pendiente.",
            icon: "clipboard",
            span: 2,
            visual: "review",
          },
          {
            tag: "Agencias",
            title: "Entregar 3D a varios clientes",
            text: "Hoy separas a cada cliente con proyectos y etiquetas. Los favoritos y la papelera te ayudan a ordenar la biblioteca.",
            icon: "building",
            span: 6,
            visual: "projects",
            note: "Los roles por cliente y el acceso compartido están planeados. Todavía no están disponibles.",
          },
        ],
      },
      viewerAlt: "Muestra 3D interactiva de un jarrón. Arrastra para girar.",
      expect: {
        title: "Qué esperar",
        sub: "Un modelo es un punto de partida que tú revisas, no una promesa cerrada.",
        hardTitle: "Casos difíciles",
        hard: [
          "Tela blanda, pliegues y estampas en polerones, chaquetas y poleras",
          "Superficies reflectantes y transparentes, como el vidrio y el metal pulido",
          "Partes muy finas, como correas, cordones y patas de silla",
          "El resultado depende de tus fotos: fondo liso, luz pareja, todas las vistas",
        ],
        missingTitle: "Aún no disponible",
        missing: [
          "Publicación en Shopify en un clic (próximamente)",
          "WooCommerce (próximamente)",
          "Roles por cliente para agencias (planeado)",
          "Motor de IA: previsto para el piloto (hoy funcionan las muestras de demostración y la importación de GLB)",
          "Pagos: ninguno está activo todavía",
        ],
      },
      integrations: {
        title: "Dónde se conecta",
        sub: "El embed funciona hoy. Los conectores de tienda están en camino, y lo decimos tal cual.",
        items: [
          { id: "embed", span: 4 },
          { id: "shopify", span: 2 },
          { id: "woocommerce", span: 3 },
          { id: "api", span: 3 },
        ],
      },
      faq: {
        title: "Preguntas de tiendas",
        items: [
          {
            q: "¿Funciona con ropa?",
            a: "Puedes probarlo y tú decides si es suficiente. La tela blanda, los pliegues y las estampas son difíciles para cualquier generador, así que espera revisar con atención y reintentar. Aprueba un modelo solo cuando se parezca a tu producto.",
          },
          {
            q: "¿Cuántas fotos necesito?",
            a: "De 1 a 4 fotos del mismo producto: frente, izquierda, atrás y derecha. Las vistas extra son opcionales. También puedes describir el producto con texto, con al menos 10 caracteres. El costo en créditos se muestra antes de generar.",
          },
          {
            q: "¿Puedo publicar en Shopify con un clic?",
            a: "Todavía no. El flujo está construido, pero solo se probó contra una tienda de prueba, por eso figura como próximamente. Hoy puedes insertar el visor alojado con un enlace iframe o exportar un GLB.",
          },
          {
            q: "¿Qué pasa con los datos de ubicación de mis fotos?",
            a: "Los datos de ubicación (EXIF) se eliminan de cada foto. Los archivos SVG se rechazan.",
          },
          {
            q: "Trabajo con varios clientes. ¿Eso está cubierto?",
            a: "Hoy los proyectos y las etiquetas mantienen separados los modelos de cada cliente. Los roles por cliente y el acceso compartido están planeados, no disponibles.",
          },
        ],
      },
      closing: {
        titleA: "Empieza con un producto.",
        titleB: "Revísalo antes de publicarlo.",
        cta: "Crear un modelo",
        note: "El costo en créditos se muestra antes de generar.",
      },
    },

    games: {
      slug: "games",
      icon: "gamepad",
      name: "Juegos",
      card: {
        line: "Props con la geometría a la vista",
        text: "Números de triángulos y UV, una versión más liviana cuando la necesites y un GLB para Blender y tu motor.",
        points: ["Diagnóstico de cada modelo", "Optimiza sin perder el original", "Sin rigging ni animación"],
        cta: "Ver juegos",
      },
      meta: {
        title: "Assets 3D para estudios de juegos y desarrolladores indie | OrbitShelf 3D",
        description:
          "Del concepto al asset con la geometría a la vista. Lee triángulos, vértices y UV, optimiza a una versión más liviana y exporta un GLB para Blender y tu motor.",
      },
      hero: {
        pill: "Juegos",
        title: "Del concepto al asset, con la geometría a la vista",
        text: "Describe un prop o parte de fotos, lee los números de triángulos y UV, y lleva un GLB a Blender y a tu motor.",
      },
      flow: [
        { icon: "type", label: "Descripción" },
        { icon: "triangle", label: "Diagnóstico" },
        { icon: "layers", label: "Optimizar" },
        { icon: "box", label: "GLB", result: true },
        { icon: "gamepad", label: "Blender, motor" },
      ],
      workflow: {
        title: "Cuatro pasos del concepto al GLB",
        sub: "Pensado para props estáticos y piezas de escenario.",
        steps: [
          {
            icon: "type",
            title: "Descríbelo o fotografíalo",
            text: "Escribe al menos 10 caracteres sobre el asset, o sube de 1 a 4 fotos de un objeto de referencia.",
          },
          {
            icon: "triangle",
            title: "Lee la geometría",
            text: "El diagnóstico lista triángulos, vértices, mallas, materiales, texturas, UV y normales.",
          },
          {
            icon: "layers",
            title: "Optimiza una versión más liviana",
            text: "Optimizar crea una versión nueva y conserva el original. Compáralas y cambia entre ellas.",
          },
          {
            icon: "download",
            title: "Exporta el GLB",
            text: "Llévalo a Blender y a tu motor. Los materiales y las texturas viajan dentro del GLB.",
          },
        ],
      },
      features: {
        title: "Lo que importa cuando construyes",
        sub: "Los números y la malla están en pantalla, no escondidos detrás de un render.",
        items: [
          {
            tag: "Del concepto al asset",
            title: "Describe un prop o parte de fotos",
            text: "El costo en créditos aparece antes de generar, y los créditos se devuelven si el proveedor rechaza el trabajo. Los datos de ubicación se eliminan de cada foto.",
            icon: "type",
            span: 4,
            visual: "textToModel",
          },
          {
            tag: "Props y escenario",
            title: "Props y piezas de entorno",
            text: "Cajas, lámparas, muebles, rocas y ambientación: piezas estáticas que colocas en una escena.",
            icon: "package",
            span: 2,
          },
          {
            tag: "Vista de malla",
            title: "Mira el wireframe antes de importar",
            text: "Cambia entre superficie y wireframe en cualquier modelo, para que los problemas de topología se vean antes de llegar a tu motor.",
            icon: "grid",
            span: 4,
            visual: "viewer",
          },
          {
            tag: "Diagnóstico",
            title: "Triángulos, UV y normales, en números",
            text: "Cada modelo lista lo que tiene dentro, para que lo juzgues tú.",
            icon: "triangle",
            span: 2,
            visual: "metrics",
          },
          {
            tag: "Optimizar",
            title: "Crea una versión más liviana",
            text: "Se crea una versión nueva y el original se conserva. Compáralas y elige la que quieras.",
            icon: "layers",
            span: 3,
            visual: "versions",
          },
          {
            tag: "Exportar",
            title: "GLB para Blender y tu motor",
            text: "El GLB lleva materiales y texturas. OBJ y STL llevan solo la geometría.",
            icon: "download",
            span: 3,
            visual: "chain",
            chain: [
              { icon: "box", label: "GLB" },
              { icon: "blocks", label: "Blender" },
              { icon: "gamepad", label: "Tu motor" },
            ],
          },
        ],
      },
      viewerAlt: "Muestra 3D interactiva de una silla. Arrastra para girar y usa el botón para ver la malla.",
      expect: {
        title: "Qué esperar",
        sub: "La geometría generada es un punto de partida. Revísala como revisarías cualquier asset.",
        hardTitle: "Casos difíciles",
        hard: [
          "Revisa triángulos y UV antes de importar, y límpialo en Blender si hace falta",
          "Los props reflectantes, transparentes o muy finos son casos difíciles",
          "El detalle de textura depende de tus fotos o de tu descripción",
        ],
        missingTitle: "No disponible",
        missing: [
          "Rigging",
          "Animación",
          "Personajes y avatares",
          "Retexturizado y edición parcial",
          "Plugins de Unity y Unreal (planeado)",
        ],
      },
      integrations: {
        title: "Dónde se conecta",
        sub: "Hoy el puente es el GLB. Lo demás está en pruebas o planeado.",
        items: [
          { id: "glb", span: 4 },
          { id: "blender", span: 2 },
          { id: "engines", span: 3 },
          { id: "api", span: 3 },
        ],
      },
      faq: {
        title: "Preguntas de creadores de juegos",
        items: [
          {
            q: "¿La geometría está lista para un juego?",
            a: "Tómala como un punto de partida. El diagnóstico muestra triángulos, vértices, mallas, materiales, texturas, UV y normales para que la juzgues, y puedes optimizar a una versión más liviana. Planea revisarla en Blender o en tu motor.",
          },
          {
            q: "¿Hace rigging o animación?",
            a: "No. No hay rigging, animación ni flujo de personajes. Sirve para props estáticos y piezas de escenario.",
          },
          {
            q: "¿Qué formatos puedo exportar?",
            a: "GLB con materiales y texturas, y OBJ y STL solo con geometría. El OBJ va en metros y el STL en milímetros.",
          },
          {
            q: "¿Hay un plugin para Unity o Unreal?",
            a: "Todavía no. Están planeados cuando se valide la demanda. Hoy exportas un GLB y lo importas tú.",
          },
          {
            q: "¿Pierdo el original cuando optimizo?",
            a: "No. Optimizar crea una versión nueva y conserva el original. Puedes compararlas y cambiar entre ellas.",
          },
        ],
      },
      closing: {
        titleA: "Empieza con un prop.",
        titleB: "Lee su geometría.",
        cta: "Crear un modelo",
        note: "El costo en créditos se muestra antes de generar.",
      },
    },

    design: {
      slug: "design",
      icon: "pen",
      name: "Diseño 3D",
      card: {
        line: "Trae un GLB y sal con el formato que necesitas",
        text: "Vista de malla, comparación de versiones y exportación a GLB, OBJ o STL, para seguir en tu propio software.",
        points: ["Importa un GLB que ya tengas", "Compara versiones", "Add-on para importar a Blender"],
        cta: "Ver diseño 3D",
      },
      meta: {
        title: "Diseño 3D: importa, optimiza y exporta | OrbitShelf 3D",
        description:
          "Parte de una descripción o de un GLB, revisa la malla, compara versiones y exporta GLB, OBJ o STL para seguir en Blender o en tu propio software.",
      },
      hero: {
        pill: "Diseño 3D",
        title: "Parte de una descripción o de un GLB y sigue en tu propio software",
        text: "Importa un GLB para analizarlo, revisa la malla, compara versiones y exporta GLB, OBJ o STL.",
      },
      flow: [
        { icon: "upload", label: "Tu GLB" },
        { icon: "grid", label: "Vista de malla" },
        { icon: "compare", label: "Versiones" },
        { icon: "download", label: "Exportar", result: true },
        { icon: "pen", label: "Tu software" },
      ],
      workflow: {
        title: "Cuatro pasos del archivo a la exportación",
        sub: "Úsalo como un banco de trabajo para el modelo y vuelve a tus propias herramientas.",
        steps: [
          {
            icon: "upload",
            title: "Importa o crea",
            text: "Importa un GLB que ya tengas, o crea uno desde una descripción o de 1 a 4 fotos.",
          },
          {
            icon: "grid",
            title: "Inspecciona la malla",
            text: "Cambia entre superficie y wireframe, y lee el diagnóstico: triángulos, vértices, mallas, materiales, texturas, UV y normales.",
          },
          {
            icon: "compare",
            title: "Optimiza y compara",
            text: "Optimizar crea una versión nueva y conserva el original. Cambia entre ellas cuando quieras.",
          },
          {
            icon: "download",
            title: "Exporta y sigue",
            text: "Descarga GLB, OBJ o STL y continúa en Blender o en el software que ya usas.",
          },
        ],
      },
      features: {
        title: "Las herramientas que usas",
        sub: "Pequeñas, directas y honestas sobre lo que lleva cada formato.",
        items: [
          {
            tag: "Vista de malla",
            title: "Superficie o wireframe, con un clic",
            text: "Revisa la topología en tu propio GLB o en uno generado. El diagnóstico lista triángulos, vértices, mallas, materiales, texturas, UV y normales.",
            icon: "grid",
            span: 4,
            visual: "viewer",
          },
          {
            tag: "Importar",
            title: "Trae un GLB que ya tengas",
            text: "Impórtalo para analizarlo y optimizarlo. Tu archivo queda como el original.",
            icon: "upload",
            span: 2,
          },
          {
            tag: "Versiones",
            title: "Compara y elige",
            text: "Cada optimización agrega una versión. Al cambiar, la revisión vuelve a pendiente.",
            icon: "compare",
            span: 2,
            visual: "versions",
          },
          {
            tag: "Exportar",
            title: "GLB, OBJ y STL",
            text: "El GLB conserva materiales y texturas. OBJ y STL llevan solo la geometría, listos para la siguiente herramienta.",
            icon: "download",
            span: 4,
            visual: "formats",
          },
          {
            tag: "Blender",
            title: "Importa a Blender con el add-on",
            text: "El add-on solo importa modelos a Blender. Todavía no se ha ejecutado dentro de Blender, así que considéralo en pruebas.",
            icon: "blocks",
            span: 3,
            visual: "chain",
            chain: [
              { icon: "box", label: "Tu modelo" },
              { icon: "plug", label: "Add-on" },
              { icon: "blocks", label: "Blender" },
            ],
          },
          {
            tag: "Empezar",
            title: "¿Aún sin archivo? Crea uno",
            text: "Describe la pieza con palabras (10 caracteres o más) o sube de 1 a 4 fotos de un objeto físico. Luego sigue como con cualquier otro modelo.",
            icon: "type",
            span: 3,
            visual: "textToModel",
          },
        ],
      },
      viewerAlt: "Muestra 3D interactiva de una lámpara. Arrastra para girar y usa el botón para ver la malla.",
      expect: {
        title: "Qué esperar",
        sub: "OrbitShelf analiza, optimiza y exporta. No reemplaza tu software de modelado.",
        hardTitle: "Casos difíciles",
        hard: [
          "Compara una versión optimizada con el original antes de cambiar a ella",
          "OBJ y STL llevan solo geometría: sin materiales ni texturas",
          "Las formas reflectantes, transparentes o muy finas son casos difíciles",
        ],
        missingTitle: "Aún no disponible",
        missing: [
          "Edición parcial y retexturizado",
          "Exportar desde Blender: el add-on solo importa",
          "Un add-on de Blender probado: todavía no se ha ejecutado dentro de Blender",
          "Motor de IA: previsto para el piloto (hoy funcionan las muestras de demostración y la importación de GLB)",
        ],
      },
      integrations: {
        title: "Dónde se conecta",
        sub: "Primero los archivos. Los add-ons y los agentes están en pruebas.",
        items: [
          { id: "blender", span: 4 },
          { id: "glb", span: 2 },
          { id: "mcp", span: 3 },
          { id: "api", span: 3 },
        ],
      },
      faq: {
        title: "Preguntas de artistas 3D",
        items: [
          {
            q: "¿Puedo traer mi propio modelo?",
            a: "Sí. Importa un GLB existente para analizarlo y optimizarlo. Optimizar crea una versión nueva y el original se conserva.",
          },
          {
            q: "¿Qué pasa cuando cambio de versión?",
            a: "La revisión vuelve a pendiente, así que nada se aprueba sin ti.",
          },
          {
            q: "¿Qué unidades usan OBJ y STL?",
            a: "El OBJ va en metros y el STL en milímetros. Ambos llevan solo geometría.",
          },
          {
            q: "¿El add-on de Blender envía modelos fuera de Blender?",
            a: "No. Solo importa modelos a Blender, y todavía no se ha ejecutado dentro de Blender, por eso figura en pruebas.",
          },
          {
            q: "¿Puedo editar una parte del modelo o retexturizarlo?",
            a: "Todavía no. La edición parcial y el retexturizado no están disponibles. Haz esos cambios en tu propio software.",
          },
        ],
      },
      closing: {
        titleA: "Empieza con un archivo.",
        titleB: "Conserva tus herramientas.",
        cta: "Crear un modelo",
        note: "El costo en créditos se muestra antes de generar.",
      },
    },
  },
};

const COPY: Record<Locale, SolutionsCopy> = { en, es };

export const getSolutionsCopy = (locale: Locale): SolutionsCopy => COPY[locale];
export const getSolution = (locale: Locale, slug: SolutionSlug): Solution => COPY[locale].solutions[slug];
