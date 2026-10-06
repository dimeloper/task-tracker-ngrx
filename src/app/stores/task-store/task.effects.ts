import { inject } from '@angular/core';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { signalStoreFeature, type } from '@ngrx/signals';
import {
  catchError,
  concatMap,
  groupBy,
  map,
  mergeMap,
  switchMap,
} from 'rxjs/operators';
import { of } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { taskPageEvents, taskApiEvents } from './task.events';
import { TaskBoardState } from '../../interfaces/task';

export function withTaskEffects<_>() {
  return signalStoreFeature(
    { state: type<TaskBoardState>() },
    withEventHandlers(
      (store, events = inject(Events), taskService = inject(TaskService)) => ({
        // Load the current page when the board opens or the page changes.
        // The reducer has already stored the new page by the time this runs.
        // switchMap: only the page asked for last matters, so an older page
        // still loading is cancelled rather than landing on top of it.
        loadTasks$: events
          .on(taskPageEvents.opened, taskPageEvents.pageChanged)
          .pipe(
            switchMap(() =>
              taskService.getTasks(store.currentPage(), store.pageSize()).pipe(
                map(page => taskApiEvents.tasksLoadedSuccess(page)),
                catchError((error: { message: string }) =>
                  of(taskApiEvents.tasksLoadedFailure(error.message))
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
              map(deleted =>
                deleted
                  ? taskApiEvents.taskDeletedSuccess(event.payload)
                  : taskApiEvents.taskDeletedFailure(
                      'This task no longer exists'
                    )
              ),
              catchError((error: { message: string }) =>
                of(taskApiEvents.taskDeletedFailure(error.message))
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
                    map(() =>
                      taskApiEvents.taskStatusChangedSuccess({
                        id: event.payload.id,
                        status: event.payload.status,
                      })
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
