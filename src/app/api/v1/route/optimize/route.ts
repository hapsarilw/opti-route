import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Coordinate, OptimizeRequest, OptimizeResponse } from '@/types';
import { generateRouteId, routeGeometry, routeLoadKg, runMockOptimize } from '@/lib/optimize-engine';
import { fetchRoadRoute } from '@/lib/directions';
import { FLEET } from '@/mocks/data';
import { recordOptimizedRoute } from '@/mocks/telemetry-sim';

/**
 * POST /api/v1/route/optimize — Process 2 AI optimization (Doc 01 §5.2, SDD §11).
 *
 * Calls a LOCAL Ollama model (free, no API key, runs on the developer's machine)
 * with structured output (JSON Mode) to decide the drop-off ORDER and write a
 * dispatcher-facing rationale. The waypoints + duration are then derived
 * deterministically from that order server-side (`routeGeometry`) — small local
 * models routinely mangle waypoint alignment and ETA math, so we don't trust
 * them with the geometry.
 *
 * The deterministic optimizer (`runMockOptimize`) is the always-ready fallback
 * (SDD §14): we fall back when
 *   • Ollama is not running / unreachable,
 *   • the model isn't pulled or the call errors,
 *   • the response fails zod validation (invalid JSON / missing field), or
 *   • the AI proposes a sequence that isn't exactly the requested manifests.
 * Either way the dispatcher always gets a valid Doc 01 §5.2 route.
 *
 * Config (server-only — never exposed to the browser):
 *   OLLAMA_HOST    default http://127.0.0.1:11434
 *   OPTIMIZE_MODEL default llama3.2   (pull it first: `ollama pull llama3.2`)
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
const MODEL = process.env.OPTIMIZE_MODEL ?? 'llama3.2';
const OLLAMA_TIMEOUT_MS = 60_000; // local CPU inference can be slow
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

/** What we ask the LLM to decide: the visit order + a short rationale. */
const llmOutputSchema = z.object({
  optimized_sequence: z.array(z.string()),
  ai_insights: z.string(),
});

/** JSON Schema handed to Ollama's `format` to constrain its structured output. */
const LLM_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    optimized_sequence: { type: 'array', items: { type: 'string' } },
    ai_insights: { type: 'string' },
  },
  required: ['optimized_sequence', 'ai_insights'],
} as const;

const SYSTEM_PROMPT = `You are the route optimization engine for OptiRoute, a logistics dispatch platform serving central Bali. Given a warehouse origin coordinate and a list of delivery destinations, decide the most efficient single-vehicle drop-off ORDER.

Rules, in priority order:
1. Sequence all HIGH-priority manifests before NORMAL and LOW ones — they have time-sensitive receiver windows.
2. Within each priority tier, minimise total travel distance using nearest-neighbour from the previous stop, starting from the warehouse origin.
3. Heavier loads are slightly preferred earlier when distance is otherwise comparable.

Output:
- "optimized_sequence": the manifest_id of EVERY supplied destination exactly once, in visit order. Never invent an id; never omit one.
- "ai_insights": a concise 1–2 sentence dispatcher-facing rationale for the ordering.

Return ONLY the JSON object matching the provided schema. No markdown, no code fences, no preamble.`;

async function optimizeWithLLM(payload: OptimizeRequest): Promise<OptimizeResponse | null> {
  const requested = new Set(payload.destinations.map((d) => d.manifest_id));

  let res: Response;
  try {
    res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: LLM_OUTPUT_JSON_SCHEMA, // Ollama structured outputs (JSON Schema)
        options: { temperature: 0 },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              origin_coordinate: payload.origin_coordinate,
              destinations: payload.destinations,
            }),
          },
        ],
      }),
    });
  } catch (err) {
    // Connection refused (Ollama not running) or timeout.
    console.error('[optimize] Ollama unreachable; falling back to mock.', err);
    return null;
  }

  if (!res.ok) {
    console.error(`[optimize] Ollama responded ${res.status}; falling back to mock.`);
    return null;
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const raw = (data.message?.content ?? '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error('[optimize] AI returned non-JSON output; falling back to mock.');
    return null;
  }

  const result = llmOutputSchema.safeParse(parsed);
  if (!result.success) {
    console.error('[optimize] AI response failed zod validation; falling back to mock.', result.error.issues);
    return null;
  }

  // The sequence must be exactly the requested manifests — no hallucinated or
  // missing ids (Doc 02 §2.5). Otherwise fall back.
  const seq = result.data.optimized_sequence;
  if (seq.length !== requested.size || !seq.every((id) => requested.has(id))) {
    console.error('[optimize] AI sequence was incomplete or out-of-selection; falling back to mock.');
    return null;
  }

  // Trust the AI's ORDER + narrative; derive geometry deterministically.
  const byId = new Map(payload.destinations.map((d) => [d.manifest_id, d]));
  const ordered = seq.map((id) => byId.get(id)!);
  const { waypoints, estimated_total_duration_mins } = routeGeometry(
    payload.origin_coordinate,
    ordered,
  );

  return {
    status: 'success',
    route_id: generateRouteId(),
    optimized_sequence: seq,
    waypoints,
    estimated_total_duration_mins,
    ai_insights: result.data.ai_insights,
  };
}

