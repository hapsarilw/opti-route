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
    throw new OptimizeError(`AI server responded with ${res.status}. Please try again.`, res.status);
  }

  return (await res.json()) as OptimizeResponse;
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
