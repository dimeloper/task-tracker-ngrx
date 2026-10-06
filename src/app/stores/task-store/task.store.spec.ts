import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { injectDispatch } from '@ngrx/signals/events';
import { TaskStore } from './task.store';
import { TaskService } from '../../services/task.service';
import { Task, TaskStatus } from '../../interfaces/task';
import { taskPageEvents } from './task.events';

// The whole store against a stubbed service. The stubs answer synchronously, so
// events, reducer and effects have all run by the time a dispatch returns.
describe('TaskStore', () => {
  let store: InstanceType<typeof TaskStore>;
  let dispatch: ReturnType<typeof injectDispatch<typeof taskPageEvents>>;
  let mockTaskService: {
    getTasks: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
    updateTaskStatus: ReturnType<typeof vi.fn>;
  };

  const task = (overrides: Partial<Task> = {}): Task => ({
    id: '1',
    title: 'Water the plants',
    description: 'Balcony first',
    status: TaskStatus.TODO,
    createdAt: '2026-10-06T00:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    mockTaskService = {
      getTasks: vi.fn().mockReturnValue(of({ tasks: [task()], totalPages: 1 })),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      updateTaskStatus: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskService, useValue: mockTaskService },
      ],
    });

    store = TestBed.inject(TaskStore);
    dispatch = TestBed.runInInjectionContext(() =>
      injectDispatch(taskPageEvents)
    );
  });

  it('starts empty, on the first page, with nothing being edited', () => {
    expect(store.taskEntities()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.currentPage()).toBe(1);
    expect(store.pageSize()).toBe(10);
    expect(store.taskEdit()).toBeNull();
  });

  describe('loading', () => {
    it('loads the first page into the columns when the board opens', () => {
      mockTaskService.getTasks.mockReturnValue(
        of({
          tasks: [
            task(),
            task({ id: '2', status: TaskStatus.IN_PROGRESS }),
            task({ id: '3', status: TaskStatus.DONE }),
          ],
          totalPages: 2,
        })
      );

      dispatch.opened();

      expect(mockTaskService.getTasks).toHaveBeenCalledWith(1, 10);
      expect(store.tasksTodo().map(t => t.id)).toEqual(['1']);
      expect(store.tasksInProgress().map(t => t.id)).toEqual(['2']);
      expect(store.tasksDone().map(t => t.id)).toEqual(['3']);
      expect(store.pageCount()).toBe(2);
      expect(store.isLoading()).toBe(false);
    });

    it('loads the page that is asked for', () => {
      mockTaskService.getTasks.mockReturnValue(
        of({ tasks: [task({ id: '11' })], totalPages: 2 })
      );

      dispatch.pageChanged(2);

      expect(mockTaskService.getTasks).toHaveBeenCalledWith(2, 10);
      expect(store.currentPage()).toBe(2);
      expect(store.taskEntities().map(t => t.id)).toEqual(['11']);
    });

    it('shows a load failure until it is dismissed', () => {
      mockTaskService.getTasks.mockReturnValue(
        throwError(() => ({ message: 'Network error' }))
      );

      dispatch.opened();
      expect(store.error()).toBe('Network error');
      expect(store.isLoading()).toBe(false);

      dispatch.errorDismissed();
      expect(store.error()).toBeNull();
    });
  });

  describe('createTask mutation', () => {
    it('creates a to-do task and resolves with it', async () => {
      const created = task({ id: '2', title: 'Fold the laundry' });
      mockTaskService.createTask.mockReturnValue(of(created));
      dispatch.opened();

      const result = await store.createTask({
        title: 'Fold the laundry',
        description: '',
      });

      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'Fold the laundry',
        description: '',
        status: TaskStatus.TODO,
      });
      expect(result).toEqual({ status: 'success', value: created });
      expect(store.tasksTodo().map(t => t.id)).toEqual(['1', '2']);
    });

    it('resolves with the error, so the form can show it', async () => {
      mockTaskService.createTask.mockReturnValue(
        throwError(() => ({ message: 'A task with this title already exists' }))
      );
      dispatch.opened();

      const result = await store.createTask({
        title: 'Water the plants',
        description: '',
      });

      expect(result).toEqual({
        status: 'error',
        error: { message: 'A task with this title already exists' },
      });
      expect(store.taskEntities()).toHaveLength(1);
      // The form owns this message; the board does not repeat it.
      expect(store.error()).toBeNull();
    });
  });

  describe('editing', () => {
    beforeEach(() => dispatch.opened());

    it('starts an edit from the task as it is now', () => {
      store.startEditing('1');
      expect(store.taskEdit()).toEqual({
        id: '1',
        title: 'Water the plants',
        description: 'Balcony first',
      });
    });

    it('ignores a task it does not have', () => {
      store.startEditing('missing');
      expect(store.taskEdit()).toBeNull();
    });

    it('keeps the draft in the store as it changes, without touching the task', () => {
      store.startEditing('1');
      store.updateTaskEdit({
        id: '1',
        title: 'Water the herbs',
        description: '',
      });

      expect(store.taskEdit()?.title).toBe('Water the herbs');
      expect(store.taskEntities()[0].title).toBe('Water the plants');
    });

    it('drops the draft on cancel', () => {
      store.startEditing('1');
      store.stopEditing();
      expect(store.taskEdit()).toBeNull();
    });

    it('saves the draft, updates the task and closes the editor', async () => {
      mockTaskService.updateTask.mockReturnValue(
        of(task({ title: 'Water the herbs', description: '' }))
      );
      store.startEditing('1');
      const edit = { id: '1', title: 'Water the herbs', description: '' };

      const result = await store.saveTaskEdit(edit);

      expect(mockTaskService.updateTask).toHaveBeenCalledWith('1', {
        title: 'Water the herbs',
        description: '',
      });
      expect(result.status).toBe('success');
      expect(store.taskEntities()[0].title).toBe('Water the herbs');
      expect(store.taskEdit()).toBeNull();
    });

    it('keeps the editor open with the draft when saving fails', async () => {
      mockTaskService.updateTask.mockReturnValue(
        throwError(() => ({ message: 'A task with this title already exists' }))
      );
      store.startEditing('1');
      const edit = { id: '1', title: 'Clean the kitchen', description: '' };
      store.updateTaskEdit(edit);

      const result = await store.saveTaskEdit(edit);

      expect(result.status).toBe('error');
      expect(store.taskEdit()).toEqual(edit);
      expect(store.taskEntities()[0].title).toBe('Water the plants');
    });
  });

  describe('deleting', () => {
    beforeEach(() => dispatch.opened());

    it('removes the task once the server confirms', () => {
      mockTaskService.deleteTask.mockReturnValue(of(true));
      dispatch.taskDeleted('1');
      expect(store.taskEntities()).toEqual([]);
    });

    it('keeps the task and says why when the server has nothing to delete', () => {
      mockTaskService.deleteTask.mockReturnValue(of(false));
      dispatch.taskDeleted('1');
      expect(store.taskEntities()).toHaveLength(1);
      expect(store.error()).toBe('This task no longer exists');
    });
  });

  describe('moving between columns', () => {
    beforeEach(() => dispatch.opened());

    it('keeps the move when the server accepts it', () => {
      mockTaskService.updateTaskStatus.mockReturnValue(of(true));

      dispatch.taskStatusChanged({
        id: '1',
        status: TaskStatus.IN_PROGRESS,
        previousStatus: TaskStatus.TODO,
      });

      expect(store.tasksInProgress().map(t => t.id)).toEqual(['1']);
      expect(store.error()).toBeNull();
    });

    it('moves the card back and says why when the server refuses', () => {
      mockTaskService.updateTaskStatus.mockReturnValue(
        throwError(() => ({ message: 'Server error' }))
      );

      dispatch.taskStatusChanged({
        id: '1',
        status: TaskStatus.DONE,
        // Captured before dispatching: by the time the effect runs, the
        // reducer has already moved the card, so the store can't tell it.
        previousStatus: TaskStatus.TODO,
      });

      expect(store.tasksTodo().map(t => t.id)).toEqual(['1']);
      expect(store.error()).toBe('Server error');
    });
  });
});
