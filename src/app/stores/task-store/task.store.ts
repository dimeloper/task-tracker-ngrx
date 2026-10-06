import { signalStore, withComputed, withState, type } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { computed, inject } from '@angular/core';
import { Task, TaskStatus } from '../../interfaces/task';
import { TASK_BOARD_INITIAL_STATE } from './task-store.config';
import { withTaskReducer } from './task.reducer';
import { withTaskEffects } from './task.effects';
import { withTaskForms } from './task.forms';
import { taskPageEvents, taskApiEvents } from './task.events';
import { withEventLogging } from '../shared/with-event-logging';

export const TaskStore = signalStore(
  { providedIn: 'root' },

  // Entities (must come before State)
  withEntities({ entity: type<Task>(), collection: 'task' }),

  // State
  withState(() => inject(TASK_BOARD_INITIAL_STATE)),

  // Computed views
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
  })),

  // Event-driven reducers
  withTaskReducer(),

  // Event-driven effects
  withTaskEffects(),

  // Event logging (for debugging)
  withEventLogging([taskPageEvents, taskApiEvents]),

  // What the create and edit forms call
  withTaskForms()
);
