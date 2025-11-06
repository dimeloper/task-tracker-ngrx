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
      on(taskPageEvents.opened, () => {
        console.log('[Event → Reducer] Page opened - setting isLoading: true');
        return { isLoading: true };
      }),

      // Handle successful task loading
      // In NGRX Signals Events, the on() handler receives only the event (not state)
      // The event object has a .payload property containing the data
      on(taskApiEvents.tasksLoadedSuccess, (event: { payload: Task[] }) => {
        console.log('[Event → Reducer] Tasks loaded successfully', {
          count: event.payload.length,
          taskIds: event.payload.map(t => t.id),
        });
        return [
          setAllEntities(event.payload, { collection: 'task' }),
          { isLoading: false },
        ];
      }),

      // Handle failed task loading
      on(taskApiEvents.tasksLoadedFailure, (event: { payload: string }) => {
        console.log('[Event → Reducer] Tasks load failed', {
          error: event.payload,
        });
        return {
          isLoading: false,
          error: event.payload,
        };
      }),

      // Handle successful task creation
      on(taskApiEvents.taskCreatedSuccess, (event: { payload: Task }) => {
        console.log('[Event → Reducer] Task created', {
          taskId: event.payload.id,
          title: event.payload.title,
        });
        return addEntity(event.payload, { collection: 'task' });
      }),

      // Handle successful task deletion
      on(taskApiEvents.taskDeletedSuccess, (event: { payload: string }) => {
        console.log('[Event → Reducer] Task deleted', {
          taskId: event.payload,
        });
        return removeEntity(event.payload, { collection: 'task' });
      }),

      // Handle optimistic status update
      on(
        taskPageEvents.taskStatusChanged,
        (event: { payload: { id: string; status: TaskStatus } }) => {
          console.log('[Event → Reducer] Task status changed (optimistic)', {
            taskId: event.payload.id,
            newStatus: event.payload.status,
          });
          return updateEntity(
            { id: event.payload.id, changes: { status: event.payload.status } },
            { collection: 'task' }
          );
        }
      ),

      // Handle status update failure (revert)
      on(
        taskApiEvents.taskStatusChangedFailure,
        (event: {
          payload: { id: string; previousStatus: TaskStatus; error: string };
        }) => {
          console.log(
            '[Event → Reducer] Task status change failed - reverting',
            {
              taskId: event.payload.id,
              revertingTo: event.payload.previousStatus,
              error: event.payload.error,
            }
          );
          return updateEntity(
            {
              id: event.payload.id,
              changes: { status: event.payload.previousStatus },
            },
            { collection: 'task' }
          );
        }
      )
    )
  );
}
