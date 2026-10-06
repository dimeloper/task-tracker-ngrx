import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signalStore, withState, type } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { withTaskEffects } from './task.effects';
import { TaskService } from '../../services/task.service';
import { taskPageEvents } from './task.events';
import { Task, TaskStatus } from '../../interfaces/task';
import { of, Subject, throwError } from 'rxjs';
import { injectDispatch } from '@ngrx/signals/events';

describe('Task Effects', () => {
  let mockTaskService: {
    getTasks: ReturnType<typeof vi.fn>;
    createTask: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
    updateTaskStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockTaskService = {
      getTasks: vi.fn(),
      createTask: vi.fn(),
      deleteTask: vi.fn(),
      updateTaskStatus: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TaskService, useValue: mockTaskService }],
    });
  });

  describe('loadTasks$ effect', () => {
    it('should call getTasks service method when opened event is dispatched', async () => {
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Test Task',
          status: TaskStatus.TODO,
          createdAt: new Date().toISOString(),
        },
      ];
      mockTaskService.getTasks.mockReturnValue(
        of({ tasks: mockTasks, totalPages: 1 })
      );

      const TestStore = signalStore(
        withState({ isLoading: false }),
        withEntities({ entity: type<Task>(), collection: 'task' }),
        withTaskEffects()
      );

      TestBed.configureTestingModule({
        providers: [
          TestStore,
          { provide: TaskService, useValue: mockTaskService },
        ],
      });

      TestBed.inject(TestStore);
      const dispatch = TestBed.runInInjectionContext(() =>
        injectDispatch(taskPageEvents)
      );

      dispatch.opened();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskService.getTasks).toHaveBeenCalledWith(1, 10);
    });

    it('should dispatch tasksLoadedFailure on service error', async () => {
      mockTaskService.getTasks.mockReturnValue(
        throwError(() => ({ message: 'Network error' }))
      );

      const TestStore = signalStore(
        withState({ isLoading: false }),
        withEntities({ entity: type<Task>(), collection: 'task' }),
        withTaskEffects()
      );

      TestBed.configureTestingModule({
        providers: [
          TestStore,
          { provide: TaskService, useValue: mockTaskService },
        ],
      });

      TestBed.inject(TestStore);
      const dispatch = TestBed.runInInjectionContext(() =>
        injectDispatch(taskPageEvents)
      );

      dispatch.opened();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskService.getTasks).toHaveBeenCalled();
    });
  });

  describe('createTask$ effect', () => {
    it('should call createTask service method when taskCreated event is dispatched', async () => {
      const newTask: Task = {
        id: '2',
        title: 'New Task',
        description: 'Description',
        status: TaskStatus.TODO,
        createdAt: new Date().toISOString(),
      };
      mockTaskService.createTask.mockReturnValue(of(newTask));

      const TestStore = signalStore(
        withState({ isLoading: false }),
        withEntities({ entity: type<Task>(), collection: 'task' }),
        withTaskEffects()
      );

      TestBed.configureTestingModule({
        providers: [
          TestStore,
          { provide: TaskService, useValue: mockTaskService },
        ],
      });

      TestBed.inject(TestStore);
      const dispatch = TestBed.runInInjectionContext(() =>
        injectDispatch(taskPageEvents)
      );

      dispatch.taskCreated({
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
      });
    });

    it('should dispatch taskCreatedFailure on service error', async () => {
      mockTaskService.createTask.mockReturnValue(
        throwError(() => ({ message: 'Creation failed' }))
      );

      const TestStore = signalStore(
        withState({ isLoading: false }),
        withEntities({ entity: type<Task>(), collection: 'task' }),
        withTaskEffects()
      );

      TestBed.configureTestingModule({
        providers: [
          TestStore,
          { provide: TaskService, useValue: mockTaskService },
        ],
      });

      TestBed.inject(TestStore);
      const dispatch = TestBed.runInInjectionContext(() =>
        injectDispatch(taskPageEvents)
      );

      dispatch.taskCreated({
        title: 'Test',
        status: TaskStatus.TODO,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskService.createTask).toHaveBeenCalled();
    });
  });

  describe('deleteTask$ effect', () => {
    it('should call deleteTask service method when taskDeleted event is dispatched', async () => {
      const taskId = '1';
      mockTaskService.deleteTask.mockReturnValue(of(void 0));

      const TestStore = signalStore(
        withState({ isLoading: false }),
        withEntities({ entity: type<Task>(), collection: 'task' }),
        withTaskEffects()
      );

      TestBed.configureTestingModule({
        providers: [
          TestStore,
          { provide: TaskService, useValue: mockTaskService },
        ],
      });

      TestBed.inject(TestStore);
      const dispatch = TestBed.runInInjectionContext(() =>
        injectDispatch(taskPageEvents)
      );

      dispatch.taskDeleted(taskId);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(taskId);
    });

    it('should dispatch taskDeletedFailure on service error', async () => {
      mockTaskService.deleteTask.mockReturnValue(
        throwError(() => ({ message: 'Deletion failed' }))
      );

      const TestStore = signalStore(
        withState({ isLoading: false }),
        withEntities({ entity: type<Task>(), collection: 'task' }),
        withTaskEffects()
      );

      TestBed.configureTestingModule({
        providers: [
          TestStore,
          { provide: TaskService, useValue: mockTaskService },
        ],
      });

      TestBed.inject(TestStore);
      const dispatch = TestBed.runInInjectionContext(() =>
        injectDispatch(taskPageEvents)
      );

      dispatch.taskDeleted('1');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskService.deleteTask).toHaveBeenCalled();
    });
  });

  describe('changeTaskStatus$ effect', () => {
    it('should call updateTaskStatus service method when taskStatusChanged event is dispatched', async () => {
      const taskId = '1';
      const newStatus = TaskStatus.IN_PROGRESS;
      mockTaskService.updateTaskStatus.mockReturnValue(of(void 0));

      const TestStore = signalStore(
        withState({ isLoading: false }),
        withEntities({ entity: type<Task>(), collection: 'task' }),
        withTaskEffects()
      );

      TestBed.configureTestingModule({
        providers: [
          TestStore,
          { provide: TaskService, useValue: mockTaskService },
        ],
      });

      TestBed.inject(TestStore);
      const dispatch = TestBed.runInInjectionContext(() =>
        injectDispatch(taskPageEvents)
      );

      dispatch.taskStatusChanged({ id: taskId, status: newStatus });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(
        taskId,
        newStatus
      );
    });

    it('should dispatch taskStatusChangedFailure on service error', async () => {
      mockTaskService.updateTaskStatus.mockReturnValue(
        throwError(() => ({ message: 'Update failed' }))
      );

      const TestStore = signalStore(
        withState({ isLoading: false }),
        withEntities({ entity: type<Task>(), collection: 'task' }),
        withTaskEffects()
      );

      TestBed.configureTestingModule({
        providers: [
          TestStore,
          { provide: TaskService, useValue: mockTaskService },
        ],
      });

      TestBed.inject(TestStore);
      const dispatch = TestBed.runInInjectionContext(() =>
        injectDispatch(taskPageEvents)
      );

      dispatch.taskStatusChanged({ id: '1', status: TaskStatus.DONE });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockTaskService.updateTaskStatus).toHaveBeenCalled();
    });
  });

  // The status reducer moves a card before the server answers, so every move
  // that is clicked has to reach the server, or the board and the server
  // disagree with nothing left to roll the card back. A request is held open
  // with a Subject here so the next click lands while it is still in flight.
  describe('concurrent clicks', () => {
    function setUp() {
      const TestStore = signalStore(
        withState({ isLoading: false }),
        withEntities({ entity: type<Task>(), collection: 'task' }),
        withTaskEffects()
      );

      TestBed.configureTestingModule({
        providers: [
          TestStore,
          { provide: TaskService, useValue: mockTaskService },
        ],
      });

      TestBed.inject(TestStore);
      return TestBed.runInInjectionContext(() =>
        injectDispatch(taskPageEvents)
      );
    }

    it('sends a status change for a second task while the first is still saving', () => {
      const firstSave = new Subject<boolean>();
      mockTaskService.updateTaskStatus
        .mockReturnValueOnce(firstSave)
        .mockReturnValueOnce(of(true));
      const dispatch = setUp();

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
      const dispatch = setUp();

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
      const dispatch = setUp();

      dispatch.taskDeleted('1');
      dispatch.taskDeleted('2');

      expect(mockTaskService.deleteTask).toHaveBeenCalledTimes(2);
      expect(mockTaskService.deleteTask).toHaveBeenLastCalledWith('2');
    });
  });
});
