import {
  signalStore,
  signalStoreFeature,
  withComputed,
  withState,
  type,
} from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { computed, inject } from '@angular/core';
import { Task, TaskStatus } from '../../interfaces/task';
import { TASK_BOARD_INITIAL_STATE, taskStoreInput } from './task-store.config';
import { withTaskReducer } from './task.reducer';
import { withTaskEffects } from './task.effects';
import { withTaskForms } from './task.forms';
import { taskPageEvents, taskApiEvents } from './task.events';
import { withEventLogging } from '../shared/with-event-logging';

// Every feature below is its own function, so the signalStore() call has no
// inline callbacks. A callback such as withComputed(({ taskEntities }) => ...)
// in the middle of the call is inferred in a later pass, and with the typed
// features around it TypeScript can no longer resolve a signalStore overload.
function withTaskColumns() {
  return signalStoreFeature(
    taskStoreInput,
    withComputed(({ taskEntities }) => ({
      tasksTodo: computed(() =>
        taskEntities().filter(t => t.status === TaskStatus.TODO)
      ),
      tasksInProgress: computed(() =>
        taskEntities().filter(t => t.status === TaskStatus.IN_PROGRESS)
      ),
      tasksDone: computed(() =>
        taskEntities().filter(t => t.status === TaskStatus.DONE)
      ),
    }))
  );
}

// Provided by TaskBoardComponent rather than in root. With a providedIn config,
// withEntities, and a feature that declares the state it needs (the reducer,
// effects and forms features all do), TypeScript 6 fails to infer the store's
// state and no signalStore overload matches. Without the config it infers fine.
export const TaskStore = signalStore(
  // Entities (must come before State)
  withEntities({ entity: type<Task>(), collection: 'task' }),

  // State
  withState(() => inject(TASK_BOARD_INITIAL_STATE)),

  // Tasks split by column
  withTaskColumns(),

  // Event-driven reducers
  withTaskReducer(),

  // Event-driven effects
  withTaskEffects(),

  // Event logging (for debugging)
  withEventLogging([taskPageEvents, taskApiEvents]),

  // What the create and edit forms call
  withTaskForms()
);
