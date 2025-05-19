import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskStore, TASK_BOARD_INITIAL_STATE } from './task.store';
import { TaskService } from '../services/task.service';
import { Task } from '../interfaces/task';
import { of, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { runInInjectionContext } from '@angular/core';

describe('TaskStore', () => {
  let store: InstanceType<typeof TaskStore>;
  let mockTaskService: Partial<TaskService>;
  let injector: TestBed;

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Description 1',
      status: 'todo',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Description 2',
      status: 'in-progress',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: '3',
      title: 'Test Task 3',
      description: 'Description 3',
      status: 'done',
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    mockTaskService = {
      getTasks: vi.fn(),
      createTask: vi.fn(),
      deleteTask: vi.fn(),
      updateTaskStatus: vi.fn(),
    };

    injector = TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskService, useValue: mockTaskService },
        {
          provide: TASK_BOARD_INITIAL_STATE,
          useValue: {
            isLoading: false,
            pageSize: 10,
            pageCount: 1,
            currentPage: 1,
          },
        },
      ],
    });

    // Create a new instance of the store for each test using runInInjectionContext
    store = runInInjectionContext(injector, () => new TaskStore());
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      expect(store.isLoading()).toBe(false);
      expect(store.pageSize()).toBe(10);
      expect(store.pageCount()).toBe(1);
      expect(store.currentPage()).toBe(1);
      expect(store.taskEntities()).toEqual([]);
    });
  });

  describe('Computed Selectors', () => {
    beforeEach(() => {
      store.updateTasks(mockTasks);
    });

    it('should filter todo tasks correctly', () => {
      expect(store.tasksTodo()).toHaveLength(1);
      expect(store.tasksTodo()[0].status).toBe('todo');
    });

    it('should filter in-progress tasks correctly', () => {
      expect(store.tasksInProgress()).toHaveLength(1);
      expect(store.tasksInProgress()[0].status).toBe('in-progress');
    });

    it('should filter done tasks correctly', () => {
      expect(store.tasksDone()).toHaveLength(1);
      expect(store.tasksDone()[0].status).toBe('done');
    });

    it('should calculate total tasks correctly', () => {
      expect(store.totalTasks()).toBe(3);
    });
  });

  describe('Methods', () => {
    describe('fetchTasks', () => {
      it('should fetch tasks successfully', async () => {
        const mockResponse = {
          tasks: mockTasks,
          totalPages: 2,
        };
        mockTaskService.getTasks = vi.fn().mockReturnValue(of(mockResponse));

        await store.fetchTasks(1);

        expect(mockTaskService.getTasks).toHaveBeenCalledWith(1, 10);
        expect(store.taskEntities()).toEqual(mockTasks);
        expect(store.pageCount()).toBe(2);
        expect(store.currentPage()).toBe(1);
        expect(store.isLoading()).toBe(false);
      });

      it('should handle error when fetching tasks', async () => {
        const error = new Error('Failed to fetch tasks');
        mockTaskService.getTasks = vi
          .fn()
          .mockReturnValue(throwError(() => error));

        await store.fetchTasks(1);

        expect(store.isLoading()).toBe(false);
        expect(store.taskEntities()).toEqual([]);
      });
    });

    describe('createTask', () => {
      it('should create task successfully', async () => {
        const newTask: Omit<Task, 'id' | 'createdAt'> = {
          title: 'New Task',
          description: 'New Description',
          status: 'todo',
        };

        const createdTask: Task = {
          ...newTask,
          id: '4',
          createdAt: '2025-01-01T00:00:00.000Z',
        };

        mockTaskService.createTask = vi.fn().mockReturnValue(of(createdTask));

        const result = await store.createTask(newTask);

        expect(mockTaskService.createTask).toHaveBeenCalledWith(newTask);
        expect(result).toEqual(createdTask);
        expect(store.taskEntities()).toContainEqual(createdTask);
      });

      it('should handle error when creating task', async () => {
        const newTask: Omit<Task, 'id' | 'createdAt'> = {
          title: 'New Task',
          description: 'New Description',
          status: 'todo',
        };

        const error = new Error('Failed to create task');
        mockTaskService.createTask = vi
          .fn()
          .mockReturnValue(throwError(() => error));

        await expect(store.createTask(newTask)).rejects.toThrow(
          'Failed to create task'
        );
      });
    });

    describe('deleteTask', () => {
      beforeEach(() => {
        store.updateTasks(mockTasks);
      });

      it('should delete task successfully', async () => {
        mockTaskService.deleteTask = vi.fn().mockReturnValue(of(true));

        const result = await store.deleteTask('1');

        expect(mockTaskService.deleteTask).toHaveBeenCalledWith('1');
        expect(result).toBe(true);
        expect(store.taskEntities()).not.toContainEqual(mockTasks[0]);
      });

      it('should handle error when deleting task', async () => {
        const error = new Error('Failed to delete task');
        mockTaskService.deleteTask = vi
          .fn()
          .mockReturnValue(throwError(() => error));

        await expect(store.deleteTask('1')).rejects.toThrow(
          'Failed to delete task'
        );
      });
    });

    describe('changeTaskStatus', () => {
      beforeEach(() => {
        store.updateTasks(mockTasks);
      });

      it('should change task status successfully', async () => {
        mockTaskService.updateTaskStatus = vi.fn().mockReturnValue(of(true));

        await store.changeTaskStatus('1', 'in-progress');

        expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(
          '1',
          'in-progress'
        );
        expect(
          store.taskEntities().find((t: Task) => t.id === '1')?.status
        ).toBe('in-progress');
      });

      it('should handle error when changing task status', async () => {
        const error = new Error('Failed to update task status');
        mockTaskService.updateTaskStatus = vi
          .fn()
          .mockReturnValue(throwError(() => error));

        await expect(
          store.changeTaskStatus('1', 'in-progress')
        ).rejects.toThrow(error);
        expect(
          store.taskEntities().find((t: Task) => t.id === '1')?.status
        ).toBe('todo');
      });
    });
  });

  describe('status revert functionality', () => {
    it('should revert status on API error', async () => {
      // First add a task to the store
      mockTaskService.getTasks = vi
        .fn()
        .mockReturnValue(of({ tasks: [mockTasks[0]], totalPages: 1 }));
      await store.fetchTasks(1);

      // Mock the API call to fail
      const error = new Error('Update failed');
      mockTaskService.updateTaskStatus = vi
        .fn()
        .mockReturnValue(throwError(() => error));

      await expect(store.changeTaskStatus('1', 'in-progress')).rejects.toThrow(
        error
      );

      // Verify the status was reverted
      const task = store.taskEntities().find(t => t.id === '1');
      expect(task?.status).toBe('todo');
    });

    it('should handle non-existent task', async () => {
      mockTaskService.updateTaskStatus = vi.fn().mockReturnValue(of(true));

      await store.changeTaskStatus('non-existent', 'in-progress');

      // Verify no changes were made
      expect(store.taskEntities()).toEqual([]);
    });

    it('should handle multiple status changes and reverts', async () => {
      // First add a task to the store
      mockTaskService.getTasks = vi
        .fn()
        .mockReturnValue(of({ tasks: [mockTasks[0]], totalPages: 1 }));
      await store.fetchTasks(1);

      // First status change succeeds
      mockTaskService.updateTaskStatus = vi.fn().mockReturnValue(of(true));
      await store.changeTaskStatus('1', 'in-progress');
      expect(store.taskEntities()[0].status).toBe('in-progress');

      // Second status change fails and reverts
      const error = new Error('Update failed');
      mockTaskService.updateTaskStatus = vi
        .fn()
        .mockReturnValue(throwError(() => error));

      await expect(store.changeTaskStatus('1', 'done')).rejects.toThrow(error);
      expect(store.taskEntities()[0].status).toBe('in-progress');
    });
  });
});
