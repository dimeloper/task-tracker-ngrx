import { on, withReducer } from '@ngrx/signals/events';
import {
  setAllEntities,
  addEntity,
  removeEntity,
  updateEntity,
} from '@ngrx/signals/entities';
import { taskPageEvents, taskApiEvents } from './task.events';
import { signalStoreFeature } from '@ngrx/signals';
import { Task, TaskStatus } from '../../interfaces/task';

export function withTaskReducer() {
  return signalStoreFeature(
    withReducer(
      // Handle loading states
      on(taskPageEvents.opened, () => ({ isLoading: true })),

      // Handle successful task loading
      // In NGRX Signals Events, the on() handler receives only the event (not state)
      // The event object has a .payload property containing the data
      on(taskApiEvents.tasksLoadedSuccess, (event: { payload: Task[] }) => {
        return [
          setAllEntities(event.payload, { collection: 'task' }),
          { isLoading: false },
        ];
      }),

      // Handle failed task loading
      on(taskApiEvents.tasksLoadedFailure, (event: { payload: string }) => ({
        isLoading: false,
        error: event.payload,
      })),

      // Handle successful task creation
      on(taskApiEvents.taskCreatedSuccess, (event: { payload: Task }) =>
        addEntity(event.payload, { collection: 'task' })
      ),

      // Handle successful task deletion
      on(taskApiEvents.taskDeletedSuccess, (event: { payload: string }) =>
        removeEntity(event.payload, { collection: 'task' })
      ),

      // Handle optimistic status update
      on(
        taskPageEvents.taskStatusChanged,
        (event: { payload: { id: string; status: TaskStatus } }) =>
          updateEntity(
            { id: event.payload.id, changes: { status: event.payload.status } },
            { collection: 'task' }
          )
      ),

      // Handle status update failure (revert)
      on(
        taskApiEvents.taskStatusChangedFailure,
        (event: {
          payload: { id: string; previousStatus: TaskStatus; error: string };
        }) =>
          updateEntity(
            {
              id: event.payload.id,
              changes: { status: event.payload.previousStatus },
            },
            { collection: 'task' }
          )
      )
    )
  );
}
