import { signalStore, withState, withComputed, type } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { computed, inject, Signal } from '@angular/core';
import { Task, TaskStatus } from '../../interfaces/task';
import { TASK_BOARD_INITIAL_STATE } from './task-store.config';
import { withTaskReducer } from './task.reducer';
import { withTaskEffects } from './task.effects';
import { taskPageEvents, taskApiEvents } from './task.events';
import { withEventLogging } from '../shared/with-event-logging';

interface TaskStoreState {
  taskEntities: Signal<Task[]>;
}

export const TaskStore = signalStore(
  { providedIn: 'root' },

  // Entities (must come before State)
  withEntities({ entity: type<Task>(), collection: 'task' }),

  // State
  withState(() => inject(TASK_BOARD_INITIAL_STATE)),

  // Event-driven reducers
  withTaskReducer(),

  // Event-driven effects
  withTaskEffects(),

  // Event logging (for debugging)
  withEventLogging([taskPageEvents, taskApiEvents]),

  // Computed views (unchanged)
  withComputed((store: TaskStoreState) => ({
    tasksTodo: computed(() =>
      store.taskEntities().filter((t: Task) => t.status === TaskStatus.TODO)
    ),
    tasksInProgress: computed(() =>
      store
        .taskEntities()
        .filter((t: Task) => t.status === TaskStatus.IN_PROGRESS)
    ),
    tasksDone: computed(() =>
      store.taskEntities().filter((t: Task) => t.status === TaskStatus.DONE)
    ),
  }))
);
