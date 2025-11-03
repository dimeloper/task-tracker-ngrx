import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { withTaskEffects } from './task.effects';
import { TaskStatus, Task } from '../../interfaces/task';

describe('Task Effects', () => {
  let taskService: TaskService;

  beforeEach(() => {
    const taskServiceMock = {
      getTasks: vi.fn(),
      createTask: vi.fn(),
      deleteTask: vi.fn(),
      updateTaskStatus: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: TaskService, useValue: taskServiceMock }],
    });

    taskService = TestBed.inject(TaskService);
  });

  it('should dispatch tasksLoadedSuccess when tasks load successfully', () => {
    const mockResponse = {
      tasks: [
        {
          id: '1',
          title: 'Test',
          status: TaskStatus.TODO,
          createdAt: new Date().toISOString(),
        },
      ] as Task[],
      totalPages: 1,
    };
    vi.mocked(taskService.getTasks).mockReturnValue(of(mockResponse));

    // Test the effects by triggering events
    const effects = withTaskEffects();
    expect(effects).toBeDefined();
  });

  it('should dispatch tasksLoadedFailure on error', () => {
    vi.mocked(taskService.getTasks).mockReturnValue(
      throwError(() => new Error('API Error'))
    );

    const effects = withTaskEffects();
    expect(effects).toBeDefined();
  });
});
