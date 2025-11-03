import { describe, it, expect } from 'vitest';
import {
  setAllEntities,
  addEntity,
  removeEntity,
  updateEntity,
} from '@ngrx/signals/entities';
import { on } from '@ngrx/signals/events';
import { taskPageEvents, taskApiEvents } from './task.events';
import { Task, TaskStatus } from '../../interfaces/task';

describe('Task Reducer', () => {
  describe('Page Events', () => {
    it('should set isLoading to true on page opened', () => {
      const result = on(taskPageEvents.opened, () => ({ isLoading: true }));

      expect(result).toBeDefined();
    });

    it('should update task status optimistically on taskStatusChanged', () => {
      const result = on(
        taskPageEvents.taskStatusChanged,
        (evt: { payload: { id: string; status: TaskStatus } }) =>
          updateEntity(
            { id: evt.payload.id, changes: { status: evt.payload.status } },
            { collection: 'task' }
          )
      );

      expect(result).toBeDefined();
    });
  });

  describe('API Events - Success', () => {
    it('should set all entities and loading to false on tasksLoadedSuccess', () => {
      const result = on(
        taskApiEvents.tasksLoadedSuccess,
        (evt: { payload: Task[] }) => [
          setAllEntities(evt.payload, { collection: 'task' }),
          { isLoading: false },
        ]
      );

      expect(result).toBeDefined();
    });

    it('should add entity on taskCreatedSuccess', () => {
      const result = on(
        taskApiEvents.taskCreatedSuccess,
        (evt: { payload: Task }) =>
          addEntity(evt.payload, { collection: 'task' })
      );

      expect(result).toBeDefined();
    });

    it('should remove entity on taskDeletedSuccess', () => {
      const result = on(
        taskApiEvents.taskDeletedSuccess,
        (evt: { payload: string }) =>
          removeEntity(evt.payload, { collection: 'task' })
      );

      expect(result).toBeDefined();
    });
  });

  describe('API Events - Failure', () => {
    it('should set error and loading to false on tasksLoadedFailure', () => {
      const result = on(
        taskApiEvents.tasksLoadedFailure,
        (evt: { payload: string }) => ({
          isLoading: false,
          error: evt.payload,
        })
      );

      expect(result).toBeDefined();
    });

    it('should revert status change on taskStatusChangedFailure', () => {
      const result = on(
        taskApiEvents.taskStatusChangedFailure,
        (evt: {
          payload: { id: string; previousStatus: TaskStatus; error: string };
        }) =>
          updateEntity(
            {
              id: evt.payload.id,
              changes: { status: evt.payload.previousStatus },
            },
            { collection: 'task' }
          )
      );

      expect(result).toBeDefined();
    });
  });
});
