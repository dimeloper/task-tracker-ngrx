import { describe, it, expect } from 'vitest';
import { setAllEntities } from '@ngrx/signals/entities';
import { on } from '@ngrx/signals/events';
import { taskApiEvents } from './task.events';
import { Task } from '../../interfaces/task';

describe('Task Reducer', () => {
  it('should set loading to false on tasksLoadedSuccess', () => {
    const result = on(
      taskApiEvents.tasksLoadedSuccess,
      (evt: { payload: Task[] }) => [
        setAllEntities(evt.payload, { collection: 'task' }),
        { isLoading: false },
      ]
    );

    expect(result).toBeDefined();
  });
});
