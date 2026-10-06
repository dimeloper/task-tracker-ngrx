import { on, withReducer } from '@ngrx/signals/events';
import {
  NamedEntityState,
  setAllEntities,
  addEntity,
  removeEntity,
  updateEntity,
} from '@ngrx/signals/entities';
import { taskPageEvents, taskApiEvents } from './task.events';
import { signalStoreFeature, type } from '@ngrx/signals';
import { Task, TaskBoardState } from '../../interfaces/task';

type TaskStoreState = TaskBoardState & NamedEntityState<Task, 'task'>;

export function withTaskReducer<_>() {
  return signalStoreFeature(
    { state: type<TaskStoreState>() },
    withReducer<TaskStoreState>(
      // Opening the board and turning the page both (re)load the current page
      on(taskPageEvents.opened, () => {
        console.log('[Event → Reducer] Page opened - setting isLoading: true');
        return { isLoading: true };
      }),

      on(taskPageEvents.pageChanged, event => {
        console.log('[Event → Reducer] Page changed', { page: event.payload });
        return { currentPage: event.payload, isLoading: true };
      }),

      on(taskApiEvents.tasksLoadedSuccess, event => {
        console.log('[Event → Reducer] Tasks loaded successfully', {
          count: event.payload.tasks.length,
          totalPages: event.payload.totalPages,
        });
        return [
          setAllEntities(event.payload.tasks, { collection: 'task' }),
          {
            isLoading: false,
            error: null,
            pageCount: Math.max(1, event.payload.totalPages),
          },
        ];
      }),

      on(taskApiEvents.tasksLoadedFailure, event => {
        console.log('[Event → Reducer] Tasks load failed', {
          error: event.payload,
        });
        return { isLoading: false, error: event.payload };
      }),

      // Create and edit failures are not handled here on purpose: the forms
      // that started them show the message on the title field instead.
      on(taskApiEvents.taskCreatedSuccess, event => {
        console.log('[Event → Reducer] Task created', {
          taskId: event.payload.id,
          title: event.payload.title,
        });
        return addEntity(event.payload, { collection: 'task' });
      }),

      // Only the edited fields are applied. Taking the whole saved task would
      // also overwrite a status move that is still on its way to the server.
      on(taskApiEvents.taskUpdatedSuccess, event => {
        console.log('[Event → Reducer] Task updated', {
          taskId: event.payload.id,
          title: event.payload.title,
        });
        return [
          updateEntity(
            {
              id: event.payload.id,
              changes: {
                title: event.payload.title,
                description: event.payload.description,
              },
            },
            { collection: 'task' }
          ),
          { taskEdit: null },
        ];
      }),

      on(taskApiEvents.taskDeletedSuccess, (event, state) => {
        console.log('[Event → Reducer] Task deleted', {
          taskId: event.payload,
        });
        return [
          removeEntity(event.payload, { collection: 'task' }),
          // Deleting the task that is open in the editor closes the editor.
          state.taskEdit?.id === event.payload ? { taskEdit: null } : {},
        ];
      }),

      on(taskApiEvents.taskDeletedFailure, event => {
        console.log('[Event → Reducer] Task delete failed', {
          error: event.payload,
        });
        return { error: event.payload };
      }),

      // Optimistic status update
      on(taskPageEvents.taskStatusChanged, event => {
        console.log('[Event → Reducer] Task status changed (optimistic)', {
          taskId: event.payload.id,
          newStatus: event.payload.status,
        });
        return updateEntity(
          { id: event.payload.id, changes: { status: event.payload.status } },
          { collection: 'task' }
        );
      }),

      // Status update failure: revert, and say why
      on(taskApiEvents.taskStatusChangedFailure, event => {
        console.log('[Event → Reducer] Task status change failed - reverting', {
          taskId: event.payload.id,
          revertingTo: event.payload.previousStatus,
          error: event.payload.error,
        });
        return [
          updateEntity(
            {
              id: event.payload.id,
              changes: { status: event.payload.previousStatus },
            },
            { collection: 'task' }
          ),
          { error: event.payload.error },
        ];
      }),

      on(taskPageEvents.errorDismissed, () => ({ error: null }))
    )
  );
}
