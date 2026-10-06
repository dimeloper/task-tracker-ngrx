import { inject } from '@angular/core';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { signalStoreFeature } from '@ngrx/signals';
import {
  exhaustMap,
  tap,
  catchError,
  concatMap,
  groupBy,
  mergeMap,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { taskPageEvents, taskApiEvents } from './task.events';
import { Task } from '../../interfaces/task';

export function withTaskEffects() {
  return signalStoreFeature(
    withEventHandlers(
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
                console.log('[Effect] Response from getTasks:', response);
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
                  '[Effect] Dispatching tasksLoadedSuccess with:',
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
        // mergeMap: deleting one task says nothing about another, so a delete
        // clicked while an earlier one is in flight is sent, not dropped.
        deleteTask$: events.on(taskPageEvents.taskDeleted).pipe(
          mergeMap(event =>
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
        // The reducer has already moved the card, so no move may be dropped:
        // exhaustMap would skip the request and leave the board ahead of the
        // server with no failure to roll it back. Moves are queued per task,
        // so "start" then "complete" reach the server in that order, while
        // moves of different tasks don't wait on each other.
        changeTaskStatus$: events.on(taskPageEvents.taskStatusChanged).pipe(
          groupBy(event => event.payload.id),
          mergeMap(movesOfOneTask =>
            movesOfOneTask.pipe(
              concatMap(event =>
                taskService
                  .updateTaskStatus(event.payload.id, event.payload.status)
                  .pipe(
                    concatMap(() =>
                      of(
                        taskApiEvents.taskStatusChangedSuccess({
                          id: event.payload.id,
                          status: event.payload.status,
                        })
                      )
                    ),
                    catchError((error: { message: string }) =>
                      of(
                        taskApiEvents.taskStatusChangedFailure({
                          id: event.payload.id,
                          previousStatus: event.payload.previousStatus,
                          error: error.message,
                        })
                      )
                    )
                  )
              )
            )
          )
        ),
      })
    )
  );
}
