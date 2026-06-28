import { z } from 'zod';
import type { OptimizeRequest, OptimizeResponse } from '@/types';

/** Error carrying an optional HTTP/AI status code for the drawer's error caption. */
export class OptimizeError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = 'OptimizeError';
    this.code = code;
  }
}

const coordinateSchema = z.object({ lat: z.number(), lng: z.number() });

/**
 * Structured-output contract for the AI route response (Doc 01 §5.2 / SDD §14).
 * Validating with zod is the "invalid JSON → error" guard: the LLM (or mock)
 * MUST return this exact shape or we fall back rather than render garbage.
 */
export const optimizeResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  route_id: z.string(),
  optimized_sequence: z.array(z.string()),
  waypoints: z.array(coordinateSchema),
  estimated_total_duration_mins: z.number(),
  ai_insights: z.string(),
  path: z.array(coordinateSchema).optional(),
});

/**
 * Parse + validate a raw AI response into a typed `OptimizeResponse`.
 * Valid JSON matching the schema → typed object; anything else → OptimizeError.
 */
export function parseOptimizeResponse(raw: unknown): OptimizeResponse {
  const result = optimizeResponseSchema.safeParse(raw);
  if (!result.success) {
    throw new OptimizeError('The AI engine returned a malformed route response.');
  }
  return result.data;
}

/**
 * POST /api/v1/route/optimize — Process 2 (Doc 01 §5.2).
 * Payload shape is sent EXACTLY per the contract; the MSW handler (or a real LLM
 * later) returns the structured sequence + waypoints + ai_insights.
 */
export async function postOptimize(payload: OptimizeRequest): Promise<OptimizeResponse> {
  let res: Response;
  try {
    res = await fetch('/api/v1/route/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Network failure / timeout — surfaced as a 504-style error in the drawer.
    throw new OptimizeError('Could not reach the AI server. Check your connection and try again.', 504);
  }

  if (!res.ok) {
    // Prefer the server's own explanation (e.g. a 422 capacity violation) so the
    // drawer shows the real reason rather than a generic status message.
    let detail = `AI server responded with ${res.status}. Please try again.`;
    try {
      const body = (await res.json()) as Partial<OptimizeResponse>;
      if (body?.ai_insights) detail = body.ai_insights;
    } catch {
      /* non-JSON body — keep the generic message */
    }
    throw new OptimizeError(detail, res.status);
  }

  // zod-validate the structured output before trusting it (SDD §14).
  return parseOptimizeResponse(await res.json());
}

/**
 * Guard the AI response against the dispatcher's selection (Doc 02 §2.5 note):
 * reject error statuses and any `optimized_sequence` id that wasn't requested.
 */
export function assertSequenceWithinSelection(res: OptimizeResponse, selectedIds: Set<string>): void {
  if (res.status !== 'success') {
    throw new OptimizeError('The AI engine returned an error status.');
  }
  const unknown = res.optimized_sequence.find((id) => !selectedIds.has(id));
  if (unknown) {
    throw new OptimizeError(`Unknown ID — "${unknown}" was not part of the selection.`);
  }
}
