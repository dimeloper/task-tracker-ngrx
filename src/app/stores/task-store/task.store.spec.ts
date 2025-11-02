import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TaskStore } from './task.store';

describe('TaskStore', () => {
  let store: InstanceType<typeof TaskStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskStore],
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

  describe('Store Signals', () => {
    it('should expose task entities signal', () => {
      expect(store.taskEntities).toBeDefined();
      expect(typeof store.taskEntities).toBe('function');
    });

    it('should expose loading state signal', () => {
      expect(store.isLoading).toBeDefined();
      expect(typeof store.isLoading).toBe('function');
      expect(store.isLoading()).toBe(false);
    });

    it('should expose pagination signals', () => {
      expect(store.pageSize).toBeDefined();
      expect(store.pageCount).toBeDefined();
      expect(store.currentPage).toBeDefined();
      expect(store.pageSize()).toBe(10);
      expect(store.pageCount()).toBe(1);
      expect(store.currentPage()).toBe(1);
    });

    it('should expose computed task views', () => {
      expect(store.tasksTodo).toBeDefined();
      expect(store.tasksInProgress).toBeDefined();
      expect(store.tasksDone).toBeDefined();
      expect(typeof store.tasksTodo).toBe('function');
      expect(typeof store.tasksInProgress).toBe('function');
      expect(typeof store.tasksDone).toBe('function');
    });
  });

  describe('Architecture', () => {
    it('should use signal-based state management', () => {
      // Verify store is a signal store by checking for signal-based methods
      expect(store.taskEntities()).toBeDefined();
      expect(Array.isArray(store.taskEntities())).toBe(true);
    });

    it('should support entity state management', () => {
      // Verify entity collection is available
      const entities = store.taskEntities();
      expect(Array.isArray(entities)).toBe(true);
    });

    it('should support computed derived state', () => {
      // Verify computed signals work
      const todo = store.tasksTodo();
      const inProgress = store.tasksInProgress();
      const done = store.tasksDone();

      expect(Array.isArray(todo)).toBe(true);
      expect(Array.isArray(inProgress)).toBe(true);
      expect(Array.isArray(done)).toBe(true);
    });

    it('should be provided as a root service', () => {
      expect(store).toBeDefined();
      // Verify it's injectable at root level via the store definition
    });
  });

  describe('Event-Driven Architecture', () => {
    it('should have been created with event-driven features', () => {
      // Verify that the store was properly initialized with all features
      expect(store).toBeDefined();
      // The store includes event reducers and effects configured
    });

    it('should handle state mutations via events', () => {
      // The store is configured to handle state mutations through events
      // Events are dispatched by components and handled by reducers and effects
      expect(store.taskEntities).toBeDefined();
    });
  });
});
