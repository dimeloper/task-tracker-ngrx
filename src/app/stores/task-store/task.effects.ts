import { inject } from '@angular/core';
import { Events, withEffects } from '@ngrx/signals/events';
import { signalStoreFeature } from '@ngrx/signals';
import { exhaustMap, tap, catchError, concatMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { taskPageEvents, taskApiEvents } from './task.events';
import { Task } from '../../interfaces/task';

export function withTaskEffects() {
  return signalStoreFeature(
    withEffects(
      (
        // Store type is dynamically composed, using Record for flexibility
        store: Record<string, unknown>,
        events = inject(Events),
        taskService = inject(TaskService)
      ) => ({
        // Load tasks when page opens
        loadTasks$: events.on(taskPageEvents.opened).pipe(
          exhaustMap(() =>
            taskService.getTasks(1, 10).pipe(
              tap(response => {
                console.log('[Task Store] Response from getTasks:', response);
              }),
              catchError((error: { message: string }) =>
                of(taskApiEvents.tasksLoadedFailure(error.message))
              ),
              concatMap((response: { tasks: Task[] } | { type: string }) => {
                if ('type' in response) {
                  // Already an event (error)
                  return of(response);
                }
                // Dispatch success with tasks array
                console.log(
                  '[Task Store] Dispatching tasksLoadedSuccess with:',
                  response.tasks
                );
                return of(taskApiEvents.tasksLoadedSuccess(response.tasks));
              })
            )
          )
        ),

        // Create task
        createTask$: events.on(taskPageEvents.taskCreated).pipe(
          exhaustMap(event =>
            taskService.createTask(event.payload).pipe(
              catchError((error: { message: string }) =>
                of(taskApiEvents.taskCreatedFailure(error.message))
              ),
              concatMap((task: Task | { type: string }) =>
                'type' in task
                  ? of(task)
                  : of(taskApiEvents.taskCreatedSuccess(task))
              )
            )
          )
        ),

        // Delete task
        deleteTask$: events.on(taskPageEvents.taskDeleted).pipe(
          exhaustMap(event =>
            taskService.deleteTask(event.payload).pipe(
              catchError((error: { message: string }) =>
                of(taskApiEvents.taskDeletedFailure(error.message))
              ),
              concatMap(() =>
                of(taskApiEvents.taskDeletedSuccess(event.payload))
              )
            )
          )
        ),

        // Change task status
        changeTaskStatus$: events.on(taskPageEvents.taskStatusChanged).pipe(
          exhaustMap(event => {
            const taskEntitiesFn = store['taskEntities'] as
              | (() => Task[])
              | undefined;
            const taskEntities = taskEntitiesFn?.() || [];
            const task = taskEntities.find(
              (t: Task) => t.id === event.payload.id
            );
            const previousStatus = task?.status;

            return taskService
              .updateTaskStatus(event.payload.id, event.payload.status)
              .pipe(
                catchError((error: { message: string }) =>
                  of(
                    taskApiEvents.taskStatusChangedFailure({
                      id: event.payload.id,
                      previousStatus: previousStatus!,
                      error: error.message,
                    })
                  )
                ),
                concatMap(() =>
                  of(taskApiEvents.taskStatusChangedSuccess(event.payload))
                )
              );
          })
        ),
      })
    )
  );
}
