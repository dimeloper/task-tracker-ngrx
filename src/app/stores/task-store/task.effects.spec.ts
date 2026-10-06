import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { inject } from '@angular/core';
import { signalStore, withState, type } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { Events, injectDispatch } from '@ngrx/signals/events';
import { of, Subject, throwError } from 'rxjs';
import { withTaskEffects } from './task.effects';
import { TASK_BOARD_INITIAL_STATE } from './task-store.config';
import { TaskService } from '../../services/task.service';
import { taskApiEvents, taskPageEvents } from './task.events';
import { Task, TaskStatus } from '../../interfaces/task';

// The effects on their own: no reducer, so state only changes when a test says
// so, and what an effect produces is read off the event stream.
const EffectsStore = signalStore(
  withEntities({ entity: type<Task>(), collection: 'task' }),
  withState(() => inject(TASK_BOARD_INITIAL_STATE)),
  withTaskEffects()
);

describe('Task Effects', () => {
  let mockTaskService: {
    getTasks: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
    updateTaskStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTaskService = {
      getTasks: vi.fn(),
      deleteTask: vi.fn(),
      updateTaskStatus: vi.fn(),
    };
  });

  /** Builds the store and records every API event the effects dispatch. */
  function setUp(initialPage = 1) {
    TestBed.configureTestingModule({
      providers: [
        EffectsStore,
        { provide: TaskService, useValue: mockTaskService },
        {
          provide: TASK_BOARD_INITIAL_STATE,
          useValue: {
            isLoading: false,
            error: null,
            pageSize: 10,
            pageCount: 3,
            currentPage: initialPage,
            taskEdit: null,
          },
        },
      ],
    });

    TestBed.inject(EffectsStore);
    const emitted: { type: string; payload?: unknown }[] = [];
    TestBed.inject(Events)
      .on(...Object.values(taskApiEvents))
      .subscribe(event => emitted.push(event));
    const dispatch = TestBed.runInInjectionContext(() =>
      injectDispatch(taskPageEvents)
    );
    return { dispatch, emitted };
  }

  const task: Task = {
    id: '1',
    title: 'Water the plants',
    status: TaskStatus.TODO,
    createdAt: '2026-10-06T00:00:00.000Z',
  };

  describe('loadTasks$', () => {
    it('loads the current page when the board opens', () => {
      mockTaskService.getTasks.mockReturnValue(
        of({ tasks: [task], totalPages: 3 })
      );
      const { dispatch, emitted } = setUp(2);

      dispatch.opened();

      expect(mockTaskService.getTasks).toHaveBeenCalledWith(2, 10);
      expect(emitted).toEqual([
        taskApiEvents.tasksLoadedSuccess({ tasks: [task], totalPages: 3 }),
      ]);
    });

    it('turns a failed load into tasksLoadedFailure', () => {
      mockTaskService.getTasks.mockReturnValue(
        throwError(() => ({ message: 'Network error' }))
      );
      const { dispatch, emitted } = setUp();

      dispatch.opened();

      expect(emitted).toEqual([
        taskApiEvents.tasksLoadedFailure('Network error'),
      ]);
    });

    it('drops a page that is still loading when another is asked for', () => {
      const slowFirstPage = new Subject<{
        tasks: Task[];
        totalPages: number;
      }>();
      const secondPage = { tasks: [{ ...task, id: '11' }], totalPages: 3 };
      mockTaskService.getTasks
        .mockReturnValueOnce(slowFirstPage)
        .mockReturnValueOnce(of(secondPage));
      const { dispatch, emitted } = setUp();

      dispatch.opened();
      dispatch.pageChanged(2);
      // The first page answers late; showing it now would be the wrong page.
      slowFirstPage.next({ tasks: [task], totalPages: 3 });

      expect(emitted).toEqual([taskApiEvents.tasksLoadedSuccess(secondPage)]);
    });
  });

  describe('deleteTask$', () => {
    it('reports a delete the server confirms', () => {
      mockTaskService.deleteTask.mockReturnValue(of(true));
      const { dispatch, emitted } = setUp();

      dispatch.taskDeleted('1');

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith('1');
      expect(emitted).toEqual([taskApiEvents.taskDeletedSuccess('1')]);
    });

    it('reports a failure when the server finds nothing to delete', () => {
      mockTaskService.deleteTask.mockReturnValue(of(false));
      const { dispatch, emitted } = setUp();

      dispatch.taskDeleted('missing');

      expect(emitted).toEqual([
        taskApiEvents.taskDeletedFailure('This task no longer exists'),
      ]);
    });

    it('reports a failure when the request errors', () => {
      mockTaskService.deleteTask.mockReturnValue(
        throwError(() => ({ message: 'Deletion failed' }))
      );
      const { dispatch, emitted } = setUp();

      dispatch.taskDeleted('1');

      expect(emitted).toEqual([
        taskApiEvents.taskDeletedFailure('Deletion failed'),
      ]);
    });
  });

  describe('changeTaskStatus$', () => {
    it('reports a move the server accepts', () => {
      mockTaskService.updateTaskStatus.mockReturnValue(of(true));
      const { dispatch, emitted } = setUp();

      dispatch.taskStatusChanged({
        id: '1',
        status: TaskStatus.IN_PROGRESS,
        previousStatus: TaskStatus.TODO,
      });

      expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(
        '1',
        TaskStatus.IN_PROGRESS
      );
      expect(emitted).toEqual([
        taskApiEvents.taskStatusChangedSuccess({
          id: '1',
          status: TaskStatus.IN_PROGRESS,
        }),
      ]);
    });

    it('carries the previous status into the failure, for the rollback', () => {
      mockTaskService.updateTaskStatus.mockReturnValue(
        throwError(() => ({ message: 'Update failed' }))
      );
      const { dispatch, emitted } = setUp();

      dispatch.taskStatusChanged({
        id: '1',
        status: TaskStatus.DONE,
        previousStatus: TaskStatus.IN_PROGRESS,
      });

      expect(emitted).toEqual([
        taskApiEvents.taskStatusChangedFailure({
          id: '1',
          previousStatus: TaskStatus.IN_PROGRESS,
          error: 'Update failed',
        }),
      ]);
    });
  });

  describe('concurrent clicks', () => {
    it('sends a status change for a second task while the first is still saving', () => {
      const firstSave = new Subject<boolean>();
      mockTaskService.updateTaskStatus
        .mockReturnValueOnce(firstSave)
        .mockReturnValueOnce(of(true));
      const { dispatch } = setUp();

      dispatch.taskStatusChanged({
        id: '1',
        status: TaskStatus.IN_PROGRESS,
        previousStatus: TaskStatus.TODO,
      });
      dispatch.taskStatusChanged({
        id: '2',
        status: TaskStatus.IN_PROGRESS,
        previousStatus: TaskStatus.TODO,
      });

      expect(mockTaskService.updateTaskStatus).toHaveBeenCalledTimes(2);
      expect(mockTaskService.updateTaskStatus).toHaveBeenLastCalledWith(
        '2',
        TaskStatus.IN_PROGRESS
      );
    });

    it('sends moves of the same task in the order they were made', () => {
      const firstSave = new Subject<boolean>();
      mockTaskService.updateTaskStatus
        .mockReturnValueOnce(firstSave)
        .mockReturnValueOnce(of(true));
      const { dispatch } = setUp();

      dispatch.taskStatusChanged({
        id: '1',
        status: TaskStatus.IN_PROGRESS,
        previousStatus: TaskStatus.TODO,
      });
      dispatch.taskStatusChanged({
        id: '1',
        status: TaskStatus.DONE,
        previousStatus: TaskStatus.IN_PROGRESS,
      });

      // Sent together, "done" could land before "in progress" and the server
      // would finish on the older status.
      expect(mockTaskService.updateTaskStatus).toHaveBeenCalledTimes(1);

      firstSave.next(true);
      firstSave.complete();

      expect(mockTaskService.updateTaskStatus).toHaveBeenCalledTimes(2);
      expect(mockTaskService.updateTaskStatus).toHaveBeenLastCalledWith(
        '1',
        TaskStatus.DONE
      );
    });

    it('sends a second delete while the first is still in flight', () => {
      const firstDelete = new Subject<boolean>();
      mockTaskService.deleteTask
        .mockReturnValueOnce(firstDelete)
        .mockReturnValueOnce(of(true));
      const { dispatch } = setUp();

      dispatch.taskDeleted('1');
      dispatch.taskDeleted('2');

      expect(mockTaskService.deleteTask).toHaveBeenCalledTimes(2);
      expect(mockTaskService.deleteTask).toHaveBeenLastCalledWith('2');
    });
  });
});
