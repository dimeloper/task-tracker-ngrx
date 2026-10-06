import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { inject } from '@angular/core';
import { patchState, signalStore, withState, type } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { injectDispatch } from '@ngrx/signals/events';
import { unprotected } from '@ngrx/signals/testing';
import { withTaskReducer } from './task.reducer';
import { TASK_BOARD_INITIAL_STATE } from './task-store.config';
import { taskApiEvents, taskPageEvents } from './task.events';
import { Task, TaskStatus } from '../../interfaces/task';

// The reducer on its own: events in, state out, no effects or service.
const ReducerStore = signalStore(
  withEntities({ entity: type<Task>(), collection: 'task' }),
  withState(() => inject(TASK_BOARD_INITIAL_STATE)),
  withTaskReducer()
);

const task = (overrides: Partial<Task> = {}): Task => ({
  id: '1',
  title: 'Water the plants',
  description: 'Balcony first',
  status: TaskStatus.TODO,
  createdAt: '2026-10-06T00:00:00.000Z',
  ...overrides,
});

describe('Task Reducer', () => {
  let store: InstanceType<typeof ReducerStore>;
  let page: ReturnType<typeof injectDispatch<typeof taskPageEvents>>;
  let api: ReturnType<typeof injectDispatch<typeof taskApiEvents>>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ReducerStore] });
    store = TestBed.inject(ReducerStore);
    page = TestBed.runInInjectionContext(() => injectDispatch(taskPageEvents));
    api = TestBed.runInInjectionContext(() => injectDispatch(taskApiEvents));
  });

  const load = (...tasks: Task[]) =>
    api.tasksLoadedSuccess({ tasks, totalPages: 1 });

  describe('loading', () => {
    it('starts loading when the board opens', () => {
      page.opened();
      expect(store.isLoading()).toBe(true);
    });

    it('stores the page it is asked for and starts loading it', () => {
      page.pageChanged(2);
      expect(store.currentPage()).toBe(2);
      expect(store.isLoading()).toBe(true);
    });

    it('replaces the tasks and records the page count on success', () => {
      page.opened();
      api.tasksLoadedSuccess({ tasks: [task()], totalPages: 3 });

      expect(store.taskEntities()).toEqual([task()]);
      expect(store.pageCount()).toBe(3);
      expect(store.isLoading()).toBe(false);
    });

    it('never records fewer than one page, even for an empty result', () => {
      api.tasksLoadedSuccess({ tasks: [], totalPages: 0 });
      expect(store.pageCount()).toBe(1);
    });

    it('keeps the error, and clears it on the next successful load', () => {
      api.tasksLoadedFailure('Network error');
      expect(store.error()).toBe('Network error');
      expect(store.isLoading()).toBe(false);

      load(task());
      expect(store.error()).toBeNull();
    });
  });

  describe('creating and editing', () => {
    it('adds a created task', () => {
      load(task());
      api.taskCreatedSuccess(task({ id: '2', title: 'Fold the laundry' }));
      expect(store.taskEntities().map(t => t.id)).toEqual(['1', '2']);
    });

    it('applies a saved edit and closes the editor', () => {
      load(task());
      patchState(unprotected(store), {
        taskEdit: { id: '1', title: 'Water the herbs', description: '' },
      });

      api.taskUpdatedSuccess(
        task({ title: 'Water the herbs', description: '' })
      );

      expect(store.taskEntities()[0].title).toBe('Water the herbs');
      expect(store.taskEdit()).toBeNull();
    });

    it('keeps a status move that is still in flight when an edit is saved', () => {
      load(task());
      // The card was moved, and the server's copy of the task predates it.
      page.taskStatusChanged({
        id: '1',
        status: TaskStatus.IN_PROGRESS,
        previousStatus: TaskStatus.TODO,
      });

      api.taskUpdatedSuccess(
        task({ title: 'Renamed', status: TaskStatus.TODO })
      );

      expect(store.taskEntities()[0]).toMatchObject({
        title: 'Renamed',
        status: TaskStatus.IN_PROGRESS,
      });
    });

    it('leaves the board alone when a create or an edit fails', () => {
      load(task());
      api.taskCreatedFailure('A task with this title already exists');
      api.taskUpdatedFailure('A task with this title already exists');

      // The form that asked shows the message; the board has nothing to say.
      expect(store.error()).toBeNull();
      expect(store.taskEntities()).toEqual([task()]);
    });
  });

  describe('deleting', () => {
    it('removes a deleted task', () => {
      load(task(), task({ id: '2' }));
      api.taskDeletedSuccess('1');
      expect(store.taskEntities().map(t => t.id)).toEqual(['2']);
    });

    it('closes the editor when the task being edited is deleted', () => {
      load(task());
      patchState(unprotected(store), {
        taskEdit: { id: '1', title: 'Half typed', description: '' },
      });

      api.taskDeletedSuccess('1');

      expect(store.taskEdit()).toBeNull();
    });

    it('leaves the editor open when a different task is deleted', () => {
      load(task(), task({ id: '2' }));
      const edit = { id: '1', title: 'Half typed', description: '' };
      patchState(unprotected(store), { taskEdit: edit });

      api.taskDeletedSuccess('2');

      expect(store.taskEdit()).toEqual(edit);
    });

    it('keeps the task and reports why when a delete fails', () => {
      load(task());
      api.taskDeletedFailure('This task no longer exists');

      expect(store.taskEntities()).toEqual([task()]);
      expect(store.error()).toBe('This task no longer exists');
    });
  });

  describe('moving between columns', () => {
    it('moves the card before the server answers', () => {
      load(task());
      page.taskStatusChanged({
        id: '1',
        status: TaskStatus.DONE,
        previousStatus: TaskStatus.TODO,
      });
      expect(store.taskEntities()[0].status).toBe(TaskStatus.DONE);
    });

    it('moves the card back and reports why when the server refuses', () => {
      load(task());
      page.taskStatusChanged({
        id: '1',
        status: TaskStatus.DONE,
        previousStatus: TaskStatus.TODO,
      });

      api.taskStatusChangedFailure({
        id: '1',
        previousStatus: TaskStatus.TODO,
        error: 'Server error',
      });

      expect(store.taskEntities()[0].status).toBe(TaskStatus.TODO);
      expect(store.error()).toBe('Server error');
    });
  });

  it('clears the error when it is dismissed', () => {
    api.tasksLoadedFailure('Network error');
    page.errorDismissed();
    expect(store.error()).toBeNull();
  });
});