export async function POST(request: Request): Promise<NextResponse<OptimizeResponse>> {
  let payload: OptimizeRequest;
  try {
    payload = (await request.json()) as OptimizeRequest;
  } catch {
    return NextResponse.json(emptyResponse('Malformed request body.'), { status: 400 });
  }

  if (!payload?.destinations?.length) {
    return NextResponse.json(
      {
        ...emptyResponse('No destinations supplied — nothing to optimize.'),
        waypoints: [payload?.origin_coordinate].filter(Boolean) as OptimizeResponse['waypoints'],
      },
      { status: 400 },
    );
  }

  // Capacity guard (Doc 01 §2.2): the chosen fleet must be able to carry the
  // route's total load. The client blocks this in the OptimizeDrawer, but we
  // re-check server-side so the contract holds even if the UI is bypassed.
  const overload = capacityViolation(payload);
  if (overload) {
    return NextResponse.json(overload, { status: 422 });
  }

  let body: OptimizeResponse | null = null;
  try {
    body = await optimizeWithLLM(payload);
  } catch (err) {
    console.error('[optimize] AI call threw; falling back to mock.', err);
  }

  // Always-ready fallback: deterministic optimizer (SDD §14).
  if (!body) {
    body = runMockOptimize(payload);
  }

  if (body.status === 'success') {
    // Snap the stop order to the road network so the route is drivable and the
    // vehicle moves along real roads (not straight lines). Omitted on failure —
    // every consumer falls back to the straight waypoints.
    body.path = await roadPath(body.waypoints);

    // Record the route server-side so a later dispatch can replay it onto the live
    // map (Process 2 → 4 bridge for the no-MSW path; harmless when MSW is active).
    recordOptimizedRoute({
      route_id: body.route_id,
      dispatcher_id: payload.dispatcher_id,
      fleet_id: payload.fleet_id,
      origin_coordinate: payload.origin_coordinate,
      optimized_sequence: body.optimized_sequence,
      waypoints: body.waypoints,
      path: body.path,
      estimated_total_duration_mins: body.estimated_total_duration_mins,
      ai_insights: body.ai_insights,
      status: 'DRAFT',
      created_at: new Date().toISOString(),
    });
  }

  return NextResponse.json(body);
}

/** Road-snapped polyline through the route's waypoints, or undefined on failure. */
async function roadPath(waypoints: Coordinate[]): Promise<Coordinate[] | undefined> {
  if (!MAPBOX_TOKEN || waypoints.length < 2) return undefined;
  const coords = waypoints.map((w) => [w.lng, w.lat] as [number, number]);
  const road = await fetchRoadRoute(coords, MAPBOX_TOKEN);
  return road?.coordinates.map(([lng, lat]) => ({ lat, lng }));
}

/**
 * Returns an error response when the selected fleet can't carry the route's load,
 * or `null` when the fleet is unknown (nothing to validate) or has enough room.
 */
function capacityViolation(payload: OptimizeRequest): OptimizeResponse | null {
  const fleet = FLEET.find((f) => f.fleet_id === payload.fleet_id);
  if (!fleet) return null; // unknown fleet — let the request through rather than block

  const load = routeLoadKg(payload.destinations);
  if (load <= fleet.capacity_kg) return null;

  const vehicle = fleet.vehicle_type.charAt(0) + fleet.vehicle_type.slice(1).toLowerCase();
  return emptyResponse(
    `Load ${load} kg exceeds the ${fleet.capacity_kg} kg capacity of ${vehicle} ${fleet.plate_number}. Select a higher-capacity vehicle.`,
  );
}

function emptyResponse(insight: string): OptimizeResponse {
  return {
    status: 'error',
    route_id: '',
    optimized_sequence: [],
    waypoints: [],
    estimated_total_duration_mins: 0,
    ai_insights: insight,
  };
}
