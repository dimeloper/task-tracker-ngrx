import { inject } from '@angular/core';
import { Events, withEffects } from '@ngrx/signals/events';
import { signalStoreFeature } from '@ngrx/signals';
import { tap } from 'rxjs/operators';

type EventGroup = Record<string, unknown>;
interface EventWithPayload {
  type: string;
  payload?: unknown;
}

/**
 * Creates a store feature that logs all events from specified event groups.
 * This is useful for debugging and monitoring the event flow in your application.
 *
 * @param eventGroups - Array of event groups to log (e.g., [taskPageEvents, taskApiEvents])
 * @returns A signal store feature that logs all events
 *
 * @example
 * ```typescript
 * export const TaskStore = signalStore(
 *   { providedIn: 'root' },
 *   withEventLogging([taskPageEvents, taskApiEvents]),
 *   // ... other features
 * );
 * ```
 */
export function withEventLogging(eventGroups: EventGroup[]) {
  return signalStoreFeature(
    withEffects((store: Record<string, unknown>, events = inject(Events)) => {
      // Collect all events from all groups
      // Using unknown[] since event creators from NGRX Signals have complex generic types
      const allEvents = eventGroups.flatMap(group =>
        Object.values(group)
      ) as unknown[];

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logAllEvents$: events.on(...(allEvents as [any, ...any[]])).pipe(
          tap((event: EventWithPayload) => {
            const isError = event.type.includes('Failure');
            if (isError) {
              console.error(`[Store Event] ${event.type}:`, event.payload);
            } else {
              console.log(`[Store Event] ${event.type}`, event.payload);
            }
          })
        ),
      };
    })
  );
}
