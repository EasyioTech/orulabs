import { ResponseSubmitSchema } from "@oruclass/validators";
import { submitResponse } from "../services/responses.service";
import { scheduleAggregate } from "../lib/aggregate";
import type { ConnContext } from "../lib/context";

export function registerResponseHandlers(ctx: ConnContext): void {
  const { io, userId, on } = ctx;

  on(
    "response:submit",
    ResponseSubmitSchema,
    async ({ trainingId, moduleId, responseData }, ack) => {
      await submitResponse({ trainingId, moduleId, userId, responseData });

      // Ack immediately — counts/broadcasts can lag the ack without affecting the
      // participant's UX.
      ack?.({ ok: true });

      // Coalesced broadcast: collapses a storm of submits into one count + one
      // fan-out per module per AGGREGATE_FLUSH_MS window (see scheduleAggregate).
      scheduleAggregate(io, trainingId, moduleId);
    },
    // Ack-only failure: never push a generic error toast for a failed save.
    { emitInternalError: false, internalMessage: "Failed to save response" },
  );
}
