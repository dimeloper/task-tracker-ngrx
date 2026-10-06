import { inject } from '@angular/core';
import {
  patchState,
  signalStoreFeature,
  withMethods,
  withProps,
} from '@ngrx/signals';
import { Dispatcher } from '@ngrx/signals/events';
import { rxMutation, withMutations } from '@angular-architects/ngrx-toolkit';
import { Task, TaskDraft, TaskEdit, TaskStatus } from '../../interfaces/task';
import { TaskService } from '../../services/task.service';
import { taskStoreInput } from './task-store.config';
import { taskApiEvents } from './task.events';

/** The service rejects with `{ message }`; anything else is stringified. */
export function errorMessage(error: unknown): string {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' ? message : String(error);
}

export function withTaskForms() {
  return signalStoreFeature(
    taskStoreInput,
    withProps(() => ({
      _taskService: inject(TaskService),
      _dispatcher: inject(Dispatcher),
    })),

    // The edit form's model. The form never holds its own copy: it reads
    // taskEdit through a linkedSignal and writes back through updateTaskEdit, so
    // the store stays the single owner of the draft (see TaskEditComponent).
    // These are methods rather than events because they fire on every keystroke
    // and change nothing but the draft; an event per keystroke would bury the
    // event log.
    withMethods(store => ({
      startEditing(taskId: string): void {
        const task = store.taskEntityMap()[taskId];
        if (task) {
          patchState(store, {
            taskEdit: {
              id: task.id,
              title: task.title,
              description: task.description ?? '',
            },
          });
        }
      },
      updateTaskEdit(taskEdit: TaskEdit): void {
        patchState(store, { taskEdit });
      },
      stopEditing(): void {
        patchState(store, { taskEdit: null });
      },
    })),

    // Creating and saving go through mutations because the forms need to await
    // the outcome: each call resolves to { status: 'success' | 'error' |
    // 'aborted' }, which submit() maps onto the form. The outcome is then
    // dispatched as an API event, so the reducer still makes every state change
    // and the event log still sees every result.
    withMutations(store => ({
      createTask: rxMutation<TaskDraft, Task>({
        operation: (draft: TaskDraft) =>
          store._taskService.createTask({ ...draft, status: TaskStatus.TODO }),
        onSuccess: task =>
          store._dispatcher.dispatch(taskApiEvents.taskCreatedSuccess(task)),
        onError: error =>
          store._dispatcher.dispatch(
            taskApiEvents.taskCreatedFailure(errorMessage(error))
          ),
      }),
      saveTaskEdit: rxMutation<TaskEdit, Task>({
        operation: ({ id, title, description }: TaskEdit) =>
          store._taskService.updateTask(id, { title, description }),
        onSuccess: task =>
          store._dispatcher.dispatch(taskApiEvents.taskUpdatedSuccess(task)),
        onError: error =>
          store._dispatcher.dispatch(
            taskApiEvents.taskUpdatedFailure(errorMessage(error))
          ),
      }),
    }))
  );
}
