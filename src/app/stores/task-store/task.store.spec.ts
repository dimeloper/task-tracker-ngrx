import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TaskStore } from './task.store';
import { TaskService } from '../../services/task.service';

describe('TaskStore', () => {
  let store: InstanceType<typeof TaskStore>;
  let mockTaskService: { getTasks: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockTaskService = {
      getTasks: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TaskStore,
        { provide: TaskService, useValue: mockTaskService },
      ],
    });

    store = TestBed.inject(TaskStore);
  });

  describe('Initial State', () => {
    it('should have initial state', () => {
      expect(store.isLoading()).toBe(false);
      expect(store.pageSize()).toBe(10);
      expect(store.pageCount()).toBe(1);
      expect(store.currentPage()).toBe(1);
    });

    it('should have empty task entities initially', () => {
      expect(store.taskEntities().length).toBe(0);
    });

    it('should have empty computed views initially', () => {
      expect(store.tasksTodo().length).toBe(0);
      expect(store.tasksInProgress().length).toBe(0);
      expect(store.tasksDone().length).toBe(0);
    });
  });

  describe('Signal Store Features', () => {
    it('should expose all required signals', () => {
      expect(store.taskEntities).toBeDefined();
      expect(store.isLoading).toBeDefined();
      expect(store.pageSize).toBeDefined();
      expect(store.pageCount).toBeDefined();
      expect(store.currentPage).toBeDefined();
      expect(store.tasksTodo).toBeDefined();
      expect(store.tasksInProgress).toBeDefined();
      expect(store.tasksDone).toBeDefined();
    });

    it('should have signals that return values when called', () => {
      expect(typeof store.taskEntities).toBe('function');
      expect(typeof store.isLoading).toBe('function');
      expect(typeof store.tasksTodo).toBe('function');

      expect(Array.isArray(store.taskEntities())).toBe(true);
      expect(typeof store.isLoading()).toBe('boolean');
      expect(Array.isArray(store.tasksTodo())).toBe(true);
    });
  });

  describe('Computed Task Views', () => {
    it('should have computed signals defined for filtering tasks by status', () => {
      // Verify computed signals exist
      // Note: In real usage, state is updated via events
      expect(store.tasksTodo).toBeDefined();
      expect(store.tasksInProgress).toBeDefined();
      expect(store.tasksDone).toBeDefined();

      expect(typeof store.tasksTodo).toBe('function');
      expect(typeof store.tasksInProgress).toBe('function');
      expect(typeof store.tasksDone).toBe('function');
    });

    it('should return empty arrays when no tasks match status', () => {
      const todo = store.tasksTodo();
      const inProgress = store.tasksInProgress();
      const done = store.tasksDone();

      expect(todo).toEqual([]);
      expect(inProgress).toEqual([]);
      expect(done).toEqual([]);
    });
  });

  describe('Event-Driven Architecture', () => {
    it('should be injectable and ready for event dispatching', () => {
      expect(store).toBeDefined();
      expect(store.taskEntities).toBeDefined();
      expect(store.isLoading).toBeDefined();
    });

    it('should have proper store composition with all features', () => {
      // Verify store has entity management
      expect(store.taskEntities).toBeDefined();

      // Verify store has state properties
      expect(store.isLoading).toBeDefined();
      expect(store.pageSize).toBeDefined();
      expect(store.currentPage).toBeDefined();

      // Verify store has computed properties
      expect(store.tasksTodo).toBeDefined();
      expect(store.tasksInProgress).toBeDefined();
      expect(store.tasksDone).toBeDefined();
    });

    it('should initialize with correct default state values', () => {
      expect(store.isLoading()).toBe(false);
      expect(store.pageSize()).toBe(10);
      expect(store.pageCount()).toBe(1);
      expect(store.currentPage()).toBe(1);
      expect(store.taskEntities().length).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should work with dependency injection', () => {
      const injectedStore = TestBed.inject(TaskStore);
      expect(injectedStore).toBeDefined();
      expect(injectedStore).toBe(store);
    });

    it('should be a singleton when provided at root', () => {
      const store1 = TestBed.inject(TaskStore);
      const store2 = TestBed.inject(TaskStore);
      expect(store1).toBe(store2);
    });
  });
});
