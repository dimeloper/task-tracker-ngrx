import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';
import { Task, TaskStatus } from '../../interfaces/task';

export const taskPageEvents = eventGroup({
  source: 'Task Page',
  events: {
    opened: type<void>(),
    taskCreated: type<Omit<Task, 'id' | 'createdAt'>>(),
    taskDeleted: type<string>(),
    taskStatusChanged: type<{
      id: string;
      status: TaskStatus;
      previousStatus: TaskStatus;
    }>(),
    pageChanged: type<number>(),
  },
});

export const taskApiEvents = eventGroup({
  source: 'Task API',
  events: {
    tasksLoadedSuccess: type<Task[]>(),
    tasksLoadedFailure: type<string>(),
    taskCreatedSuccess: type<Task>(),
    taskCreatedFailure: type<string>(),
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
