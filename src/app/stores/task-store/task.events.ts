import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Task, TaskStatus, TasksPage } from '../../interfaces/task';

// Creating and editing a task are not page events: the forms await them as
// mutations on the store (see task.store.ts). Their outcomes still arrive as
// API events below, so the reducer stays the only place that writes tasks.
export const taskPageEvents = eventGroup({
  source: 'Task Page',
  events: {
    opened: type<void>(),
    taskDeleted: type<string>(),
    taskStatusChanged: type<{
      id: string;
      status: TaskStatus;
      previousStatus: TaskStatus;
    }>(),
    pageChanged: type<number>(),
    errorDismissed: type<void>(),
  },
});

export const taskApiEvents = eventGroup({
  source: 'Task API',
  events: {
    tasksLoadedSuccess: type<TasksPage>(),
    tasksLoadedFailure: type<string>(),
    taskCreatedSuccess: type<Task>(),
    taskCreatedFailure: type<string>(),
    taskUpdatedSuccess: type<Task>(),
    taskUpdatedFailure: type<string>(),
    taskDeletedSuccess: type<string>(),
    taskDeletedFailure: type<string>(),
    taskStatusChangedSuccess: type<{ id: string; status: TaskStatus }>(),
    taskStatusChangedFailure: type<{
      id: string;
      previousStatus: TaskStatus;
      error: string;
    }>(),
  },
});
