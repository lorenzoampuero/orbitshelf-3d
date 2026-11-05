import { v1Json, withToken } from "@/lib/api-tokens";
import { refreshEngineSwitches } from "@/lib/jobs";
import { availableEngines, toEngineDto } from "@/lib/provider/registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The engines available right now, with what they can really do and the date their published price was read. */
export const GET = withToken("models:read", async (req) => {
  await refreshEngineSwitches().catch(() => undefined);
  const mode = new URL(req.url).searchParams.get("mode");
  const engines = availableEngines().map(toEngineDto);
  return v1Json({ models: mode ? engines.filter((e) => (e.modes as string[]).includes(mode)) : engines });
});
